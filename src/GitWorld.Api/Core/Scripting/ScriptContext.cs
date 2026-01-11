using GitWorld.Shared;

namespace GitWorld.Api.Core.Scripting;

/// <summary>
/// Represents an entity visible to the script (read-only data)
/// </summary>
public class ScriptEntity
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty; // 'player', 'bug', 'boss', etc
    public float X { get; init; }
    public float Y { get; init; }
    public int Hp { get; init; }
    public int MaxHp { get; init; }
    public int Level { get; init; }
    public int Elo { get; init; }
    public int Dano { get; init; }
    public int Armadura { get; init; }
    public int Critico { get; init; }
    public int Evasao { get; init; }
    public int VelocidadeAtaque { get; init; }
    public int VelocidadeMovimento { get; init; }
    public string Estado { get; init; } = string.Empty; // 'idle', 'moving', 'attacking', 'dead'
    public string Reino { get; init; } = string.Empty;
    public bool IsMonster { get; init; }
    public bool IsPlayer { get; init; }
    public bool IsAlly { get; init; }
    public bool IsEnemy { get; init; }
}

/// <summary>
/// Event information available to scripts
/// </summary>
public class ScriptEventInfo
{
    public bool Active { get; init; }
    public string Type { get; init; } = string.Empty;
    public int MonstersRemaining { get; init; }
}

/// <summary>
/// Action that a script wants to perform
/// </summary>
public class ScriptAction
{
    public ScriptActionType Type { get; set; } = ScriptActionType.None;
    public float? TargetX { get; set; }
    public float? TargetY { get; set; }
    public string? TargetEntityId { get; set; }
}

public enum ScriptActionType
{
    None,
    MoveTo,
    MoveToEntity,
    Attack,
    AttackNearest,
    Flee,
    Stop
}

/// <summary>
/// Context passed to scripts with all available data and functions
/// </summary>
public class ScriptContext
{
    private readonly Entity _player;
    private readonly World _world;
    private readonly List<ScriptEntity> _enemies;
    private readonly List<ScriptEntity> _allies;
    private readonly List<ScriptEntity> _monsters;
    private readonly List<ScriptEntity> _players;
    private readonly ScriptEventInfo _event;
    private readonly long _tick;
    private readonly List<string> _logs = new();

    public ScriptAction Action { get; private set; } = new();

    public ScriptContext(Entity player, World world, bool isEventActive, string eventType, int monstersRemaining, long tick)
    {
        _player = player;
        _world = world;
        _tick = tick;

        _event = new ScriptEventInfo
        {
            Active = isEventActive,
            Type = eventType,
            MonstersRemaining = monstersRemaining
        };

        // Build entity lists
        _enemies = new List<ScriptEntity>();
        _allies = new List<ScriptEntity>();
        _monsters = new List<ScriptEntity>();
        _players = new List<ScriptEntity>();

        foreach (var entity in world.Entities)
        {
            if (entity.Id == player.Id) continue;
            if (!entity.IsAlive) continue;

            var scriptEntity = ToScriptEntity(entity, player);

            if (IsMonsterType(entity.Type))
            {
                _monsters.Add(scriptEntity);
                if (entity.Reino != player.Reino)
                    _enemies.Add(scriptEntity);
            }
            else if (entity.Type == EntityType.Player)
            {
                _players.Add(scriptEntity);
                if (entity.Reino == player.Reino)
                    _allies.Add(scriptEntity);
                else
                    _enemies.Add(scriptEntity);
            }
        }
    }

    #region Properties exposed to JavaScript

    /// <summary>
    /// The player's own data
    /// </summary>
    public ScriptEntity Self => ToScriptEntity(_player, _player);

    /// <summary>
    /// All enemies in vision range (players + monsters from different reino)
    /// </summary>
    public ScriptEntity[] Enemies => _enemies.ToArray();

    /// <summary>
    /// All allies in vision range (same reino)
    /// </summary>
    public ScriptEntity[] Allies => _allies.ToArray();

    /// <summary>
    /// All monsters in vision range
    /// </summary>
    public ScriptEntity[] Monsters => _monsters.ToArray();

