using GitWorld.Api.Auth;
using GitWorld.Api.Caching;
using GitWorld.Api.Core;
using GitWorld.Api.Core.Scripting;
using GitWorld.Api.Core.Systems;
using GitWorld.Api.Data;
using GitWorld.Api.GitHub;
using GitWorld.Api.Models;
using GitWorld.Api.Providers;
using GitWorld.Api.Services;
using GitWorld.Api.Stream;
using GitWorld.Shared;
using GitWorld.Shared.Entities;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using StreamInfo = GitWorld.Api.Models.StreamInfo;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// S2 Publisher
var s2Config = new S2Config();
builder.Configuration.GetSection("S2").Bind(s2Config);

// Apply defaults if not configured
if (string.IsNullOrEmpty(s2Config.BaseUrl))
    s2Config.BaseUrl = "https://aws.s2.dev";
if (string.IsNullOrEmpty(s2Config.Basin))
    s2Config.Basin = "gitworld";
if (string.IsNullOrEmpty(s2Config.StreamName))
    s2Config.StreamName = "game-state";
if (s2Config.TimeoutSeconds <= 0)
    s2Config.TimeoutSeconds = 10;

builder.Services.AddSingleton(s2Config);
builder.Services.AddHttpClient<IS2Publisher, S2Publisher>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(s2Config.TimeoutSeconds);
});
builder.Services.AddHttpClient<IS2TokenService, S2TokenService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
});

// Memory Cache (para GitHub)
builder.Services.AddMemoryCache();

// Redis Cache
var redisEnabled = builder.Configuration.GetValue<bool>("Redis:Enabled", false);
var redisConnectionString = builder.Configuration["Redis:ConnectionString"];

if (redisEnabled && !string.IsNullOrEmpty(redisConnectionString))
{
    try
    {
        var redisOptions = ConfigurationOptions.Parse(redisConnectionString);
        redisOptions.AbortOnConnectFail = false;
        var redis = ConnectionMultiplexer.Connect(redisOptions);
        builder.Services.AddSingleton<IConnectionMultiplexer>(redis);
        Console.WriteLine("[Redis] Connected to Redis");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Redis] Failed to connect: {ex.Message}. Using memory cache fallback.");
        builder.Services.AddSingleton<IConnectionMultiplexer?>(sp => null);
    }
}
else
{
    Console.WriteLine("[Redis] Disabled or not configured. Using memory cache only.");
    builder.Services.AddSingleton<IConnectionMultiplexer?>(sp => null);
}

builder.Services.AddSingleton<ICacheService, RedisCacheService>();

// GitHub Integration Services
builder.Services.AddHttpClient<IGitHubFetcher, GitHubFetcher>();
builder.Services.AddSingleton<IStatsCalculator, StatsCalculator>();
builder.Services.AddScoped<IGitHubService, GitHubService>();

// Multi-Provider Stats Services
builder.Services.AddHttpClient<GitLabFetcher>();
builder.Services.AddHttpClient<HuggingFaceFetcher>();
builder.Services.AddSingleton<IUnifiedStatsCalculator, UnifiedStatsCalculator>();
builder.Services.AddScoped<IStatsService, StatsService>();

// Item Service
builder.Services.AddScoped<IItemService, ItemService>();

// Game services
builder.Services.AddSingleton<World>();
builder.Services.AddSingleton<ScriptExecutor>();
builder.Services.AddSingleton<GameLoop>(sp => new GameLoop(
    sp.GetRequiredService<World>(),
    sp.GetRequiredService<ScriptExecutor>()
));
builder.Services.AddSingleton<MovementSystem>();

// Clerk JWT Validation
builder.Services.AddHttpClient<IClerkJwtValidator, ClerkJwtValidator>();

