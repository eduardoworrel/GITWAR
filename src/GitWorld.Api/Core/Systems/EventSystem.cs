using GitWorld.Shared;

namespace GitWorld.Api.Core.Systems;

public enum EventType
{
    None,
    BugSwarm,       // 5-10 bugs per player
    Intermediate,   // AI Hallucinations + Managers
    Boss,           // Daily boss at 18h
    UnexplainedBug  // Hourly boss - high HP, low damage
}

public class EventInfo
{
    public EventType Type { get; set; }
    public int MonstersRemaining { get; set; }
    public long StartTick { get; set; }
}

public class EventSystem
{
    private readonly World _world;
    private readonly Random _random = new();

    // Event state
    public bool IsEventActive => CurrentEvent.Type != EventType.None;
    public EventInfo CurrentEvent { get; } = new() { Type = EventType.None };

    // Track spawned monsters
    private readonly HashSet<Guid> _spawnedMonsterIds = new();

    // Timers (in ticks)
    private long _lastBugEventTick;
    private long _lastIntermediateEventTick;
    private long _lastUnexplainedBugEventTick;
    private DateTime _lastBossDate = DateTime.MinValue;

    public EventSystem(World world)
    {
        _world = world;
    }

    /// <summary>
    /// Register a monster spawned outside of events (e.g., on server startup)
    /// so it gets cleaned up when dead
    /// </summary>
    public void RegisterMonster(Guid monsterId)
    {
        _spawnedMonsterIds.Add(monsterId);
    }

    public void Update(long currentTick)
    {
        // Clean up dead monsters
        CleanupDeadMonsters();

        // Unstick monsters that are inside collision zones
        UnstickMonsters();

        // Check if event ended (all monsters dead)
        if (IsEventActive && _spawnedMonsterIds.Count == 0)
        {
            EndEvent();
        }

        // Don't start new events while one is active
        if (IsEventActive)
            return;

        // Check boss event (daily at 18h)
        CheckBossEvent(currentTick);

        // Check unexplained bug event (1 hour)
        if (currentTick - _lastUnexplainedBugEventTick >= GameConstants.UnexplainedBugEventIntervalTicks)
        {
            StartUnexplainedBugEvent(currentTick);
            _lastUnexplainedBugEventTick = currentTick;
            return;
        }

        // Check intermediate event (30 min)
        if (currentTick - _lastIntermediateEventTick >= GameConstants.IntermediateEventIntervalTicks)
        {
            StartIntermediateEvent(currentTick);
            _lastIntermediateEventTick = currentTick;
            return;
        }

        // Check bug event (10 min)
        if (currentTick - _lastBugEventTick >= GameConstants.BugEventIntervalTicks)
        {
            StartBugEvent(currentTick);
            _lastBugEventTick = currentTick;
        }
    }

    private void CheckBossEvent(long currentTick)
    {
        var now = DateTime.Now;

        // Check if it's 18:00 and we haven't spawned boss today
        if (now.Hour == GameConstants.BossEventHour &&
            now.Date != _lastBossDate)
        {
            StartBossEvent(currentTick);
            _lastBossDate = now.Date;
        }
    }

    private void StartBugEvent(long currentTick)
    {
        var players = GetAlivePlayers().ToList();
        if (players.Count == 0) return;

        var totalBugs = _random.Next(
            GameConstants.BugSpawnMin * players.Count,
            GameConstants.BugSpawnMax * players.Count + 1
        );

        Console.WriteLine($"[EventSystem] Starting Bug Swarm event - spawning {totalBugs} bugs near {players.Count} players");

        for (int i = 0; i < totalBugs; i++)
        {
            var (x, y) = GetPositionNearPlayer(players);
            var monster = _world.AddMonster(EntityType.Bug, x, y);
            _spawnedMonsterIds.Add(monster.Id);
        }

        CurrentEvent.Type = EventType.BugSwarm;
        CurrentEvent.MonstersRemaining = totalBugs;
        CurrentEvent.StartTick = currentTick;
    }

