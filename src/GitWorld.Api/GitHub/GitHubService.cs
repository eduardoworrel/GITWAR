using Microsoft.Extensions.Caching.Memory;
using GitWorld.Api.GitHub.Models;

namespace GitWorld.Api.GitHub;

/// <summary>
/// Serviço principal para obter dados do GitHub com cache.
/// Integra GitHubFetcher + StatsCalculator + IMemoryCache.
/// </summary>
public interface IGitHubService
{
    /// <summary>
    /// Obtém o perfil completo do jogador (com cache de 1 hora).
    /// </summary>
    Task<PlayerProfile> GetPlayerProfileAsync(string username, string? accessToken = null, bool forceRefresh = false);

    /// <summary>
    /// Obtém apenas os stats calculados (com cache).
    /// </summary>
    Task<PlayerStats> GetPlayerStatsAsync(string username, string? accessToken = null, bool forceRefresh = false);

    /// <summary>
    /// Obtém os dados brutos do GitHub (para exibição no perfil).
    /// </summary>
    Task<GitHubData> GetRawDataAsync(string username, string? accessToken = null, bool forceRefresh = false);

    /// <summary>
    /// Invalida o cache de um usuário.
    /// </summary>
    void InvalidateCache(string username);
}

public class GitHubService : IGitHubService
{
    private readonly IGitHubFetcher _fetcher;
    private readonly IStatsCalculator _calculator;
    private readonly IMemoryCache _cache;
    private readonly ILogger<GitHubService> _logger;
    private readonly string? _defaultToken;

    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);
    private const string CacheKeyPrefix = "github_player_";

    public GitHubService(
        IGitHubFetcher fetcher,
        IStatsCalculator calculator,
        IMemoryCache cache,
        ILogger<GitHubService> logger,
        IConfiguration configuration)
    {
        _fetcher = fetcher;
        _calculator = calculator;
        _cache = cache;
        _logger = logger;
        _defaultToken = configuration["GITHUB_TOKEN"] ?? Environment.GetEnvironmentVariable("GITHUB_TOKEN");

        if (!string.IsNullOrEmpty(_defaultToken))
        {
            _logger.LogInformation("GitHub token configurado - rate limit: 5000 req/hora");
        }
        else
        {
            _logger.LogWarning("GITHUB_TOKEN não configurado - rate limit: 60 req/hora");
        }
    }

    public async Task<PlayerProfile> GetPlayerProfileAsync(string username, string? accessToken = null, bool forceRefresh = false)
    {
        var cacheKey = GetCacheKey(username);

        if (!forceRefresh && _cache.TryGetValue(cacheKey, out PlayerProfile? cachedProfile) && cachedProfile != null)
        {
            _logger.LogDebug("Cache hit para {Username}", username);
            return cachedProfile;
        }

        _logger.LogInformation("Buscando dados do GitHub para {Username}", username);

        var token = accessToken ?? _defaultToken;
        var githubData = await _fetcher.FetchUserDataAsync(username, token);
        var stats = _calculator.Calculate(githubData);

        var profile = new PlayerProfile
        {
            Username = githubData.Username,
            GitHubId = githubData.GitHubId,
            AvatarUrl = githubData.AvatarUrl,
            Stats = stats,
            LastSync = DateTime.UtcNow,
            TotalProjects = githubData.TotalRepos,
            TotalCommits = githubData.Commits
        };

        // Cache por 1 hora
        var cacheOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(CacheDuration)
            .SetSlidingExpiration(TimeSpan.FromMinutes(30));

        _cache.Set(cacheKey, profile, cacheOptions);

        _logger.LogInformation("Dados de {Username} cacheados por 1 hora. Reino: {Reino}", username, stats.Reino);

        return profile;
    }

    public async Task<PlayerStats> GetPlayerStatsAsync(string username, string? accessToken = null, bool forceRefresh = false)
    {
        var profile = await GetPlayerProfileAsync(username, accessToken, forceRefresh);
        return profile.Stats;
    }

    public async Task<GitHubData> GetRawDataAsync(string username, string? accessToken = null, bool forceRefresh = false)
    {
        var token = accessToken ?? _defaultToken;
        return await _fetcher.FetchUserDataAsync(username, token);
    }

    public void InvalidateCache(string username)
    {
        var cacheKey = GetCacheKey(username);
        _cache.Remove(cacheKey);
        _logger.LogInformation("Cache invalidado para {Username}", username);
    }

    private static string GetCacheKey(string username)
    {
        return $"{CacheKeyPrefix}{username.ToLowerInvariant()}";
    }
}
