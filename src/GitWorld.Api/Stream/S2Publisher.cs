using System.Net.Http.Headers;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace GitWorld.Api.Stream;

public interface IS2Publisher
{
    Task<bool> CreateStreamAsync(string streamName);
    Task<bool> AppendAsync(string streamName, object data);
    Task<bool> AppendGameStateAsync(Guid userId, GameStatePayload state);
    Task<bool> BroadcastGameStateAsync(long tick, IEnumerable<GitWorld.Api.Core.Entity> entities, IEnumerable<GitWorld.Api.Core.CombatEvent>? combatEvents = null, GitWorld.Api.Core.Systems.EventInfo? activeEvent = null, IEnumerable<GitWorld.Api.Core.RewardEvent>? rewardEvents = null, IEnumerable<GitWorld.Api.Core.LevelUpEvent>? levelUpEvents = null);
    Task<bool> EnsureStreamExistsAsync(string streamName);
    bool IsAvailable { get; }
}

public class S2Publisher : IS2Publisher
{
    private readonly HttpClient _httpClient;
    private readonly S2Config _config;
    private readonly ILogger<S2Publisher> _logger;
    private readonly JsonSerializerOptions _jsonOptions;
    private bool _isAvailable = true;
    private DateTime _lastFailure = DateTime.MinValue;
    private readonly TimeSpan _retryInterval = TimeSpan.FromSeconds(30);
    private int _consecutiveFailures = 0;
    private const int MaxConsecutiveFailures = 5;
    private readonly string _basinBaseUrl;

    public bool IsAvailable => _isAvailable;

