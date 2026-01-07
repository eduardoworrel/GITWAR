using GitWorld.Api.Auth;
using GitWorld.Api.Core;
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

// Memory Cache (para GitHub)
builder.Services.AddMemoryCache();

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
builder.Services.AddSingleton<GameLoop>();
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

    // Seed items if none exist
    if (!db.Items.Any())
    {
        var items = new List<Item>
        {
            // Notebooks
            new() { Id = Guid.NewGuid(), Name = "ThinkPad X1", Category = "Notebook", Tier = "B", DanoBonus = 5, VelocidadeAtaqueBonus = 3 },
            new() { Id = Guid.NewGuid(), Name = "MacBook Pro M3", Category = "Notebook", Tier = "A", DanoBonus = 10, CriticoBonus = 5, VelocidadeAtaqueBonus = 5 },
            new() { Id = Guid.NewGuid(), Name = "Alienware X17", Category = "Notebook", Tier = "S", DanoBonus = 20, CriticoBonus = 10, VelocidadeAtaqueBonus = 8 },
            new() { Id = Guid.NewGuid(), Name = "Razer Blade 18", Category = "Notebook", Tier = "S", DanoBonus = 25, CriticoBonus = 12, VelocidadeAtaqueBonus = 10, VisualDescription = "RGB gaming beast" },
            new() { Id = Guid.NewGuid(), Name = "ASUS ROG Zephyrus", Category = "Notebook", Tier = "A", DanoBonus = 18, CriticoBonus = 8, VelocidadeAtaqueBonus = 7, VisualDescription = "Slim powerhouse" },

            // Processadores
            new() { Id = Guid.NewGuid(), Name = "Intel i5", Category = "Processador", Tier = "C", VelocidadeAtaqueBonus = 5 },
            new() { Id = Guid.NewGuid(), Name = "AMD Ryzen 7", Category = "Processador", Tier = "B", VelocidadeAtaqueBonus = 10, DanoBonus = 3 },
            new() { Id = Guid.NewGuid(), Name = "Apple M3 Max", Category = "Processador", Tier = "A", VelocidadeAtaqueBonus = 15, DanoBonus = 5, CriticoBonus = 3 },
            new() { Id = Guid.NewGuid(), Name = "AMD Ryzen 9 7950X3D", Category = "Processador", Tier = "S", VelocidadeAtaqueBonus = 25, DanoBonus = 15, CriticoBonus = 10, VisualDescription = "3D V-Cache monster" },
            new() { Id = Guid.NewGuid(), Name = "Intel i9-14900K", Category = "Processador", Tier = "S", VelocidadeAtaqueBonus = 22, DanoBonus = 18, CriticoBonus = 8, VisualDescription = "24 cores of power" },

            // Café - incluindo marcas brasileiras
            new() { Id = Guid.NewGuid(), Name = "Café Solúvel", Category = "Café", Tier = "F", VelocidadeAtaqueBonus = 2, DurationMinutes = 30 },
            new() { Id = Guid.NewGuid(), Name = "Espresso", Category = "Café", Tier = "D", VelocidadeAtaqueBonus = 5, CriticoBonus = 2, DurationMinutes = 60 },
            new() { Id = Guid.NewGuid(), Name = "Cold Brew Artesanal", Category = "Café", Tier = "B", VelocidadeAtaqueBonus = 10, CriticoBonus = 5, DanoBonus = 3, DurationMinutes = 120 },
            new() { Id = Guid.NewGuid(), Name = "Café Pilão", Category = "Café", Tier = "C", VelocidadeAtaqueBonus = 6, DanoBonus = 2, DurationMinutes = 45, VisualDescription = "Tradição brasileira" },
            new() { Id = Guid.NewGuid(), Name = "3 Corações", Category = "Café", Tier = "C", VelocidadeAtaqueBonus = 7, CriticoBonus = 3, DurationMinutes = 50, VisualDescription = "Feito com amor" },
            new() { Id = Guid.NewGuid(), Name = "Café Orfeu", Category = "Café", Tier = "A", VelocidadeAtaqueBonus = 12, CriticoBonus = 6, DanoBonus = 5, DurationMinutes = 90, VisualDescription = "Premium brasileiro" },
            new() { Id = Guid.NewGuid(), Name = "Café do Ponto", Category = "Café", Tier = "D", VelocidadeAtaqueBonus = 4, DurationMinutes = 40, VisualDescription = "Clássico paulista" },

            // Energéticos
            new() { Id = Guid.NewGuid(), Name = "Monster Energy", Category = "Energético", Tier = "D", VelocidadeMovimentoBonus = 5, VelocidadeAtaqueBonus = 3, DurationMinutes = 45 },
            new() { Id = Guid.NewGuid(), Name = "Red Bull", Category = "Energético", Tier = "C", VelocidadeMovimentoBonus = 8, VelocidadeAtaqueBonus = 5, DurationMinutes = 60 },
            new() { Id = Guid.NewGuid(), Name = "G Fuel", Category = "Energético", Tier = "B", VelocidadeMovimentoBonus = 12, VelocidadeAtaqueBonus = 8, CriticoBonus = 3, DurationMinutes = 90 },

            // Teclados - incluindo split e hype
            new() { Id = Guid.NewGuid(), Name = "Teclado Membrana", Category = "Teclado", Tier = "F", VelocidadeAtaqueBonus = 1 },
            new() { Id = Guid.NewGuid(), Name = "Keychron K2", Category = "Teclado", Tier = "C", VelocidadeAtaqueBonus = 5, DanoBonus = 2 },
            new() { Id = Guid.NewGuid(), Name = "Custom Mechanical", Category = "Teclado", Tier = "A", VelocidadeAtaqueBonus = 12, DanoBonus = 5, CriticoBonus = 3 },
            new() { Id = Guid.NewGuid(), Name = "ZSA Moonlander", Category = "Teclado", Tier = "S", VelocidadeAtaqueBonus = 18, DanoBonus = 8, CriticoBonus = 8, EvasaoBonus = 5, VisualDescription = "Split ergo masterpiece" },
            new() { Id = Guid.NewGuid(), Name = "Wooting 60HE", Category = "Teclado", Tier = "S", VelocidadeAtaqueBonus = 20, DanoBonus = 10, CriticoBonus = 5, VisualDescription = "Analog switches pro" },
            new() { Id = Guid.NewGuid(), Name = "Ducky One 3", Category = "Teclado", Tier = "A", VelocidadeAtaqueBonus = 14, DanoBonus = 6, CriticoBonus = 4, VisualDescription = "Hot-swap legend" },

            // Fones - incluindo hype
            new() { Id = Guid.NewGuid(), Name = "Fone Genérico", Category = "Fone", Tier = "F", EvasaoBonus = 1 },
            new() { Id = Guid.NewGuid(), Name = "AirPods Pro", Category = "Fone", Tier = "B", EvasaoBonus = 5, VelocidadeMovimentoBonus = 3 },
            new() { Id = Guid.NewGuid(), Name = "Sony WH-1000XM5", Category = "Fone", Tier = "A", EvasaoBonus = 10, VelocidadeMovimentoBonus = 5, ArmaduraBonus = 3 },
            new() { Id = Guid.NewGuid(), Name = "Bose QuietComfort Ultra", Category = "Fone", Tier = "A", EvasaoBonus = 12, ArmaduraBonus = 5, HpBonus = 10, VisualDescription = "Silence is golden" },
            new() { Id = Guid.NewGuid(), Name = "Sennheiser HD 800 S", Category = "Fone", Tier = "S", EvasaoBonus = 15, CriticoBonus = 8, DanoBonus = 5, VisualDescription = "Audiophile endgame" },
            new() { Id = Guid.NewGuid(), Name = "Beyerdynamic DT 1990", Category = "Fone", Tier = "S", EvasaoBonus = 12, CriticoBonus = 10, DanoBonus = 8, VisualDescription = "German precision" },

            // Camisetas
            new() { Id = Guid.NewGuid(), Name = "Camiseta Básica", Category = "Camiseta", Tier = "F", ArmaduraBonus = 1 },
            new() { Id = Guid.NewGuid(), Name = "Hoodie Tech", Category = "Camiseta", Tier = "C", ArmaduraBonus = 5, HpBonus = 10 },
            new() { Id = Guid.NewGuid(), Name = "Moletom GitHub", Category = "Camiseta", Tier = "B", ArmaduraBonus = 8, HpBonus = 20, EvasaoBonus = 2 },

            // IDEs - todas as famosas
            new() { Id = Guid.NewGuid(), Name = "Notepad", Category = "IDE", Tier = "F", DanoBonus = -5, EvasaoBonus = 10, VisualDescription = "Chad energy" },
            new() { Id = Guid.NewGuid(), Name = "VS Code", Category = "IDE", Tier = "B", DanoBonus = 8, VelocidadeAtaqueBonus = 5 },
            new() { Id = Guid.NewGuid(), Name = "Neovim", Category = "IDE", Tier = "A", DanoBonus = 15, VelocidadeAtaqueBonus = 10, CriticoBonus = 5, VisualDescription = "btw I use vim" },
            new() { Id = Guid.NewGuid(), Name = "JetBrains Fleet", Category = "IDE", Tier = "S", DanoBonus = 20, VelocidadeAtaqueBonus = 12, CriticoBonus = 8, ArmaduraBonus = 5 },
            new() { Id = Guid.NewGuid(), Name = "IntelliJ IDEA", Category = "IDE", Tier = "S", DanoBonus = 22, VelocidadeAtaqueBonus = 10, CriticoBonus = 10, ArmaduraBonus = 8, VisualDescription = "Java god mode" },
            new() { Id = Guid.NewGuid(), Name = "PyCharm", Category = "IDE", Tier = "A", DanoBonus = 16, VelocidadeAtaqueBonus = 8, CriticoBonus = 6, VisualDescription = "Python paradise" },
            new() { Id = Guid.NewGuid(), Name = "WebStorm", Category = "IDE", Tier = "A", DanoBonus = 14, VelocidadeAtaqueBonus = 12, CriticoBonus = 5, VisualDescription = "JS/TS mastery" },
            new() { Id = Guid.NewGuid(), Name = "Sublime Text", Category = "IDE", Tier = "B", DanoBonus = 10, VelocidadeAtaqueBonus = 15, VisualDescription = "Speed demon" },
            new() { Id = Guid.NewGuid(), Name = "Vim", Category = "IDE", Tier = "A", DanoBonus = 18, VelocidadeAtaqueBonus = 8, CriticoBonus = 12, EvasaoBonus = 5, VisualDescription = "The OG" },
            new() { Id = Guid.NewGuid(), Name = "Emacs", Category = "IDE", Tier = "A", DanoBonus = 12, ArmaduraBonus = 15, HpBonus = 20, VisualDescription = "OS disguised as editor" },
            new() { Id = Guid.NewGuid(), Name = "Eclipse", Category = "IDE", Tier = "C", DanoBonus = 5, ArmaduraBonus = 8, HpBonus = 15, VisualDescription = "Enterprise classic" },
            new() { Id = Guid.NewGuid(), Name = "Cursor", Category = "IDE", Tier = "S", DanoBonus = 25, VelocidadeAtaqueBonus = 15, CriticoBonus = 12, VisualDescription = "AI-powered coding" },
            new() { Id = Guid.NewGuid(), Name = "Zed", Category = "IDE", Tier = "A", DanoBonus = 12, VelocidadeAtaqueBonus = 20, CriticoBonus = 5, VisualDescription = "Blazingly fast" },
            new() { Id = Guid.NewGuid(), Name = "Rider", Category = "IDE", Tier = "S", DanoBonus = 20, VelocidadeAtaqueBonus = 10, ArmaduraBonus = 10, CriticoBonus = 8, VisualDescription = "C# excellence" },

            // Comidas
            new() { Id = Guid.NewGuid(), Name = "Miojo", Category = "Comida", Tier = "F", HpBonus = 5, DurationMinutes = 30 },
            new() { Id = Guid.NewGuid(), Name = "Pizza", Category = "Comida", Tier = "D", HpBonus = 15, ArmaduraBonus = 2, DurationMinutes = 60 },
            new() { Id = Guid.NewGuid(), Name = "Sushi Premium", Category = "Comida", Tier = "A", HpBonus = 30, ArmaduraBonus = 5, CriticoBonus = 3, DurationMinutes = 120 },

            // Pets
            new() { Id = Guid.NewGuid(), Name = "Rubber Duck", Category = "Pet", Tier = "C", CriticoBonus = 5, VisualDescription = "Debug companion" },
            new() { Id = Guid.NewGuid(), Name = "Gato Preto", Category = "Pet", Tier = "B", EvasaoBonus = 8, CriticoBonus = 5, VisualDescription = "Bad luck for enemies" },
            new() { Id = Guid.NewGuid(), Name = "Octocat", Category = "Pet", Tier = "S", DanoBonus = 10, CriticoBonus = 10, EvasaoBonus = 10, VisualDescription = "GitHub mascot" },

            // Acessórios
            new() { Id = Guid.NewGuid(), Name = "Mousepad RGB", Category = "Acessório", Tier = "D", VelocidadeAtaqueBonus = 3 },
            new() { Id = Guid.NewGuid(), Name = "Standing Desk", Category = "Acessório", Tier = "B", HpBonus = 20, VelocidadeMovimentoBonus = 5 },
            new() { Id = Guid.NewGuid(), Name = "Herman Miller", Category = "Acessório", Tier = "S", HpBonus = 50, ArmaduraBonus = 10, EvasaoBonus = 5, VisualDescription = "Ergonomic throne" },
        };

        db.Items.AddRange(items);
        db.SaveChanges();
        Console.WriteLine($"[Database] Seeded {items.Count} items");
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

    // Broadcast game state every 2 ticks (~100ms)
    if (tick % 2 == 0)
    {
        // Use GetEventsSince instead of DrainEvents to not interfere with SSE clients
        var combatEvents = gameLoop.CombatSystem.EventQueue.GetEventsSince(lastS2BroadcastTick);
        var activeEvent = gameLoop.EventSystem.CurrentEvent;
        lastS2BroadcastTick = tick;
        _ = Task.Run(() => s2Publisher.BroadcastGameStateAsync(tick, world.Entities, combatEvents, activeEvent));

        // Periodically clean old events (keep last 10 seconds = 200 ticks)
        if (tick % 200 == 0)
        {
            gameLoop.CombatSystem.EventQueue.ClearOlderThan(tick - 200);
        }
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
        var stats = new GitWorld.Shared.PlayerStats(
            player.HpMax,
            player.Dano,
            player.VelocidadeAtaque,
            player.VelocidadeMovimento,
            player.Critico,
            player.Evasao,
            player.Armadura
        );

        // Restore entity at last known position
        var entity = world.AddEntity(
            player.Id,
            player.GitHubLogin,
            stats,
            player.Reino,
            player.Elo,
            player.Vitorias,
            player.Derrotas
        );

        // Override spawn position with saved position
        entity.X = player.X;
        entity.Y = player.Y;
        entity.CurrentHp = player.Hp > 0 ? player.Hp : player.HpMax;

        // Unstick if player is inside a collision zone (e.g., after map change)
        world.UnstickEntity(entity);

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

        Console.WriteLine($"[Startup] Restored {player.GitHubLogin} at ({player.X:F0}, {player.Y:F0}) ELO:{player.Elo}");
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
            State = e.State.ToString(),
            Type = e.Type.ToString()
        })
    });
}).WithName("GetGameState");

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