    private void StartIntermediateEvent(long currentTick)
    {
        var players = GetAlivePlayers().ToList();
        if (players.Count == 0) return;

        Console.WriteLine($"[EventSystem] Starting Intermediate event near {players.Count} players");

        // Spawn bugs too
        var bugCount = _random.Next(
            GameConstants.BugSpawnMin * players.Count,
            GameConstants.BugSpawnMax * players.Count + 1
        );

        for (int i = 0; i < bugCount; i++)
        {
            var (x, y) = GetPositionNearPlayer(players);
            var monster = _world.AddMonster(EntityType.Bug, x, y);
            _spawnedMonsterIds.Add(monster.Id);
        }

        // Spawn AI Hallucinations
        var aiCount = _random.Next(
            GameConstants.AIHallucinationSpawnMin * players.Count,
            GameConstants.AIHallucinationSpawnMax * players.Count + 1
        );

        for (int i = 0; i < aiCount; i++)
        {
            var (x, y) = GetPositionNearPlayer(players);
            var monster = _world.AddMonster(EntityType.AIHallucination, x, y);
            _spawnedMonsterIds.Add(monster.Id);
        }

        // Spawn Managers
        var managerCount = _random.Next(
            GameConstants.ManagerSpawnMin * players.Count,
            GameConstants.ManagerSpawnMax * players.Count + 1
        );

        for (int i = 0; i < managerCount; i++)
        {
            var (x, y) = GetPositionNearPlayer(players);
            var monster = _world.AddMonster(EntityType.Manager, x, y);
            _spawnedMonsterIds.Add(monster.Id);
        }

        CurrentEvent.Type = EventType.Intermediate;
        CurrentEvent.MonstersRemaining = bugCount + aiCount + managerCount;
        CurrentEvent.StartTick = currentTick;

        Console.WriteLine($"[EventSystem] Spawned {bugCount} bugs, {aiCount} AI, {managerCount} managers");
    }

    private void StartBossEvent(long currentTick)
    {
        Console.WriteLine($"[EventSystem] Starting Boss event - Deploy de Final de Expediente!");

        // Spawn boss at map center
        var centerX = GameConstants.MapaWidth / 2f;
        var centerY = GameConstants.MapaHeight / 2f;
        var boss = _world.AddMonster(EntityType.Boss, centerX, centerY);
        _spawnedMonsterIds.Add(boss.Id);

        CurrentEvent.Type = EventType.Boss;
        CurrentEvent.MonstersRemaining = 1;
        CurrentEvent.StartTick = currentTick;
    }

    private void StartUnexplainedBugEvent(long currentTick)
    {
        var players = GetAlivePlayers().ToList();
        if (players.Count == 0) return;

        Console.WriteLine($"[EventSystem] Starting Unexplained Bug event - Bug sem explicação apareceu!");

        // Spawn near a random player
        var (x, y) = GetPositionNearPlayer(players);
        var monster = _world.AddMonster(EntityType.UnexplainedBug, x, y);
        _spawnedMonsterIds.Add(monster.Id);

        CurrentEvent.Type = EventType.UnexplainedBug;
        CurrentEvent.MonstersRemaining = 1;
        CurrentEvent.StartTick = currentTick;
    }

    private void CleanupDeadMonsters()
    {
        var deadMonsters = _spawnedMonsterIds
            .Where(id =>
            {
                var entity = _world.GetEntity(id);
                return entity == null || !entity.IsAlive;
            })
            .ToList();

        foreach (var id in deadMonsters)
        {
            _spawnedMonsterIds.Remove(id);
            _world.RemoveEntity(id); // Remove dead monsters from world
        }

        if (IsEventActive)
        {
            CurrentEvent.MonstersRemaining = _spawnedMonsterIds.Count;
        }
    }

