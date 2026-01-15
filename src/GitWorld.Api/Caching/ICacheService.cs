namespace GitWorld.Api.Caching;

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key) where T : class;
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null) where T : class;
    Task RemoveAsync(string key);
    Task RemoveByPatternAsync(string pattern);
    bool IsConnected { get; }
}

public static class CacheKeys
{
    // Clerk user cache - 5 min TTL
    public static string ClerkUser(string clerkId) => $"clerk:user:{clerkId}";
    public static readonly TimeSpan ClerkUserTtl = TimeSpan.FromMinutes(5);

    // Player cache - 15 min TTL
    public static string PlayerByClerkId(string clerkId) => $"player:clerk:{clerkId}";
    public static string PlayerById(Guid playerId) => $"player:id:{playerId}";
    public static readonly TimeSpan PlayerTtl = TimeSpan.FromMinutes(15);

    // Shop items - 1 hour TTL (rarely changes)
    public static string AllItems => "items:all";
    public static readonly TimeSpan ItemsTtl = TimeSpan.FromHours(1);

    // Player inventory - 5 min TTL
    public static string PlayerInventory(Guid playerId) => $"player:{playerId}:inventory";
    public static string PlayerBonuses(Guid playerId) => $"player:{playerId}:bonuses";
    public static readonly TimeSpan InventoryTtl = TimeSpan.FromMinutes(5);

    // Script - 5 min TTL
    public static string PlayerScript(Guid playerId) => $"player:{playerId}:script";
    public static readonly TimeSpan ScriptTtl = TimeSpan.FromMinutes(5);
}