    public S2Publisher(HttpClient httpClient, S2Config config, ILogger<S2Publisher> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        // Validate configuration
        if (!_config.Enabled)
        {
            _logger.LogInformation("S2 streaming is disabled by configuration.");
            _isAvailable = false;
            return;
        }

        if (string.IsNullOrWhiteSpace(_config.Token))
        {
            _logger.LogWarning("S2 token is not configured. S2 streaming will be disabled.");
            _isAvailable = false;
            return;
        }

        if (string.IsNullOrWhiteSpace(_config.BaseUrl))
        {
            _logger.LogWarning("S2 BaseUrl is not configured. S2 streaming will be disabled.");
            _isAvailable = false;
            return;
        }

        try
        {
            // S2 uses basin-specific URLs for stream operations: https://{basin}.b.aws.s2.dev
            _basinBaseUrl = $"https://{_config.Basin}.b.aws.s2.dev";
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _config.Token);
            _httpClient.Timeout = TimeSpan.FromSeconds(_config.TimeoutSeconds);

            _logger.LogInformation("S2 Publisher initialized with BasinUrl: {BasinUrl}, Basin: {Basin}",
                _basinBaseUrl, _config.Basin);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize S2 Publisher. S2 streaming will be disabled.");
            _isAvailable = false;
        }
    }

    private bool ShouldRetry()
    {
        if (_isAvailable)
            return true;

        // Check if enough time has passed since last failure to retry
        if (DateTime.UtcNow - _lastFailure > _retryInterval)
        {
            _logger.LogInformation("Attempting to reconnect to S2 after {Seconds} seconds...", _retryInterval.TotalSeconds);
            _isAvailable = true;
            _consecutiveFailures = 0;
            return true;
        }

        return false;
    }

    private void HandleSuccess()
    {
        if (!_isAvailable)
        {
            _logger.LogInformation("S2 connection restored successfully.");
        }
        _isAvailable = true;
        _consecutiveFailures = 0;
    }

    private void HandleFailure(Exception? ex, string operation)
    {
        _consecutiveFailures++;
        _lastFailure = DateTime.UtcNow;

        if (_consecutiveFailures >= MaxConsecutiveFailures && _isAvailable)
        {
            _isAvailable = false;
            _logger.LogWarning(
                "S2 streaming disabled after {Failures} consecutive failures. Will retry in {Seconds} seconds. Last error: {Error}",
                _consecutiveFailures, _retryInterval.TotalSeconds, ex?.Message ?? "Unknown");
        }
        else if (_isAvailable)
        {
            // Log individual failures at debug level to avoid log spam
            _logger.LogDebug("S2 {Operation} failed ({Failures}/{Max}): {Error}",
                operation, _consecutiveFailures, MaxConsecutiveFailures, ex?.Message ?? "Unknown");
        }
    }

    private bool IsNetworkError(Exception ex)
    {
        return ex is HttpRequestException ||
               ex is SocketException ||
               ex is TaskCanceledException ||
               ex.InnerException is SocketException ||
               (ex.Message?.Contains("nodename nor servname provided") ?? false) ||
               (ex.Message?.Contains("No such host") ?? false) ||
               (ex.Message?.Contains("DNS") ?? false);
    }

    public async Task<bool> CreateStreamAsync(string streamName)
    {
        if (!ShouldRetry())
            return false;

        try
        {
            // Use basin-specific URL for stream operations
            var url = $"{_basinBaseUrl}/v1/streams/{streamName}";
            var request = new HttpRequestMessage(HttpMethod.Put, url)
            {
                Content = new StringContent("{}", Encoding.UTF8, "application/json")
            };

            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(_config.TimeoutSeconds));
            var response = await _httpClient.SendAsync(request, cts.Token);

            if (response.IsSuccessStatusCode || response.StatusCode == System.Net.HttpStatusCode.Conflict)
            {
                HandleSuccess();
                _logger.LogDebug("Stream created/exists: {StreamName}", streamName);
                return true;
            }

            var error = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("Failed to create stream {StreamName}: {StatusCode} - {Error}",
                streamName, response.StatusCode, error);
            HandleFailure(null, "CreateStream");
            return false;
        }
        catch (Exception ex) when (IsNetworkError(ex))
        {
            HandleFailure(ex, "CreateStream");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Unexpected error creating stream {StreamName}", streamName);
            HandleFailure(ex, "CreateStream");
            return false;
        }
    }

    public async Task<bool> AppendAsync(string streamName, object data)
    {
        if (!ShouldRetry())
            return false;

        try
        {
            // Use basin-specific URL for stream operations
            var url = $"{_basinBaseUrl}/v1/streams/{streamName}/records";

            // S2 expects: { "records": [{ "body": "base64-encoded-json" }] }
            var dataJson = JsonSerializer.Serialize(data, _jsonOptions);
            var base64Body = Convert.ToBase64String(Encoding.UTF8.GetBytes(dataJson));
            var s2Payload = new { records = new[] { new { body = base64Body } } };
            var json = JsonSerializer.Serialize(s2Payload, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(_config.TimeoutSeconds));
            var response = await _httpClient.PostAsync(url, content, cts.Token);

            if (response.IsSuccessStatusCode)
            {
                HandleSuccess();
                return true;
            }

            var error = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("Failed to append to stream {StreamName}: {StatusCode} - {Error}",
                streamName, response.StatusCode, error);
            HandleFailure(null, "Append");
            return false;
        }
        catch (Exception ex) when (IsNetworkError(ex))
        {
            HandleFailure(ex, "Append");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Unexpected error appending to stream {StreamName}", streamName);
            HandleFailure(ex, "Append");
            return false;
        }
    }

    public async Task<bool> AppendGameStateAsync(Guid userId, GameStatePayload state)
    {
        if (!ShouldRetry())
            return false;

        var streamName = $"user-{userId}";
        await CreateStreamAsync(streamName);
        return await AppendAsync(streamName, state);
    }

    public async Task<bool> BroadcastGameStateAsync(long tick, IEnumerable<GitWorld.Api.Core.Entity> entities, IEnumerable<GitWorld.Api.Core.CombatEvent>? combatEvents = null, GitWorld.Api.Core.Systems.EventInfo? activeEvent = null, IEnumerable<GitWorld.Api.Core.RewardEvent>? rewardEvents = null, IEnumerable<GitWorld.Api.Core.LevelUpEvent>? levelUpEvents = null)
    {
        if (!ShouldRetry())
            return false;

        try
        {
            var payload = new GameStatePayload
            {
                Tick = tick,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                Entidades = entities.Select(e => new EntityPayload
                {
                    Id = e.Id,
                    Login = e.GithubLogin,
                    X = e.X,
                    Y = e.Y,
                    Hp = e.CurrentHp,
                    HpMax = e.MaxHp,
                    Estado = e.State.ToString().ToLowerInvariant(),
                    Reino = e.Reino,
                    AlvoId = e.TargetEntityId,
                    Type = e.Type.ToString().ToLowerInvariant(),
                    VelocidadeAtaque = e.VelocidadeAtaque,
                    VelocidadeMovimento = e.VelocidadeMovimento,
                    Elo = e.Elo,
                    Vitorias = e.Vitorias,
                    Derrotas = e.Derrotas,
                    Dano = e.Dano,
                    Critico = e.Critico,
                    Evasao = e.Evasao,
                    Armadura = e.Armadura,
                    Level = e.Level,
                    Exp = e.Exp,
                    Gold = e.Gold,
                    EquippedItems = e.EquippedItems.Count > 0
                        ? e.EquippedItems.Select(i => new EquippedItemPayload
                        {
                            Name = i.Name,
                            Category = i.Category,
                            Tier = i.Tier
                        }).ToList()
                        : null
                }).ToList(),
                Eventos = combatEvents?.Select(e => new GameEventPayload
                {
                    Type = e.Type.ToString().ToLowerInvariant(),
                    Tick = e.Tick,
                    Timestamp = e.Timestamp,
                    AttackerId = e.AttackerId,
                    AttackerName = e.AttackerName,
                    TargetId = e.TargetId,
                    TargetName = e.TargetName,
                    Damage = e.Damage,
                    IsCritical = e.IsCritical
                }).ToList() ?? new List<GameEventPayload>(),
                Rewards = rewardEvents?.Select(r => new RewardEventPayload
                {
                    PlayerId = r.PlayerId,
                    X = r.X,
                    Y = r.Y,
                    ExpGained = r.ExpGained,
                    GoldGained = r.GoldGained,
                    LeveledUp = r.LeveledUp,
                    NewLevel = r.NewLevel,
                    Source = r.Source,
                    Tick = r.Tick
                }).ToList() ?? new List<RewardEventPayload>(),
                LevelUps = levelUpEvents?.Select(l => new LevelUpEventPayload
                {
                    PlayerId = l.PlayerId,
                    PlayerName = l.PlayerName,
                    OldLevel = l.OldLevel,
                    NewLevel = l.NewLevel,
                    X = l.X,
                    Y = l.Y,
                    Tick = l.Tick
                }).ToList() ?? new List<LevelUpEventPayload>(),
                ActiveEvent = activeEvent != null && activeEvent.Type != GitWorld.Api.Core.Systems.EventType.None
                    ? new ActiveEventPayload
                    {
                        Type = activeEvent.Type.ToString().ToLowerInvariant(),
                        MonstersRemaining = activeEvent.MonstersRemaining
                    }
                    : null
            };

            return await AppendAsync(_config.StreamName, payload);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error broadcasting game state at tick {Tick}", tick);
            return false;
        }
    }

    public async Task<bool> EnsureStreamExistsAsync(string streamName)
    {
        return await CreateStreamAsync(streamName);
    }
}

