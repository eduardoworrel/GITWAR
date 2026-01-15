using System.Collections.Concurrent;
using System.Diagnostics;
using Jint;
using Jint.Runtime;

namespace GitWorld.Api.Core.Scripting;

/// <summary>
/// Executes player scripts in a sandboxed JavaScript environment using Jint.
/// Includes resource limits, error handling, and caching.
/// </summary>
public class ScriptExecutor
{
    private readonly ILogger<ScriptExecutor> _logger;

    // Cache compiled scripts per player to avoid re-parsing every tick
    private readonly ConcurrentDictionary<Guid, CachedScript> _scriptCache = new();

    // Execution limits
    private const int MaxExecutionTimeMs = 10;         // Max 10ms per tick (increased for CancellationToken overhead)
    private const int MaxStatements = 1000;            // Max statements per execution
    private const int MaxMemoryMb = 2;                 // Max 2MB memory
    private const int MaxRecursionDepth = 50;          // Max recursion depth

    // Error tracking for auto-disable
    private readonly ConcurrentDictionary<Guid, int> _errorCounts = new();
    private readonly ConcurrentDictionary<Guid, DateTime> _disabledUntil = new();
    private const int MaxErrorsBeforeDisable = 3;  // Reduced from 10 to 3
    private static readonly TimeSpan DisableCooldown = TimeSpan.FromMinutes(5);  // Cooldown after disable

    // TEMPORARY: Blacklist known problematic scripts until they can be fixed in the database
    private static readonly HashSet<Guid> _blacklistedPlayers = new()
    {
        Guid.Parse("1f4e4e3c-ed69-4c84-bde9-7e046b0aa427")  // Player with infinite loop script
    };

    // Pool of CancellationTokenSources to reduce allocations
    private readonly ConcurrentQueue<CancellationTokenSource> _ctsPool = new();

