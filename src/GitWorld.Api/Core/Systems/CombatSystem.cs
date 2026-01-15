using GitWorld.Shared;

namespace GitWorld.Api.Core.Systems;

public class CombatSystem
{
    private readonly World _world;
    private readonly Random _random = new();
    private readonly CombatEventQueue _eventQueue;

    /// <summary>
    /// Event triggered when an entity takes damage.
    /// Parameters: attacker, target, damage dealt
    /// Used by AISystem to trigger NPC aggro when attacked by players.
    /// </summary>
    public event Action<Entity, Entity, int>? OnDamageDealt;

    /// <summary>
    /// Event triggered when a player kills another player.
    /// Parameters: killer, victim
    /// Used for persisting ELO changes to database.
    /// </summary>
    public event Action<Entity, Entity>? OnPlayerKill;

    /// <summary>
    /// Event triggered when a monster is killed.
    /// Parameters: monster, killer (last hit)
    /// Used for distributing XP/Gold rewards.
    /// </summary>
    public event Action<Entity, Entity>? OnMonsterKill;

    public CombatEventQueue EventQueue => _eventQueue;

    public CombatSystem(World world)
    {
        _world = world;
        _eventQueue = new CombatEventQueue();
    }

    /// <summary>
    /// Process auto-combat for players: validates and maintains combat state.
    /// Target selection is now handled by PlayerBehaviorSystem.
    /// This just ensures combat state consistency.
    /// </summary>
    public void ProcessPlayerAutoCombat(Entity player, long currentTick)
    {
        if (player.Type != EntityType.Player || !player.IsAlive)
            return;

        // PlayerBehaviorSystem now handles target selection.
        // This method validates that if we're attacking, the target is still valid.
        if (player.State == EntityState.Attacking && player.TargetEntityId.HasValue)
        {
            var target = _world.GetEntity(player.TargetEntityId.Value);

            // Clear combat if target is invalid
            if (target == null || !target.IsAlive)
            {
                ClearCombat(player);
                return;
            }

            // Clear combat if target is now ELO protected (ELO may have changed)
            // Exception: Self-defense - if they're attacking us, we can fight back!
            if (target.Type == EntityType.Player)
            {
                bool isAttackingUs = target.TargetEntityId == player.Id && target.State == EntityState.Attacking;

                if (!isAttackingUs)
                {
                    int eloDiff = player.Elo - target.Elo;
                    if (eloDiff >= GameConstants.EloProtectionThreshold)
                    {
                        // Target became too weak and not attacking us - clear combat, find new target
                        Console.WriteLine($"[Combat] {player.GithubLogin} stops attacking {target.GithubLogin} (ELO protected: {eloDiff} diff)");
                        ClearCombat(player);
                    }
                }
            }
        }
    }

    /// <summary>
    /// Process combat for an entity each tick
    /// </summary>
    public void Update(Entity entity, long currentTick)
    {
        if (entity.State == EntityState.Dead)
            return;

        if (entity.State != EntityState.Attacking || !entity.TargetEntityId.HasValue)
            return;

        var target = _world.GetEntity(entity.TargetEntityId.Value);
        if (target == null || !target.IsAlive)
        {
            ClearCombat(entity);
            return;
        }

        // Check if in attack range
        var distance = entity.DistanceTo(target);
        if (distance > GameConstants.RangeAtaque)
        {
            // Move towards target while maintaining attack state
            entity.SetTarget(target.X, target.Y, preserveAttackState: true);
            return;
        }

        // Check attack cooldown (VelocidadeAtaque reduz o cooldown drasticamente)
        // Cooldown base: 30 ticks (1.5s), sem cap mínimo
        // Fórmula: max(2, 30 - velocidadeAtaque) - devs ativos atacam muito mais rápido
        int effectiveCooldown = Math.Max(2, 30 - entity.VelocidadeAtaque);
        if (currentTick - entity.LastAttackTick < effectiveCooldown)
            return;

        // Perform attack
        var (damage, isCritical) = CalculateDamageWithCrit(entity, target);
        entity.LastAttackTick = currentTick;

        if (damage > 0)
        {
            // Register damage for reward distribution (before applying damage)
            target.RegisterDamage(entity.Id, damage);

            var targetDied = target.TakeDamage(damage, currentTick);

            // Log combat event
            var critText = isCritical ? " CRIT!" : "";
            Console.WriteLine($"[Combat] {entity.GithubLogin} hits {target.GithubLogin} for {damage} damage{critText} ({target.CurrentHp}/{target.MaxHp} HP)");

            // Emit combat event
            _eventQueue.Add(new CombatEvent(
                currentTick,
                isCritical ? CombatEventType.Critical : CombatEventType.Damage,
                entity.Id,
                entity.GithubLogin,
                target.Id,
                target.GithubLogin,
                damage,
                isCritical
            ));

            // Notify listeners (e.g., AISystem for NPC aggro)
            OnDamageDealt?.Invoke(entity, target, damage);

            if (targetDied)
            {
                Console.WriteLine($"[Combat] {target.GithubLogin} has been killed by {entity.GithubLogin}!");

                // Calculate ELO for player vs player kills
                if (entity.Type == EntityType.Player && target.Type == EntityType.Player)
                {
                    CalculateElo(entity, target);
                    OnPlayerKill?.Invoke(entity, target);
                }

                // Notify monster kill for XP/Gold distribution
                if (ProgressionSystem.IsMonster(target.Type))
                {
                    OnMonsterKill?.Invoke(target, entity);
                }

                // Emit kill event
                _eventQueue.Add(new CombatEvent(
                    currentTick,
                    CombatEventType.Kill,
                    entity.Id,
                    entity.GithubLogin,
                    target.Id,
                    target.GithubLogin
                ));

                // Emit death event
                _eventQueue.Add(new CombatEvent(
                    currentTick,
                    CombatEventType.Death,
                    target.Id,
                    target.GithubLogin,
                    target.Id,
                    target.GithubLogin
                ));

                ClearCombat(entity);
            }
        }
        else
        {
            // Attack missed (evasion)
            Console.WriteLine($"[Combat] {entity.GithubLogin} missed {target.GithubLogin} (evaded)");

            // Emit miss event
            _eventQueue.Add(new CombatEvent(
                currentTick,
                CombatEventType.Miss,
                entity.Id,
                entity.GithubLogin,
                target.Id,
                target.GithubLogin
            ));
        }
    }

