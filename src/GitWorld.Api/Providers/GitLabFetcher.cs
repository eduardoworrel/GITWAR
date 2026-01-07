using System.Net.Http.Headers;
using System.Text.Json;

namespace GitWorld.Api.Providers;

/// <summary>
/// Fetcher para dados do GitLab.
/// API: https://docs.gitlab.com/ee/api/
/// </summary>
public class GitLabFetcher : IProviderFetcher
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GitLabFetcher> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    public string ProviderName => "gitlab";

    public GitLabFetcher(HttpClient httpClient, ILogger<GitLabFetcher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        _httpClient.BaseAddress = new Uri("https://gitlab.com/api/v4/");
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        _httpClient.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("GitWorld", "1.0"));
    }

    public async Task<ProviderData> FetchUserDataAsync(string username, string? accessToken = null)
    {
        if (!string.IsNullOrEmpty(accessToken))
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        }

        var data = new ProviderData
        {
            Username = username,
            Provider = "gitlab"
        };

        try
        {
            // 1. Buscar perfil do usuário
            var profile = await FetchProfileAsync(username);
            if (profile == null)
            {
                _logger.LogWarning("GitLab user {Username} not found", username);
                return data;
            }

            data.UserId = profile.Id;
            data.AvatarUrl = profile.AvatarUrl ?? string.Empty;
            data.CreatedAt = profile.CreatedAt;
            data.Followers = profile.FollowersCount;
            data.Following = profile.FollowingCount;

            // 2. Buscar projetos do usuário
            var projects = await FetchProjectsAsync(profile.Id);
            ProcessProjects(data, projects);

            // 3. Buscar eventos recentes (commits, MRs, etc)
            var events = await FetchEventsAsync(profile.Id);
            ProcessEvents(data, events);

            // 4. Buscar merge requests
            var mergeRequests = await FetchMergeRequestsAsync(username);
            ProcessMergeRequests(data, mergeRequests);

            _logger.LogInformation("GitLab data fetched for {Username}: {Projects} projects, {Commits} commits",
                username, data.TotalProjects, data.Commits);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching GitLab data for {Username}", username);
        }

        return data;
    }

    private async Task<GitLabUser?> FetchProfileAsync(string username)
    {
        try
        {
            // Buscar por username
            var response = await _httpClient.GetAsync($"users?username={Uri.EscapeDataString(username)}");
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            var users = JsonSerializer.Deserialize<List<GitLabUser>>(json, JsonOptions);

            if (users == null || users.Count == 0)
                return null;

            // Buscar detalhes completos do usuário
            var userId = users[0].Id;
            var detailResponse = await _httpClient.GetAsync($"users/{userId}");
            detailResponse.EnsureSuccessStatusCode();
            var detailJson = await detailResponse.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<GitLabUser>(detailJson, JsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching GitLab profile for {Username}", username);
            return null;
        }
    }

    private async Task<List<GitLabProject>> FetchProjectsAsync(long userId)
    {
        var projects = new List<GitLabProject>();
        try
        {
            var page = 1;
            const int perPage = 100;

            while (page <= 5) // Limitar a 5 páginas
            {
                var response = await _httpClient.GetAsync($"users/{userId}/projects?per_page={perPage}&page={page}&order_by=updated_at");
                if (!response.IsSuccessStatusCode)
                    break;

                var json = await response.Content.ReadAsStringAsync();
                var pageProjects = JsonSerializer.Deserialize<List<GitLabProject>>(json, JsonOptions);

                if (pageProjects == null || pageProjects.Count == 0)
                    break;

                projects.AddRange(pageProjects);

                if (pageProjects.Count < perPage)
                    break;

                page++;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching GitLab projects for user {UserId}", userId);
        }
        return projects;
    }

    private async Task<List<GitLabEvent>> FetchEventsAsync(long userId)
    {
        var events = new List<GitLabEvent>();
        try
        {
            // Buscar eventos dos últimos 90 dias
            var after = DateTime.UtcNow.AddDays(-90).ToString("yyyy-MM-dd");
            var response = await _httpClient.GetAsync($"users/{userId}/events?per_page=100&after={after}");

            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                events = JsonSerializer.Deserialize<List<GitLabEvent>>(json, JsonOptions) ?? new();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching GitLab events for user {UserId}", userId);
        }
        return events;
    }

    private async Task<List<GitLabMergeRequest>> FetchMergeRequestsAsync(string username)
    {
        var mergeRequests = new List<GitLabMergeRequest>();
        try
        {
            // Buscar MRs criados pelo usuário
            var response = await _httpClient.GetAsync($"merge_requests?author_username={Uri.EscapeDataString(username)}&scope=all&per_page=100");

            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                mergeRequests = JsonSerializer.Deserialize<List<GitLabMergeRequest>>(json, JsonOptions) ?? new();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching GitLab merge requests for {Username}", username);
        }
        return mergeRequests;
    }

    private void ProcessProjects(ProviderData data, List<GitLabProject> projects)
    {
        data.TotalProjects = projects.Count;
        data.Stars = projects.Sum(p => p.StarCount);
        data.Forks = projects.Sum(p => p.ForksCount);
        data.AvgStars = projects.Count > 0 ? projects.Average(p => p.StarCount) : 0;

        // Contar projetos forked
        data.ContributedProjects = projects.Count(p => p.ForkedFromProject != null);

        // Processar linguagens
        var languageCounts = new Dictionary<string, int>();
        foreach (var project in projects)
        {
            // GitLab retorna linguagens como um dicionário percentual
            // Simplificamos contando a linguagem principal de cada projeto
            if (!string.IsNullOrEmpty(project.Language))
            {
                var lang = project.Language;
                languageCounts[lang] = languageCounts.GetValueOrDefault(lang, 0) + 1;
            }
        }

        data.LanguageStats = languageCounts;
        data.Languages = languageCounts.Count;

        if (languageCounts.Count > 0)
        {
            data.MainLanguage = languageCounts.OrderByDescending(kv => kv.Value).First().Key;
        }
    }

    private void ProcessEvents(ProviderData data, List<GitLabEvent> events)
    {
        var now = DateTime.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30);
        var sevenDaysAgo = now.AddDays(-7);

        foreach (var ev in events)
        {
            switch (ev.ActionName)
            {
                case "pushed to":
                case "pushed new":
                    // Cada push pode ter múltiplos commits
                    var commitCount = ev.PushData?.CommitCount ?? 1;
                    data.Commits += commitCount;

                    if (ev.CreatedAt >= thirtyDaysAgo)
                        data.Commits30d += commitCount;
                    if (ev.CreatedAt >= sevenDaysAgo)
                        data.Commits7d += commitCount;
                    break;

                case "commented on":
                    data.Reviews++;
                    break;

                case "opened":
                case "created":
                    if (ev.TargetType == "Issue")
                    {
                        data.IssuesTotal++;
                        if (ev.CreatedAt >= thirtyDaysAgo)
                            data.Issues30d++;
                    }
                    break;

                case "closed":
                    if (ev.TargetType == "Issue")
                        data.IssuesClosed++;
                    break;
            }
        }
    }

    private void ProcessMergeRequests(ProviderData data, List<GitLabMergeRequest> mergeRequests)
    {
        var now = DateTime.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30);

        data.MergeRequestsTotal = mergeRequests.Count;

        foreach (var mr in mergeRequests)
        {
            if (mr.State == "merged")
                data.MergeRequestsMerged++;

            if (mr.CreatedAt >= thirtyDaysAgo)
                data.MergeRequests30d++;
        }
    }
}

#region GitLab API Response Models

internal class GitLabUser
{
    public long Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
}

internal class GitLabProject
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Language { get; set; }
    public int StarCount { get; set; }
    public int ForksCount { get; set; }
    public GitLabProjectReference? ForkedFromProject { get; set; }
    public DateTime LastActivityAt { get; set; }
}

internal class GitLabProjectReference
{
    public long Id { get; set; }
}

internal class GitLabEvent
{
    public long Id { get; set; }
    public string? ActionName { get; set; }
    public string? TargetType { get; set; }
    public DateTime CreatedAt { get; set; }
    public GitLabPushData? PushData { get; set; }
}

internal class GitLabPushData
{
    public int CommitCount { get; set; }
    public string? Action { get; set; }
}

internal class GitLabMergeRequest
{
    public long Id { get; set; }
    public string? State { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? MergedAt { get; set; }
}

#endregion