// API
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// Auto migrate database
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    Console.WriteLine("[Database] Migrations applied successfully");

    // Fallback: ensure clerk_id column exists (for production compatibility)
    try
    {
        await db.Database.ExecuteSqlRawAsync(@"
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='clerk_id') THEN
                    ALTER TABLE players ADD COLUMN clerk_id VARCHAR(255);
                    CREATE UNIQUE INDEX IF NOT EXISTS ""IX_players_clerk_id"" ON players (clerk_id);
                END IF;
            END $$;
        ");
        Console.WriteLine("[Database] ClerkId column verified");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Database] ClerkId fallback check: {ex.Message}");
    }

    // Seed items if none exist
    if (!db.Items.Any())
    {
        // Tier-based pricing
        var tierPrices = new Dictionary<string, int>
        {
            { "F", 50 }, { "D", 150 }, { "C", 400 },
            { "B", 1000 }, { "A", 2500 }, { "S", 5000 }
        };

        var items = new List<Item>
        {
            // Notebooks - all have ranged attacks with projectiles
            new() { Id = Guid.NewGuid(), Name = "ThinkPad X1", Category = "Notebook", Tier = "B", DanoBonus = 5, VelocidadeAtaqueBonus = 3, RangeBonus = 50, ProjectileColor = "#3776AB", ProjectileSize = 1f, Price = tierPrices["B"] },
            new() { Id = Guid.NewGuid(), Name = "MacBook Pro M3", Category = "Notebook", Tier = "A", DanoBonus = 10, CriticoBonus = 5, VelocidadeAtaqueBonus = 5, RangeBonus = 80, ProjectileColor = "#FFFFFF", ProjectileSize = 1.2f, Price = tierPrices["A"] },
            new() { Id = Guid.NewGuid(), Name = "Alienware X17", Category = "Notebook", Tier = "S", DanoBonus = 20, CriticoBonus = 10, VelocidadeAtaqueBonus = 8, RangeBonus = 120, ProjectileColor = "#00FF00", ProjectileSize = 1.5f, Price = tierPrices["S"] },
            new() { Id = Guid.NewGuid(), Name = "Razer Blade 18", Category = "Notebook", Tier = "S", DanoBonus = 25, CriticoBonus = 12, VelocidadeAtaqueBonus = 10, RangeBonus = 150, ProjectileColor = "#00FF88", ProjectileSize = 1.6f, VisualDescription = "RGB gaming beast", Price = tierPrices["S"] },
            new() { Id = Guid.NewGuid(), Name = "ASUS ROG Zephyrus", Category = "Notebook", Tier = "A", DanoBonus = 18, CriticoBonus = 8, VelocidadeAtaqueBonus = 7, RangeBonus = 100, ProjectileColor = "#FF0000", ProjectileSize = 1.3f, VisualDescription = "Slim powerhouse", Price = tierPrices["A"] },

            // Processadores
            new() { Id = Guid.NewGuid(), Name = "Intel i5", Category = "Processador", Tier = "C", VelocidadeAtaqueBonus = 5, Price = tierPrices["C"] },
            new() { Id = Guid.NewGuid(), Name = "AMD Ryzen 7", Category = "Processador", Tier = "B", VelocidadeAtaqueBonus = 10, DanoBonus = 3, Price = tierPrices["B"] },
            new() { Id = Guid.NewGuid(), Name = "Apple M3 Max", Category = "Processador", Tier = "A", VelocidadeAtaqueBonus = 15, DanoBonus = 5, CriticoBonus = 3, Price = tierPrices["A"] },
            new() { Id = Guid.NewGuid(), Name = "AMD Ryzen 9 7950X3D", Category = "Processador", Tier = "S", VelocidadeAtaqueBonus = 25, DanoBonus = 15, CriticoBonus = 10, VisualDescription = "3D V-Cache monster", Price = tierPrices["S"] },
            new() { Id = Guid.NewGuid(), Name = "Intel i9-14900K", Category = "Processador", Tier = "S", VelocidadeAtaqueBonus = 22, DanoBonus = 18, CriticoBonus = 8, VisualDescription = "24 cores of power", Price = tierPrices["S"] },

            // Café - incluindo marcas brasileiras
            new() { Id = Guid.NewGuid(), Name = "Café Solúvel", Category = "Café", Tier = "F", VelocidadeAtaqueBonus = 2, DurationMinutes = 30, Price = tierPrices["F"] },
            new() { Id = Guid.NewGuid(), Name = "Espresso", Category = "Café", Tier = "D", VelocidadeAtaqueBonus = 5, CriticoBonus = 2, DurationMinutes = 60, Price = tierPrices["D"] },
            new() { Id = Guid.NewGuid(), Name = "Cold Brew Artesanal", Category = "Café", Tier = "B", VelocidadeAtaqueBonus = 10, CriticoBonus = 5, DanoBonus = 3, DurationMinutes = 120, Price = tierPrices["B"] },
            new() { Id = Guid.NewGuid(), Name = "Café Pilão", Category = "Café", Tier = "C", VelocidadeAtaqueBonus = 6, DanoBonus = 2, DurationMinutes = 45, VisualDescription = "Tradição brasileira", Price = tierPrices["C"] },
            new() { Id = Guid.NewGuid(), Name = "3 Corações", Category = "Café", Tier = "C", VelocidadeAtaqueBonus = 7, CriticoBonus = 3, DurationMinutes = 50, VisualDescription = "Feito com amor", Price = tierPrices["C"] },
            new() { Id = Guid.NewGuid(), Name = "Café Orfeu", Category = "Café", Tier = "A", VelocidadeAtaqueBonus = 12, CriticoBonus = 6, DanoBonus = 5, DurationMinutes = 90, VisualDescription = "Premium brasileiro", Price = tierPrices["A"] },
            new() { Id = Guid.NewGuid(), Name = "Café do Ponto", Category = "Café", Tier = "D", VelocidadeAtaqueBonus = 4, DurationMinutes = 40, VisualDescription = "Clássico paulista", Price = tierPrices["D"] },

            // Energéticos
            new() { Id = Guid.NewGuid(), Name = "Monster Energy", Category = "Energético", Tier = "D", VelocidadeMovimentoBonus = 5, VelocidadeAtaqueBonus = 3, DurationMinutes = 45, Price = tierPrices["D"] },
            new() { Id = Guid.NewGuid(), Name = "Red Bull", Category = "Energético", Tier = "C", VelocidadeMovimentoBonus = 8, VelocidadeAtaqueBonus = 5, DurationMinutes = 60, Price = tierPrices["C"] },
            new() { Id = Guid.NewGuid(), Name = "G Fuel", Category = "Energético", Tier = "B", VelocidadeMovimentoBonus = 12, VelocidadeAtaqueBonus = 8, CriticoBonus = 3, DurationMinutes = 90, Price = tierPrices["B"] },

            // Teclados - incluindo split e hype
            new() { Id = Guid.NewGuid(), Name = "Teclado Membrana", Category = "Teclado", Tier = "F", VelocidadeAtaqueBonus = 1, Price = tierPrices["F"] },
            new() { Id = Guid.NewGuid(), Name = "Keychron K2", Category = "Teclado", Tier = "C", VelocidadeAtaqueBonus = 5, DanoBonus = 2, Price = tierPrices["C"] },
            new() { Id = Guid.NewGuid(), Name = "Custom Mechanical", Category = "Teclado", Tier = "A", VelocidadeAtaqueBonus = 12, DanoBonus = 5, CriticoBonus = 3, Price = tierPrices["A"] },
            new() { Id = Guid.NewGuid(), Name = "ZSA Moonlander", Category = "Teclado", Tier = "S", VelocidadeAtaqueBonus = 18, DanoBonus = 8, CriticoBonus = 8, EvasaoBonus = 5, VisualDescription = "Split ergo masterpiece", Price = tierPrices["S"] },
            new() { Id = Guid.NewGuid(), Name = "Wooting 60HE", Category = "Teclado", Tier = "S", VelocidadeAtaqueBonus = 20, DanoBonus = 10, CriticoBonus = 5, VisualDescription = "Analog switches pro", Price = tierPrices["S"] },
            new() { Id = Guid.NewGuid(), Name = "Ducky One 3", Category = "Teclado", Tier = "A", VelocidadeAtaqueBonus = 14, DanoBonus = 6, CriticoBonus = 4, VisualDescription = "Hot-swap legend", Price = tierPrices["A"] },

            // Fones - incluindo hype
            new() { Id = Guid.NewGuid(), Name = "Fone Genérico", Category = "Fone", Tier = "F", EvasaoBonus = 1, Price = tierPrices["F"] },
            new() { Id = Guid.NewGuid(), Name = "AirPods Pro", Category = "Fone", Tier = "B", EvasaoBonus = 5, VelocidadeMovimentoBonus = 3, Price = tierPrices["B"] },
            new() { Id = Guid.NewGuid(), Name = "Sony WH-1000XM5", Category = "Fone", Tier = "A", EvasaoBonus = 10, VelocidadeMovimentoBonus = 5, ArmaduraBonus = 3, Price = tierPrices["A"] },
            new() { Id = Guid.NewGuid(), Name = "Bose QuietComfort Ultra", Category = "Fone", Tier = "A", EvasaoBonus = 12, ArmaduraBonus = 5, HpBonus = 10, VisualDescription = "Silence is golden", Price = tierPrices["A"] },
            new() { Id = Guid.NewGuid(), Name = "Sennheiser HD 800 S", Category = "Fone", Tier = "S", EvasaoBonus = 15, CriticoBonus = 8, DanoBonus = 5, VisualDescription = "Audiophile endgame", Price = tierPrices["S"] },
            new() { Id = Guid.NewGuid(), Name = "Beyerdynamic DT 1990", Category = "Fone", Tier = "S", EvasaoBonus = 12, CriticoBonus = 10, DanoBonus = 8, VisualDescription = "German precision", Price = tierPrices["S"] },

            // Camisetas
            new() { Id = Guid.NewGuid(), Name = "Camiseta Básica", Category = "Camiseta", Tier = "F", ArmaduraBonus = 1, Price = tierPrices["F"] },
            new() { Id = Guid.NewGuid(), Name = "Hoodie Tech", Category = "Camiseta", Tier = "C", ArmaduraBonus = 5, HpBonus = 10, Price = tierPrices["C"] },
            new() { Id = Guid.NewGuid(), Name = "Moletom GitHub", Category = "Camiseta", Tier = "B", ArmaduraBonus = 8, HpBonus = 20, EvasaoBonus = 2, Price = tierPrices["B"] },

            // IDEs - todas as famosas
            new() { Id = Guid.NewGuid(), Name = "Notepad", Category = "IDE", Tier = "F", DanoBonus = -5, EvasaoBonus = 10, VisualDescription = "Chad energy", Price = tierPrices["F"] },
            new() { Id = Guid.NewGuid(), Name = "VS Code", Category = "IDE", Tier = "B", DanoBonus = 8, VelocidadeAtaqueBonus = 5, Price = tierPrices["B"] },
            new() { Id = Guid.NewGuid(), Name = "Neovim", Category = "IDE", Tier = "A", DanoBonus = 15, VelocidadeAtaqueBonus = 10, CriticoBonus = 5, VisualDescription = "btw I use vim", Price = tierPrices["A"] },
            new() { Id = Guid.NewGuid(), Name = "JetBrains Fleet", Category = "IDE", Tier = "S", DanoBonus = 20, VelocidadeAtaqueBonus = 12, CriticoBonus = 8, ArmaduraBonus = 5, Price = tierPrices["S"] },
            new() { Id = Guid.NewGuid(), Name = "IntelliJ IDEA", Category = "IDE", Tier = "S", DanoBonus = 22, VelocidadeAtaqueBonus = 10, CriticoBonus = 10, ArmaduraBonus = 8, VisualDescription = "Java god mode", Price = tierPrices["S"] },
            new() { Id = Guid.NewGuid(), Name = "PyCharm", Category = "IDE", Tier = "A", DanoBonus = 16, VelocidadeAtaqueBonus = 8, CriticoBonus = 6, VisualDescription = "Python paradise", Price = tierPrices["A"] },
            new() { Id = Guid.NewGuid(), Name = "WebStorm", Category = "IDE", Tier = "A", DanoBonus = 14, VelocidadeAtaqueBonus = 12, CriticoBonus = 5, VisualDescription = "JS/TS mastery", Price = tierPrices["A"] },
            new() { Id = Guid.NewGuid(), Name = "Sublime Text", Category = "IDE", Tier = "B", DanoBonus = 10, VelocidadeAtaqueBonus = 15, VisualDescription = "Speed demon", Price = tierPrices["B"] },
            new() { Id = Guid.NewGuid(), Name = "Vim", Category = "IDE", Tier = "A", DanoBonus = 18, VelocidadeAtaqueBonus = 8, CriticoBonus = 12, EvasaoBonus = 5, VisualDescription = "The OG", Price = tierPrices["A"] },
            new() { Id = Guid.NewGuid(), Name = "Emacs", Category = "IDE", Tier = "A", DanoBonus = 12, ArmaduraBonus = 15, HpBonus = 20, VisualDescription = "OS disguised as editor", Price = tierPrices["A"] },
            new() { Id = Guid.NewGuid(), Name = "Eclipse", Category = "IDE", Tier = "C", DanoBonus = 5, ArmaduraBonus = 8, HpBonus = 15, VisualDescription = "Enterprise classic", Price = tierPrices["C"] },
            new() { Id = Guid.NewGuid(), Name = "Cursor", Category = "IDE", Tier = "S", DanoBonus = 25, VelocidadeAtaqueBonus = 15, CriticoBonus = 12, VisualDescription = "AI-powered coding", Price = tierPrices["S"] },
            new() { Id = Guid.NewGuid(), Name = "Zed", Category = "IDE", Tier = "A", DanoBonus = 12, VelocidadeAtaqueBonus = 20, CriticoBonus = 5, VisualDescription = "Blazingly fast", Price = tierPrices["A"] },
            new() { Id = Guid.NewGuid(), Name = "Rider", Category = "IDE", Tier = "S", DanoBonus = 20, VelocidadeAtaqueBonus = 10, ArmaduraBonus = 10, CriticoBonus = 8, VisualDescription = "C# excellence", Price = tierPrices["S"] },

            // Comidas
            new() { Id = Guid.NewGuid(), Name = "Miojo", Category = "Comida", Tier = "F", HpBonus = 5, DurationMinutes = 30, Price = tierPrices["F"] },
            new() { Id = Guid.NewGuid(), Name = "Pizza", Category = "Comida", Tier = "D", HpBonus = 15, ArmaduraBonus = 2, DurationMinutes = 60, Price = tierPrices["D"] },
            new() { Id = Guid.NewGuid(), Name = "Sushi Premium", Category = "Comida", Tier = "A", HpBonus = 30, ArmaduraBonus = 5, CriticoBonus = 3, DurationMinutes = 120, Price = tierPrices["A"] },

            // Pets
            new() { Id = Guid.NewGuid(), Name = "Rubber Duck", Category = "Pet", Tier = "C", CriticoBonus = 5, VisualDescription = "Debug companion", Price = tierPrices["C"] },
            new() { Id = Guid.NewGuid(), Name = "Gato Preto", Category = "Pet", Tier = "B", EvasaoBonus = 8, CriticoBonus = 5, VisualDescription = "Bad luck for enemies", Price = tierPrices["B"] },
            new() { Id = Guid.NewGuid(), Name = "Octocat", Category = "Pet", Tier = "S", DanoBonus = 10, CriticoBonus = 10, EvasaoBonus = 10, VisualDescription = "GitHub mascot", Price = tierPrices["S"] },

            // Acessórios
            new() { Id = Guid.NewGuid(), Name = "Mousepad RGB", Category = "Acessório", Tier = "D", VelocidadeAtaqueBonus = 3, Price = tierPrices["D"] },
            new() { Id = Guid.NewGuid(), Name = "Standing Desk", Category = "Acessório", Tier = "B", HpBonus = 20, VelocidadeMovimentoBonus = 5, Price = tierPrices["B"] },
            new() { Id = Guid.NewGuid(), Name = "Herman Miller", Category = "Acessório", Tier = "S", HpBonus = 50, ArmaduraBonus = 10, EvasaoBonus = 5, VisualDescription = "Ergonomic throne", Price = tierPrices["S"] },
        };

        db.Items.AddRange(items);
        db.SaveChanges();
        Console.WriteLine($"[Database] Seeded {items.Count} items");
    }
    else
    {
        // Fix items with Price = 0 (migration added column but existing items have 0)
        var itemsWithZeroPrice = db.Items.Where(i => i.Price == 0).ToList();
        if (itemsWithZeroPrice.Count > 0)
        {
            var tierPrices = new Dictionary<string, int>
            {
                { "F", 50 }, { "D", 150 }, { "C", 400 },
                { "B", 1000 }, { "A", 2500 }, { "S", 5000 }
            };

            foreach (var item in itemsWithZeroPrice)
            {
                if (tierPrices.TryGetValue(item.Tier, out var price))
                {
                    item.Price = price;
                }
            }
            db.SaveChanges();
            Console.WriteLine($"[Database] Updated prices for {itemsWithZeroPrice.Count} items");
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"[Database] Migration error: {ex.Message}");
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseClerkAuth();
app.MapControllers();

// Start game loop
var gameLoop = app.Services.GetRequiredService<GameLoop>();
var s2Publisher = app.Services.GetRequiredService<IS2Publisher>();
var streamReady = false;
long lastS2BroadcastTick = -1;

gameLoop.OnTick += (tick, world) =>
{
    // Log a cada 100 ticks (~5 segundos)
    if (tick % 100 == 0)
    {
        Console.WriteLine($"[GameLoop] Tick {tick} - World:{world.GetHashCode()} Entities: {world.Entities.Count}");
    }

    // Ensure game-state stream exists
    if (!streamReady)
    {
        _ = Task.Run(async () => { streamReady = await s2Publisher.EnsureStreamExistsAsync(s2Config.StreamName); });
    }

    // Use GetEventsSince instead of DrainEvents to not interfere with SSE clients
    var combatEvents = gameLoop.CombatSystem.EventQueue.GetEventsSince(lastS2BroadcastTick);
    var activeEvent = gameLoop.EventSystem.CurrentEvent;
    var rewardEvents = gameLoop.ProgressionSystem.GetAndClearRewardEvents();
    var levelUpEvents = gameLoop.ProgressionSystem.GetAndClearLevelUpEvents();
    lastS2BroadcastTick = tick;

    // Broadcast to individual player streams with ADAPTIVE FREQUENCY
    // Each player gets updates at different rates based on activity level:
    // - Combat: every 2 ticks (100ms) - 10 updates/s
    // - Moving: every 4 ticks (200ms) - 5 updates/s
    // - Idle: every 10 ticks (500ms) - 2 updates/s
    var onlineSessions = world.PlayerSessions.ToList();
    var nearbyEntityIds = new HashSet<Guid>(); // Track nearby entity IDs for event filtering

    foreach (var session in onlineSessions)
    {
        var playerEntity = world.GetEntity(session.EntityId);
        if (playerEntity == null) continue;

        // Determine activity level based on entity state
        // Dead state also gets high frequency so client sees death/respawn transitions
        var newActivityLevel = playerEntity.State switch
        {
            GitWorld.Api.Core.EntityState.Attacking => PlayerActivityLevel.Combat,
            GitWorld.Api.Core.EntityState.Dead => PlayerActivityLevel.Combat, // High frequency for death/respawn
            _ when playerEntity.TargetEntityId.HasValue => PlayerActivityLevel.Combat,
            GitWorld.Api.Core.EntityState.Moving => PlayerActivityLevel.Moving,
            _ => PlayerActivityLevel.Idle
        };
        session.ActivityLevel = newActivityLevel;

        // Determine broadcast interval based on activity level
        var broadcastInterval = session.ActivityLevel switch
        {
            PlayerActivityLevel.Combat => 2,   // 100ms - full speed for combat
            PlayerActivityLevel.Moving => 4,   // 200ms - moderate for movement
            PlayerActivityLevel.Idle => 10,    // 500ms - slow for idle
            _ => 2
        };

        // Skip this player if not enough ticks have passed since last broadcast
        if ((tick - session.LastBroadcastTick) < broadcastInterval)
            continue;

        session.LastBroadcastTick = tick;

        // Get entities within player's vision radius (includes self)
        var nearbyEntities = world.GetEntitiesInRange(playerEntity.X, playerEntity.Y, GameConstants.RaioBroadcast)
            .Append(playerEntity)
            .ToList();

        // Build set of nearby entity IDs for filtering events
        nearbyEntityIds.Clear();
        foreach (var e in nearbyEntities)
            nearbyEntityIds.Add(e.Id);

        // Filter combat events: include if attacker OR target is nearby (so player sees all nearby combat)
        var playerCombatEvents = combatEvents?
            .Where(e => nearbyEntityIds.Contains(e.AttackerId) || nearbyEntityIds.Contains(e.TargetId))
            .ToList();

        // Rewards are personal - only player's own rewards
        var playerRewardEvents = rewardEvents?
            .Where(r => r.PlayerId == session.PlayerId)
            .ToList();

        // Level ups: include if player is nearby (for killfeed/notifications)
        var playerLevelUpEvents = levelUpEvents?
            .Where(l => nearbyEntityIds.Contains(l.PlayerId))
            .ToList();

        var streamName = session.StreamName;
        // Use delta updates for individual player streams
        // Full state every 100 ticks (~5 seconds) for sync, delta updates otherwise
        var forceFullState = tick % 100 == 0;

        // DEBUG: Log entity count every 100 ticks
        if (tick % 100 == 0)
        {
            Console.WriteLine($"[Stream] Player {session.GithubLogin} at ({playerEntity.X:F0},{playerEntity.Y:F0}) -> stream={streamName}, nearby={nearbyEntities.Count}, total={world.Entities.Count}");
        }

        _ = Task.Run(() => s2Publisher.BroadcastDeltaGameStateAsync(tick, session.PlayerId, nearbyEntities, forceFullState, playerCombatEvents, activeEvent, playerRewardEvents, playerLevelUpEvents, streamName));
    }

    // Broadcast to global stream every 2 ticks for spectators (non-authenticated users)
    // Spectators always get full speed since they're watching the action
    if (tick % 2 == 0)
    {
        _ = Task.Run(() => s2Publisher.BroadcastGameStateAsync(tick, world.Entities, combatEvents, activeEvent, rewardEvents, levelUpEvents));
    }

    // Periodically clean old events (keep last 10 seconds = 200 ticks)
    if (tick % 200 == 0)
    {
        gameLoop.CombatSystem.EventQueue.ClearOlderThan(tick - 200);
    }

    // Persist player positions every 200 ticks (~10 seconds)
    if (tick % 200 == 0)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = app.Services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                foreach (var entity in world.Entities.Where(e => e.Type == EntityType.Player))
                {
                    var player = await db.Players.FindAsync(entity.Id);
                    if (player != null)
                    {
                        player.X = entity.X;
                        player.Y = entity.Y;
                        player.Hp = entity.CurrentHp;
                        player.Estado = entity.State switch
                        {
                            GitWorld.Api.Core.EntityState.Idle => PlayerState.Idle,
                            GitWorld.Api.Core.EntityState.Moving => PlayerState.Moving,
                            GitWorld.Api.Core.EntityState.Attacking => PlayerState.Fighting,
                            GitWorld.Api.Core.EntityState.Dead => PlayerState.Dead,
                            _ => PlayerState.Idle
                        };
                        // Persist progression
                        player.Level = entity.Level;
                        player.Exp = entity.Exp;
                        player.Gold = entity.Gold;
                        player.UpdatedAt = DateTime.UtcNow;
                    }
                }
                await db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Persist] Failed to save positions: {ex.Message}");
            }
        });
    }
};
gameLoop.Start();

