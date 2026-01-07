using System.Collections.Concurrent;
using GitWorld.Shared;

namespace GitWorld.Api.Core.Systems;

public enum AIState
{
    Idle,       // Standing still, waiting to be attacked
    Chasing,
    Attacking,
    Returning
}

public class NpcData
{
    public float SpawnX { get; init; }
    public float SpawnY { get; init; }
    public AIState State { get; set; } = AIState.Idle;
    public Guid? AggroTargetId { get; set; }
}

public class AISystem
{
    private readonly World _world;
    private readonly CombatSystem _combatSystem;
    private readonly ConcurrentDictionary<Guid, NpcData> _npcData = new();

    public AISystem(World world, CombatSystem combatSystem)
    {
        _world = world;
        _combatSystem = combatSystem;

        // Subscribe to damage events to trigger NPC aggro when attacked
        _combatSystem.OnDamageDealt += OnEntityDamaged;
    }

    /// <summary>
    /// Handle damage events - when an NPC/Bug takes damage, it becomes aggressive toward attacker
    /// </summary>
    private void OnEntityDamaged(Entity attacker, Entity target, int damage)
    {
        // NPCs and Bugs are passive - only attack when attacked
        if (target.Type != EntityType.NPC && target.Type != EntityType.Bug)
            return;

        // Trigger aggro - will chase and attack the player
        SetAggro(target, attacker);
    }

    /// <summary>
    /// Register an NPC or passive monster and store its spawn position
    /// </summary>
    public void RegisterNpc(Entity entity)
    {
        // Only register NPCs and Bugs (passive entities)
        if (entity.Type != EntityType.NPC && entity.Type != EntityType.Bug)
            return;

        _npcData[entity.Id] = new NpcData
        {
            SpawnX = entity.X,
            SpawnY = entity.Y,
            State = AIState.Idle
        };
    }

    /// <summary>
    /// Unregister an NPC (when removed from world)
    /// </summary>
    public void UnregisterNpc(Guid npcId)
    {
        _npcData.TryRemove(npcId, out _);
    }

    /// <summary>
    /// Set aggro on an NPC or passive monster when it's attacked
    /// NPCs and Bugs are PASSIVE - they only attack if attacked first!
    /// </summary>
    public void SetAggro(Entity npc, Entity attacker)
    {
        // Only NPCs and Bugs use passive aggro system
        if (npc.Type != EntityType.NPC && npc.Type != EntityType.Bug)
            return;

        if (!npc.IsAlive)
            return;

        if (!_npcData.TryGetValue(npc.Id, out var data))
        {
            // Register monster if not already registered
            RegisterNpc(npc);
            data = _npcData[npc.Id];
        }

        data.AggroTargetId = attacker.Id;
        data.State = AIState.Chasing;
    }

    /// <summary>
    /// Update AI for an NPC each tick
    /// </summary>
    public void Update(Entity entity, long currentTick)
    {
        if (entity.Type != EntityType.NPC || !entity.IsAlive)
            return;

        if (!_npcData.TryGetValue(entity.Id, out var data))
        {
            // NPC not registered, register it now
            RegisterNpc(entity);
            data = _npcData[entity.Id];
        }

        switch (data.State)
        {
            case AIState.Idle:
                // NPC is passive - just stand still until attacked
                break;

            case AIState.Chasing:
                ProcessChasing(entity, data, currentTick);
                break;

            case AIState.Attacking:
                ProcessAttacking(entity, data, currentTick);
                break;

            case AIState.Returning:
                ProcessReturning(entity, data, currentTick);
                break;
        }
    }

    private void ProcessChasing(Entity npc, NpcData data, long currentTick)
    {
        if (!data.AggroTargetId.HasValue)
        {
            data.State = AIState.Returning;
            return;
        }

        var target = _world.GetEntity(data.AggroTargetId.Value);
        if (target == null || !target.IsAlive)
        {
            // Target is gone, return to spawn
            ClearAggro(data);
            data.State = AIState.Returning;
            return;
        }

        // Check if too far from spawn point
        var distanceFromSpawn = npc.DistanceTo(data.SpawnX, data.SpawnY);
        if (distanceFromSpawn > GameConstants.NpcChaseDistance)
        {
            // Too far, return home
            ClearAggro(data);
            data.State = AIState.Returning;
            return;
        }

        // Check if target is in attack range
        var distanceToTarget = npc.DistanceTo(target);
        if (distanceToTarget <= GameConstants.RangeAtaque)
        {
            // Start attacking
            _combatSystem.TryStartCombat(npc, target);
            data.State = AIState.Attacking;
        }
        else
        {
            // Move towards target
            npc.SetTarget(target.X, target.Y);
        }
    }

