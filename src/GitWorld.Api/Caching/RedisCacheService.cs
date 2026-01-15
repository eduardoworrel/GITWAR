using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using StackExchange.Redis;

namespace GitWorld.Api.Caching;

public class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<RedisCacheService> _logger;
    private readonly bool _redisEnabled;

    // Circuit breaker state
    private int _failureCount;
    private DateTime _circuitOpenedAt = DateTime.MinValue;
    private const int FailureThreshold = 5;
    private static readonly TimeSpan CircuitResetTime = TimeSpan.FromSeconds(30);

    public RedisCacheService(
        IConnectionMultiplexer? redis,
        IMemoryCache memoryCache,
        ILogger<RedisCacheService> logger,
        IConfiguration configuration)
    {
        _redis = redis;
        _memoryCache = memoryCache;
        _logger = logger;
        _redisEnabled = configuration.GetValue<bool>("Redis:Enabled", false);
    }

    public bool IsConnected => _redisEnabled && _redis?.IsConnected == true && !IsCircuitOpen;

    private bool IsCircuitOpen => _failureCount >= FailureThreshold &&
                                   DateTime.UtcNow - _circuitOpenedAt < CircuitResetTime;

    public async Task<T?> GetAsync<T>(string key) where T : class
    {
        // Try memory cache first (L1)
        if (_memoryCache.TryGetValue(key, out T? memoryValue))
        {
            return memoryValue;
        }

        // Try Redis (L2) if available
        if (!IsConnected || IsCircuitOpen)
        {
            return null;
        }

        try
        {
            var db = _redis!.GetDatabase();
            var value = await db.StringGetAsync(key);

            if (value.HasValue)
            {
                var result = JsonSerializer.Deserialize<T>(value.ToString());
                if (result != null)
                {
                    // Store in memory cache with shorter TTL
                    _memoryCache.Set(key, result, TimeSpan.FromMinutes(1));
                }
                ResetCircuit();
                return result;
            }

            ResetCircuit();
            return null;
        }
        catch (Exception ex)
        {
            RecordFailure(ex);
            return null;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null) where T : class
    {
        var json = JsonSerializer.Serialize(value);

        // Always set in memory cache
        _memoryCache.Set(key, value, expiry ?? TimeSpan.FromMinutes(5));

        // Try Redis if available
        if (!IsConnected || IsCircuitOpen)
        {
            return;
        }

        try
        {
            var db = _redis!.GetDatabase();
            if (expiry.HasValue)
            {
                await db.StringSetAsync(key, json, expiry.Value);
            }
            else
            {
                await db.StringSetAsync(key, json);
            }
            ResetCircuit();
        }
        catch (Exception ex)
        {
            RecordFailure(ex);
        }
    }

    public async Task RemoveAsync(string key)
    {
        _memoryCache.Remove(key);

        if (!IsConnected || IsCircuitOpen)
        {
            return;
        }

        try
        {
            var db = _redis!.GetDatabase();
            await db.KeyDeleteAsync(key);
            ResetCircuit();
        }
        catch (Exception ex)
        {
            RecordFailure(ex);
        }
    }

    public async Task RemoveByPatternAsync(string pattern)
    {
        // Memory cache doesn't support pattern removal easily
        // For Redis, use SCAN + DEL

        if (!IsConnected || IsCircuitOpen)
        {
            return;
        }

        try
        {
            var endpoints = _redis!.GetEndPoints();
            foreach (var endpoint in endpoints)
            {
                var server = _redis.GetServer(endpoint);
                var keys = server.Keys(pattern: pattern).ToArray();

                if (keys.Length > 0)
                {
                    var db = _redis.GetDatabase();
                    await db.KeyDeleteAsync(keys);
                }
            }
            ResetCircuit();
        }
        catch (Exception ex)
        {
            RecordFailure(ex);
        }
    }

    private void RecordFailure(Exception ex)
    {
        _failureCount++;
        if (_failureCount >= FailureThreshold)
        {
            _circuitOpenedAt = DateTime.UtcNow;
            _logger.LogWarning(ex, "Redis circuit breaker opened after {Count} failures", _failureCount);
        }
    }

    private void ResetCircuit()
    {
        if (_failureCount > 0)
        {
            _failureCount = 0;
            _logger.LogInformation("Redis circuit breaker reset");
        }
    }
}
