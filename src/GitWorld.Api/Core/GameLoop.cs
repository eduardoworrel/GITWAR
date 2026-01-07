using GitWorld.Api.Core.Systems;
using GitWorld.Shared;

namespace GitWorld.Api.Core;

public class GameLoop : IDisposable
{
    private readonly World _world;
    private readonly Timer _timer;
    private readonly object _lock = new();

    private readonly MovementSystem _movementSystem;
    private readonly CombatSystem _combatSystem;
    private readonly AISystem _aiSystem;
    private readonly PlayerBehaviorSystem _playerBehaviorSystem;
    private readonly HealthBehaviorSystem _healthBehaviorSystem;
    private readonly EventSystem _eventSystem;

    private long _currentTick;
    private bool _isRunning;
    private bool _disposed;

    public event Action<long, World>? OnTick;

    public long CurrentTick => _currentTick;
    public bool IsRunning => _isRunning;
    public World World => _world;

    // Expose systems for external use (e.g., API endpoints)
    public CombatSystem CombatSystem => _combatSystem;
    public AISystem AISystem => _aiSystem;
    public MovementSystem MovementSystem => _movementSystem;
    public EventSystem EventSystem => _eventSystem;

    public GameLoop(World world)
    {
        _world = world;
        _movementSystem = new MovementSystem(world);
        _combatSystem = new CombatSystem(world);
        _aiSystem = new AISystem(world, _combatSystem);
        _playerBehaviorSystem = new PlayerBehaviorSystem(world);
        _healthBehaviorSystem = new HealthBehaviorSystem(world);
        _eventSystem = new EventSystem(world);

        // Wire up EventSystem to PlayerBehaviorSystem for monster priority
        _playerBehaviorSystem.SetEventSystem(_eventSystem);

        _timer = new Timer(Tick, null, Timeout.Infinite, Timeout.Infinite);
    }

    public void Start()
    {
        if (_isRunning) return;

        lock (_lock)
        {
            _isRunning = true;
            _timer.Change(0, GameConstants.TickRateMs);
        }
    }

    public void Stop()
    {
        if (!_isRunning) return;

        lock (_lock)
        {
            _isRunning = false;
            _timer.Change(Timeout.Infinite, Timeout.Infinite);
        }
    }

    private void Tick(object? state)
    {
        if (!_isRunning) return;

        lock (_lock)
        {
            _currentTick++;

            try
            {
                ProcessSystems();
                OnTick?.Invoke(_currentTick, _world);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[GameLoop] Error on tick {_currentTick}: {ex.Message}");
            }
        }
    }

    private void ProcessSystems()
    {
        // Update event system (spawn monsters, check event end)
        _eventSystem.Update(_currentTick);

        // Clean up old combat events periodically (every 5 seconds = 100 ticks)
        if (_currentTick % 100 == 0)
        {
            _combatSystem.EventQueue.ClearOlderThan(_currentTick - 200);
        }

        // Processa todas as entidades
        foreach (var entity in _world.Entities)
        {
            if (entity.State == EntityState.Dead)
            {
                // Clear fleeing state when player dies
                if (entity.Type == EntityType.Player)
                {
                    _healthBehaviorSystem.OnEntityDeath(entity.Id);
                }
                ProcessDeadEntity(entity);
                continue;
            }

            // Process AI for NPCs (determines movement/combat targets)
            if (entity.Type == EntityType.NPC)
            {
                _aiSystem.Update(entity, _currentTick);
            }

            // Process AI for event monsters
            if (IsMonsterType(entity.Type))
            {
                _aiSystem.UpdateMonster(entity, _currentTick, _eventSystem);
            }

            // Process health behavior for Players (flee when low HP, regen at home)
            // If player is fleeing, skip normal behavior
            bool isFleeing = false;
            if (entity.Type == EntityType.Player)
            {
                isFleeing = _healthBehaviorSystem.Update(entity, _currentTick);
            }

            // Process behavior for Players (find enemies when idle)
            // Skip if player is fleeing to safety
            if (entity.Type == EntityType.Player && !isFleeing)
            {
                _playerBehaviorSystem.Update(entity, _currentTick);
            }

            // Process movement for all entities
            _movementSystem.Update(entity);

            // Process auto-combat for players (attack when in range of enemy)
            if (entity.Type == EntityType.Player)
            {
                _combatSystem.ProcessPlayerAutoCombat(entity, _currentTick);
            }

            // Process combat for all entities (handles the actual attack execution)
            _combatSystem.Update(entity, _currentTick);
        }
    }

    private void ProcessDeadEntity(Entity entity)
    {
        // Monsters don't respawn - EventSystem handles cleanup
        if (IsMonsterType(entity.Type))
            return;

        if (!entity.RespawnAtTick.HasValue)
            return;

        if (_currentTick >= entity.RespawnAtTick.Value)
        {
            float x, y;

            // NPCs respawn at their original spawn position
            if (entity.Type == EntityType.NPC)
            {
                var npcData = _aiSystem.GetNpcData(entity.Id);
                if (npcData != null)
                {
                    x = npcData.SpawnX;
                    y = npcData.SpawnY;
                    npcData.State = AIState.Idle; // Reset AI state
                    npcData.AggroTargetId = null;
                }
                else
                {
                    (x, y) = _world.GetRandomPosition();
                }
            }
            else
            {
                // Players respawn in their kingdom
                (x, y) = _world.GetRespawnPosition(entity.Reino);
            }

            entity.Respawn(x, y);
            Console.WriteLine($"[Respawn] {entity.GithubLogin} respawned at ({x:F0}, {y:F0}) in {entity.Reino}");

            // Emit respawn event
            _combatSystem.EventQueue.Add(new CombatEvent(
                _currentTick,
                CombatEventType.Respawn,
                entity.Id,
                entity.GithubLogin,
                entity.Id,
                entity.GithubLogin
            ));

            // PlayerBehaviorSystem will handle finding a new target when player is Idle
        }
    }

    public void Dispose()
    {
        if (_disposed) return;

        _disposed = true;
        Stop();
        _timer.Dispose();
    }

    private static bool IsMonsterType(EntityType type) =>
        type is EntityType.Bug or EntityType.AIHallucination or EntityType.Manager or EntityType.Boss or EntityType.UnexplainedBug;
}
