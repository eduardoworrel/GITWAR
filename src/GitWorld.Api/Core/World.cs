using System.Collections.Concurrent;
using GitWorld.Shared;

namespace GitWorld.Api.Core;

public class World
{
    private readonly ConcurrentDictionary<Guid, Entity> _entities = new();
    private readonly ConcurrentDictionary<string, PlayerSession> _playerSessions = new();
    private readonly Random _random = new();

    public int Width { get; } = GameConstants.MapaWidth;
    public int Height { get; } = GameConstants.MapaHeight;

    public IReadOnlyCollection<Entity> Entities => _entities.Values.ToList();

    public Entity? GetEntity(Guid id)
    {
        _entities.TryGetValue(id, out var entity);
        return entity;
    }

    public Entity AddEntity(Guid playerId, string githubLogin, PlayerStats stats, string reino, int elo = 1000, int vitorias = 0, int derrotas = 0)
    {
        var (x, y) = GetSpawnPosition(reino);
        var entity = new Entity(playerId, githubLogin, stats, reino, x, y, EntityType.Player, elo, vitorias, derrotas);
        _entities[entity.Id] = entity;
        Console.WriteLine($"[World:{GetHashCode()}] AddEntity {githubLogin} - Total: {_entities.Count}");
        return entity;
    }

    public bool RemoveEntity(Guid id)
    {
        return _entities.TryRemove(id, out _);
    }

    public Entity AddNpc(string name, PlayerStats stats, float x, float y)
    {
        var (clampedX, clampedY) = ClampToWorld(x, y);
        var entity = new Entity(Guid.NewGuid(), name, stats, "NPC", clampedX, clampedY, EntityType.NPC);
        _entities[entity.Id] = entity;
        return entity;
    }

    public Entity AddMonster(EntityType type, float x, float y)
    {
        var (clampedX, clampedY) = ClampToWorld(x, y);
        var (stats, name) = GetMonsterStatsAndName(type);
        var entity = new Entity(Guid.NewGuid(), name, stats, "Monster", clampedX, clampedY, type);
        _entities[entity.Id] = entity;
        Console.WriteLine($"[World] Spawned {name} at ({clampedX:F0}, {clampedY:F0})");
        return entity;
    }

    private static (PlayerStats stats, string name) GetMonsterStatsAndName(EntityType type)
    {
        return type switch
        {
            EntityType.Bug => (
                new PlayerStats(
                    MonsterStats.Bug.Hp,
                    MonsterStats.Bug.Dano,
                    MonsterStats.Bug.VelAtaque,
                    MonsterStats.Bug.VelMov,
                    MonsterStats.Bug.Crit,
                    MonsterStats.Bug.Evasao,
                    MonsterStats.Bug.Armadura
                ),
                "Bug"
            ),
            EntityType.AIHallucination => (
                new PlayerStats(
                    MonsterStats.AIHallucination.Hp,
                    MonsterStats.AIHallucination.Dano,
                    MonsterStats.AIHallucination.VelAtaque,
                    MonsterStats.AIHallucination.VelMov,
                    MonsterStats.AIHallucination.Crit,
                    MonsterStats.AIHallucination.Evasao,
                    MonsterStats.AIHallucination.Armadura
                ),
                "AI Hallucination"
            ),
            EntityType.Manager => (
                new PlayerStats(
                    MonsterStats.Manager.Hp,
                    MonsterStats.Manager.Dano,
                    MonsterStats.Manager.VelAtaque,
                    MonsterStats.Manager.VelMov,
                    MonsterStats.Manager.Crit,
                    MonsterStats.Manager.Evasao,
                    MonsterStats.Manager.Armadura
                ),
                "Manager"
            ),
            EntityType.Boss => (
                new PlayerStats(
                    MonsterStats.Boss.Hp,
                    MonsterStats.Boss.Dano,
                    MonsterStats.Boss.VelAtaque,
                    MonsterStats.Boss.VelMov,
                    MonsterStats.Boss.Crit,
                    MonsterStats.Boss.Evasao,
                    MonsterStats.Boss.Armadura
                ),
                "Deploy Final Expediente"
            ),
            EntityType.UnexplainedBug => (
                new PlayerStats(
                    MonsterStats.UnexplainedBug.Hp,
                    MonsterStats.UnexplainedBug.Dano,
                    MonsterStats.UnexplainedBug.VelAtaque,
                    MonsterStats.UnexplainedBug.VelMov,
                    MonsterStats.UnexplainedBug.Crit,
                    MonsterStats.UnexplainedBug.Evasao,
                    MonsterStats.UnexplainedBug.Armadura
                ),
                "Unexplained Bug"
            ),
            _ => throw new ArgumentException($"Invalid monster type: {type}")
        };
    }

