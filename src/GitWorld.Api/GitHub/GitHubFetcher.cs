using System.Net.Http.Headers;
using System.Text.Json;
using GitWorld.Api.GitHub.Models;

namespace GitWorld.Api.GitHub;

/// <summary>
/// Serviço para buscar dados do GitHub via API REST.
/// </summary>
public interface IGitHubFetcher
{
    Task<GitHubData> FetchUserDataAsync(string username, string? accessToken = null);
}

public class GitHubFetcher : IGitHubFetcher
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GitHubFetcher> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    public GitHubFetcher(HttpClient httpClient, ILogger<GitHubFetcher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        _httpClient.BaseAddress = new Uri("https://api.github.com/");
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
        _httpClient.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");
        _httpClient.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("GitWorld", "1.0"));
    }

    public async Task<GitHubData> FetchUserDataAsync(string username, string? accessToken = null)
    {
        if (!string.IsNullOrEmpty(accessToken))
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        }

        var data = new GitHubData { Username = username };

        // Buscar dados em paralelo para melhor performance
        var profileTask = FetchProfileAsync(username);
        var reposTask = FetchReposAsync(username);
        var commitsTask = FetchCommitsAsync(username);
        var prsTask = FetchPullRequestsAsync(username);
        var issuesTask = FetchIssuesAsync(username);

        await Task.WhenAll(profileTask, reposTask, commitsTask, prsTask, issuesTask);

        // Processar perfil
        var profile = await profileTask;
        if (profile != null)
        {
            data.GitHubId = profile.Id;
            data.AvatarUrl = profile.AvatarUrl ?? string.Empty;
            data.CreatedAt = profile.CreatedAt;
            data.Followers = profile.Followers;
            data.Following = profile.Following;
            data.PublicRepos = profile.PublicRepos;
        }

        // Processar repositórios
        var repos = await reposTask;
        ProcessRepos(data, repos, username);

        // Processar commits
        var commits = await commitsTask;
        ProcessCommits(data, commits);

        // Processar PRs
        var prs = await prsTask;
        ProcessPullRequests(data, prs);

        // Processar Issues
        var issues = await issuesTask;
        ProcessIssues(data, issues);

        return data;
    }

    private async Task<GitHubProfile?> FetchProfileAsync(string username)
    {
        try
        {
            var response = await _httpClient.GetAsync($"users/{username}");
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<GitHubProfile>(json, JsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar perfil de {Username}", username);
            return null;
        }
    }

    private async Task<List<GitHubRepo>> FetchReposAsync(string username)
    {
        var repos = new List<GitHubRepo>();
        try
        {
            var page = 1;
            const int perPage = 100;

            while (true)
            {
                var response = await _httpClient.GetAsync($"users/{username}/repos?per_page={perPage}&page={page}&sort=updated");
                response.EnsureSuccessStatusCode();
                var json = await response.Content.ReadAsStringAsync();
                var pageRepos = JsonSerializer.Deserialize<List<GitHubRepo>>(json, JsonOptions);

                if (pageRepos == null || pageRepos.Count == 0)
                    break;

                repos.AddRange(pageRepos);

                if (pageRepos.Count < perPage)
                    break;

                page++;

                // Limitar a 5 páginas (500 repos) para evitar rate limit
                if (page > 5)
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar repositórios de {Username}", username);
        }
        return repos;
    }

    private async Task<GitHubSearchResult<GitHubCommitItem>> FetchCommitsAsync(string username)
    {
        try
        {
            var response = await _httpClient.GetAsync($"search/commits?q=author:{username}&per_page=100&sort=author-date&order=desc");
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<GitHubSearchResult<GitHubCommitItem>>(json, JsonOptions)
                   ?? new GitHubSearchResult<GitHubCommitItem>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar commits de {Username}", username);
            return new GitHubSearchResult<GitHubCommitItem>();
        }
    }

    private async Task<GitHubSearchResult<GitHubPrItem>> FetchPullRequestsAsync(string username)
    {
        try
        {
            var response = await _httpClient.GetAsync($"search/issues?q=author:{username}+type:pr&per_page=100");
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<GitHubSearchResult<GitHubPrItem>>(json, JsonOptions)
                   ?? new GitHubSearchResult<GitHubPrItem>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar PRs de {Username}", username);
            return new GitHubSearchResult<GitHubPrItem>();
        }
    }

    private async Task<GitHubSearchResult<GitHubIssueItem>> FetchIssuesAsync(string username)
    {
        try
        {
            var response = await _httpClient.GetAsync($"search/issues?q=author:{username}+type:issue&per_page=100");
            response.EnsureSuccessStatusCode();
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<GitHubSearchResult<GitHubIssueItem>>(json, JsonOptions)
                   ?? new GitHubSearchResult<GitHubIssueItem>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar issues de {Username}", username);
            return new GitHubSearchResult<GitHubIssueItem>();
        }
    }

    private void ProcessRepos(GitHubData data, List<GitHubRepo> repos, string username)
    {
        data.TotalRepos = repos.Count;
        data.Stars = repos.Sum(r => r.StargazersCount);
        data.Forks = repos.Sum(r => r.ForksCount);
        data.AvgStars = repos.Count > 0 ? repos.Average(r => r.StargazersCount) : 0;

        // Contar repos por linguagem
        var languageCounts = new Dictionary<string, int>();
        foreach (var repo in repos.Where(r => !string.IsNullOrEmpty(r.Language)))
        {
            var lang = repo.Language!;
            languageCounts[lang] = languageCounts.GetValueOrDefault(lang, 0) + 1;
        }

        data.LanguageRepoCount = languageCounts;
        data.Languages = languageCounts.Count;

        // Determinar linguagem principal (mais repos)
        if (languageCounts.Count > 0)
        {
            data.MainLanguage = languageCounts.OrderByDescending(kv => kv.Value).First().Key;
        }

        // Repos externos (forks de outros)
        data.ExternalRepos = repos.Count(r => r.Fork);
    }

    private void ProcessCommits(GitHubData data, GitHubSearchResult<GitHubCommitItem> result)
    {
        data.Commits = result.TotalCount;

        var now = DateTime.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30);
        var sevenDaysAgo = now.AddDays(-7);

        foreach (var item in result.Items ?? Enumerable.Empty<GitHubCommitItem>())
        {
            var commitDate = item.Commit?.Author?.Date ?? DateTime.MinValue;

            if (commitDate >= thirtyDaysAgo)
                data.Commits30d++;

            if (commitDate >= sevenDaysAgo)
                data.Commits7d++;
        }
    }

    private void ProcessPullRequests(GitHubData data, GitHubSearchResult<GitHubPrItem> result)
    {
        data.PrsTotal = result.TotalCount;

        var now = DateTime.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30);

        foreach (var item in result.Items ?? Enumerable.Empty<GitHubPrItem>())
        {
            if (item.PullRequest?.MergedAt != null)
                data.PrsMerged++;

            var createdAt = item.CreatedAt;
            if (createdAt >= thirtyDaysAgo)
                data.Prs30d++;
        }
    }

    private void ProcessIssues(GitHubData data, GitHubSearchResult<GitHubIssueItem> result)
    {
        data.IssuesTotal = result.TotalCount;

        var now = DateTime.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30);

        foreach (var item in result.Items ?? Enumerable.Empty<GitHubIssueItem>())
        {
            if (item.State == "closed")
                data.IssuesClosed++;

            var createdAt = item.CreatedAt;
            if (createdAt >= thirtyDaysAgo)
                data.Issues30d++;
        }
    }
}

