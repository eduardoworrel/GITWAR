using System.Net.Http.Headers;
using System.Text.Json;

namespace GitWorld.Api.Providers;

/// <summary>
/// Fetcher para dados do HuggingFace.
/// API: https://huggingface.co/docs/hub/api
///
/// Mapeamento de conceitos:
/// - Models/Datasets/Spaces → Projetos
/// - Downloads → Stars (popularidade)
/// - Likes → Stars adicionais
/// - Model updates → Commits
/// </summary>
public class HuggingFaceFetcher : IProviderFetcher
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<HuggingFaceFetcher> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public string ProviderName => "huggingface";

    public HuggingFaceFetcher(HttpClient httpClient, ILogger<HuggingFaceFetcher> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        _httpClient.BaseAddress = new Uri("https://huggingface.co/api/");
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
            Provider = "huggingface",
            // HuggingFace users go to IA kingdom
            MainLanguage = "IA"
        };
        data.LanguageStats["IA"] = 100;
        data.Languages = 1;

        try
        {
            // 1. Buscar perfil do usuário
            var profile = await FetchProfileAsync(username);
            if (profile != null)
            {
                data.AvatarUrl = profile.AvatarUrl ?? $"https://huggingface.co/avatars/{username}";
                data.Followers = profile.NumFollowers;
                data.Following = profile.NumFollowing;
                // HuggingFace não expõe data de criação, usar 1 ano como padrão
                data.CreatedAt = DateTime.UtcNow.AddYears(-1);
            }

            // 2. Buscar modelos do usuário
            var models = await FetchModelsAsync(username);
            data.Models = models.Count;

            // 3. Buscar datasets do usuário
            var datasets = await FetchDatasetsAsync(username);
            data.Datasets = datasets.Count;

            // 4. Buscar spaces do usuário
            var spaces = await FetchSpacesAsync(username);
            data.Spaces = spaces.Count;

            // Processar estatísticas
            ProcessArtifacts(data, models, datasets, spaces);

            _logger.LogInformation("HuggingFace data fetched for {Username}: {Models} models, {Datasets} datasets, {Spaces} spaces, {Downloads} downloads",
                username, data.Models, data.Datasets, data.Spaces, data.Downloads);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching HuggingFace data for {Username}", username);
        }

        return data;
    }

    private async Task<HuggingFaceUser?> FetchProfileAsync(string username)
    {
        try
        {
            var response = await _httpClient.GetAsync($"users/{username}");
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<HuggingFaceUser>(json, JsonOptions);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching HuggingFace profile for {Username}", username);
        }
        return null;
    }

    private async Task<List<HuggingFaceModel>> FetchModelsAsync(string username)
    {
        var models = new List<HuggingFaceModel>();
        try
        {
            var response = await _httpClient.GetAsync($"models?author={Uri.EscapeDataString(username)}&full=true&limit=100");
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                models = JsonSerializer.Deserialize<List<HuggingFaceModel>>(json, JsonOptions) ?? new();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching HuggingFace models for {Username}", username);
        }
        return models;
    }

    private async Task<List<HuggingFaceDataset>> FetchDatasetsAsync(string username)
    {
        var datasets = new List<HuggingFaceDataset>();
        try
        {
            var response = await _httpClient.GetAsync($"datasets?author={Uri.EscapeDataString(username)}&full=true&limit=100");
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                datasets = JsonSerializer.Deserialize<List<HuggingFaceDataset>>(json, JsonOptions) ?? new();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching HuggingFace datasets for {Username}", username);
        }
        return datasets;
    }

    private async Task<List<HuggingFaceSpace>> FetchSpacesAsync(string username)
    {
        var spaces = new List<HuggingFaceSpace>();
        try
        {
            var response = await _httpClient.GetAsync($"spaces?author={Uri.EscapeDataString(username)}&full=true&limit=100");
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                spaces = JsonSerializer.Deserialize<List<HuggingFaceSpace>>(json, JsonOptions) ?? new();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching HuggingFace spaces for {Username}", username);
        }
        return spaces;
    }

    private void ProcessArtifacts(ProviderData data, List<HuggingFaceModel> models, List<HuggingFaceDataset> datasets, List<HuggingFaceSpace> spaces)
    {
        // Total de projetos
        data.TotalProjects = models.Count + datasets.Count + spaces.Count;

        // Downloads e likes (equivalente a stars)
        var totalDownloads = 0L;
        var totalLikes = 0;

        foreach (var model in models)
        {
            totalDownloads += model.Downloads;
            totalLikes += model.Likes;

            // Contar como "commit" cada atualização recente (último mês)
            if (model.LastModified >= DateTime.UtcNow.AddDays(-30))
            {
                data.Commits30d++;
            }
            if (model.LastModified >= DateTime.UtcNow.AddDays(-7))
            {
                data.Commits7d++;
            }
            data.Commits++;

            // Modelos com muitos downloads são como PRs merged (sucesso)
            if (model.Downloads > 1000)
            {
                data.MergeRequestsMerged++;
            }
            data.MergeRequestsTotal++;
        }

        foreach (var dataset in datasets)
        {
            totalDownloads += dataset.Downloads;
            totalLikes += dataset.Likes;
            data.Commits++;

            if (dataset.LastModified >= DateTime.UtcNow.AddDays(-30))
            {
                data.Commits30d++;
            }

            // Datasets são como issues resolvidas (contribuição para comunidade)
            data.IssuesClosed++;
            data.IssuesTotal++;
        }

        foreach (var space in spaces)
        {
            totalLikes += space.Likes;
            data.Commits++;

            if (space.LastModified >= DateTime.UtcNow.AddDays(-30))
            {
                data.Commits30d++;
            }

            // Spaces são demos interativos - conta como reviews/contribuições
            data.Reviews++;
        }

        // Normalizar downloads para escala razoável (log scale)
        data.Downloads = (int)totalDownloads;
        data.Likes = totalLikes;

        // Stars = combinação de downloads normalizados + likes
        // Usar log scale para downloads muito grandes
        var normalizedDownloads = totalDownloads > 0 ? (int)(Math.Log10(totalDownloads + 1) * 100) : 0;
        data.Stars = normalizedDownloads + totalLikes;

        data.AvgStars = data.TotalProjects > 0 ? (double)data.Stars / data.TotalProjects : 0;
    }
}

#region HuggingFace API Response Models

internal class HuggingFaceUser
{
    public string? AvatarUrl { get; set; }
    public int NumFollowers { get; set; }
    public int NumFollowing { get; set; }
    public int NumModels { get; set; }
    public int NumDatasets { get; set; }
    public int NumSpaces { get; set; }
}

internal class HuggingFaceModel
{
    public string ModelId { get; set; } = string.Empty;
    public string? Author { get; set; }
    public long Downloads { get; set; }
    public int Likes { get; set; }
    public DateTime LastModified { get; set; }
    public List<string>? Tags { get; set; }
    public string? PipelineTag { get; set; }
}

internal class HuggingFaceDataset
{
    public string Id { get; set; } = string.Empty;
    public string? Author { get; set; }
    public long Downloads { get; set; }
    public int Likes { get; set; }
    public DateTime LastModified { get; set; }
    public List<string>? Tags { get; set; }
}

internal class HuggingFaceSpace
{
    public string Id { get; set; } = string.Empty;
    public string? Author { get; set; }
    public int Likes { get; set; }
    public DateTime LastModified { get; set; }
    public string? Sdk { get; set; }
}

#endregion
