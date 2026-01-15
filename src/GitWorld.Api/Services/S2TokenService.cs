using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using GitWorld.Api.Stream;
using GitWorld.Shared.Entities;

namespace GitWorld.Api.Services;

public interface IS2TokenService
{
    Task<string?> GetOrCreatePlayerReadTokenAsync(Player player, TimeSpan? expiration = null);
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

    public async Task<string?> GetOrCreatePlayerReadTokenAsync(Player player, TimeSpan? expiration = null)
    {
        // Check if player has a valid cached token (with 1 hour buffer)
        if (!string.IsNullOrEmpty(player.S2ReadToken) &&
            player.S2ReadTokenExpiresAt.HasValue &&
            player.S2ReadTokenExpiresAt.Value > DateTime.UtcNow.AddHours(1))
        {
            _logger.LogDebug("Using cached S2 read token for player {PlayerId}", player.Id);
            return player.S2ReadToken;
        }

        if (string.IsNullOrWhiteSpace(_config.Token))
        {
            _logger.LogWarning("S2 token not configured, cannot create player read token");
            return null;
        }

        try
        {
            var streamName = $"player-{player.Id}";
            var expiresAt = DateTime.UtcNow.Add(expiration ?? TimeSpan.FromHours(24));
            var tokenId = $"player-read-{player.Id}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";

            var request = new CreateTokenRequest
            {
                Id = tokenId,
                Scope = new TokenScope
                {
                    Basins = new BasinScope { Exact = _config.Basin },
                    Streams = new StreamScope { Exact = streamName },
                    Ops = new[] { "read" }
                },
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

            if (string.IsNullOrEmpty(tokenResponse?.AccessToken))
            {
                _logger.LogWarning("S2 returned empty token");
                return null;
            }

            // Cache token in player entity (caller must save to DB)
            player.S2ReadToken = tokenResponse.AccessToken;
            player.S2ReadTokenExpiresAt = expiresAt;

            _logger.LogDebug("Created S2 read token for player {PlayerId}, expires {ExpiresAt}",
                player.Id, expiresAt);

            return tokenResponse.AccessToken;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating S2 token for player {PlayerId}", player.Id);
            return null;
        }
    }
}

internal class CreateTokenRequest
{
    public string? Id { get; set; }
    public TokenScope? Scope { get; set; }
    public bool? AutoPrefixStreams { get; set; }
    public string? ExpiresAt { get; set; }
}

internal class TokenScope
{
    public BasinScope? Basins { get; set; }
    public StreamScope? Streams { get; set; }
    public string[]? Ops { get; set; }
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
    public string? AccessToken { get; set; }
    public string? Id { get; set; }
}