    public IEnumerable<Entity> GetEntitiesInRange(Entity center, float range)
    {
        return _entities.Values
            .Where(e => e.Id != center.Id && e.IsAlive && center.DistanceTo(e) <= range);
    }

    public IEnumerable<Entity> GetEntitiesInRange(float x, float y, float range)
    {
        return _entities.Values
            .Where(e => e.IsAlive && e.DistanceTo(x, y) <= range);
    }

    private (float x, float y) GetSpawnPosition(string reino)
    {
        // Spawn no território do reino
        return Territories.GetSpawnPosition(reino, _random);
    }

    public (float x, float y) GetRespawnPosition(string reino)
    {
        // Respawn no território do reino
        return Territories.GetSpawnPosition(reino, _random);
    }

    public (float x, float y) GetRandomPosition()
    {
        return (_random.NextSingle() * Width, _random.NextSingle() * Height);
    }

    public (float x, float y) ClampToWorld(float x, float y)
    {
        x = Math.Clamp(x, 0, Width);
        y = Math.Clamp(y, 0, Height);
        return (x, y);
    }

    /// <summary>
    /// Check if position is inside any collision zone
    /// </summary>
    public static bool IsInsideCollisionZone(float x, float y, float radius = 15f)
    {
        foreach (var zone in GameConstants.DeskCollisionZones)
        {
            if (x >= zone.X - radius &&
                x <= zone.X + zone.Width + radius &&
                y >= zone.Y - radius &&
                y <= zone.Y + zone.Height + radius)
            {
                return true;
            }
        }
        return false;
    }

    /// <summary>
    /// If entity is stuck inside a collision zone, move to spawn point
    /// </summary>
    public void UnstickEntity(Entity entity)
    {
        if (IsInsideCollisionZone(entity.X, entity.Y))
        {
            var (safeX, safeY) = GetSpawnPosition(entity.Reino);
            entity.X = safeX;
            entity.Y = safeY;
            Console.WriteLine($"[World] Unstuck {entity.GithubLogin} from collision zone -> ({safeX:F0}, {safeY:F0})");
        }
    }

    // Player Session Management
    public void RegisterPlayerSession(PlayerSession session)
    {
        _playerSessions[session.GithubLogin.ToLowerInvariant()] = session;
    }

    public bool UnregisterPlayerSession(string githubLogin)
    {
        return _playerSessions.TryRemove(githubLogin.ToLowerInvariant(), out _);
    }

    public PlayerSession? GetPlayerSession(string githubLogin)
    {
        _playerSessions.TryGetValue(githubLogin.ToLowerInvariant(), out var session);
        return session;
    }

    public bool IsPlayerOnline(string githubLogin)
    {
        return _playerSessions.ContainsKey(githubLogin.ToLowerInvariant());
    }

    public void UpdateHeartbeat(string githubLogin)
    {
        if (_playerSessions.TryGetValue(githubLogin.ToLowerInvariant(), out var session))
        {
            session.LastHeartbeat = DateTime.UtcNow;
        }
    }

    public IEnumerable<PlayerSession> GetStaleSessions(TimeSpan timeout)
    {
        var threshold = DateTime.UtcNow - timeout;
        return _playerSessions.Values.Where(s => s.LastHeartbeat < threshold);
    }

    public IReadOnlyCollection<PlayerSession> PlayerSessions => _playerSessions.Values.ToList();
}
