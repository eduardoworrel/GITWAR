namespace GitWorld.Shared;

public static class GameConstants
{
    public const int TickRateMs = 50;        // 20 ticks/s
    public const float RangeVisao = 300f;    // unidades
    public const float RangeAtaque = 30f;    // unidades
    public const int TempoRespawnMs = 5000;  // 5 segundos
    public const float VelocidadeBase = 100f; // unidades/s (dobrado)

    // Mapa expandido (10k x 10k) - mesa de escritório fica no centro
    public const int MapaWidth = 10000;
    public const int MapaHeight = 10000;

    // Área original da mesa (centralizada no mapa expandido)
    public const int DeskWidth = 5000;
    public const int DeskHeight = 3000;
    public const int DeskOffsetX = (MapaWidth - DeskWidth) / 2;   // 2500
    public const int DeskOffsetZ = (MapaHeight - DeskHeight) / 2; // 3500

    // Spawn único - área da mesa (centro do desk)
    public const float SpawnX = DeskOffsetX + DeskWidth / 2;  // 5000 (centro X do desk)
    public const float SpawnY = DeskOffsetZ + DeskHeight / 2; // 5000 (centro Z do desk)

    public const float RaioBroadcast = 1000f; // raio de broadcast do backend (frontend usa LOD para distantes)