    /// <summary>
    /// Initiate combat between attacker and target
    /// </summary>
    public bool TryStartCombat(Entity attacker, Entity target)
    {
        if (attacker.State == EntityState.Dead || target.State == EntityState.Dead)
            return false;

        if (attacker.Id == target.Id)
            return false;

        attacker.TargetEntityId = target.Id;
        attacker.State = EntityState.Attacking;

        // If in range, stay in place; otherwise move towards target
        var distance = attacker.DistanceTo(target);
        if (distance > GameConstants.RangeAtaque)
        {
            attacker.SetTarget(target.X, target.Y);
        }

        return true;
    }

    /// <summary>
    /// Calculate damage from attacker to target
    /// Formula:
    /// 1. Check evasion: RNG less than target.Evasao -> miss (return 0)
    /// 2. Base damage: attacker.Dano
    /// 3. Critical: RNG less than attacker.Critico -> damage * 1.5
    /// 4. Armor: damage - target.Armadura (min 1)
    /// </summary>
    public int CalculateDamage(Entity attacker, Entity target)
    {
        var (damage, _) = CalculateDamageWithCrit(attacker, target);
        return damage;
    }

    /// <summary>
    /// Calculate damage from attacker to target with critical hit information
    /// Returns tuple of (damage, isCritical)
    /// </summary>
    public (int damage, bool isCritical) CalculateDamageWithCrit(Entity attacker, Entity target)
    {
        // Evasion check (0-100 scale)
        var evasionRoll = _random.Next(100);
        if (evasionRoll < target.Evasao)
        {
            return (0, false); // Miss
        }

        // Base damage
        float damage = attacker.Dano;

        // Critical hit check (0-100 scale)
        var critRoll = _random.Next(100);
        bool isCritical = critRoll < attacker.Critico;
        if (isCritical)
        {
            damage *= GameConstants.CriticalMultiplier;
        }

        // Apply armor reduction
        damage -= target.Armadura;

        // Minimum damage
        return (Math.Max((int)damage, GameConstants.MinDamage), isCritical);
    }

    /// <summary>
    /// Stop combat for an entity.
    /// IMPORTANT: Change State BEFORE clearing TargetEntityId to avoid
    /// race conditions where API reads State=Attacking with null target.
    /// </summary>
    public void ClearCombat(Entity entity)
    {
        // Change State first to maintain consistency for external observers
        if (entity.State == EntityState.Attacking)
        {
            entity.State = EntityState.Idle;
        }
        entity.TargetEntityId = null;
        entity.ClearTarget();
    }

    /// <summary>
    /// Calculate and apply ELO changes when a player kills another player.
    /// ACCUMULATIVE system - ELO only goes UP:
    /// - Base gain: 10 ELO per kill
    /// - Bonus for killing stronger players (up to +20 extra)
    /// - No loss on death (deaths are just tracked for stats)
    /// </summary>
    private void CalculateElo(Entity killer, Entity victim)
    {
        const int BaseGain = 10;
        const int MaxBonus = 20;

        int eloDiff = victim.Elo - killer.Elo; // Positive = victim was stronger

        // Bonus for killing stronger players
        int bonus = 0;
        if (eloDiff > 0)
        {
            // Scale bonus based on how much stronger the victim was
            // +100 ELO diff = +5 bonus, +400 ELO diff = +20 bonus (max)
            bonus = Math.Min(MaxBonus, eloDiff / 20);
        }

        int killerGain = BaseGain + bonus;

        // Apply changes - killer gains, victim doesn't lose
        killer.Elo += killerGain;
        killer.Vitorias++;
        victim.Derrotas++;

        Console.WriteLine($"[ELO] {killer.GithubLogin} +{killerGain} ({killer.Elo}) | {victim.GithubLogin} death #{victim.Derrotas} (ELO unchanged: {victim.Elo})");
    }
}