// Handler for persisting ELO changes to database when a player kills another
gameLoop.CombatSystem.OnPlayerKill += async (killer, victim) =>
{
    Console.WriteLine($"[ELO] Kill event: {killer.GithubLogin} ({killer.Id}) killed {victim.GithubLogin} ({victim.Id})");
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var killerPlayer = await db.Players.FindAsync(killer.Id);
        var victimPlayer = await db.Players.FindAsync(victim.Id);

        Console.WriteLine($"[ELO] DB lookup - Killer found: {killerPlayer != null}, Victim found: {victimPlayer != null}");

        if (killerPlayer != null && victimPlayer != null)
        {
            // Update ELO in database
            killerPlayer.Elo = killer.Elo;
            killerPlayer.Vitorias = killer.Vitorias;

            victimPlayer.Elo = victim.Elo;
            victimPlayer.Derrotas = victim.Derrotas;

            // Record battle
            db.Battles.Add(new Battle
            {
                Id = Guid.NewGuid(),
                Player1Id = killer.Id,
                Player2Id = victim.Id,
                WinnerId = killer.Id,
                DurationMs = 0,
                CreatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();
            Console.WriteLine($"[ELO] Persisted: {killer.GithubLogin} ELO={killer.Elo} W={killer.Vitorias} | {victim.GithubLogin} ELO={victim.Elo} L={victim.Derrotas}");
        }
        else
        {
            Console.WriteLine($"[ELO] Players not found in database!");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[ELO] Failed to persist: {ex.Message}");
    }
};

// No NPCs by default - focusing on PvP
var world = app.Services.GetRequiredService<World>();
Console.WriteLine("[GameLoop] PvP mode - no NPCs spawned");

// Spawn UnexplainedBug on server start (always present in the world)
var centerX = GameConstants.MapaWidth / 2f;
var centerY = GameConstants.MapaHeight / 2f;
var startupBug = world.AddMonster(EntityType.UnexplainedBug, centerX, centerY);
gameLoop.EventSystem.RegisterMonster(startupBug.Id);
Console.WriteLine("[GameLoop] UnexplainedBug spawned at map center on startup");

// Load existing players from database on startup (continuity after restart)
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Load players who were active in the last 24 hours
    var recentThreshold = DateTime.UtcNow.AddHours(-24);
    var recentPlayers = await db.Players
        .Where(p => p.UpdatedAt > recentThreshold)
        .ToListAsync();

    Console.WriteLine($"[Startup] Found {recentPlayers.Count} recent players to restore");

    foreach (var player in recentPlayers)
    {
        // ========== STATS BASE IGUAIS PARA TODOS ==========
        // TODO: Descomentar quando quiser usar stats salvos no banco
        // var stats = new GitWorld.Shared.PlayerStats(
        //     player.HpMax,
        //     player.Dano,
        //     player.VelocidadeAtaque,
        //     player.VelocidadeMovimento,
        //     player.Critico,
        //     player.Evasao,
        //     player.Armadura
        // );

        // Stats base fixos para todos
        var stats = new GitWorld.Shared.PlayerStats(
            500,   // HP
            50,    // Dano
            50,    // VelocidadeAtaque
            100,   // VelocidadeMovimento
            10,    // Critico
            10,    // Evasao
            10     // Armadura
        );

        // Restore entity at last known position
        var entity = world.AddEntity(
            player.Id,
            player.GitHubLogin,
            stats,
            player.Reino,
            player.Elo,
            player.Vitorias,
            player.Derrotas,
            player.Level,
            player.Exp,
            player.Gold
        );

        // Override spawn position with saved position
        entity.X = player.X;
        entity.Y = player.Y;
        // Use HP base (500) já que estamos com stats fixos
        entity.CurrentHp = entity.MaxHp;

        // Unstick if player is inside a collision zone (e.g., after map change)
        world.UnstickEntity(entity);

        // Load equipped items from database
        var equippedPlayerItems = db.PlayerItems
            .Include(pi => pi.Item)
            .Where(pi => pi.PlayerId == player.Id && pi.IsEquipped)
            .Where(pi => pi.ExpiresAt == null || pi.ExpiresAt > DateTime.UtcNow)
            .ToList();

        var equippedItems = equippedPlayerItems
            .Select(pi => new GitWorld.Api.Core.EquippedItemInfo
            {
                Name = pi.Item.Name,
                Category = pi.Item.Category,
                Tier = pi.Item.Tier
            })
            .ToList();
        entity.EquippedItems = equippedItems;

        // Apply item bonuses to stats
        foreach (var pi in equippedPlayerItems)
        {
            entity.MaxHp += pi.Item.HpBonus;
            entity.Dano += pi.Item.DanoBonus;
            entity.Armadura += pi.Item.ArmaduraBonus;
            entity.Critico += pi.Item.CriticoBonus;
            entity.Evasao += pi.Item.EvasaoBonus;
            entity.VelocidadeAtaque += pi.Item.VelocidadeAtaqueBonus;
            entity.VelocidadeMovimento += pi.Item.VelocidadeMovimentoBonus;
            // Projectile properties (take the highest RangeBonus, last color/size)
            entity.RangeBonus += pi.Item.RangeBonus;
            if (!string.IsNullOrEmpty(pi.Item.ProjectileColor))
                entity.ProjectileColor = pi.Item.ProjectileColor;
            if (pi.Item.ProjectileSize > entity.ProjectileSize)
                entity.ProjectileSize = pi.Item.ProjectileSize;
        }
        entity.CurrentHp = Math.Min(entity.CurrentHp, entity.MaxHp);

        // Load scripting settings
        entity.CustomScript = player.CustomScript;
        entity.ScriptEnabled = player.ScriptEnabled;

        // Create session for the player
        var streamName = $"player-{player.Id}";
        var session = new PlayerSession
        {
            PlayerId = player.Id,
            EntityId = entity.Id,
            GithubLogin = player.GitHubLogin,
            JoinedAt = DateTime.UtcNow,
            LastHeartbeat = DateTime.UtcNow,
            StreamName = streamName
        };
        world.RegisterPlayerSession(session);

        Console.WriteLine($"[Startup] Restored {player.GitHubLogin} at ({player.X:F0}, {player.Y:F0}) ELO:{player.Elo} Items:{equippedItems.Count}");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"[Startup] Failed to restore players: {ex.Message}");
}

// Health check
app.MapGet("/health", (GameLoop loop) => Results.Ok(new
{
    status = "healthy",
    tick = loop.CurrentTick,
    timestamp = DateTime.UtcNow
})).WithName("HealthCheck");

// Game state endpoint
app.MapGet("/game/state", (World world, GameLoop loop) =>
{
    return Results.Ok(new
    {
        tick = loop.CurrentTick,
        entities = world.Entities.Select(e => new
        {
            e.Id,
            e.GithubLogin,
            e.Reino,
            e.X,
            e.Y,
            e.CurrentHp,
            e.MaxHp,
            State = e.State.ToString().ToLowerInvariant(),
            Type = e.Type.ToString().ToLowerInvariant()
        })
    });
}).WithName("GetGameState");

// Get online players for spectators (to follow their streams)
app.MapGet("/game/spectate/players", async (World world, AppDbContext db, S2Config config, IS2TokenService s2TokenService) =>
{
    var sessions = world.PlayerSessions.ToList();
    if (sessions.Count == 0)
    {
        return Results.Ok(new { players = Array.Empty<object>() });
    }

    var playerIds = sessions.Select(s => s.PlayerId).ToList();
    var players = await db.Players
        .Where(p => playerIds.Contains(p.Id))
        .ToListAsync();

    var result = new List<object>();
    foreach (var session in sessions)
    {
        var player = players.FirstOrDefault(p => p.Id == session.PlayerId);
        if (player == null) continue;

        var entity = world.GetEntity(session.EntityId);
        if (entity == null || !entity.IsAlive) continue;

        // Get or create read token for spectators
        var readToken = await s2TokenService.GetOrCreatePlayerReadTokenAsync(player);
        if (readToken == null) continue;

        result.Add(new
        {
            playerId = player.Id,
            entityId = session.EntityId,
            githubLogin = session.GithubLogin,
            reino = entity.Reino,
            level = entity.Level,
            elo = entity.Elo,
            x = entity.X,
            y = entity.Y,
            stream = new
            {
                streamName = session.StreamName,
                basin = config.Basin,
                baseUrl = $"https://{config.Basin}.b.aws.s2.dev",
                readToken = readToken
            }
        });
    }

    // Save any new tokens generated
    await db.SaveChangesAsync();

    return Results.Ok(new { players = result });
}).WithName("GetSpectatePlayers");

// Add test player with custom name and reino (for PvP testing)
app.MapPost("/game/test-player", (World world, string? name, string? reino) =>
{
    var playerId = Guid.NewGuid();
    var playerName = name ?? $"TestPlayer-{playerId.ToString()[..6]}";
    var playerReino = reino ?? "TypeScript";
    var stats = new GitWorld.Shared.PlayerStats(100, 20, 50, 50, 10, 5, 10);
    var entity = world.AddEntity(playerId, playerName, stats, playerReino);
    Console.WriteLine($"[Test] Spawned {playerName} ({playerReino}) at ({entity.X:F0}, {entity.Y:F0})");
    return Results.Created($"/game/entity/{entity.Id}", new
    {
        entity.Id,
        entity.GithubLogin,
        entity.Reino,
        entity.X,
        entity.Y
    });
}).WithName("AddTestPlayer");

// Move entity
app.MapPost("/game/entity/{id}/move", (World world, Guid id, float x, float y, MovementSystem movement) =>
{
    var entity = world.GetEntity(id);
    if (entity == null)
        return Results.NotFound();

    movement.SetDestination(entity, x, y);
    return Results.Ok(new { entity.Id, targetX = x, targetY = y });
}).WithName("MoveEntity");

// GitHub stats endpoint
app.MapGet("/github/{username}", async (string username, IGitHubService gitHubService) =>
{
    try
    {
        var profile = await gitHubService.GetPlayerProfileAsync(username);
        return Results.Ok(profile);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Erro ao buscar dados: {ex.Message}");
    }
}).WithName("GetGitHubStats");

// Refresh GitHub cache endpoint
app.MapPost("/github/{username}/refresh", async (string username, IGitHubService gitHubService) =>
{
    try
    {
        var profile = await gitHubService.GetPlayerProfileAsync(username, forceRefresh: true);
        return Results.Ok(profile);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Erro ao atualizar dados: {ex.Message}");
    }
}).WithName("RefreshGitHubStats");

// GitHub raw data endpoint (for profile display)
app.MapGet("/github/{username}/raw", async (string username, IGitHubService gitHubService) =>
{
    try
    {
        var rawData = await gitHubService.GetRawDataAsync(username);
        return Results.Ok(rawData);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Erro ao buscar dados: {ex.Message}");
    }
}).WithName("GetGitHubRawData");

// GitLab raw data endpoint (for profile display)
app.MapGet("/gitlab/{username}/raw", async (string username, GitLabFetcher gitLabFetcher) =>
{
    try
    {
        var rawData = await gitLabFetcher.FetchUserDataAsync(username);
        return Results.Ok(rawData);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Erro ao buscar dados: {ex.Message}");
    }
}).WithName("GetGitLabRawData");

// HuggingFace raw data endpoint (for profile display)
app.MapGet("/huggingface/{username}/raw", async (string username, HuggingFaceFetcher huggingFaceFetcher) =>
{
    try
    {
        var rawData = await huggingFaceFetcher.FetchUserDataAsync(username);
        return Results.Ok(rawData);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Erro ao buscar dados: {ex.Message}");
    }
}).WithName("GetHuggingFaceRawData");

// Get all linked accounts for current user
app.MapGet("/profile/linked-accounts", async (HttpContext context, IClerkJwtValidator clerkValidator) =>
{
    try
    {
        var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        {
            return Results.Unauthorized();
        }
        var token = authHeader.Substring(7);

        var user = await clerkValidator.ValidateTokenAsync(token);
        if (user == null)
        {
            return Results.Unauthorized();
        }

        var linkedAccounts = await clerkValidator.GetLinkedAccountsAsync(user.ClerkId);
        return Results.Ok(linkedAccounts);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Erro ao buscar contas: {ex.Message}");
    }
}).WithName("GetLinkedAccounts");

// POST /game/join - Join the game (authenticated via Clerk)
app.MapPost("/game/join", async (HttpContext context, World world, IStatsService statsService, AppDbContext db, S2Config config, IClerkJwtValidator clerkValidator, IS2TokenService s2TokenService) =>
{
    try
    {
        // Get token from Authorization header
        var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        {
            return Results.Unauthorized();
        }
        var token = authHeader.Substring(7);

        // Validate token and get user info using ClerkJwtValidator
        var clerkUser = await clerkValidator.ValidateTokenAsync(token);
        if (clerkUser == null)
        {
            return Results.Unauthorized();
        }

        if (string.IsNullOrEmpty(clerkUser.Username))
        {
            return Results.BadRequest(new { error = "Account not connected. Please sign in with GitHub, GitLab, or HuggingFace." });
        }

        Console.WriteLine($"[game/join] User {clerkUser.ClerkId} -> Provider: {clerkUser.Provider}, Username: {clerkUser.Username}");

        // Check if player is already online
        if (world.IsPlayerOnline(clerkUser.Username))
        {
            var existingSession = world.GetPlayerSession(clerkUser.Username);
            if (existingSession != null)
            {
                var existingEntity = world.GetEntity(existingSession.EntityId);
                if (existingEntity != null)
                {
                    // Reload equipped items (in case they changed or weren't loaded)
                    var existingEquippedItems = await db.PlayerItems
                        .Include(pi => pi.Item)
                        .Where(pi => pi.PlayerId == existingSession.PlayerId && pi.IsEquipped)
                        .Select(pi => new GitWorld.Api.Core.EquippedItemInfo
                        {
                            Name = pi.Item.Name,
                            Category = pi.Item.Category,
                            Tier = pi.Item.Tier
                        })
                        .ToListAsync();
                    existingEntity.EquippedItems = existingEquippedItems;

                    // Generate read token for player's stream
                    var existingPlayer = await db.Players.FindAsync(existingSession.PlayerId);
                    var existingReadToken = existingPlayer != null
                        ? await s2TokenService.GetOrCreatePlayerReadTokenAsync(existingPlayer)
                        : null;
                    if (existingPlayer != null) await db.SaveChangesAsync();

                    // Get initial state of all nearby entities (prevents "Unknown" names on reconnect)
                    var existingInitialState = world.GetEntitiesInRange(existingEntity.X, existingEntity.Y, GameConstants.RaioBroadcast)
                        .Select(e => new EntityInfo(
                            e.Id,
                            e.GithubLogin,
                            e.X,
                            e.Y,
                            e.CurrentHp,
                            e.MaxHp,
                            e.State.ToString().ToLowerInvariant(),
                            e.Reino,
                            e.Type.ToString().ToLowerInvariant(),
                            e.Level,
                            e.Exp,
                            e.Gold,
                            e.Dano,
                            e.Critico,
                            e.Evasao,
                            e.Armadura,
                            e.VelocidadeAtaque,
                            e.VelocidadeMovimento,
                            e.Elo,
                            e.Vitorias,
                            e.Derrotas
                        ))
                        .ToList();

                    return Results.Ok(new JoinResponse(
                        existingSession.PlayerId,
                        existingSession.EntityId,
                        existingSession.GithubLogin,
                        existingEntity.Reino,
                        existingEntity.X,
                        existingEntity.Y,
                        new StreamInfo(existingSession.StreamName, config.Basin, config.BaseUrl, existingReadToken),
                        existingInitialState
                    ));
                }
            }
        }

        // Get all linked accounts and try to find one with activity
        var linkedAccounts = await clerkValidator.GetLinkedAccountsAsync(clerkUser.ClerkId);

        // Add primary account if not already in list
        if (clerkUser.Provider != OAuthProvider.Unknown && !string.IsNullOrEmpty(clerkUser.Username))
        {
            if (!linkedAccounts.Any(a => a.Provider == clerkUser.Provider && a.Username == clerkUser.Username))
            {
                linkedAccounts.Insert(0, new LinkedAccount(clerkUser.Provider, clerkUser.Username, null));
            }
        }

        // Try each linked account until we find one with activity
        PlayerProfile? profile = null;
        OAuthProvider usedProvider = OAuthProvider.Unknown;
        string? usedUsername = null;

        foreach (var account in linkedAccounts)
        {
            if (account.Provider == OAuthProvider.Unknown) continue;

            var tempProfile = await statsService.GetPlayerProfileAsync(account.Provider, account.Username);
            if (tempProfile.HasMinimumActivity)
            {
                profile = tempProfile;
                usedProvider = account.Provider;
                usedUsername = account.Username;
                break;
            }
        }

        // If no provider has activity, return error
        if (profile == null || !profile.HasMinimumActivity)
        {
            var providerNames = string.Join(", ", linkedAccounts
                .Where(a => a.Provider != OAuthProvider.Unknown)
                .Select(a => a.Provider switch
                {
                    OAuthProvider.GitHub => "GitHub",
                    OAuthProvider.GitLab => "GitLab",
                    OAuthProvider.HuggingFace => "HuggingFace",
                    _ => "provider"
                })
                .Distinct());

            return Results.BadRequest(new { errorKey = "errors.noActivity", provider = providerNames });
        }

        var playerStats = profile.Stats;
        var loginUsername = usedUsername ?? clerkUser.Username;

        // For avatar display, prefer GitHub username if available
        var githubAccount = linkedAccounts.FirstOrDefault(a => a.Provider == OAuthProvider.GitHub);
        var displayUsername = githubAccount?.Username ?? loginUsername;

        // Find or create player in database
        // Check by ClerkId first, then by username, then by provider UserId
        var player = await db.Players.FirstOrDefaultAsync(p =>
            p.ClerkId == clerkUser.ClerkId ||
            p.GitHubLogin.ToLower() == loginUsername.ToLower() ||
            p.GitHubId == profile.UserId);
        if (player == null)
        {
            player = new Player
            {
                Id = Guid.NewGuid(),
                ClerkId = clerkUser.ClerkId,
                GitHubId = profile.UserId,
                GitHubLogin = loginUsername,
                Hp = playerStats.Hp,
                HpMax = playerStats.Hp,
                Dano = playerStats.Dano,
                VelocidadeAtaque = playerStats.VelocidadeAtaque,
                VelocidadeMovimento = playerStats.VelocidadeMovimento,
                Critico = playerStats.Critico,
                Evasao = playerStats.Evasao,
                Armadura = playerStats.Armadura,
                Reino = playerStats.Reino,
                LastGitHubSync = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            db.Players.Add(player);
            await db.SaveChangesAsync();
        }
        else
        {
            // Update stats from provider and ensure ClerkId is set
            if (string.IsNullOrEmpty(player.ClerkId))
            {
                player.ClerkId = clerkUser.ClerkId;
            }
            player.Hp = playerStats.Hp;
            player.HpMax = playerStats.Hp;
            player.Dano = playerStats.Dano;
            player.VelocidadeAtaque = playerStats.VelocidadeAtaque;
            player.VelocidadeMovimento = playerStats.VelocidadeMovimento;
            player.Critico = playerStats.Critico;
            player.Evasao = playerStats.Evasao;
            player.Armadura = playerStats.Armadura;
            player.Reino = playerStats.Reino;
            player.LastGitHubSync = DateTime.UtcNow;
            player.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }

        // Create Shared.PlayerStats for Entity (without Reino)
        var sharedStats = new GitWorld.Shared.PlayerStats(
            playerStats.Hp,
            playerStats.Dano,
            playerStats.VelocidadeAtaque,
            playerStats.VelocidadeMovimento,
            playerStats.Critico,
            playerStats.Evasao,
            playerStats.Armadura
        );

        // Create Entity in World (with player ID, ELO and progression from database)
        // Use displayUsername (GitHub username if available) for avatar display
        var entity = world.AddEntity(player.Id, displayUsername, sharedStats, playerStats.Reino, player.Elo, player.Vitorias, player.Derrotas, player.Level, player.Exp, player.Gold);

        // Load equipped items from database and apply bonuses
        var equippedPlayerItems = await db.PlayerItems
            .Include(pi => pi.Item)
            .Where(pi => pi.PlayerId == player.Id && pi.IsEquipped)
            .Where(pi => pi.ExpiresAt == null || pi.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        var equippedItems = equippedPlayerItems
            .Select(pi => new GitWorld.Api.Core.EquippedItemInfo
            {
                Name = pi.Item.Name,
                Category = pi.Item.Category,
                Tier = pi.Item.Tier
            })
            .ToList();
        entity.EquippedItems = equippedItems;

        // Apply item bonuses to stats
        foreach (var pi in equippedPlayerItems)
        {
            entity.MaxHp += pi.Item.HpBonus;
            entity.Dano += pi.Item.DanoBonus;
            entity.Armadura += pi.Item.ArmaduraBonus;
            entity.Critico += pi.Item.CriticoBonus;
            entity.Evasao += pi.Item.EvasaoBonus;
            entity.VelocidadeAtaque += pi.Item.VelocidadeAtaqueBonus;
            entity.VelocidadeMovimento += pi.Item.VelocidadeMovimentoBonus;
            // Projectile properties (take the highest RangeBonus, last color/size)
            entity.RangeBonus += pi.Item.RangeBonus;
            if (!string.IsNullOrEmpty(pi.Item.ProjectileColor))
                entity.ProjectileColor = pi.Item.ProjectileColor;
            if (pi.Item.ProjectileSize > entity.ProjectileSize)
                entity.ProjectileSize = pi.Item.ProjectileSize;
        }
        entity.CurrentHp = entity.MaxHp; // Full HP on join

        // Load scripting settings
        entity.CustomScript = player.CustomScript;
        entity.ScriptEnabled = player.ScriptEnabled;

        // Auto-move player towards NPC at center (0, 0)
        entity.SetTarget(0, 0);

        // Create player session
        var streamName = $"player-{player.Id}";
        var session = new PlayerSession
        {
            PlayerId = player.Id,
            EntityId = entity.Id,
            GithubLogin = displayUsername,
            JoinedAt = DateTime.UtcNow,
            LastHeartbeat = DateTime.UtcNow,
            StreamName = streamName
        };
        world.RegisterPlayerSession(session);

        // Ensure player stream exists
        _ = Task.Run(async () => await s2Publisher.EnsureStreamExistsAsync(streamName));

        // Generate read token for player's stream
        var readToken = await s2TokenService.GetOrCreatePlayerReadTokenAsync(player);
        await db.SaveChangesAsync();

        // Get initial state of all nearby entities (prevents "Unknown" names on join)
        var initialState = world.GetEntitiesInRange(entity.X, entity.Y, GameConstants.RaioBroadcast)
            .Select(e => new EntityInfo(
                e.Id,
                e.GithubLogin,
                e.X,
                e.Y,
                e.CurrentHp,
                e.MaxHp,
                e.State.ToString().ToLowerInvariant(),
                e.Reino,
                e.Type.ToString().ToLowerInvariant(),
                e.Level,
                e.Exp,
                e.Gold,
                e.Dano,
                e.Critico,
                e.Evasao,
                e.Armadura,
                e.VelocidadeAtaque,
                e.VelocidadeMovimento,
                e.Elo,
                e.Vitorias,
                e.Derrotas
            ))
            .ToList();

        return Results.Ok(new JoinResponse(
            player.Id,
            entity.Id,
            displayUsername,
            playerStats.Reino,
            entity.X,
            entity.Y,
            new StreamInfo(streamName, config.Basin, config.BaseUrl, readToken),
            initialState
        ));
    }
    catch (Exception ex)
    {
        return Results.Problem($"Erro ao entrar no jogo: {ex.Message}");
    }
}).WithName("JoinGame");

// GET /game/player/{id} - Get player info for reconnect
app.MapGet("/game/player/{id}", async (Guid id, World world, AppDbContext db, S2Config config, IS2TokenService s2TokenService) =>
{
    var player = await db.Players.FindAsync(id);
    if (player == null)
        return Results.NotFound(new { error = "Player not found" });

    var session = world.GetPlayerSession(player.GitHubLogin);
    if (session == null)
        return Results.NotFound(new { error = "Player not online", playerId = id });

    var entity = world.GetEntity(session.EntityId);
    if (entity == null)
        return Results.NotFound(new { error = "Entity not found", playerId = id });

    // Generate read token for player's stream
    var readToken = await s2TokenService.GetOrCreatePlayerReadTokenAsync(player);
    await db.SaveChangesAsync();

    return Results.Ok(new JoinResponse(
        player.Id,
        session.EntityId,
        player.GitHubLogin,
        player.Reino,
        entity.X,
        entity.Y,
        new StreamInfo(session.StreamName, config.Basin, config.BaseUrl, readToken)
    ));
}).WithName("GetPlayer");

// POST /game/player/{id}/heartbeat - Update player heartbeat
app.MapPost("/game/player/{id}/heartbeat", async (Guid id, World world, AppDbContext db) =>
{
    var player = await db.Players.FindAsync(id);
    if (player == null)
        return Results.NotFound(new { error = "Player not found" });

    world.UpdateHeartbeat(player.GitHubLogin);
    return Results.Ok(new { playerId = id, timestamp = DateTime.UtcNow });
}).WithName("PlayerHeartbeat");

// POST /game/player/{id}/leave - Leave the game
app.MapPost("/game/player/{id}/leave", async (Guid id, World world, AppDbContext db) =>
{
    var player = await db.Players.FindAsync(id);
    if (player == null)
        return Results.NotFound(new { error = "Player not found" });

    var session = world.GetPlayerSession(player.GitHubLogin);
    if (session != null)
    {
        world.RemoveEntity(session.EntityId);
        world.UnregisterPlayerSession(player.GitHubLogin);
    }

    return Results.Ok(new { playerId = id, leftAt = DateTime.UtcNow });
}).WithName("LeaveGame");

// GET /stream/info - Return basin and stream info
app.MapGet("/stream/info", (S2Config config) =>
{
    // S2 uses basin-specific URLs for reading: https://{basin}.b.aws.s2.dev
    var readBaseUrl = $"https://{config.Basin}.b.aws.s2.dev";
    return Results.Ok(new
    {
        basin = config.Basin,
        baseUrl = config.BaseUrl,
        readBaseUrl = readBaseUrl,
        gameStateStream = config.StreamName
    });
}).WithName("GetStreamInfo");

// CORS preflight for Safari
app.MapMethods("/stream/s2", new[] { "OPTIONS" }, (HttpContext context) =>
{
    context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
    context.Response.Headers.Append("Access-Control-Allow-Methods", "GET, OPTIONS");
    context.Response.Headers.Append("Access-Control-Allow-Headers", "Accept, Content-Type");
    context.Response.Headers.Append("Access-Control-Max-Age", "86400");
    return Results.Ok();
});

// S2 Proxy - Transforms S2 SSE batches into plain text stream (one JSON per line)
// Following woolball pattern: text/plain + WriteAsync bytes + FlushAsync + Close
app.MapGet("/stream/s2", async (HttpContext context, S2Config s2Config, ILogger<Program> logger) =>
{
    // CORS for dev
    context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
    context.Response.Headers.Append("Access-Control-Allow-Methods", "GET, OPTIONS");
    context.Response.Headers.Append("Access-Control-Allow-Headers", "Accept, Content-Type");
    context.Response.Headers.Append("Cache-Control", "no-cache");
    context.Response.Headers.Append("X-Accel-Buffering", "no");

    // Simple text/plain like woolball pattern
    context.Response.ContentType = "text/plain";

    var s2Url = $"https://{s2Config.Basin}.b.aws.s2.dev/v1/streams/{s2Config.StreamName}/records";

    using var httpClient = new HttpClient();
    httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {s2Config.Token}");
    httpClient.DefaultRequestHeaders.Add("Accept", "text/event-stream");
    httpClient.Timeout = Timeout.InfiniteTimeSpan;

    try
    {
        logger.LogInformation("[S2 Proxy] Connecting to S2: {Url}", s2Url);

        using var response = await httpClient.GetAsync(
            s2Url,
            HttpCompletionOption.ResponseHeadersRead,
            context.RequestAborted
        );

        if (!response.IsSuccessStatusCode)
        {
            logger.LogError("[S2 Proxy] S2 returned {StatusCode}", response.StatusCode);
            context.Response.StatusCode = (int)response.StatusCode;
            return;
        }

        logger.LogInformation("[S2 Proxy] Connected! Streaming to client...");

        // Force response headers to be sent immediately (Safari fix)
        await context.Response.StartAsync(context.RequestAborted);
        await context.Response.Body.FlushAsync(context.RequestAborted);

        await using var s2Stream = await response.Content.ReadAsStreamAsync(context.RequestAborted);
        using var reader = new StreamReader(s2Stream) ?? throw new InvalidOperationException("Failed to get S2 stream reader");

        var buffer = new System.Text.StringBuilder();

        while (!reader.EndOfStream! && !context.RequestAborted.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync(context.RequestAborted);
            if (line == null) break;

            if (string.IsNullOrEmpty(line))
            {
                var eventText = buffer.ToString();
                buffer.Clear();

                if (string.IsNullOrWhiteSpace(eventText)) continue;

                string? eventType = null;
                string? eventData = null;

                foreach (var eventLine in eventText.Split('\n'))
                {
                    if (eventLine.StartsWith("event: "))
                        eventType = eventLine[7..];
                    else if (eventLine.StartsWith("data: "))
                        eventData = eventLine[6..];
                    else if (eventLine.StartsWith("data:"))
                        eventData = eventLine[5..];
                }

                if (eventType == "batch" && !string.IsNullOrEmpty(eventData))
                {
                    try
                    {
                        using var doc = System.Text.Json.JsonDocument.Parse(eventData);
                        var records = doc.RootElement.GetProperty("records");

                        foreach (var record in records.EnumerateArray())
                        {
                            var bodyBase64 = record.GetProperty("body").GetString();
                            if (string.IsNullOrEmpty(bodyBase64)) continue;

                            var bodyBytes = Convert.FromBase64String(bodyBase64);
                            var bodyJson = System.Text.Encoding.UTF8.GetString(bodyBytes);

                            // Woolball pattern: bytes + WriteAsync + FlushAsync
                            var bytes = System.Text.Encoding.UTF8.GetBytes(bodyJson + "\n");
                            await context.Response.Body.WriteAsync(bytes, 0, bytes.Length, context.RequestAborted);
                            await context.Response.Body.FlushAsync(context.RequestAborted);
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "[S2 Proxy] Error parsing batch");
                    }
                }
            }
            else
            {
                buffer.AppendLine(line);
            }
        }

        // Close body when done
        context.Response.Body.Close();
    }
    catch (OperationCanceledException)
    {
        logger.LogInformation("[S2 Proxy] Client disconnected");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "[S2 Proxy] Error streaming from S2");
    }
}).WithName("StreamS2Proxy");

// ========== ITEM SYSTEM ENDPOINTS ==========

// GET /shop/items - List all items in the shop
app.MapGet("/shop/items", async (IItemService itemService) =>
{
    var items = await itemService.GetAllItemsAsync();
    return Results.Ok(items.Select(i => new
    {
        i.Id,
        i.Name,
        i.Category,
        i.Tier,
        i.Price,
        stats = new
        {
            dano = i.DanoBonus,
            armadura = i.ArmaduraBonus,
            hp = i.HpBonus,
            critico = i.CriticoBonus,
            evasao = i.EvasaoBonus,
            velocidadeAtaque = i.VelocidadeAtaqueBonus,
            velocidadeMovimento = i.VelocidadeMovimentoBonus
        },
        i.DurationMinutes,
        i.DurationCondition,
        i.VisualDescription
    }));
}).WithName("GetShopItems");

// GET /player/inventory - Get current player's inventory (authenticated)
app.MapGet("/player/inventory", async (HttpContext context, IItemService itemService, AppDbContext db, IClerkJwtValidator clerkValidator) =>
{
    var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
    if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        return Results.Unauthorized();

    var token = authHeader.Substring(7);
    var clerkUser = await clerkValidator.ValidateTokenAsync(token);
    if (clerkUser == null || string.IsNullOrEmpty(clerkUser.Username))
        return Results.Unauthorized();

    var player = await db.Players.FirstOrDefaultAsync(p => p.ClerkId == clerkUser.ClerkId);
    if (player == null)
        return Results.NotFound(new { error = "Player not found" });

    var inventory = await itemService.GetPlayerInventoryAsync(player.Id);
    return Results.Ok(inventory.Select(pi => new
    {
        pi.Id,
        pi.IsEquipped,
        pi.AcquiredAt,
        pi.ExpiresAt,
        item = new
        {
            pi.Item.Id,
            pi.Item.Name,
            pi.Item.Category,
            pi.Item.Tier,
            stats = new
            {
                dano = pi.Item.DanoBonus,
                armadura = pi.Item.ArmaduraBonus,
                hp = pi.Item.HpBonus,
                critico = pi.Item.CriticoBonus,
                evasao = pi.Item.EvasaoBonus,
                velocidadeAtaque = pi.Item.VelocidadeAtaqueBonus,
                velocidadeMovimento = pi.Item.VelocidadeMovimentoBonus
            },
            pi.Item.VisualDescription
        }
    }));
}).WithName("GetPlayerInventory");

// POST /player/items/acquire - Acquire an item (purchase with gold)
app.MapPost("/player/items/acquire", async (HttpContext context, IItemService itemService, AppDbContext db, IClerkJwtValidator clerkValidator, World world, Guid itemId) =>
{
    var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
    if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        return Results.Unauthorized();

    var token = authHeader.Substring(7);
    var clerkUser = await clerkValidator.ValidateTokenAsync(token);
    if (clerkUser == null || string.IsNullOrEmpty(clerkUser.Username))
        return Results.Unauthorized();

    var player = await db.Players.FirstOrDefaultAsync(p => p.ClerkId == clerkUser.ClerkId);
    if (player == null)
        return Results.NotFound(new { error = "Player not found" });

    var (playerItem, error, newGoldBalance) = await itemService.AcquireItemAsync(player.Id, itemId);

    if (error != null)
    {
        return error switch
        {
            "INSUFFICIENT_GOLD" => Results.BadRequest(new { error = "Insufficient gold", code = "INSUFFICIENT_GOLD", currentGold = newGoldBalance }),
            "ITEM_NOT_FOUND" => Results.NotFound(new { error = "Item not found", code = "ITEM_NOT_FOUND" }),
            "PLAYER_NOT_FOUND" => Results.NotFound(new { error = "Player not found", code = "PLAYER_NOT_FOUND" }),
            _ => Results.BadRequest(new { error, code = "UNKNOWN_ERROR" })
        };
    }

    // Update player's gold in the World entity (for real-time sync)
    var entity = world.GetEntity(player.Id);
    if (entity != null)
    {
        entity.Gold = newGoldBalance;
    }

    // Reload with Item included
    var acquired = await db.PlayerItems.Include(pi => pi.Item).FirstAsync(pi => pi.Id == playerItem!.Id);

    return Results.Created($"/player/inventory/{playerItem!.Id}", new
    {
        acquired.Id,
        acquired.IsEquipped,
        acquired.AcquiredAt,
        acquired.ExpiresAt,
        newGoldBalance,
        item = new
        {
            acquired.Item.Id,
            acquired.Item.Name,
            acquired.Item.Category,
            acquired.Item.Tier,
            acquired.Item.Price
        }
    });
}).WithName("AcquireItem");

// POST /player/items/{playerItemId}/equip - Equip an item
app.MapPost("/player/items/{playerItemId}/equip", async (HttpContext context, IItemService itemService, AppDbContext db, IClerkJwtValidator clerkValidator, World world, Guid playerItemId) =>
{
    var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
    if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        return Results.Unauthorized();

    var token = authHeader.Substring(7);
    var clerkUser = await clerkValidator.ValidateTokenAsync(token);
    if (clerkUser == null || string.IsNullOrEmpty(clerkUser.Username))
        return Results.Unauthorized();

    var player = await db.Players.FirstOrDefaultAsync(p => p.ClerkId == clerkUser.ClerkId);
    if (player == null)
        return Results.NotFound(new { error = "Player not found" });

    var success = await itemService.EquipItemAsync(player.Id, playerItemId);
    if (!success)
        return Results.BadRequest(new { error = "Failed to equip item" });

    // Update entity's equipped items and stats in World
    var entity = world.GetEntity(player.Id);
    if (entity != null)
    {
        var equippedItems = await db.PlayerItems
            .Include(pi => pi.Item)
            .Where(pi => pi.PlayerId == player.Id && pi.IsEquipped)
            .Select(pi => new GitWorld.Api.Core.EquippedItemInfo
            {
                Name = pi.Item.Name,
                Category = pi.Item.Category,
                Tier = pi.Item.Tier
            })
            .ToListAsync();
        entity.EquippedItems = equippedItems;

        // Recalculate combat stats: base + bonuses
        var bonuses = await itemService.GetPlayerBonusesAsync(player.Id);
        entity.MaxHp = player.HpMax + bonuses.Hp;
        entity.Dano = player.Dano + bonuses.Dano;
        entity.Armadura = player.Armadura + bonuses.Armadura;
        entity.Critico = player.Critico + bonuses.Critico;
        entity.Evasao = player.Evasao + bonuses.Evasao;
        entity.VelocidadeAtaque = player.VelocidadeAtaque + bonuses.VelocidadeAtaque;
        entity.VelocidadeMovimento = player.VelocidadeMovimento + bonuses.VelocidadeMovimento;
        Console.WriteLine($"[Items] {player.GitHubLogin} stats updated - Dano:{entity.Dano} Arm:{entity.Armadura} Crit:{entity.Critico} Eva:{entity.Evasao}");
    }

    return Results.Ok(new { equipped = true, playerItemId });
}).WithName("EquipItem");

// POST /player/items/{playerItemId}/unequip - Unequip an item
app.MapPost("/player/items/{playerItemId}/unequip", async (HttpContext context, IItemService itemService, AppDbContext db, IClerkJwtValidator clerkValidator, World world, Guid playerItemId) =>
{
    var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
    if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        return Results.Unauthorized();

    var token = authHeader.Substring(7);
    var clerkUser = await clerkValidator.ValidateTokenAsync(token);
    if (clerkUser == null || string.IsNullOrEmpty(clerkUser.Username))
        return Results.Unauthorized();

    var player = await db.Players.FirstOrDefaultAsync(p => p.ClerkId == clerkUser.ClerkId);
    if (player == null)
        return Results.NotFound(new { error = "Player not found" });

    var success = await itemService.UnequipItemAsync(player.Id, playerItemId);
    if (!success)
        return Results.BadRequest(new { error = "Failed to unequip item" });

    // Update entity's equipped items and stats in World
    var entity = world.GetEntity(player.Id);
    if (entity != null)
    {
        var equippedItems = await db.PlayerItems
            .Include(pi => pi.Item)
            .Where(pi => pi.PlayerId == player.Id && pi.IsEquipped)
            .Select(pi => new GitWorld.Api.Core.EquippedItemInfo
            {
                Name = pi.Item.Name,
                Category = pi.Item.Category,
                Tier = pi.Item.Tier
            })
            .ToListAsync();
        entity.EquippedItems = equippedItems;

        // Recalculate combat stats: base + bonuses
        var bonuses = await itemService.GetPlayerBonusesAsync(player.Id);
        entity.MaxHp = player.HpMax + bonuses.Hp;
        entity.Dano = player.Dano + bonuses.Dano;
        entity.Armadura = player.Armadura + bonuses.Armadura;
        entity.Critico = player.Critico + bonuses.Critico;
        entity.Evasao = player.Evasao + bonuses.Evasao;
        entity.VelocidadeAtaque = player.VelocidadeAtaque + bonuses.VelocidadeAtaque;
        entity.VelocidadeMovimento = player.VelocidadeMovimento + bonuses.VelocidadeMovimento;
        Console.WriteLine($"[Items] {player.GitHubLogin} stats updated - Dano:{entity.Dano} Arm:{entity.Armadura} Crit:{entity.Critico} Eva:{entity.Evasao}");
    }

    return Results.Ok(new { equipped = false, playerItemId });
}).WithName("UnequipItem");

// GET /player/bonuses - Get current player's stat bonuses from equipped items
app.MapGet("/player/bonuses", async (HttpContext context, IItemService itemService, AppDbContext db, IClerkJwtValidator clerkValidator) =>
{
    var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
    if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        return Results.Unauthorized();

    var token = authHeader.Substring(7);
    var clerkUser = await clerkValidator.ValidateTokenAsync(token);
    if (clerkUser == null || string.IsNullOrEmpty(clerkUser.Username))
        return Results.Unauthorized();

    var player = await db.Players.FirstOrDefaultAsync(p => p.ClerkId == clerkUser.ClerkId);
    if (player == null)
        return Results.NotFound(new { error = "Player not found" });

    var bonuses = await itemService.GetPlayerBonusesAsync(player.Id);
    return Results.Ok(bonuses);
}).WithName("GetPlayerBonuses");

// DEBUG: Check player_items stats (temporary)
app.MapGet("/debug/player-items-stats", async (AppDbContext db) =>
{
    var totalPlayerItems = await db.PlayerItems.CountAsync();
    var equippedItems = await db.PlayerItems.Where(pi => pi.IsEquipped).CountAsync();
    var playersWithItems = await db.PlayerItems
        .Select(pi => pi.PlayerId)
        .Distinct()
        .CountAsync();

    var playerItemDetails = await db.PlayerItems
        .Include(pi => pi.Item)
        .Include(pi => pi.Player)
        .GroupBy(pi => pi.Player.GitHubLogin)
        .Select(g => new {
            Player = g.Key,
            TotalItems = g.Count(),
            EquippedItems = g.Count(pi => pi.IsEquipped)
        })
        .ToListAsync();

    return Results.Ok(new {
        totalPlayerItems,
        equippedItems,
        playersWithItems,
        playerItemDetails
    });
}).WithName("DebugPlayerItemsStats");

// DEBUG: Check entities in memory with equipped items
app.MapGet("/debug/entities-equipped", (World world) =>
{
    var entities = world.Entities.Where(e => e.Type == GitWorld.Api.Core.EntityType.Player).Select(e => new {
        e.GithubLogin,
        EquippedItemsCount = e.EquippedItems.Count,
        EquippedItems = e.EquippedItems.Select(i => i.Name).ToList()
    }).ToList();

    return Results.Ok(entities);
}).WithName("DebugEntitiesEquipped");

// Admin: Spawn a specific monster type
app.MapPost("/admin/spawn-monster", (HttpContext ctx, World world, string type, float? x, float? y) =>
{
    var adminKey = "gw-admin-2026-x7k9m";
    var providedKey = ctx.Request.Headers["X-Admin-Key"].FirstOrDefault();
    if (providedKey != adminKey) return Results.Unauthorized();

    if (!Enum.TryParse<GitWorld.Api.Core.EntityType>(type, true, out var entityType))
    {
        return Results.BadRequest(new { error = $"Unknown monster type: {type}" });
    }

    var spawnX = x ?? 500 + Random.Shared.Next(-200, 200);
    var spawnY = y ?? 500 + Random.Shared.Next(-200, 200);

    var monster = world.AddMonster(entityType, spawnX, spawnY);
    return Results.Ok(new
    {
        id = monster.Id,
        type = entityType.ToString().ToLowerInvariant(),
        name = monster.GithubLogin,
        x = monster.X,
        y = monster.Y
    });
}).WithName("AdminSpawnMonster");

// Admin: Spawn ALL monster types in a grid
app.MapPost("/admin/spawn-all-monsters", (HttpContext ctx, World world) =>
{
    var adminKey = "gw-admin-2026-x7k9m";
    var providedKey = ctx.Request.Headers["X-Admin-Key"].FirstOrDefault();
    if (providedKey != adminKey) return Results.Unauthorized();

    var allTypes = Enum.GetValues<GitWorld.Api.Core.EntityType>()
        .Where(t => t != GitWorld.Api.Core.EntityType.Player && t != GitWorld.Api.Core.EntityType.NPC && t != GitWorld.Api.Core.EntityType.Neutral)
        .ToList();

    var spawned = new List<object>();
    float startX = 300;
    float startY = 300;
    float spacing = 120;
    int cols = 10;

    for (int i = 0; i < allTypes.Count; i++)
    {
        var type = allTypes[i];
        var col = i % cols;
        var row = i / cols;
        var xPos = startX + col * spacing;
        var yPos = startY + row * spacing;

        try
        {
            var monster = world.AddMonster(type, xPos, yPos);
            spawned.Add(new
            {
                type = type.ToString().ToLowerInvariant(),
                name = monster.GithubLogin,
                x = monster.X,
                y = monster.Y
            });
        }
        catch (Exception ex)
        {
            spawned.Add(new { type = type.ToString(), error = ex.Message });
        }
    }

    return Results.Ok(new { count = spawned.Count, monsters = spawned });
}).WithName("AdminSpawnAllMonsters");

// Admin: Clear all monsters (dead or alive)
app.MapPost("/admin/clear-monsters", (HttpContext ctx, World world, bool? deadOnly) =>
{
    var adminKey = "gw-admin-2026-x7k9m";
    var providedKey = ctx.Request.Headers["X-Admin-Key"].FirstOrDefault();
    if (providedKey != adminKey) return Results.Unauthorized();

    var monsterTypes = Enum.GetValues<GitWorld.Api.Core.EntityType>()
        .Where(t => t != GitWorld.Api.Core.EntityType.Player && t != GitWorld.Api.Core.EntityType.NPC && t != GitWorld.Api.Core.EntityType.Neutral)
        .ToHashSet();

    var monstersToRemove = world.Entities
        .Where(e => monsterTypes.Contains(e.Type))
        .Where(e => deadOnly != true || e.State == GitWorld.Api.Core.EntityState.Dead)
        .Select(e => e.Id)
        .ToList();

    foreach (var id in monstersToRemove)
    {
        world.RemoveEntity(id);
    }

    return Results.Ok(new { removed = monstersToRemove.Count, deadOnly = deadOnly ?? false });
}).WithName("AdminClearMonsters");

// Admin: Spawn fake players for stress testing
app.MapPost("/admin/spawn-fake-players", (HttpContext ctx, World world, int count = 100) =>
{
    var adminKey = "gw-admin-2026-x7k9m";
    var providedKey = ctx.Request.Headers["X-Admin-Key"].FirstOrDefault();
    if (providedKey != adminKey) return Results.Unauthorized();

    var reinos = new[] { "JavaScript", "Python", "Java", "CSharp", "C", "TypeScript", "Go", "Rust", "Ruby", "PHP" };
    var spawned = new List<object>();
    var random = new Random();

    for (int i = 0; i < count; i++)
    {
        var reino = reinos[i % reinos.Length];
        var stats = new GitWorld.Shared.PlayerStats(
            Hp: 100 + random.Next(0, 200),
            Dano: 10 + random.Next(0, 30),
            VelocidadeAtaque: 50 + random.Next(0, 50),
            VelocidadeMovimento: 80 + random.Next(0, 40),
            Critico: 5 + random.Next(0, 15),
            Evasao: 5 + random.Next(0, 10),
            Armadura: 5 + random.Next(0, 15)
        );

        var playerId = Guid.NewGuid();
        var playerName = $"StressTest_{i:D4}";

        var entity = world.AddEntity(playerId, playerName, stats, reino);
        spawned.Add(new { id = entity.Id, name = playerName, reino, x = entity.X, y = entity.Y });
    }

    return Results.Ok(new { count = spawned.Count, players = spawned.Take(10), message = $"Spawned {count} fake players" });
}).WithName("AdminSpawnFakePlayers");

// Admin: Clear all fake stress test players
app.MapPost("/admin/clear-fake-players", (HttpContext ctx, World world) =>
{
    var adminKey = "gw-admin-2026-x7k9m";
    var providedKey = ctx.Request.Headers["X-Admin-Key"].FirstOrDefault();
    if (providedKey != adminKey) return Results.Unauthorized();

    var fakePlayerIds = world.Entities
        .Where(e => e.GithubLogin.StartsWith("StressTest_"))
        .Select(e => e.Id)
        .ToList();

    foreach (var id in fakePlayerIds)
    {
        world.RemoveEntity(id);
    }

    return Results.Ok(new { removed = fakePlayerIds.Count });
}).WithName("AdminClearFakePlayers");

// Admin: Reset all player ELOs
app.MapPost("/admin/reset-elo", async (HttpContext ctx, AppDbContext db, World world) =>
{
    var adminKey = "gw-admin-2026-x7k9m";
    var providedKey = ctx.Request.Headers["X-Admin-Key"].FirstOrDefault();
    if (providedKey != adminKey) return Results.Unauthorized();

    var players = await db.Players.ToListAsync();
    foreach (var player in players)
    {
        player.Elo = 1000;
        player.Vitorias = 0;
        player.Derrotas = 0;
        var entity = world.Entities.FirstOrDefault(e => e.Id == player.Id);
        if (entity != null) { entity.Elo = 1000; entity.Vitorias = 0; entity.Derrotas = 0; }
    }
    await db.SaveChangesAsync();
    return Results.Ok(new { message = $"Reset ELO for {players.Count} players" });
}).WithName("ResetAllElo");

// Temporary: Import players (remove after migration)
app.MapPost("/admin/import-players", async (HttpContext ctx, AppDbContext db) =>
{
    var adminKey = "gw-admin-2026-x7k9m";
    if (ctx.Request.Headers["X-Admin-Key"].FirstOrDefault() != adminKey) return Results.Unauthorized();

    var body = await new StreamReader(ctx.Request.Body).ReadToEndAsync();
    var data = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(body);
    var players = data.GetProperty("players");
    var count = 0;

    foreach (var p in players.EnumerateArray())
    {
        var player = new Player
        {
            Id = Guid.Parse(p.GetProperty("id").GetString()!),
            GitHubId = p.GetProperty("gitHubId").GetInt64(),
            GitHubLogin = p.GetProperty("gitHubLogin").GetString()!,
            ClerkId = p.TryGetProperty("clerkId", out var c) && c.ValueKind != System.Text.Json.JsonValueKind.Null ? c.GetString() : null,
            Hp = p.GetProperty("hp").GetInt32(),
            HpMax = p.GetProperty("hpMax").GetInt32(),
            Dano = p.GetProperty("dano").GetInt32(),
            VelocidadeAtaque = p.GetProperty("velocidadeAtaque").GetInt32(),
            VelocidadeMovimento = p.GetProperty("velocidadeMovimento").GetInt32(),
            Critico = p.GetProperty("critico").GetInt32(),
            Evasao = p.GetProperty("evasao").GetInt32(),
            Armadura = p.GetProperty("armadura").GetInt32(),
            Reino = p.GetProperty("reino").GetString()!,
            X = (float)p.GetProperty("x").GetDouble(),
            Y = (float)p.GetProperty("y").GetDouble(),
            Elo = p.GetProperty("elo").GetInt32(),
            Vitorias = p.GetProperty("vitorias").GetInt32(),
            Derrotas = p.GetProperty("derrotas").GetInt32(),
            Level = p.GetProperty("level").GetInt32(),
            Exp = p.GetProperty("exp").GetInt32(),
            Gold = p.GetProperty("gold").GetInt32(),
            CustomScript = p.TryGetProperty("customScript", out var cs) && cs.ValueKind != System.Text.Json.JsonValueKind.Null ? cs.GetString() : null,
            ScriptEnabled = p.TryGetProperty("scriptEnabled", out var se) && se.GetBoolean(),
            LastGitHubSync = DateTime.UtcNow
        };
        db.Players.Add(player);
        count++;
    }
    await db.SaveChangesAsync();
    return Results.Ok(new { imported = count });
}).WithName("AdminImportPlayers");

// ============================================================================
// SCRIPTING ENDPOINTS
// ============================================================================

// Get player's current script
app.MapGet("/player/script", async (HttpContext context, AppDbContext db, IClerkJwtValidator clerkValidator) =>
{
    var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
    if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        return Results.Unauthorized();

    var token = authHeader.Substring(7);
    var clerkUser = await clerkValidator.ValidateTokenAsync(token);
    if (clerkUser == null || string.IsNullOrEmpty(clerkUser.Username))
        return Results.Unauthorized();

    var player = await db.Players.FirstOrDefaultAsync(p => p.ClerkId == clerkUser.ClerkId);
    if (player == null) return Results.NotFound(new { error = "Player not found" });

    return Results.Ok(new
    {
        script = player.CustomScript ?? DefaultScript.Code,
        enabled = player.ScriptEnabled,
        updatedAt = player.ScriptUpdatedAt,
        isDefault = string.IsNullOrEmpty(player.CustomScript)
    });
}).WithName("GetPlayerScript");

// Save player's script
app.MapPost("/player/script", async (HttpContext context, AppDbContext db, IClerkJwtValidator clerkValidator, ScriptExecutor scriptExecutor, World world, ScriptRequest request) =>
{
    var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
    if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        return Results.Unauthorized();

    var token = authHeader.Substring(7);
    var clerkUser = await clerkValidator.ValidateTokenAsync(token);
    if (clerkUser == null || string.IsNullOrEmpty(clerkUser.Username))
        return Results.Unauthorized();

    var player = await db.Players.FirstOrDefaultAsync(p => p.ClerkId == clerkUser.ClerkId);
    if (player == null) return Results.NotFound(new { error = "Player not found" });

    // Validate script syntax
    var (isValid, error) = scriptExecutor.ValidateScript(request.Script);
    if (!isValid)
    {
        return Results.BadRequest(new { error = error });
    }

    // Save script to database
    player.CustomScript = request.Script;
    player.ScriptUpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();

    // Update entity in memory (if player is online)
    var entity = world.GetEntity(player.Id);
    if (entity != null)
    {
        entity.CustomScript = request.Script;
    }

    // Clear script executor cache so new script takes effect
    scriptExecutor.InvalidateCache(player.Id);

    return Results.Ok(new
    {
        message = "Script saved successfully",
        updatedAt = player.ScriptUpdatedAt
    });
}).WithName("SavePlayerScript");

// Validate a script without saving
app.MapPost("/player/script/validate", (ScriptExecutor scriptExecutor, ScriptRequest request) =>
{
    var (isValid, error) = scriptExecutor.ValidateScript(request.Script);
    return Results.Ok(new { isValid, error });
}).WithName("ValidateScript");

// Enable/disable custom script
app.MapPost("/player/script/toggle", async (HttpContext context, AppDbContext db, IClerkJwtValidator clerkValidator, ScriptExecutor scriptExecutor, World world, ScriptToggleRequest request) =>
{
    var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
    if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        return Results.Unauthorized();

    var token = authHeader.Substring(7);
    var clerkUser = await clerkValidator.ValidateTokenAsync(token);
    if (clerkUser == null || string.IsNullOrEmpty(clerkUser.Username))
        return Results.Unauthorized();

    var player = await db.Players.FirstOrDefaultAsync(p => p.ClerkId == clerkUser.ClerkId);
    if (player == null) return Results.NotFound(new { error = "Player not found" });

    // If enabling, validate that script is valid first
    if (request.Enabled && !string.IsNullOrEmpty(player.CustomScript))
    {
        var (isValid, error) = scriptExecutor.ValidateScript(player.CustomScript);
        if (!isValid)
        {
            return Results.BadRequest(new { error = $"Cannot enable invalid script: {error}" });
        }
    }

    player.ScriptEnabled = request.Enabled;
    await db.SaveChangesAsync();

    // Update entity in memory (if player is online)
    var entity = world.GetEntity(player.Id);
    if (entity != null)
    {
        entity.ScriptEnabled = request.Enabled;
    }

    // Reset errors when toggling
    scriptExecutor.ResetErrors(player.Id);

    return Results.Ok(new
    {
        enabled = player.ScriptEnabled,
        message = request.Enabled ? "Custom script enabled" : "Default behavior enabled"
    });
}).WithName("TogglePlayerScript");

// Get script status (errors, disabled, etc)
app.MapGet("/player/script/status", async (HttpContext context, AppDbContext db, IClerkJwtValidator clerkValidator, ScriptExecutor scriptExecutor) =>
{
    var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
    if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        return Results.Unauthorized();

    var token = authHeader.Substring(7);
    var clerkUser = await clerkValidator.ValidateTokenAsync(token);
    if (clerkUser == null || string.IsNullOrEmpty(clerkUser.Username))
        return Results.Unauthorized();

    var player = await db.Players.FirstOrDefaultAsync(p => p.ClerkId == clerkUser.ClerkId);
    if (player == null) return Results.NotFound(new { error = "Player not found" });

    var errorCount = scriptExecutor.GetErrorCount(player.Id);
    var isDisabled = scriptExecutor.IsDisabled(player.Id);

    return Results.Ok(new
    {
        enabled = player.ScriptEnabled,
        hasCustomScript = !string.IsNullOrEmpty(player.CustomScript),
        errorCount,
        isDisabled,
        disabledReason = isDisabled ? "Too many errors (max 10)" : null
    });
}).WithName("GetScriptStatus");

// Reset script to default
app.MapPost("/player/script/reset", async (HttpContext context, AppDbContext db, IClerkJwtValidator clerkValidator, ScriptExecutor scriptExecutor, World world) =>
{
    var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
    if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        return Results.Unauthorized();

    var token = authHeader.Substring(7);
    var clerkUser = await clerkValidator.ValidateTokenAsync(token);
    if (clerkUser == null || string.IsNullOrEmpty(clerkUser.Username))
        return Results.Unauthorized();

    var player = await db.Players.FirstOrDefaultAsync(p => p.ClerkId == clerkUser.ClerkId);
    if (player == null) return Results.NotFound(new { error = "Player not found" });

    player.CustomScript = null;
    player.ScriptEnabled = false;
    player.ScriptUpdatedAt = null;
    await db.SaveChangesAsync();

    // Update entity in memory (if player is online)
    var entity = world.GetEntity(player.Id);
    if (entity != null)
    {
        entity.CustomScript = null;
        entity.ScriptEnabled = false;
    }

    scriptExecutor.InvalidateCache(player.Id);
    scriptExecutor.ResetErrors(player.Id);

    return Results.Ok(new { message = "Script reset to default" });
}).WithName("ResetPlayerScript");

// Get default script code (for reference)
app.MapGet("/player/script/default", () =>
{
    return Results.Ok(new { script = DefaultScript.Code });
}).WithName("GetDefaultScript");

// Get script API documentation
app.MapGet("/player/script/docs", () =>
{
    return Results.Ok(new
    {
        variables = new
        {
            self = "Your player's data (id, x, y, hp, maxHp, level, elo, dano, etc.)",
            enemies = "Array of enemies in vision range",
            allies = "Array of allies in vision range",
            monsters = "Array of monsters in vision range",
            players = "Array of other players in vision range",
            @event = "Current event info { active, type, monstersRemaining }",
            tick = "Current server tick",
            attackRange = "Attack range constant"
        },
        functions = new
        {
            moveTo = "moveTo(x, y) - Move to coordinates",
            moveToEntity = "moveToEntity(entity) - Move towards entity",
            attack = "attack(entity) - Attack entity",
            attackNearest = "attackNearest() - Attack nearest enemy",
            flee = "flee() - Run away from enemies",
            stop = "stop() - Stop all actions",
            getDistance = "getDistance(entity) - Get distance to entity",
            isInAttackRange = "isInAttackRange(entity) - Check if in range",
            getNearestEnemy = "getNearestEnemy() - Get nearest enemy",
            getNearestAlly = "getNearestAlly() - Get nearest ally",
            getNearestMonster = "getNearestMonster() - Get nearest monster",
            getNearestPlayer = "getNearestPlayer() - Get nearest player",
            getEntitiesInRange = "getEntitiesInRange(range) - Get entities in range",
            log = "log(message) - Debug log (max 10/tick)",
            random = "random() - Random 0-1",
            randomRange = "randomRange(min, max) - Random in range"
        },
        entityProperties = new[] { "id", "name", "type", "x", "y", "hp", "maxHp", "level", "elo", "dano", "armadura", "critico", "evasao", "velocidadeAtaque", "velocidadeMovimento", "estado", "reino", "isMonster", "isPlayer", "isAlly", "isEnemy" },
        example = DefaultScript.Code
    });
}).WithName("GetScriptDocs");

// Ensure graceful shutdown
var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
lifetime.ApplicationStopping.Register(() =>
{
    Console.WriteLine("[GameLoop] Stopping...");
    gameLoop.Stop();
    gameLoop.Dispose();
});

app.Run();