#region GitHub API Response Models

internal class GitHubProfile
{
    public long Id { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public int Followers { get; set; }
    public int Following { get; set; }
    public int PublicRepos { get; set; }
}

internal class GitHubRepo
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Language { get; set; }
    public int StargazersCount { get; set; }
    public int ForksCount { get; set; }
    public bool Fork { get; set; }
    public DateTime UpdatedAt { get; set; }
}

internal class GitHubSearchResult<T>
{
    public int TotalCount { get; set; }
    public bool IncompleteResults { get; set; }
    public List<T>? Items { get; set; }
}

internal class GitHubCommitItem
{
    public GitHubCommitDetail? Commit { get; set; }
}

internal class GitHubCommitDetail
{
    public GitHubCommitAuthor? Author { get; set; }
}

internal class GitHubCommitAuthor
{
    public DateTime Date { get; set; }
}

internal class GitHubPrItem
{
    public DateTime CreatedAt { get; set; }
    public string? State { get; set; }
    public GitHubPullRequestInfo? PullRequest { get; set; }
}

internal class GitHubPullRequestInfo
{
    public DateTime? MergedAt { get; set; }
}

internal class GitHubIssueItem
{
    public DateTime CreatedAt { get; set; }
    public string? State { get; set; }
}

#endregion
