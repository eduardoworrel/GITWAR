using GitWorld.Api.Auth;
using GitWorld.Api.GitHub;
using Microsoft.Extensions.Caching.Memory;

namespace GitWorld.Api.Providers;

/// <summary>
/// Serviço unificado para obter stats de qualquer provedor.
/// Integra GitHubFetcher, GitLabFetcher, HuggingFaceFetcher + UnifiedStatsCalculator + cache.
/// </summary>
public interface IStatsService
{
    /// <summary>
    /// Obtém o perfil completo do jogador (com cache de 1 hora).
    /// </summary>
    Task<PlayerProfile> GetPlayerProfileAsync(OAuthProvider provider, string username, string? accessToken = null, bool forceRefresh = false);
}

public class StatsService : IStatsService
{
    private readonly IGitHubService _gitHubService;
    private readonly GitLabFetcher _gitLabFetcher;
    private readonly HuggingFaceFetcher _huggingFaceFetcher;
    private readonly IUnifiedStatsCalculator _calculator;
    private readonly IMemoryCache _cache;
    private readonly ILogger<StatsService> _logger;

    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);
    private const string CacheKeyPrefix = "player_stats_";

    public StatsService(
        IGitHubService gitHubService,
        GitLabFetcher gitLabFetcher,
        HuggingFaceFetcher huggingFaceFetcher,
        IUnifiedStatsCalculator calculator,
        IMemoryCache cache,
        ILogger<StatsService> logger)
    {
        _gitHubService = gitHubService;
        _gitLabFetcher = gitLabFetcher;
        _huggingFaceFetcher = huggingFaceFetcher;
        _calculator = calculator;
        _cache = cache;
        _logger = logger;
    }

    public async Task<PlayerProfile> GetPlayerProfileAsync(OAuthProvider provider, string username, string? accessToken = null, bool forceRefresh = false)
    {
        var cacheKey = GetCacheKey(provider, username);

        if (!forceRefresh && _cache.TryGetValue(cacheKey, out PlayerProfile? cachedProfile) && cachedProfile != null)
        {
            _logger.LogDebug("Cache hit for {Provider}/{Username}", provider, username);
            return cachedProfile;
        }

        _logger.LogInformation("Fetching stats from {Provider} for {Username}", provider, username);

        PlayerProfile profile;

        switch (provider)
        {
            case OAuthProvider.GitHub:
                // Usar o GitHubService existente (já tem cache próprio)
                var ghProfile = await _gitHubService.GetPlayerProfileAsync(username, accessToken, forceRefresh);
                profile = new PlayerProfile
                {
                    Username = ghProfile.Username,
                    UserId = ghProfile.GitHubId,
                    AvatarUrl = ghProfile.AvatarUrl,
                    Provider = "github",
                    Stats = new PlayerStats(
                        ghProfile.Stats.Hp,
                        ghProfile.Stats.Dano,
                        ghProfile.Stats.VelocidadeAtaque,
                        ghProfile.Stats.VelocidadeMovimento,
                        ghProfile.Stats.Critico,
                        ghProfile.Stats.Evasao,
                        ghProfile.Stats.Armadura,
                        ghProfile.Stats.Reino
                    ),
                    LastSync = ghProfile.LastSync,
                    TotalProjects = ghProfile.TotalProjects,
                    TotalCommits = ghProfile.TotalCommits
                };
                break;

            case OAuthProvider.GitLab:
                var glData = await _gitLabFetcher.FetchUserDataAsync(username, accessToken);
                var glStats = _calculator.Calculate(glData);
                profile = new PlayerProfile
                {
                    Username = glData.Username,
                    UserId = glData.UserId,
                    AvatarUrl = glData.AvatarUrl,
                    Provider = "gitlab",
                    Stats = glStats,
                    LastSync = DateTime.UtcNow,
                    TotalProjects = glData.TotalProjects,
                    TotalCommits = glData.Commits
                };
                break;

            case OAuthProvider.HuggingFace:
                var hfData = await _huggingFaceFetcher.FetchUserDataAsync(username, accessToken);
                var hfStats = _calculator.Calculate(hfData);
                profile = new PlayerProfile
                {
                    Username = hfData.Username,
                    UserId = hfData.UserId,
                    AvatarUrl = hfData.AvatarUrl,
                    Provider = "huggingface",
                    Stats = hfStats,
                    LastSync = DateTime.UtcNow,
                    TotalProjects = hfData.Models + hfData.Datasets + hfData.Spaces,
                    TotalCommits = hfData.Commits
                };
                break;

            default:
                _logger.LogWarning("Unknown provider {Provider}, using default stats", provider);
                profile = CreateDefaultProfile(username);
                break;
        }

        // Cache por 1 hora
        var cacheOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(CacheDuration)
            .SetSlidingExpiration(TimeSpan.FromMinutes(30));

        _cache.Set(cacheKey, profile, cacheOptions);

        _logger.LogInformation("Stats cached for {Provider}/{Username}. Reino: {Reino}, HP: {HP}, Dano: {Dano}",
            provider, username, profile.Stats.Reino, profile.Stats.Hp, profile.Stats.Dano);

        return profile;
    }

    private PlayerProfile CreateDefaultProfile(string username)
    {
        return new PlayerProfile
        {
            Username = username,
            UserId = 0,
            AvatarUrl = string.Empty,
            Provider = "unknown",
            Stats = new PlayerStats(100, 10, 1, 100, 5, 5, 5, "Python"),
            LastSync = DateTime.UtcNow
        };
    }

    private static string GetCacheKey(OAuthProvider provider, string username)
    {
        return $"{CacheKeyPrefix}{provider}_{username.ToLowerInvariant()}";
    }
}
