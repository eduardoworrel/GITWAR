using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using GitWorld.Api.Stream;

namespace GitWorld.Api.Services;

public interface IS2TokenService
{
    Task<string?> CreatePlayerReadTokenAsync(Guid playerId, TimeSpan? expiration = null);
}

public class S2TokenService : IS2TokenService
{
    private readonly HttpClient _httpClient;
    private readonly S2Config _config;
    private readonly ILogger<S2TokenService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public S2TokenService(HttpClient httpClient, S2Config config, ILogger<S2TokenService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        if (!string.IsNullOrWhiteSpace(_config.Token))
        {
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _config.Token);
        }
    }

    public async Task<string?> CreatePlayerReadTokenAsync(Guid playerId, TimeSpan? expiration = null)
    {
        if (string.IsNullOrWhiteSpace(_config.Token))
        {
            _logger.LogWarning("S2 token not configured, cannot create player read token");
            return null;
        }

        try
        {
            var streamName = $"player-{playerId}";
            var expiresAt = DateTime.UtcNow.Add(expiration ?? TimeSpan.FromHours(24));

            var request = new CreateTokenRequest
            {
                Basins = new BasinScope { Exact = _config.Basin },
                Streams = new StreamScope { Exact = streamName },
                Operations = new[] { "read" },
                ExpiresAt = expiresAt.ToString("O")
            };

            var json = JsonSerializer.Serialize(request, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var url = $"{_config.BaseUrl}/v1/access-tokens";
            _logger.LogDebug("Creating S2 read token for stream {StreamName}", streamName);

            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
            var response = await _httpClient.PostAsync(url, content, cts.Token);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to create S2 token: {StatusCode} - {Error}",
                    response.StatusCode, error);
                return null;
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            var tokenResponse = JsonSerializer.Deserialize<CreateTokenResponse>(responseBody, _jsonOptions);

            if (string.IsNullOrEmpty(tokenResponse?.Token))
            {
                _logger.LogWarning("S2 returned empty token");
                return null;
            }

            _logger.LogDebug("Created S2 read token for player {PlayerId}, expires {ExpiresAt}",
                playerId, expiresAt);

            return tokenResponse.Token;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating S2 token for player {PlayerId}", playerId);
            return null;
        }
    }
}

internal class CreateTokenRequest
{
    public BasinScope? Basins { get; set; }
    public StreamScope? Streams { get; set; }
    public string[]? Operations { get; set; }
    public string? ExpiresAt { get; set; }
}

internal class BasinScope
{
    public string? Exact { get; set; }
    public string? Prefix { get; set; }
}

internal class StreamScope
{
    public string? Exact { get; set; }
    public string? Prefix { get; set; }
}

internal class CreateTokenResponse
{
    public string? Token { get; set; }
    public string? Id { get; set; }
}