public class S2Config
{
    public string BaseUrl { get; set; } = "https://aws.s2.dev";
    public string Token { get; set; } = string.Empty;
    public string Basin { get; set; } = "gitworld";
    public string StreamName { get; set; } = "game-state"; // Use "game-state-dev" for local
    public int TimeoutSeconds { get; set; } = 10;
    public bool Enabled { get; set; } = true;
}

public class GameStatePayload
{
    // Server version - based on assembly build time, only changes when code is recompiled
    public static readonly string CurrentServerVersion = File.GetLastWriteTimeUtc(
        System.Reflection.Assembly.GetExecutingAssembly().Location
    ).Ticks.ToString();

    public long Tick { get; set; }
    public long Timestamp { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    public string ServerVersion { get; set; } = CurrentServerVersion;
    public EntityPayload? Player { get; set; }
    public List<EntityPayload> Entidades { get; set; } = new();
    public List<GameEventPayload> Eventos { get; set; } = new();
    public List<RewardEventPayload> Rewards { get; set; } = new();
    public List<LevelUpEventPayload> LevelUps { get; set; } = new();
    public ActiveEventPayload? ActiveEvent { get; set; }
}

public class ActiveEventPayload
{
    public string Type { get; set; } = string.Empty;  // "none", "bugswarm", "intermediate", "boss"
    public int MonstersRemaining { get; set; }
}

public class EntityPayload
{
    public Guid Id { get; set; }
    public string Login { get; set; } = string.Empty;
    public float X { get; set; }
    public float Y { get; set; }
    public int Hp { get; set; }
    public int HpMax { get; set; }
    public string Estado { get; set; } = "idle";
    public string Reino { get; set; } = string.Empty;
    public Guid? AlvoId { get; set; }
    public string Type { get; set; } = "player";
    public int VelocidadeAtaque { get; set; } = 50;
    public int VelocidadeMovimento { get; set; } = 50;
    public int Elo { get; set; } = 1000;
    public int Vitorias { get; set; }
    public int Derrotas { get; set; }
    public int Dano { get; set; } = 20;
    public int Critico { get; set; } = 10;
    public int Evasao { get; set; } = 5;
    public int Armadura { get; set; } = 10;
    public int Level { get; set; } = 1;
    public int Exp { get; set; } = 0;
    public int Gold { get; set; } = 0;
    public List<EquippedItemPayload>? EquippedItems { get; set; }
}

public class EquippedItemPayload
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Tier { get; set; } = "F";
}

public class GameEventPayload
{
    public string Type { get; set; } = string.Empty;
    public long Tick { get; set; }
    public long Timestamp { get; set; }
    public Guid AttackerId { get; set; }
    public string AttackerName { get; set; } = string.Empty;
    public Guid TargetId { get; set; }
    public string TargetName { get; set; } = string.Empty;
    public int? Damage { get; set; }
    public bool IsCritical { get; set; }
}

public class RewardEventPayload
{
    public Guid PlayerId { get; set; }
    public float X { get; set; }
    public float Y { get; set; }
    public int ExpGained { get; set; }
    public int GoldGained { get; set; }
    public bool LeveledUp { get; set; }
    public int NewLevel { get; set; }
    public string Source { get; set; } = string.Empty;
    public long Tick { get; set; }
}

public class LevelUpEventPayload
{
    public Guid PlayerId { get; set; }
    public string PlayerName { get; set; } = string.Empty;
    public int OldLevel { get; set; }
    public int NewLevel { get; set; }
    public float X { get; set; }
    public float Y { get; set; }
    public long Tick { get; set; }
}
