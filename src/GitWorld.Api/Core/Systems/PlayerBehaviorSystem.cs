using GitWorld.Shared;

namespace GitWorld.Api.Core.Systems;

/// <summary>
/// Handles automatic player behavior - continuously seeks and attacks enemies.
/// Simple logic: always chase nearest enemy, attack when in range.
/// During events, prioritizes monsters over other players.
/// </summary>
public class PlayerBehaviorSystem
{
    private readonly World _world;
    private EventSystem? _eventSystem;

    public PlayerBehaviorSystem(World world)
    {
        _world = world;
    }

    /// <summary>
    /// Set reference to EventSystem after GameLoop is fully constructed
    /// </summary>
    public void SetEventSystem(EventSystem eventSystem)
    {
        _eventSystem = eventSystem;
    }

    /// <summary>
    /// Process behavior for a player each tick.
    /// ALWAYS evaluates and updates target - continuous, not one-time.
    /// </summary>
    public void Update(Entity player, long currentTick)
    {
        if (player.Type != EntityType.Player || !player.IsAlive)
            return;

        // Find nearest enemy - do this EVERY tick
        var enemy = FindNearestEnemy(player);

        if (enemy == null)
        {
            // Debug: log why player is idle (every 2 seconds)
            if (currentTick % 40 == 0)
            {
                var monsterCount = _world.Entities.Count(e => IsMonsterOrNpc(e.Type) && e.IsAlive);
                var playerCount = _world.Entities.Count(e => e.Type == EntityType.Player && e.IsAlive && e.Id != player.Id);
                Console.WriteLine($"[Idle] {player.GithubLogin} at ({player.X:F0},{player.Y:F0}) - no enemy. Monsters:{monsterCount} Players:{playerCount}");
            }
            // No enemies - go idle
            player.TargetEntityId = null;
            player.State = EntityState.Idle;
            player.ClearTarget();
            return;
        }

        var distance = player.DistanceTo(enemy);

        // In attack range? Attack!
        if (distance <= GameConstants.RangeAtaque)
        {
            player.TargetEntityId = enemy.Id;
            player.State = EntityState.Attacking;
            // Clear movement target - we're in range, no need to move
            player.TargetX = null;
            player.TargetY = null;

            // Debug: log attacking (every 2 seconds)
            if (currentTick % 40 == 0)
            {
                Console.WriteLine($"[Attack] {player.GithubLogin} attacking {enemy.GithubLogin} dist={distance:F0}");
            }
        }
        else
        {
            // Out of range - move towards enemy
            player.TargetEntityId = null;
            player.State = EntityState.Moving;
            player.TargetX = enemy.X;
            player.TargetY = enemy.Y;

            // Debug: log moving (every 2 seconds)
            if (currentTick % 40 == 0)
            {
                Console.WriteLine($"[Move] {player.GithubLogin} -> {enemy.GithubLogin} ({enemy.Type}) dist={distance:F0}");
            }
        }
    }

    /// <summary>
    /// Find the nearest living enemy (different Reino).
    /// During events: prioritizes monsters over other players.
    /// Players ignore other players with ELO 200+ below theirs (protection for weaker players).
    /// Exception: Self-defense - if someone is attacking us, we can fight back regardless of ELO.
    /// NPCs/Monsters are always valid targets.
    /// </summary>
    public Entity? FindNearestEnemy(Entity player)
    {
        Entity? nearestMonster = null;
        float nearestMonsterDistance = float.MaxValue;

        Entity? nearestPlayer = null;
        float nearestPlayerDistance = float.MaxValue;

        foreach (var entity in _world.Entities)
        {
            if (entity.Id == player.Id) continue;
            if (!entity.IsAlive) continue;
            if (entity.Reino == player.Reino) continue;

            var distance = player.DistanceTo(entity);

            // Check if entity is a monster (including NPCs)
            if (IsMonsterOrNpc(entity.Type))
            {
                if (distance < nearestMonsterDistance)
                {
                    nearestMonsterDistance = distance;
                    nearestMonster = entity;
                }
                continue;
            }

            // ELO protection: skip players with ELO significantly below ours
            // This prevents strong players from farming weak players
            // Also skip players with ELO significantly above ours
            // Exception: Self-defense - if they're attacking us, we can fight back!
            if (entity.Type == EntityType.Player)
            {
                bool isAttackingUs = entity.TargetEntityId == player.Id && entity.State == EntityState.Attacking;

                if (!isAttackingUs)
                {
                    int eloDiff = player.Elo - entity.Elo;

                    // Target is too weak - ignore them (protection for weak players)
                    if (eloDiff >= GameConstants.EloProtectionThreshold)
                    {
                        continue;
                    }

                    // Target is too strong - avoid them
                    if (eloDiff <= -GameConstants.EloDangerThreshold)
                    {
                        continue;
                    }
                }

                if (distance < nearestPlayerDistance)
                {
                    nearestPlayerDistance = distance;
                    nearestPlayer = entity;
                }
            }
        }

        // During events: prioritize monsters over players
        if (_eventSystem?.IsEventActive == true && nearestMonster != null)
        {
            return nearestMonster;
        }

        // Outside events: prefer players, but attack monsters if no players nearby
        if (nearestPlayer != null)
            return nearestPlayer;

        return nearestMonster;
    }

    private static bool IsMonsterOrNpc(EntityType type) =>
        type is EntityType.NPC or EntityType.Bug or EntityType.AIHallucination or EntityType.Manager or EntityType.Boss or EntityType.UnexplainedBug;
}