// POST /game/join - Join the game (authenticated via Clerk)
app.MapPost("/game/join", async (HttpContext context, World world, IStatsService statsService, AppDbContext db, S2Config config, IClerkJwtValidator clerkValidator) =>
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

                    return Results.Ok(new JoinResponse(
                        existingSession.PlayerId,
                        existingSession.EntityId,
                        existingSession.GithubLogin,
                        existingEntity.Reino,
                        existingEntity.X,
                        existingEntity.Y,
                        new StreamInfo(existingSession.StreamName, config.Basin, config.BaseUrl)
                    ));
                }
            }
        }

        // Fetch stats from the appropriate provider (GitHub, GitLab, HuggingFace)
        var profile = await statsService.GetPlayerProfileAsync(clerkUser.Provider, clerkUser.Username);

        // Validate minimum activity (at least 1 repo/project OR 1 commit)
        if (!profile.HasMinimumActivity)
        {
            var providerName = clerkUser.Provider switch
            {
                OAuthProvider.GitHub => "GitHub",
                OAuthProvider.GitLab => "GitLab",
                OAuthProvider.HuggingFace => "HuggingFace",
                _ => "provider"
            };
            return Results.BadRequest(new { errorKey = "errors.noActivity", provider = providerName });
        }

        var playerStats = profile.Stats;

        // Find or create player in database (GitHubLogin is used generically for all providers)
        var player = await db.Players.FirstOrDefaultAsync(p => p.GitHubLogin.ToLower() == clerkUser.Username.ToLower());
        if (player == null)
        {
            player = new Player
            {
                Id = Guid.NewGuid(),
                GitHubId = profile.UserId,
                GitHubLogin = clerkUser.Username,
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
            // Update stats from provider
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

        // Create Entity in World (with player ID and ELO from database)
        var entity = world.AddEntity(player.Id, clerkUser.Username, sharedStats, playerStats.Reino, player.Elo, player.Vitorias, player.Derrotas);

        // Load equipped items from database
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

        // Auto-move player towards NPC at center (0, 0)
        entity.SetTarget(0, 0);

        // Create player session
        var streamName = $"player-{player.Id}";
        var session = new PlayerSession
        {
            PlayerId = player.Id,
            EntityId = entity.Id,
            GithubLogin = clerkUser.Username,
            JoinedAt = DateTime.UtcNow,
            LastHeartbeat = DateTime.UtcNow,
            StreamName = streamName
        };
        world.RegisterPlayerSession(session);

        // Ensure player stream exists
        _ = Task.Run(async () => await s2Publisher.EnsureStreamExistsAsync(streamName));

        return Results.Ok(new JoinResponse(
            player.Id,
            entity.Id,
            clerkUser.Username,
            playerStats.Reino,
            entity.X,
            entity.Y,
            new StreamInfo(streamName, config.Basin, config.BaseUrl)
        ));
    }
    catch (Exception ex)
    {
        return Results.Problem($"Erro ao entrar no jogo: {ex.Message}");
    }
}).WithName("JoinGame");