    public ScriptExecutor(ILogger<ScriptExecutor> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Execute a player's script and return the resulting action.
    /// Returns null if script fails or is disabled.
    /// Uses CancellationToken for robust infinite loop protection.
    /// </summary>
    public ScriptAction? Execute(Guid playerId, string scriptCode, ScriptContext context)
    {
        // Check blacklist first (for known problematic scripts)
        if (_blacklistedPlayers.Contains(playerId))
        {
            return null; // Script permanently blacklisted
        }

        // Check if player is in cooldown from previous errors
        if (_disabledUntil.TryGetValue(playerId, out var disabledUntil) && DateTime.UtcNow < disabledUntil)
        {
            return null; // Script disabled, in cooldown
        }

        // Check if player has too many errors
        if (_errorCounts.TryGetValue(playerId, out var errorCount) && errorCount >= MaxErrorsBeforeDisable)
        {
            // Start cooldown and reset error count
            _disabledUntil[playerId] = DateTime.UtcNow.Add(DisableCooldown);
            _errorCounts.TryRemove(playerId, out _);
            _logger.LogWarning("Script for player {PlayerId} disabled for {Minutes} minutes due to repeated failures",
                playerId, DisableCooldown.TotalMinutes);
            return null;
        }

        // Get or reuse a CancellationTokenSource from pool
        if (!_ctsPool.TryDequeue(out var cts))
        {
            cts = new CancellationTokenSource();
        }

        try
        {
            cts.CancelAfter(MaxExecutionTimeMs);
            var stopwatch = Stopwatch.StartNew();

            // Create fresh engine with CancellationToken for this execution
            // This ensures robust cancellation even for tight loops
            var engine = CreateSandboxedEngineWithCancellation(cts.Token);

            // Expose context to JavaScript
            ExposeContextToEngine(engine, context);

            // Parse and execute the script (defines onTick function)
            engine.Execute(scriptCode);

            // Call onTick() if it exists
            var onTick = engine.GetValue("onTick");
            if (onTick.IsObject() && onTick.AsObject() is Jint.Native.Function.Function)
            {
                engine.Invoke("onTick");
            }

            stopwatch.Stop();

            // Log slow scripts
            if (stopwatch.ElapsedMilliseconds > MaxExecutionTimeMs)
            {
                _logger.LogWarning("Script for player {PlayerId} took {Ms}ms (limit: {Limit}ms)",
                    playerId, stopwatch.ElapsedMilliseconds, MaxExecutionTimeMs);
            }

            // Reset error count on success
            _errorCounts.TryRemove(playerId, out _);

            return context.Action;
        }
        catch (OperationCanceledException)
        {
            IncrementErrorCount(playerId);
            _logger.LogWarning("Script for player {PlayerId} cancelled - possible infinite loop", playerId);
            return null;
        }
        catch (ExecutionCanceledException)
        {
            IncrementErrorCount(playerId);
            _logger.LogWarning("Script for player {PlayerId} exceeded execution limits", playerId);
            return null;
        }
        catch (Exception ex)
        {
            IncrementErrorCount(playerId);
            _logger.LogWarning(ex, "Script error for player {PlayerId}: {Message}", playerId, ex.Message);
            return null;
        }
        finally
        {
            // Reset and return CTS to pool for reuse
            if (cts.TryReset())
            {
                _ctsPool.Enqueue(cts);
            }
            else
            {
                cts.Dispose();
            }
        }
    }

    /// <summary>
    /// Validate a script without executing it.
    /// Returns (isValid, errorMessage)
    /// </summary>
    public (bool IsValid, string? Error) ValidateScript(string scriptCode)
    {
        try
        {
            var engine = CreateSandboxedEngine();

            // Create a dummy context for validation
            engine.SetValue("self", new { });
            engine.SetValue("enemies", Array.Empty<object>());
            engine.SetValue("allies", Array.Empty<object>());
            engine.SetValue("monsters", Array.Empty<object>());
            engine.SetValue("players", Array.Empty<object>());
            engine.SetValue("event", new { active = false, type = "", monstersRemaining = 0 });
            engine.SetValue("tick", 0);
            engine.SetValue("attackRange", 100);

            // Expose no-op functions for validation
            engine.SetValue("moveTo", new Action<float, float>((x, y) => { }));
            engine.SetValue("moveToEntity", new Action<object>(e => { }));
            engine.SetValue("attack", new Action<object>(e => { }));
            engine.SetValue("attackNearest", new Action(() => { }));
            engine.SetValue("flee", new Action(() => { }));
            engine.SetValue("stop", new Action(() => { }));
            engine.SetValue("getDistance", new Func<object, float>(e => 0));
            engine.SetValue("isInAttackRange", new Func<object, bool>(e => false));
            engine.SetValue("getNearestEnemy", new Func<object?>(() => null));
            engine.SetValue("getNearestAlly", new Func<object?>(() => null));
            engine.SetValue("getNearestMonster", new Func<object?>(() => null));
            engine.SetValue("getNearestPlayer", new Func<object?>(() => null));
            engine.SetValue("getEntitiesInRange", new Func<float, object[]>(r => Array.Empty<object>()));
            engine.SetValue("log", new Action<string>(m => { }));
            engine.SetValue("random", new Func<double>(() => 0.5));
            engine.SetValue("randomRange", new Func<double, double, double>((min, max) => min));

            // Try to parse the script
            engine.Execute(scriptCode);

            // Check if onTick exists
            var onTick = engine.GetValue("onTick");
            if (!onTick.IsObject() || onTick.AsObject() is not Jint.Native.Function.Function)
            {
                return (false, "Script must define an 'onTick()' function");
            }

            return (true, null);
        }
        catch (JavaScriptException ex)
        {
            return (false, $"JavaScript error: {ex.Message} at line {ex.Location.Start.Line}");
        }
        catch (Exception ex)
        {
            return (false, $"Error: {ex.Message}");
        }
    }

    /// <summary>
    /// Clear cached script for a player (call when script is updated)
    /// </summary>
    public void InvalidateCache(Guid playerId)
    {
        _scriptCache.TryRemove(playerId, out _);
        _errorCounts.TryRemove(playerId, out _);
        _disabledUntil.TryRemove(playerId, out _);  // Clear cooldown when script is updated
    }

    /// <summary>
    /// Reset error count for a player (call when script is updated)
    /// </summary>
    public void ResetErrors(Guid playerId)
    {
        _errorCounts.TryRemove(playerId, out _);
    }

    /// <summary>
    /// Check if a player's script is disabled due to errors
    /// </summary>
    public bool IsDisabled(Guid playerId)
    {
        // Check cooldown first
        if (_disabledUntil.TryGetValue(playerId, out var disabledUntil) && DateTime.UtcNow < disabledUntil)
        {
            return true;
        }
        return _errorCounts.TryGetValue(playerId, out var count) && count >= MaxErrorsBeforeDisable;
    }

    /// <summary>
    /// Get error count for a player
    /// </summary>
    public int GetErrorCount(Guid playerId)
    {
        return _errorCounts.GetValueOrDefault(playerId, 0);
    }

    #region Private Methods

    private Engine CreateSandboxedEngine()
    {
        return new Engine(options =>
        {
            // Resource limits
            options.TimeoutInterval(TimeSpan.FromMilliseconds(MaxExecutionTimeMs));
            options.MaxStatements(MaxStatements);
            options.LimitRecursion(MaxRecursionDepth);
            options.LimitMemory(MaxMemoryMb * 1024 * 1024);

            // Disable dangerous features
            options.Strict();

            // Allow CLR interop for our exposed types only
            options.AllowClr(typeof(ScriptEntity).Assembly);
        });
    }

    private Engine CreateSandboxedEngineWithCancellation(CancellationToken cancellationToken)
    {
        return new Engine(options =>
        {
            // CancellationToken provides robust protection against infinite loops
            // The engine checks this token at regular intervals during execution
            options.CancellationToken(cancellationToken);

            // Additional resource limits as fallback
            options.TimeoutInterval(TimeSpan.FromMilliseconds(MaxExecutionTimeMs));
            options.MaxStatements(MaxStatements);
            options.LimitRecursion(MaxRecursionDepth);
            options.LimitMemory(MaxMemoryMb * 1024 * 1024);

            // Disable dangerous features
            options.Strict();

            // Allow CLR interop for our exposed types only
            options.AllowClr(typeof(ScriptEntity).Assembly);
        });
    }

    private void ExposeContextToEngine(Engine engine, ScriptContext context)
    {
        // Expose read-only data
        engine.SetValue("self", context.Self);
        engine.SetValue("enemies", context.Enemies);
        engine.SetValue("allies", context.Allies);
        engine.SetValue("monsters", context.Monsters);
        engine.SetValue("players", context.Players);
        engine.SetValue("event", context.Event);
        engine.SetValue("tick", context.Tick);
        engine.SetValue("attackRange", context.AttackRange);

        // Expose action functions
        engine.SetValue("moveTo", new Action<float, float>(context.MoveTo));
        engine.SetValue("moveToEntity", new Action<ScriptEntity>(context.MoveToEntity));
        engine.SetValue("attack", new Action<ScriptEntity>(context.Attack));
        engine.SetValue("attackNearest", new Action(context.AttackNearest));
        engine.SetValue("flee", new Action(context.Flee));
        engine.SetValue("stop", new Action(context.Stop));

        // Expose query functions
        engine.SetValue("getDistance", new Func<ScriptEntity, float>(context.GetDistance));
        engine.SetValue("isInAttackRange", new Func<ScriptEntity, bool>(context.IsInAttackRange));
        engine.SetValue("getNearestEnemy", new Func<ScriptEntity?>(context.GetNearestEnemy));
        engine.SetValue("getNearestAlly", new Func<ScriptEntity?>(context.GetNearestAlly));
        engine.SetValue("getNearestMonster", new Func<ScriptEntity?>(context.GetNearestMonster));
        engine.SetValue("getNearestPlayer", new Func<ScriptEntity?>(context.GetNearestPlayer));
        engine.SetValue("getEntitiesInRange", new Func<float, ScriptEntity[]>(context.GetEntitiesInRange));

        // Expose utility functions
        engine.SetValue("log", new Action<string>(context.Log));
        engine.SetValue("random", new Func<double>(context.Random));
        engine.SetValue("randomRange", new Func<double, double, double>(context.RandomRange));
    }

    private void IncrementErrorCount(Guid playerId)
    {
        _errorCounts.AddOrUpdate(playerId, 1, (_, count) => count + 1);
    }

    #endregion

    private class CachedScript
    {
        public Engine? Engine { get; set; }
        public int ScriptHash { get; set; }
        public bool IsCompiled { get; set; }
    }
}

/// <summary>
/// Default script that mimics the original PlayerBehaviorSystem
/// </summary>
public static class DefaultScript
{
    public const string Code = @"
// Default behavior script
// This mimics the original auto-battle behavior

function onTick() {
    // During events, prioritize monsters
    if (event.active) {
        const monster = getNearestMonster();
        if (monster) {
            if (isInAttackRange(monster)) {
                attack(monster);
            } else {
                moveToEntity(monster);
            }
            return;
        }
    }

    // Find nearest enemy
    const enemy = getNearestEnemy();

    if (!enemy) {
        // No enemies, stay idle
        stop();
        return;
    }

    // Attack if in range, otherwise move towards enemy
    if (isInAttackRange(enemy)) {
        attack(enemy);
    } else {
        moveToEntity(enemy);
    }
}
";
}