    // Collision zones for desk objects (X, Y, Width, Height)
    // Positions are relative to the expanded map (desk is centered)
    // These objects block player movement
    public static readonly (float X, float Y, float Width, float Height)[] DeskCollisionZones = new[]
    {
        // === Desk Objects (positioned relative to desk center at 5000, 5000) ===
        // Monitor base (desk center X, desk top + 600)
        (DeskOffsetX + DeskWidth / 2f - 150f, DeskOffsetZ + 600f - 100f, 300f, 200f),
        // Keyboard (desk center X, desk center Z - 100)
        (DeskOffsetX + DeskWidth / 2f - 275f, DeskOffsetZ + DeskHeight / 2f - 100f - 90f, 550f, 180f),
        // Mouse only (desk center X + 550, desk center Z) - mousepad is walkable
        (DeskOffsetX + DeskWidth / 2f + 550f - 40f, DeskOffsetZ + DeskHeight / 2f - 50f, 80f, 100f),

        // === Tech Buildings in EXPANDED areas (outside desk) ===
        // North area buildings (z < DeskOffsetZ = 3500)
        (3000f - 40f, 1500f - 20f, 80f, 40f),       // Server rack
        (7000f - 40f, 1500f - 20f, 80f, 40f),       // Server rack
        (5000f - 100f, 1000f - 75f, 200f, 150f),    // Data center
        (4000f - 75f, 2500f - 10f, 150f, 20f),      // Whiteboard
        (6000f - 75f, 2500f - 10f, 150f, 20f),      // Whiteboard

        // South area buildings (z > DeskOffsetZ + DeskHeight = 6500)
        (3000f - 40f, 8500f - 20f, 80f, 40f),       // Server rack
        (7000f - 40f, 8500f - 20f, 80f, 40f),       // Server rack
        (5000f - 100f, 9000f - 75f, 200f, 150f),    // Data center
        (4000f - 50f, 7500f - 30f, 100f, 60f),      // Coffee station
        (6000f - 50f, 7500f - 30f, 100f, 60f),      // Coffee station

        // West area buildings (x < DeskOffsetX = 2500)
        (1000f - 40f, 4000f - 20f, 80f, 40f),       // Server rack
        (1000f - 40f, 6000f - 20f, 80f, 40f),       // Server rack
        (500f - 40f, 5000f - 25f, 80f, 50f),        // UPS
        (1500f - 30f, 4500f - 15f, 60f, 30f),       // Network switch
        (1500f - 30f, 5500f - 15f, 60f, 30f),       // Network switch

        // East area buildings (x > DeskOffsetX + DeskWidth = 7500)
        (9000f - 40f, 4000f - 20f, 80f, 40f),       // Server rack
        (9000f - 40f, 6000f - 20f, 80f, 40f),       // Server rack
        (9500f - 40f, 5000f - 25f, 80f, 50f),       // UPS
        (8500f - 30f, 4500f - 15f, 60f, 30f),       // Network switch
        (8500f - 30f, 5500f - 15f, 60f, 30f),       // Network switch

        // Corner data centers
        (1000f - 100f, 1000f - 75f, 200f, 150f),    // Northwest
        (9000f - 100f, 1000f - 75f, 200f, 150f),    // Northeast
        (1000f - 100f, 9000f - 75f, 200f, 150f),    // Southwest
        (9000f - 100f, 9000f - 75f, 200f, 150f),    // Southeast
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
    public const int BugSpawnMin = 1;
    public const int BugSpawnMax = 3;
    public const int AIHallucinationSpawnMin = 0;
    public const int AIHallucinationSpawnMax = 1;
    public const int ManagerSpawnMin = 0;
    public const int ManagerSpawnMax = 1;

    // Event System - ELO rewards
    public const int BugEloReward = 1;
    public const int AIHallucinationEloReward = 3;
    public const int ManagerEloReward = 3;
    public const int BossEloReward = 10;
    public const int UnexplainedBugEloReward = 15;

    // Monster aggro range - how far monsters detect and chase players
    // Set to cover entire map so UnexplainedBug hunts from anywhere
    public const float MonsterAggroRange = 6000f;

    // Progression System - Level & XP
    public const int MaxLevel = 100;
    public const int BaseExpToLevel = 100;           // XP base para subir de nível
    public const float ExpScalingFactor = 1.15f;     // Multiplicador por nível (exponencial)

    // Progression System - XP rewards
    public const int BugExpReward = 10;
    public const int AIHallucinationExpReward = 25;
    public const int ManagerExpReward = 30;
    public const int BossExpReward = 200;
    public const int UnexplainedBugExpReward = 150;
    public const int PlayerKillExpReward = 50;       // XP base por matar jogador (escala com nível)

    // Progression System - Gold rewards
    public const int BugGoldReward = 5;
    public const int AIHallucinationGoldReward = 15;
    public const int ManagerGoldReward = 20;
    public const int BossGoldReward = 100;
    public const int UnexplainedBugGoldReward = 75;
    public const int PlayerKillGoldReward = 25;      // Gold base por matar jogador

    // Level bonuses - stats increase per level
    public const float HpPerLevel = 10f;             // +10 HP max por nível
    public const float DanoPerLevel = 1f;            // +1 dano por nível
    public const float ArmaduraPerLevel = 0.5f;      // +0.5 armadura por nível
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
/// (Hp, Dano, VelAtaque, VelMov, Crit, Evasao, Armadura)
/// </summary>
public static class MonsterStats
{
    // === Original Monsters ===
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) Bug =
        (900, 25, 40, 80, 10, 10, 5);
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) AIHallucination =
        (1800, 40, 50, 50, 25, 20, 10);
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) Manager =
        (3000, 35, 40, 25, 15, 5, 25);
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) Boss =
        (60000, 100, 70, 40, 35, 15, 40);
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) UnexplainedBug =
        (30000, 30, 10, 20, 5, 5, 15);

    // === JavaScript Errors ===
    // undefined - fantasmagórico, evasivo, dano baixo
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) JsUndefined =
        (600, 15, 35, 70, 5, 35, 0);
    // NaN - imprevisível, crítico alto
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) JsNaN =
        (800, 20, 45, 60, 40, 20, 5);
    // Callback Hell - lento mas persistente, muito HP
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) JsCallbackHell =
        (2000, 30, 30, 30, 10, 5, 15);

    // === Python Errors ===
    // IndentationError - frágil, rápido
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) PyIndentationError =
        (500, 18, 50, 75, 15, 25, 0);
    // NoneType - vazio, pouco HP, alto crítico
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) PyNoneType =
        (400, 25, 40, 55, 45, 30, 0);
    // ImportError - médio, traz outros problemas
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) PyImportError =
        (1000, 22, 35, 50, 10, 15, 10);

    // === Java Errors ===
    // NullPointerException - clássico, balanceado
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) JavaNullPointer =
        (1200, 35, 45, 45, 20, 15, 10);
    // ClassNotFoundException - perdido, lento
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) JavaClassNotFound =
        (900, 20, 30, 35, 10, 20, 5);
    // OutOfMemoryError - TANQUE, muito HP, lento
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) JavaOutOfMemory =
        (4000, 50, 25, 20, 5, 0, 30);

    // === C# Errors ===
    // NullReferenceException - similar ao Java
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) CsNullReference =
        (1100, 32, 45, 50, 18, 18, 8);
    // StackOverflowException - cresce, muito dano
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) CsStackOverflow =
        (2500, 60, 50, 40, 25, 10, 15);
    // InvalidCastException - confuso, evasivo
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) CsInvalidCast =
        (800, 28, 40, 55, 30, 25, 5);

    // === C/C++ Errors ===
    // Segmentation Fault - DEVASTADOR, muito dano
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) CSegFault =
        (1800, 80, 60, 50, 35, 10, 20);
    // Stack Overflow - torre infinita, muito HP
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) CStackOverflow =
        (3500, 45, 40, 35, 15, 5, 25);
    // Memory Leak - lento, persistente, drena
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) CMemoryLeak =
        (2200, 25, 20, 25, 10, 15, 20);

    // === TypeScript Errors ===
    // Type Error - estruturado, médio
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) TsTypeError =
        (1000, 30, 45, 55, 20, 20, 10);
    // any - caótico, imprevisível
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) TsAny =
        (700, 35, 55, 70, 35, 30, 0);
    // readonly - defensivo, lento
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) TsReadonly =
        (1500, 20, 25, 30, 5, 5, 35);

    // === PHP Errors ===
    // T_PAAMAYIM_NEKUDOTAYIM - bizarro, alto crítico
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) PhpPaamayim =
        (900, 40, 50, 45, 40, 20, 5);
    // Fatal Error - perigoso
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) PhpFatalError =
        (1600, 55, 45, 40, 25, 10, 15);
    // Undefined Index - comum, fraco
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) PhpUndefinedIndex =
        (650, 18, 40, 60, 15, 25, 5);

    // === Go Errors ===
    // nil panic - rápido, agressivo
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) GoNilPanic =
        (1100, 45, 55, 65, 30, 20, 8);
    // Deadlock - TANQUE, imóvel, muito HP
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) GoDeadlock =
        (3000, 35, 30, 10, 10, 0, 40);
    // Import cycle - loop, médio
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) GoImportCycle =
        (1300, 28, 40, 50, 15, 15, 12);

    // === Rust Errors ===
    // Borrow Checker - defensivo, prende
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) RustBorrowChecker =
        (1400, 30, 35, 45, 20, 15, 25);
    // panic! - explosivo, muito dano, frágil
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) RustPanic =
        (800, 70, 70, 60, 45, 25, 0);
    // Lifetime Error - persistente, lento
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) RustLifetimeError =
        (1800, 25, 30, 35, 10, 10, 20);

    // === Ruby Errors ===
    // NoMethodError - ágil, fraco
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) RubyNoMethodError =
        (700, 22, 45, 65, 20, 30, 5);
    // LoadError - médio
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) RubyLoadError =
        (1000, 28, 40, 50, 15, 20, 10);
    // SyntaxError - irritante, rápido
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) RubySyntaxError =
        (600, 20, 55, 70, 25, 35, 0);

    // === Swift Errors ===
    // found nil - rápido, aéreo
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) SwiftFoundNil =
        (850, 30, 50, 75, 25, 35, 5);
    // Force Unwrap - explosivo
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) SwiftForceUnwrap =
        (700, 55, 60, 55, 40, 20, 0);
    // Index out of range - fora dos limites
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) SwiftIndexOutOfRange =
        (900, 35, 45, 60, 20, 25, 8);

    // === Kotlin Errors ===
    // NullPointerException - moderno, balanceado
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) KotlinNullPointer =
        (1000, 32, 45, 55, 22, 18, 10);
    // ClassCastException - transformador
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) KotlinClassCast =
        (850, 28, 40, 50, 25, 22, 8);
    // UninitializedPropertyAccess - incompleto
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) KotlinUninitialized =
        (750, 25, 35, 45, 15, 20, 5);

    // === Scala Errors ===
    // MatchError - padrão não encontrado
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) ScalaMatchError =
        (1100, 35, 45, 50, 20, 15, 12);
    // AbstractMethodError - incompleto
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) ScalaAbstractMethod =
        (900, 25, 35, 40, 15, 25, 8);
    // StackOverflowError - recursivo
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) ScalaStackOverflow =
        (2800, 50, 45, 35, 20, 5, 22);

    // === R Errors ===
    // Error in eval - dados corrompidos
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) REvalError =
        (950, 30, 40, 45, 25, 20, 10);
    // Object not found - invisível
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) RObjectNotFound =
        (600, 20, 35, 55, 15, 40, 0);
    // Subscript out of bounds - fora do limite
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) RSubscriptOutOfBounds =
        (800, 35, 45, 50, 30, 20, 8);

    // === SQL Errors ===
    // Deadlock - travado, tanque
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) SqlDeadlock =
        (2500, 30, 25, 15, 10, 0, 35);
    // Syntax Error - comum, fraco
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) SqlSyntaxError =
        (700, 22, 40, 55, 20, 25, 5);
    // Connection Timeout - lento, persistente
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) SqlTimeout =
        (1500, 25, 20, 30, 10, 10, 25);

    // === Shell/Bash Errors ===
    // Command not found - perdido
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) BashCommandNotFound =
        (650, 18, 40, 60, 15, 30, 5);
    // Permission denied - bloqueador
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) BashPermissionDenied =
        (1200, 25, 30, 40, 10, 10, 30);
    // Core dumped - devastador
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) BashCoreDumped =
        (1800, 65, 55, 45, 35, 15, 18);

    // === Perl Errors ===
    // Uninitialized value - fantasma
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) PerlUninitialized =
        (700, 20, 35, 50, 20, 35, 5);
    // Syntax error (regex) - caótico
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) PerlSyntaxError =
        (900, 35, 50, 55, 35, 25, 8);
    // Can't locate - perdido no deserto
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) PerlCantLocate =
        (800, 22, 35, 45, 15, 25, 10);

    // === Lua Errors ===
    // attempt to index nil - lunar
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) LuaIndexNil =
        (750, 25, 40, 55, 20, 25, 8);
    // bad argument - mal encaixado
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) LuaBadArgument =
        (650, 22, 45, 60, 25, 30, 5);
    // stack overflow - pilha de luas
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) LuaStackOverflow =
        (2000, 40, 40, 40, 18, 10, 20);

    // === Dart Errors ===
    // Null check on null - alvo vazio
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) DartNullCheck =
        (800, 28, 45, 60, 25, 25, 8);
    // RangeError - fora do limite
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) DartRangeError =
        (900, 35, 50, 65, 30, 20, 10);
    // NoSuchMethodError - sem centro
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) DartNoSuchMethod =
        (700, 25, 40, 55, 20, 28, 5);

    // === Elixir Errors ===
    // FunctionClauseError - poção errada
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) ElixirFunctionClause =
        (1000, 32, 45, 50, 22, 20, 12);
    // ArgumentError - ingredientes incompatíveis
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) ElixirArgumentError =
        (850, 28, 40, 55, 25, 22, 8);
    // KeyError - chave perdida
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) ElixirKeyError =
        (750, 24, 42, 58, 20, 25, 6);

    // === AI/ML Errors (AI Invasion) ===
    // VanishingGradient - fantasmagórico, evasivo, desaparece
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) AIVanishingGradient =
        (600, 15, 30, 65, 10, 45, 0);
    // ExplodingGradient - instável, alto dano, explosivo
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) AIExplodingGradient =
        (1200, 80, 60, 55, 40, 10, 5);
    // DyingRelu - neurônios morrendo, fica mais fraco
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) AIDyingRelu =
        (1500, 30, 35, 40, 15, 20, 15);
    // Overfitting - decorou tudo, TANQUE mas previsível
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) AIOverfitting =
        (3500, 45, 50, 30, 25, 5, 25);
    // Underfitting - simplório, fraco em tudo
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) AIUnderfitting =
        (500, 12, 25, 50, 5, 15, 5);
    // ModeCollapse - GAN quebrado, gera clones
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) AIModeCollapse =
        (1800, 35, 45, 45, 20, 20, 15);
    // CatastrophicForgetting - esquece tudo, médio
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) AICatastrophicForgetting =
        (1400, 28, 40, 50, 18, 22, 12);
    // DataLeakage - vantagem injusta, alto crítico
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) AIDataLeakage =
        (1000, 50, 55, 60, 50, 30, 8);
    // CudaOutOfMemory - GPU derretendo, MEGA TANQUE, muito lento
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) AICudaOutOfMemory =
        (5000, 60, 20, 15, 15, 0, 40);
    // BiasVariance - balança desequilibrada, balanceado
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) AIBiasVariance =
        (1600, 38, 42, 48, 22, 22, 18);
    // DeadNeuron - neurônio morto, zumbi lento
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) AIDeadNeuron =
        (2000, 20, 20, 25, 5, 5, 30);
    // NaNLoss - loss explodiu, caótico, alto dano
    public static readonly (int Hp, int Dano, int VelAtaque, int VelMov, int Crit, int Evasao, int Armadura) AINaNLoss =
        (800, 70, 65, 70, 45, 25, 0);
}