    private void ProcessAttacking(Entity npc, NpcData data, long currentTick)
    {
        if (!data.AggroTargetId.HasValue)
        {
            _combatSystem.ClearCombat(npc);
            data.State = AIState.Returning;
            return;
        }

        var target = _world.GetEntity(data.AggroTargetId.Value);
        if (target == null || !target.IsAlive)
        {
            // Target is gone, return to spawn
            _combatSystem.ClearCombat(npc);
            ClearAggro(data);
            data.State = AIState.Returning;
            return;
        }

        // Check if too far from spawn point
        var distanceFromSpawn = npc.DistanceTo(data.SpawnX, data.SpawnY);
        if (distanceFromSpawn > GameConstants.NpcChaseDistance)
        {
            // Too far, return home
            _combatSystem.ClearCombat(npc);
            ClearAggro(data);
            data.State = AIState.Returning;
            return;
        }

        // Check if target moved out of range
        var distanceToTarget = npc.DistanceTo(target);
        if (distanceToTarget > GameConstants.RangeAtaque)
        {
            // Chase the target
            data.State = AIState.Chasing;
            npc.SetTarget(target.X, target.Y);
        }
        // Combat system handles the actual attacks
    }

    private void ProcessReturning(Entity npc, NpcData data, long currentTick)
    {
        var distanceFromSpawn = npc.DistanceTo(data.SpawnX, data.SpawnY);

        if (distanceFromSpawn <= 5f)
        {
            // Arrived at spawn, go back to idle
            npc.ClearTarget();
            data.State = AIState.Idle;
            return;
        }

        // Move towards spawn point
        if (npc.State == EntityState.Idle || !npc.TargetX.HasValue)
        {
            npc.SetTarget(data.SpawnX, data.SpawnY);
        }
    }

    private void ClearAggro(NpcData data)
    {
        data.AggroTargetId = null;
    }

    /// <summary>
    /// Get the NPC data for debugging/inspection
    /// </summary>
    public NpcData? GetNpcData(Guid npcId)
    {
        _npcData.TryGetValue(npcId, out var data);
        return data;
    }

    /// <summary>
    /// Update AI for event monsters each tick
    /// All monsters are aggressive during events - they actively hunt players
    /// </summary>
    public void UpdateMonster(Entity monster, long currentTick, EventSystem eventSystem)
    {
        if (!monster.IsAlive)
            return;

        // All monsters are aggressive - they hunt players
        UpdateAggressiveMonster(monster, currentTick);
    }

    private void UpdateBug(Entity bug, long currentTick)
    {
        // Bug uses NPC data structure for passive behavior
        if (!_npcData.TryGetValue(bug.Id, out var data))
        {
            RegisterNpc(bug);
            data = _npcData[bug.Id];
        }

        switch (data.State)
        {
            case AIState.Idle:
                // Bug is passive - just stand still until attacked
                break;

            case AIState.Chasing:
                ProcessChasing(bug, data, currentTick);
                break;

            case AIState.Attacking:
                ProcessAttacking(bug, data, currentTick);
                break;

            case AIState.Returning:
                // Bugs don't return to spawn, they just idle after losing target
                data.State = AIState.Idle;
                bug.ClearTarget();
                break;
        }
    }

    private void UpdateAggressiveMonster(Entity monster, long currentTick)
    {
        // Find nearest player in aggro range
        var nearestPlayer = _world.Entities
            .Where(e => e.Type == EntityType.Player && e.IsAlive)
            .OrderBy(e => monster.DistanceTo(e))
            .FirstOrDefault();

        if (nearestPlayer == null)
        {
            // No players, idle
            monster.ClearTarget();
            return;
        }

        var distance = monster.DistanceTo(nearestPlayer);

        // Check if player is in aggro range
        if (distance > GameConstants.MonsterAggroRange)
        {
            // Player too far, idle or wander
            monster.ClearTarget();
            return;
        }

        // Player in range - chase or attack
        if (distance <= GameConstants.RangeAtaque)
        {
            // In attack range - start combat
            _combatSystem.TryStartCombat(monster, nearestPlayer);
        }
        else
        {
            // Chase the player
            monster.SetTarget(nearestPlayer.X, nearestPlayer.Y);
        }
    }
}