    /// <summary>
    /// Move monsters that are stuck inside collision zones to safe positions
    /// </summary>
    private void UnstickMonsters()
    {
        foreach (var id in _spawnedMonsterIds)
        {
            var monster = _world.GetEntity(id);
            if (monster == null || !monster.IsAlive) continue;

            if (World.IsInsideCollisionZone(monster.X, monster.Y))
            {
                var (safeX, safeY) = GetSafeRandomPosition();
                Console.WriteLine($"[EventSystem] Unstuck {monster.GithubLogin} from ({monster.X:F0},{monster.Y:F0}) to ({safeX:F0},{safeY:F0})");
                monster.X = safeX;
                monster.Y = safeY;
            }
        }
    }

    private void EndEvent()
    {
        Console.WriteLine($"[EventSystem] Event {CurrentEvent.Type} ended!");
        CurrentEvent.Type = EventType.None;
        CurrentEvent.MonstersRemaining = 0;
        _spawnedMonsterIds.Clear();
    }

    private int GetPlayerCount()
    {
        return _world.Entities.Count(e => e.Type == EntityType.Player && e.IsAlive);
    }

    private IEnumerable<Entity> GetAlivePlayers()
    {
        return _world.Entities.Where(e => e.Type == EntityType.Player && e.IsAlive);
    }

    /// <summary>
    /// Get a spawn position near a random player (200-500 units away)
    /// Avoids collision zones to prevent monsters getting stuck
    /// </summary>
    private (float x, float y) GetPositionNearPlayer(List<Entity> players)
    {
        if (players.Count == 0)
            return GetSafeRandomPosition();

        // Try up to 10 times to find a valid position
        for (int attempt = 0; attempt < 10; attempt++)
        {
            // Pick a random player
            var player = players[_random.Next(players.Count)];

            // Random angle and distance (200-500 units from player)
            var angle = _random.NextSingle() * MathF.PI * 2;
            var distance = 200 + _random.NextSingle() * 300; // 200-500 units

            var x = player.X + MathF.Cos(angle) * distance;
            var y = player.Y + MathF.Sin(angle) * distance;

            // Clamp to world bounds
            var (clampedX, clampedY) = _world.ClampToWorld(x, y);

            // Check if position is NOT inside a collision zone
            if (!World.IsInsideCollisionZone(clampedX, clampedY))
            {
                return (clampedX, clampedY);
            }
        }

        // Fallback: spawn at the safe spawn point with small offset
        return GetSafeRandomPosition();
    }

    /// <summary>
    /// Get a random position that is guaranteed to be outside collision zones
    /// </summary>
    private (float x, float y) GetSafeRandomPosition()
    {
        // Try random positions up to 10 times
        for (int attempt = 0; attempt < 10; attempt++)
        {
            var (x, y) = _world.GetRandomPosition();
            if (!World.IsInsideCollisionZone(x, y))
            {
                return (x, y);
            }
        }

        // Fallback: use spawn point area (guaranteed safe)
        var offsetX = (_random.NextSingle() - 0.5f) * 400;
        var offsetY = (_random.NextSingle() - 0.5f) * 400;
        return (GameConstants.SpawnX + offsetX, GameConstants.SpawnY + offsetY);
    }

    /// <summary>
    /// Check if an entity is a monster from the current event
    /// </summary>
    public bool IsEventMonster(Guid entityId)
    {
        return _spawnedMonsterIds.Contains(entityId);
    }

    /// <summary>
    /// Get ELO reward for killing a monster
    /// </summary>
    public int GetMonsterEloReward(EntityType type)
    {
        return type switch
        {
            EntityType.Bug => GameConstants.BugEloReward,
            EntityType.AIHallucination => GameConstants.AIHallucinationEloReward,
            EntityType.Manager => GameConstants.ManagerEloReward,
            EntityType.Boss => GameConstants.BossEloReward,
            EntityType.UnexplainedBug => GameConstants.UnexplainedBugEloReward,
            _ => 0
        };
    }

    /// <summary>
    /// Get all event monsters for AI processing
    /// </summary>
    public IEnumerable<Entity> GetEventMonsters()
    {
        return _spawnedMonsterIds
            .Select(id => _world.GetEntity(id))
            .Where(e => e != null && e.IsAlive)!;
    }
}