// GET /game/player/{id} - Get player info for reconnect
app.MapGet("/game/player/{id}", async (Guid id, World world, AppDbContext db, S2Config config) =>
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

    return Results.Ok(new JoinResponse(
        player.Id,
        session.EntityId,
        player.GitHubLogin,
        player.Reino,
        entity.X,
        entity.Y,
        new StreamInfo(session.StreamName, config.Basin, config.BaseUrl)
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

    var player = await db.Players.FirstOrDefaultAsync(p => p.GitHubLogin.ToLower() == clerkUser.Username.ToLower());
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

// POST /player/items/acquire - Acquire an item
app.MapPost("/player/items/acquire", async (HttpContext context, IItemService itemService, AppDbContext db, IClerkJwtValidator clerkValidator, Guid itemId) =>
{
    var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
    if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        return Results.Unauthorized();

    var token = authHeader.Substring(7);
    var clerkUser = await clerkValidator.ValidateTokenAsync(token);
    if (clerkUser == null || string.IsNullOrEmpty(clerkUser.Username))
        return Results.Unauthorized();

    var player = await db.Players.FirstOrDefaultAsync(p => p.GitHubLogin.ToLower() == clerkUser.Username.ToLower());
    if (player == null)
        return Results.NotFound(new { error = "Player not found" });

    var playerItem = await itemService.AcquireItemAsync(player.Id, itemId);
    if (playerItem == null)
        return Results.NotFound(new { error = "Item not found" });

    // Reload with Item included
    var acquired = await db.PlayerItems.Include(pi => pi.Item).FirstAsync(pi => pi.Id == playerItem.Id);

    return Results.Created($"/player/inventory/{playerItem.Id}", new
    {
        acquired.Id,
        acquired.IsEquipped,
        acquired.AcquiredAt,
        acquired.ExpiresAt,
        item = new
        {
            acquired.Item.Id,
            acquired.Item.Name,
            acquired.Item.Category,
            acquired.Item.Tier
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

    var player = await db.Players.FirstOrDefaultAsync(p => p.GitHubLogin.ToLower() == clerkUser.Username.ToLower());
    if (player == null)
        return Results.NotFound(new { error = "Player not found" });

    var success = await itemService.EquipItemAsync(player.Id, playerItemId);
    if (!success)
        return Results.BadRequest(new { error = "Failed to equip item" });

    // Update entity's equipped items in World
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

    var player = await db.Players.FirstOrDefaultAsync(p => p.GitHubLogin.ToLower() == clerkUser.Username.ToLower());
    if (player == null)
        return Results.NotFound(new { error = "Player not found" });

    var success = await itemService.UnequipItemAsync(player.Id, playerItemId);
    if (!success)
        return Results.BadRequest(new { error = "Failed to unequip item" });

    // Update entity's equipped items in World
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

    var player = await db.Players.FirstOrDefaultAsync(p => p.GitHubLogin.ToLower() == clerkUser.Username.ToLower());
    if (player == null)
        return Results.NotFound(new { error = "Player not found" });

    var bonuses = await itemService.GetPlayerBonusesAsync(player.Id);
    return Results.Ok(bonuses);
}).WithName("GetPlayerBonuses");

// Ensure graceful shutdown
var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
lifetime.ApplicationStopping.Register(() =>
{
    Console.WriteLine("[GameLoop] Stopping...");
    gameLoop.Stop();
    gameLoop.Dispose();
});

app.Run();