    /// <summary>
    /// All players in vision range (excluding self)
    /// </summary>
    public ScriptEntity[] Players => _players.ToArray();

    /// <summary>
    /// Current event information
    /// </summary>
    public ScriptEventInfo Event => _event;

    /// <summary>
    /// Current server tick
    /// </summary>
    public long Tick => _tick;

    /// <summary>
    /// Attack range constant
    /// </summary>
    public float AttackRange => GameConstants.RangeAtaque;

    #endregion

    #region Functions exposed to JavaScript

    /// <summary>
    /// Move to specific coordinates
    /// </summary>
    public void MoveTo(float x, float y)
    {
        Action = new ScriptAction
        {
            Type = ScriptActionType.MoveTo,
            TargetX = Math.Clamp(x, 0, GameConstants.MapaWidth),
            TargetY = Math.Clamp(y, 0, GameConstants.MapaHeight)
        };
    }

    /// <summary>
    /// Move towards an entity
    /// </summary>
    public void MoveToEntity(ScriptEntity entity)
    {
        if (entity == null) return;
        Action = new ScriptAction
        {
            Type = ScriptActionType.MoveToEntity,
            TargetEntityId = entity.Id
        };
    }

    /// <summary>
    /// Attack a specific entity
    /// </summary>
    public void Attack(ScriptEntity entity)
    {
        if (entity == null) return;
        Action = new ScriptAction
        {
            Type = ScriptActionType.Attack,
            TargetEntityId = entity.Id
        };
    }

    /// <summary>
    /// Attack the nearest enemy
    /// </summary>
    public void AttackNearest()
    {
        Action = new ScriptAction { Type = ScriptActionType.AttackNearest };
    }

    /// <summary>
    /// Flee from enemies
    /// </summary>
    public void Flee()
    {
        Action = new ScriptAction { Type = ScriptActionType.Flee };
    }

    /// <summary>
    /// Stop moving and attacking
    /// </summary>
    public void Stop()
    {
        Action = new ScriptAction { Type = ScriptActionType.Stop };
    }

    /// <summary>
    /// Get distance to an entity
    /// </summary>
    public float GetDistance(ScriptEntity entity)
    {
        if (entity == null) return float.MaxValue;
        var dx = _player.X - entity.X;
        var dy = _player.Y - entity.Y;
        return MathF.Sqrt(dx * dx + dy * dy);
    }

    /// <summary>
    /// Check if entity is in attack range
    /// </summary>
    public bool IsInAttackRange(ScriptEntity entity)
    {
        return GetDistance(entity) <= GameConstants.RangeAtaque;
    }

    /// <summary>
    /// Get the nearest enemy (player or monster)
    /// </summary>
    public ScriptEntity? GetNearestEnemy()
    {
        return _enemies.MinBy(e => GetDistance(e));
    }

    /// <summary>
    /// Get the nearest ally
    /// </summary>
    public ScriptEntity? GetNearestAlly()
    {
        return _allies.MinBy(e => GetDistance(e));
    }

    /// <summary>
    /// Get the nearest monster
    /// </summary>
    public ScriptEntity? GetNearestMonster()
    {
        return _monsters.MinBy(e => GetDistance(e));
    }

    /// <summary>
    /// Get the nearest player (excluding self)
    /// </summary>
    public ScriptEntity? GetNearestPlayer()
    {
        return _players.MinBy(e => GetDistance(e));
    }

    /// <summary>
    /// Get entities within a specific range
    /// </summary>
    public ScriptEntity[] GetEntitiesInRange(float range)
    {
        return _enemies.Concat(_allies).Where(e => GetDistance(e) <= range).ToArray();
    }

    /// <summary>
    /// Log a message (limited, for debugging)
    /// </summary>
    public void Log(string message)
    {
        if (_logs.Count < 10) // Limit logs per tick
        {
            _logs.Add(message);
        }
    }

    /// <summary>
    /// Get random number between 0 and 1
    /// </summary>
    public double Random()
    {
        return System.Random.Shared.NextDouble();
    }

    /// <summary>
    /// Get random number between min and max
    /// </summary>
    public double RandomRange(double min, double max)
    {
        return min + System.Random.Shared.NextDouble() * (max - min);
    }

    #endregion

