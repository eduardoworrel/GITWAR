namespace GitWorld.Shared;

public static class GameConstants
{
    public const int TickRateMs = 50;        // 20 ticks/s
    public const float RangeVisao = 300f;    // unidades
    public const float RangeAtaque = 30f;    // unidades
    public const int TempoRespawnMs = 5000;  // 5 segundos
    public const float VelocidadeBase = 100f; // unidades/s (dobrado)

    public const int MapaWidth = 5000;    // Mesa de escritório
    public const int MapaHeight = 3000;

    // Spawn único - área livre da mesa (entre teclado e borda inferior)
    public const float SpawnX = 1800f;
    public const float SpawnY = 2300f;

    public const float RaioBroadcast = 500f; // raio de visao do cliente

    // Collision zones for desk objects (X, Y, Width, Height)
    // These objects block player movement
    public static readonly (float X, float Y, float Width, float Height)[] DeskCollisionZones = new[]
    {
        // Monitor base (center: 2500, 600)
        (2500f - 150f, 600f - 100f, 300f, 200f),
        // Keyboard (center: 2500, 1400)
        (2500f - 275f, 1400f - 90f, 550f, 180f),
        // Mouse only (center: 3050, 1500) - mousepad is walkable
        (3050f - 40f, 1500f - 50f, 80f, 100f),
        // Coffee cup (center: 3300, 500)
        (3300f - 50f, 500f - 50f, 100f, 100f),
        // Plant pot (center: 300, 600)
        (300f - 60f, 600f - 60f, 120f, 120f),
        // Pen holder (center: 600, 400)
        (600f - 50f, 400f - 50f, 100f, 100f),
        // Paper stack (center: 400, 1800)
        (400f - 110f, 1800f - 150f, 220f, 300f),
        // Headphones (center: 3700, 1700)
        (3700f - 100f, 1700f - 100f, 200f, 200f),
    };

    // Combat constants
    public const int AttackCooldownTicks = 60;   // 3 seconds at 50ms/tick (base lenta)
    public const float CriticalMultiplier = 1.5f;
    public const int MinDamage = 1;
    public const float NpcPatrolRadius = 200f;
    public const float NpcChaseDistance = 500f;

    // ELO protection: players ignore targets with ELO this much below theirs
    public const int EloProtectionThreshold = 200;
    // ELO danger: players avoid targets with ELO this much above theirs (suicide prevention)
    public const int EloDangerThreshold = 300;

    // Event System - Timing (in ticks, 20 ticks = 1 second)
    public const int BugEventIntervalTicks = 20 * 60;                  // 1 minuto
    public const int IntermediateEventIntervalTicks = 20 * 60 * 5;     // 5 minutos
    public const int UnexplainedBugEventIntervalTicks = 20 * 60 * 60;  // 1 hora
    public const int BossEventHour = 18;                               // 18h horário do servidor

    // Event System - Spawn quantities (per player)
    public const int BugSpawnMin = 5;
    public const int BugSpawnMax = 10;
    public const int AIHallucinationSpawnMin = 2;
    public const int AIHallucinationSpawnMax = 4;
    public const int ManagerSpawnMin = 1;
    public const int ManagerSpawnMax = 2;

    // Event System - ELO rewards
    public const int BugEloReward = 1;
    public const int AIHallucinationEloReward = 3;
    public const int ManagerEloReward = 3;
    public const int BossEloReward = 10;
    public const int UnexplainedBugEloReward = 15;

    // Monster aggro range - how far monsters detect and chase players
    // Set to cover entire map so UnexplainedBug hunts from anywhere
    public const float MonsterAggroRange = 6000f;
}

public static class ReinoCores
{
    public static readonly Dictionary<string, string> Cores = new()
    {
        ["Python"] = "#3776AB",
        ["JavaScript"] = "#F7DF1E",
        ["TypeScript"] = "#3178C6",
        ["Java"] = "#ED8B00",
        ["C#"] = "#239120",
        ["Go"] = "#00ADD8",
        ["Rust"] = "#DEA584",
        ["Ruby"] = "#CC342D",
        ["PHP"] = "#777BB4",
        ["C++"] = "#00599C",
        ["C"] = "#555555",
        ["Swift"] = "#FA7343",
        ["Kotlin"] = "#7F52FF",
        ["Shell"] = "#89E051",
        ["Scala"] = "#DC322F"
    };

    public static string GetCor(string reino) =>
        Cores.TryGetValue(reino, out var cor) ? cor : "#888888";
}

/// <summary>
/// Stats predefinidos para cada tipo de monstro
/// </summary>
public static class MonsterStats
{
    // Bug - Monstro básico (spawn a cada 10 min)
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) Bug =
        (900, 25, 40, 40, 10, 10, 5);

    // AIHallucination - Monstro intermediário (spawn a cada 30 min)
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) AIHallucination =
        (1800, 40, 50, 50, 25, 20, 10);

    // Manager - Monstro intermediário tanque (spawn a cada 30 min)
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) Manager =
        (3000, 35, 40, 25, 15, 5, 25);

    // Boss - Deploy de Final de Expediente (spawn diário às 18h)
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) Boss =
        (30000, 100, 70, 40, 35, 15, 40);

    // UnexplainedBug - Boss a cada 1 hora (muita vida, pouco dano, ataque lento)
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) UnexplainedBug =
        (30000, 30, 10, 20, 5, 5, 15);
}
