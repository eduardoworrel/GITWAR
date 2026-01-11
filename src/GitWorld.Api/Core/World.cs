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

    public Entity AddEntity(Guid playerId, string githubLogin, PlayerStats stats, string reino, int elo = 1000, int vitorias = 0, int derrotas = 0, int level = 1, int exp = 0, int gold = 0)
    {
        var (x, y) = GetSpawnPosition(reino);
        var entity = new Entity(playerId, githubLogin, stats, reino, x, y, EntityType.Player, elo, vitorias, derrotas, level, exp, gold);
        _entities[entity.Id] = entity;
        Console.WriteLine($"[World:{GetHashCode()}] AddEntity {githubLogin} (Lv.{level}) - Total: {_entities.Count}");
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
        // Find unoccupied position to avoid stacking on other entities
        var (finalX, finalY) = FindUnoccupiedPosition(clampedX, clampedY, 25f, 15);
        var (stats, name) = GetMonsterStatsAndName(type);
        var entity = new Entity(Guid.NewGuid(), name, stats, "Monster", finalX, finalY, type);
        _entities[entity.Id] = entity;
        Console.WriteLine($"[World] Spawned {name} at ({finalX:F0}, {finalY:F0})");
        return entity;
    }

    // Helper to convert MonsterStats tuple to PlayerStats
    private static PlayerStats ToPlayerStats((int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) s)
        => new(s.Hp, s.Dano, s.VelAtaque, s.VelMov, s.Crit, s.Evasao, s.Armadura);

    private static (PlayerStats stats, string name) GetMonsterStatsAndName(EntityType type)
    {
        return type switch
        {
            // === Original Monsters ===
            EntityType.Bug => (ToPlayerStats(MonsterStats.Bug), "Bug"),
            EntityType.AIHallucination => (ToPlayerStats(MonsterStats.AIHallucination), "AI Hallucination"),
            EntityType.Manager => (ToPlayerStats(MonsterStats.Manager), "Manager"),
            EntityType.Boss => (ToPlayerStats(MonsterStats.Boss), "Deploy Final Expediente"),
            EntityType.UnexplainedBug => (ToPlayerStats(MonsterStats.UnexplainedBug), "Unexplained Bug"),

            // === JavaScript Errors ===
            EntityType.JsUndefined => (ToPlayerStats(MonsterStats.JsUndefined), "undefined"),
            EntityType.JsNaN => (ToPlayerStats(MonsterStats.JsNaN), "NaN"),
            EntityType.JsCallbackHell => (ToPlayerStats(MonsterStats.JsCallbackHell), "Callback Hell"),

            // === Python Errors ===
            EntityType.PyIndentationError => (ToPlayerStats(MonsterStats.PyIndentationError), "IndentationError"),
            EntityType.PyNoneType => (ToPlayerStats(MonsterStats.PyNoneType), "NoneType"),
            EntityType.PyImportError => (ToPlayerStats(MonsterStats.PyImportError), "ImportError"),

            // === Java Errors ===
            EntityType.JavaNullPointer => (ToPlayerStats(MonsterStats.JavaNullPointer), "NullPointerException"),
            EntityType.JavaClassNotFound => (ToPlayerStats(MonsterStats.JavaClassNotFound), "ClassNotFoundException"),
            EntityType.JavaOutOfMemory => (ToPlayerStats(MonsterStats.JavaOutOfMemory), "OutOfMemoryError"),

            // === C# Errors ===
            EntityType.CsNullReference => (ToPlayerStats(MonsterStats.CsNullReference), "NullReferenceException"),
            EntityType.CsStackOverflow => (ToPlayerStats(MonsterStats.CsStackOverflow), "StackOverflowException"),
            EntityType.CsInvalidCast => (ToPlayerStats(MonsterStats.CsInvalidCast), "InvalidCastException"),

            // === C/C++ Errors ===
            EntityType.CSegFault => (ToPlayerStats(MonsterStats.CSegFault), "Segmentation Fault"),
            EntityType.CStackOverflow => (ToPlayerStats(MonsterStats.CStackOverflow), "Stack Overflow"),
            EntityType.CMemoryLeak => (ToPlayerStats(MonsterStats.CMemoryLeak), "Memory Leak"),

            // === TypeScript Errors ===
            EntityType.TsTypeError => (ToPlayerStats(MonsterStats.TsTypeError), "Type Error"),
            EntityType.TsAny => (ToPlayerStats(MonsterStats.TsAny), "any"),
            EntityType.TsReadonly => (ToPlayerStats(MonsterStats.TsReadonly), "readonly"),

            // === PHP Errors ===
            EntityType.PhpPaamayim => (ToPlayerStats(MonsterStats.PhpPaamayim), "T_PAAMAYIM_NEKUDOTAYIM"),
            EntityType.PhpFatalError => (ToPlayerStats(MonsterStats.PhpFatalError), "Fatal Error"),
            EntityType.PhpUndefinedIndex => (ToPlayerStats(MonsterStats.PhpUndefinedIndex), "Undefined Index"),

            // === Go Errors ===
            EntityType.GoNilPanic => (ToPlayerStats(MonsterStats.GoNilPanic), "nil panic"),
            EntityType.GoDeadlock => (ToPlayerStats(MonsterStats.GoDeadlock), "Deadlock"),
            EntityType.GoImportCycle => (ToPlayerStats(MonsterStats.GoImportCycle), "Import Cycle"),

            // === Rust Errors ===
            EntityType.RustBorrowChecker => (ToPlayerStats(MonsterStats.RustBorrowChecker), "Borrow Checker"),
            EntityType.RustPanic => (ToPlayerStats(MonsterStats.RustPanic), "panic!"),
            EntityType.RustLifetimeError => (ToPlayerStats(MonsterStats.RustLifetimeError), "Lifetime Error"),

            // === Ruby Errors ===
            EntityType.RubyNoMethodError => (ToPlayerStats(MonsterStats.RubyNoMethodError), "NoMethodError"),
            EntityType.RubyLoadError => (ToPlayerStats(MonsterStats.RubyLoadError), "LoadError"),
            EntityType.RubySyntaxError => (ToPlayerStats(MonsterStats.RubySyntaxError), "SyntaxError"),

            // === Swift Errors ===
            EntityType.SwiftFoundNil => (ToPlayerStats(MonsterStats.SwiftFoundNil), "found nil"),
            EntityType.SwiftForceUnwrap => (ToPlayerStats(MonsterStats.SwiftForceUnwrap), "Force Unwrap"),
            EntityType.SwiftIndexOutOfRange => (ToPlayerStats(MonsterStats.SwiftIndexOutOfRange), "Index out of range"),

            // === Kotlin Errors ===
            EntityType.KotlinNullPointer => (ToPlayerStats(MonsterStats.KotlinNullPointer), "KotlinNullPointerException"),
            EntityType.KotlinClassCast => (ToPlayerStats(MonsterStats.KotlinClassCast), "ClassCastException"),
            EntityType.KotlinUninitialized => (ToPlayerStats(MonsterStats.KotlinUninitialized), "UninitializedPropertyAccess"),

            // === Scala Errors ===
            EntityType.ScalaMatchError => (ToPlayerStats(MonsterStats.ScalaMatchError), "MatchError"),
            EntityType.ScalaAbstractMethod => (ToPlayerStats(MonsterStats.ScalaAbstractMethod), "AbstractMethodError"),
            EntityType.ScalaStackOverflow => (ToPlayerStats(MonsterStats.ScalaStackOverflow), "StackOverflowError"),

            // === R Errors ===
            EntityType.REvalError => (ToPlayerStats(MonsterStats.REvalError), "Error in eval"),
            EntityType.RObjectNotFound => (ToPlayerStats(MonsterStats.RObjectNotFound), "object not found"),
            EntityType.RSubscriptOutOfBounds => (ToPlayerStats(MonsterStats.RSubscriptOutOfBounds), "subscript out of bounds"),

            // === SQL Errors ===
            EntityType.SqlDeadlock => (ToPlayerStats(MonsterStats.SqlDeadlock), "Deadlock"),
            EntityType.SqlSyntaxError => (ToPlayerStats(MonsterStats.SqlSyntaxError), "Syntax Error"),
            EntityType.SqlTimeout => (ToPlayerStats(MonsterStats.SqlTimeout), "Connection Timeout"),

            // === Shell/Bash Errors ===
            EntityType.BashCommandNotFound => (ToPlayerStats(MonsterStats.BashCommandNotFound), "command not found"),
            EntityType.BashPermissionDenied => (ToPlayerStats(MonsterStats.BashPermissionDenied), "Permission denied"),
            EntityType.BashCoreDumped => (ToPlayerStats(MonsterStats.BashCoreDumped), "core dumped"),

            // === Perl Errors ===
            EntityType.PerlUninitialized => (ToPlayerStats(MonsterStats.PerlUninitialized), "uninitialized value"),
            EntityType.PerlSyntaxError => (ToPlayerStats(MonsterStats.PerlSyntaxError), "syntax error"),
            EntityType.PerlCantLocate => (ToPlayerStats(MonsterStats.PerlCantLocate), "Can't locate"),

            // === Lua Errors ===
            EntityType.LuaIndexNil => (ToPlayerStats(MonsterStats.LuaIndexNil), "attempt to index nil"),
            EntityType.LuaBadArgument => (ToPlayerStats(MonsterStats.LuaBadArgument), "bad argument"),
            EntityType.LuaStackOverflow => (ToPlayerStats(MonsterStats.LuaStackOverflow), "stack overflow"),

            // === Dart Errors ===
            EntityType.DartNullCheck => (ToPlayerStats(MonsterStats.DartNullCheck), "Null check on null"),
            EntityType.DartRangeError => (ToPlayerStats(MonsterStats.DartRangeError), "RangeError"),
            EntityType.DartNoSuchMethod => (ToPlayerStats(MonsterStats.DartNoSuchMethod), "NoSuchMethodError"),

            // === Elixir Errors ===
            EntityType.ElixirFunctionClause => (ToPlayerStats(MonsterStats.ElixirFunctionClause), "FunctionClauseError"),
            EntityType.ElixirArgumentError => (ToPlayerStats(MonsterStats.ElixirArgumentError), "ArgumentError"),
            EntityType.ElixirKeyError => (ToPlayerStats(MonsterStats.ElixirKeyError), "KeyError"),

            // === AI/ML Errors ===
            EntityType.AIVanishingGradient => (ToPlayerStats(MonsterStats.AIVanishingGradient), "Vanishing Gradient"),
            EntityType.AIExplodingGradient => (ToPlayerStats(MonsterStats.AIExplodingGradient), "Exploding Gradient"),
            EntityType.AIDyingRelu => (ToPlayerStats(MonsterStats.AIDyingRelu), "Dying ReLU"),
            EntityType.AIOverfitting => (ToPlayerStats(MonsterStats.AIOverfitting), "Overfitting"),
            EntityType.AIUnderfitting => (ToPlayerStats(MonsterStats.AIUnderfitting), "Underfitting"),
            EntityType.AIModeCollapse => (ToPlayerStats(MonsterStats.AIModeCollapse), "Mode Collapse"),
            EntityType.AICatastrophicForgetting => (ToPlayerStats(MonsterStats.AICatastrophicForgetting), "Catastrophic Forgetting"),
            EntityType.AIDataLeakage => (ToPlayerStats(MonsterStats.AIDataLeakage), "Data Leakage"),
            EntityType.AICudaOutOfMemory => (ToPlayerStats(MonsterStats.AICudaOutOfMemory), "CUDA OOM"),
            EntityType.AIBiasVariance => (ToPlayerStats(MonsterStats.AIBiasVariance), "Bias-Variance"),
            EntityType.AIDeadNeuron => (ToPlayerStats(MonsterStats.AIDeadNeuron), "Dead Neuron"),
            EntityType.AINaNLoss => (ToPlayerStats(MonsterStats.AINaNLoss), "NaN Loss"),

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
    /// Check if position is too close to any entity
    /// </summary>
    public bool IsPositionOccupied(float x, float y, float minDistance = 30f, Guid? excludeEntity = null)
    {
        foreach (var entity in _entities.Values)
        {
            if (excludeEntity.HasValue && entity.Id == excludeEntity.Value)
                continue;
            if (!entity.IsAlive)
                continue;

            var dist = entity.DistanceTo(x, y);
            if (dist < minDistance)
                return true;
        }
        return false;
    }

    /// <summary>
    /// Find a safe position near the target that is not occupied by other entities
    /// </summary>
    public (float x, float y) FindUnoccupiedPosition(float targetX, float targetY, float minDistance = 30f, int maxAttempts = 10)
    {
        // First check if target position is already free
        if (!IsPositionOccupied(targetX, targetY, minDistance) && !IsInsideCollisionZone(targetX, targetY))
            return (targetX, targetY);

        // Try random offsets around the target
        for (int i = 0; i < maxAttempts; i++)
        {
            var angle = _random.NextSingle() * MathF.PI * 2;
            var distance = minDistance + _random.NextSingle() * minDistance; // 30-60 units away

            var x = targetX + MathF.Cos(angle) * distance;
            var y = targetY + MathF.Sin(angle) * distance;

            var (clampedX, clampedY) = ClampToWorld(x, y);

            if (!IsPositionOccupied(clampedX, clampedY, minDistance) && !IsInsideCollisionZone(clampedX, clampedY))
                return (clampedX, clampedY);
        }

        // Fallback: return original position
        return (targetX, targetY);
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