    #region Helpers

    public IReadOnlyList<string> GetLogs() => _logs;

    private ScriptEntity ToScriptEntity(Entity entity, Entity viewer)
    {
        var isMonster = IsMonsterType(entity.Type);
        return new ScriptEntity
        {
            Id = entity.Id.ToString(),
            Name = entity.GithubLogin,
            Type = entity.Type.ToString().ToLowerInvariant(),
            X = entity.X,
            Y = entity.Y,
            Hp = entity.CurrentHp,
            MaxHp = entity.MaxHp,
            Level = entity.Level,
            Elo = entity.Elo,
            Dano = entity.Dano,
            Armadura = entity.Armadura,
            Critico = entity.Critico,
            Evasao = entity.Evasao,
            VelocidadeAtaque = entity.VelocidadeAtaque,
            VelocidadeMovimento = entity.VelocidadeMovimento,
            Estado = entity.State.ToString().ToLowerInvariant(),
            Reino = entity.Reino,
            IsMonster = isMonster,
            IsPlayer = entity.Type == EntityType.Player,
            IsAlly = entity.Reino == viewer.Reino && entity.Id != viewer.Id,
            IsEnemy = entity.Reino != viewer.Reino
        };
    }

    private static bool IsMonsterType(EntityType type) =>
        type is EntityType.NPC or EntityType.Bug or EntityType.AIHallucination
            or EntityType.Manager or EntityType.Boss or EntityType.UnexplainedBug
            // Language errors
            or EntityType.JsUndefined or EntityType.JsNaN or EntityType.JsCallbackHell
            or EntityType.PyIndentationError or EntityType.PyNoneType or EntityType.PyImportError
            or EntityType.JavaNullPointer or EntityType.JavaClassNotFound or EntityType.JavaOutOfMemory
            or EntityType.CsNullReference or EntityType.CsStackOverflow or EntityType.CsInvalidCast
            or EntityType.CSegFault or EntityType.CStackOverflow or EntityType.CMemoryLeak
            or EntityType.TsTypeError or EntityType.TsAny or EntityType.TsReadonly
            or EntityType.PhpPaamayim or EntityType.PhpFatalError or EntityType.PhpUndefinedIndex
            or EntityType.GoNilPanic or EntityType.GoDeadlock or EntityType.GoImportCycle
            or EntityType.RustBorrowChecker or EntityType.RustPanic or EntityType.RustLifetimeError
            or EntityType.RubyNoMethodError or EntityType.RubyLoadError or EntityType.RubySyntaxError
            or EntityType.SwiftFoundNil or EntityType.SwiftForceUnwrap or EntityType.SwiftIndexOutOfRange
            or EntityType.KotlinNullPointer or EntityType.KotlinClassCast or EntityType.KotlinUninitialized
            or EntityType.ScalaMatchError or EntityType.ScalaAbstractMethod or EntityType.ScalaStackOverflow
            or EntityType.REvalError or EntityType.RObjectNotFound or EntityType.RSubscriptOutOfBounds
            or EntityType.SqlDeadlock or EntityType.SqlSyntaxError or EntityType.SqlTimeout
            or EntityType.BashCommandNotFound or EntityType.BashPermissionDenied or EntityType.BashCoreDumped
            or EntityType.PerlUninitialized or EntityType.PerlSyntaxError or EntityType.PerlCantLocate
            or EntityType.LuaIndexNil or EntityType.LuaBadArgument or EntityType.LuaStackOverflow
            or EntityType.DartNullCheck or EntityType.DartRangeError or EntityType.DartNoSuchMethod
            or EntityType.ElixirFunctionClause or EntityType.ElixirArgumentError or EntityType.ElixirKeyError
            // AI errors
            or EntityType.AIVanishingGradient or EntityType.AIExplodingGradient or EntityType.AIDyingRelu
            or EntityType.AIOverfitting or EntityType.AIUnderfitting or EntityType.AIModeCollapse
            or EntityType.AICatastrophicForgetting or EntityType.AIDataLeakage or EntityType.AICudaOutOfMemory
            or EntityType.AIBiasVariance or EntityType.AIDeadNeuron or EntityType.AINaNLoss;

    #endregion
}
