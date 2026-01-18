using GitWorld.Shared;

namespace GitWorld.Api.Core;

public enum EntityState
{
    Idle,
    Moving,
    Attacking,
    Dead
}

public enum EntityType
{
    Player,
    NPC,
    Bug,              // Monstro fraco - spawn a cada 10 min
    AIHallucination,  // Monstro intermediário - spawn a cada 30 min
    Manager,          // Monstro intermediário - spawn a cada 30 min
    Boss,             // Boss diário às 18h
    UnexplainedBug,   // Boss a cada 1 hora - muita vida, pouco dano
    Neutral,

    // === JavaScript Errors ===
    JsUndefined,          // Fantasma translúcido, contorno pontilhado
    JsNaN,                // Dígitos quebrados, glitch visual
    JsCallbackHell,       // Espiral de parênteses e chaves

    // === Python Errors ===
    PyIndentationError,   // Blocos desalinhados, tabs/espaços visíveis
    PyNoneType,           // Buraco negro pequeno, vazio com contorno
    PyImportError,        // Caixa de pacote quebrada, cobras escapando

    // === Java Errors ===
    JavaNullPointer,      // Seta apontando pro vazio, amarelo rachado
    JavaClassNotFound,    // Silhueta de classe com "?"
    JavaOutOfMemory,      // Xícara de café transbordando

    // === C# Errors ===
    CsNullReference,      // Espelho quebrado refletindo nada
    CsStackOverflow,      // Pilha de janelas Windows
    CsInvalidCast,        // Forma tentando encaixar em buraco errado

    // === C/C++ Errors ===
    CSegFault,            // Blocos de RAM fragmentados
    CStackOverflow,       // Torre de frames infinita
    CMemoryLeak,          // Criatura derretendo, poças de memória

    // === TypeScript Errors ===
    TsTypeError,          // Cubo tentando ser esfera
    TsAny,                // Blob amorfo que muda de forma
    TsReadonly,           // Estátua congelada com cadeado

    // === PHP Errors ===
    PhpPaamayim,          // Dois pontos gigantes com olhos
    PhpFatalError,        // Elefante zumbi
    PhpUndefinedIndex,    // Array com buracos

    // === Go Errors ===
    GoNilPanic,           // Gopher zumbi
    GoDeadlock,           // Dois gophers presos em abraço
    GoImportCycle,        // Cobra engolindo própria cauda

    // === Rust Errors ===
    RustBorrowChecker,    // Caranguejo com garras que prendem
    RustPanic,            // Caranguejo explodindo
    RustLifetimeError,    // Caranguejo com relógio de areia

    // === Ruby Errors ===
    RubyNoMethodError,    // Gema rachada sem brilho
    RubyLoadError,        // Trilhos quebrados
    RubySyntaxError,      // Gema mal lapidada

    // === Swift Errors ===
    SwiftFoundNil,        // Pássaro caindo, asas transparentes
    SwiftForceUnwrap,     // Presente explodindo
    SwiftIndexOutOfRange, // Pássaro voando pra fora da tela

    // === Kotlin Errors ===
    KotlinNullPointer,    // K estilizado quebrado
    KotlinClassCast,      // Diamante tentando virar círculo
    KotlinUninitialized,  // Construção inacabada

    // === Scala Errors ===
    ScalaMatchError,      // Escada sem degraus
    ScalaAbstractMethod,  // Forma abstrata incompleta
    ScalaStackOverflow,   // Escada infinita

    // === R Errors ===
    REvalError,           // Gráfico estatístico corrompido
    RObjectNotFound,      // Lupa procurando invisível
    RSubscriptOutOfBounds,// Vetor com índice vermelho

    // === SQL Errors ===
    SqlDeadlock,          // Tabelas encadeadas com cadeados
    SqlSyntaxError,       // Query quebrada
    SqlTimeout,           // Tubo de dados entupido

    // === Shell/Bash Errors ===
    BashCommandNotFound,  // Terminal com "?" piscando
    BashPermissionDenied, // Cadeado gigante vermelho
    BashCoreDumped,       // Núcleo vazando dados

    // === Perl Errors ===
    PerlUninitialized,    // Camelo transparente
    PerlSyntaxError,      // Regex impossível de ler
    PerlCantLocate,       // Camelo perdido no deserto

    // === Lua Errors ===
    LuaIndexNil,          // Lua com cratera
    LuaBadArgument,       // Joia lunar mal encaixada
    LuaStackOverflow,     // Pilha de luas

    // === Dart Errors ===
    DartNullCheck,        // Alvo acertando o vazio
    DartRangeError,       // Dardo voando além do limite
    DartNoSuchMethod,     // Alvo sem centro

    // === Elixir Errors ===
    ElixirFunctionClause, // Poção com receita errada
    ElixirArgumentError,  // Frasco com ingredientes incompatíveis
    ElixirKeyError,       // Mapa de alquimia sem chave

    // === AI/ML Errors (AI Invasion Event) ===
    AIVanishingGradient,  // Gradientes desaparecendo - fantasma matemático evaporando
    AIExplodingGradient,  // Gradientes explodindo - núcleo instável com números voando
    AIDyingRelu,          // Neurônios mortos - cérebro robótico com partes apagadas
    AIOverfitting,        // Decoreba - robô com espelho, só repete o que vê
    AIUnderfitting,       // Burro demais - robô simplório ignorando padrões
    AIModeCollapse,       // GAN colapsado - clones idênticos saindo de máquina
    AICatastrophicForgetting, // Esquecimento - robô com memória vazando
    AIDataLeakage,        // Vazamento de dados - tubos com dados escapando
    AICudaOutOfMemory,    // GPU sem memória - chip derretendo/fumando
    AIBiasVariance,       // Trade-off - balança desequilibrada com cérebros
    AIDeadNeuron,         // Neurônio morto - célula cerebral apagada/cinza
    AINaNLoss             // Loss explodiu - display com "NaN" e faíscas
}

// Minimal equipped item info for broadcasting
public class EquippedItemInfo
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Tier { get; set; } = "F";
}

public class Entity
{
    public Guid Id { get; init; }
    public string GithubLogin { get; init; } = string.Empty;
    public string Reino { get; set; } = string.Empty;
    public EntityType Type { get; init; } = EntityType.Player;

    // Posição
    public float X { get; set; }
    public float Y { get; set; }

    // Destino de movimento
    public float? TargetX { get; set; }
    public float? TargetY { get; set; }

    // Stats base (do GitHub)
    public int MaxHp { get; set; }
    public int Dano { get; set; }
    public int VelocidadeAtaque { get; set; }
    public int VelocidadeMovimento { get; set; }
    public int Critico { get; set; }
    public int Evasao { get; set; }
    public int Armadura { get; set; }

    // Projectile properties (from equipped items)
    public int RangeBonus { get; set; } = 0;
    public string? ProjectileColor { get; set; }
    public float ProjectileSize { get; set; } = 1f;

    // Estado atual
    public int CurrentHp { get; set; }
    public EntityState State { get; set; } = EntityState.Idle;
    public Guid? TargetEntityId { get; set; }

    // Respawn
    public long? RespawnAtTick { get; set; }

    // Último tick de ataque (cooldown)
    public long LastAttackTick { get; set; }

    // Ranking (ELO)
    public int Elo { get; set; } = 1000;
    public int Vitorias { get; set; }
    public int Derrotas { get; set; }

    // Progressão
    public int Level { get; set; } = 1;
    public int Exp { get; set; } = 0;
    public int Gold { get; set; } = 0;

    // Equipped items (for visual display)
    public List<EquippedItemInfo> EquippedItems { get; set; } = new();

    // Scripting
    public string? CustomScript { get; set; }
    public bool ScriptEnabled { get; set; } = false;

    // Damage tracking for reward distribution (only for monsters)
    // Key: Attacker Entity ID, Value: Total damage dealt
    public Dictionary<Guid, int> DamageContributors { get; } = new();

    /// <summary>
    /// Register damage from an attacker for reward distribution
    /// </summary>
    public void RegisterDamage(Guid attackerId, int damage)
    {
        if (Type == EntityType.Player) return; // Only track for monsters

        if (DamageContributors.ContainsKey(attackerId))
            DamageContributors[attackerId] += damage;
        else
            DamageContributors[attackerId] = damage;
    }

    /// <summary>
    /// Get damage contribution percentage for each attacker
    /// </summary>
    public Dictionary<Guid, float> GetDamagePercentages()
    {
        var totalDamage = DamageContributors.Values.Sum();
        if (totalDamage == 0) return new Dictionary<Guid, float>();

        return DamageContributors.ToDictionary(
            kvp => kvp.Key,
            kvp => (float)kvp.Value / totalDamage
        );
    }

    public Entity(Guid id, string githubLogin, PlayerStats stats, string reino, float x, float y, EntityType type = EntityType.Player, int elo = 1000, int vitorias = 0, int derrotas = 0, int level = 1, int exp = 0, int gold = 0)
    {
        Id = id;
        GithubLogin = githubLogin;
        Reino = reino;
        X = x;
        Y = y;
        Type = type;

        MaxHp = stats.Hp;
        Dano = stats.Dano;
        VelocidadeAtaque = stats.VelocidadeAtaque;
        VelocidadeMovimento = stats.VelocidadeMovimento;
        Critico = stats.Critico;
        Evasao = stats.Evasao;
        Armadura = stats.Armadura;

        CurrentHp = MaxHp;

        Elo = elo;
        Vitorias = vitorias;
        Derrotas = derrotas;

        Level = level;
        Exp = exp;
        Gold = gold;
    }

    public float DistanceTo(Entity other)
    {
        var dx = other.X - X;
        var dy = other.Y - Y;
        return MathF.Sqrt(dx * dx + dy * dy);
    }

    public float DistanceTo(float targetX, float targetY)
    {
        var dx = targetX - X;
        var dy = targetY - Y;
        return MathF.Sqrt(dx * dx + dy * dy);
    }

    public bool IsAlive => State != EntityState.Dead;

    public void SetTarget(float x, float y, bool preserveAttackState = false)
    {
        TargetX = x;
        TargetY = y;
        // Don't override Attacking state when chasing a target
        if (!preserveAttackState || State != EntityState.Attacking)
        {
            State = EntityState.Moving;
        }
    }

    public void ClearTarget()
    {
        TargetX = null;
        TargetY = null;
        if (State == EntityState.Moving)
            State = EntityState.Idle;
    }

    public void Die(long currentTick)
    {
        State = EntityState.Dead;
        CurrentHp = 0;
        TargetEntityId = null;
        ClearTarget();
        RespawnAtTick = currentTick + (GameConstants.TempoRespawnMs / GameConstants.TickRateMs);
    }

    public void Respawn(float x, float y)
    {
        X = x;
        Y = y;
        CurrentHp = MaxHp;
        State = EntityState.Idle;
        RespawnAtTick = null;
        TargetEntityId = null;
    }

    /// <summary>
    /// Apply damage to this entity and check for death
    /// </summary>
    /// <param name="damage">Amount of damage to apply</param>
    /// <param name="currentTick">Current game tick for death scheduling</param>
    /// <returns>True if the entity died from this damage</returns>
    public bool TakeDamage(int damage, long currentTick)
    {
        if (!IsAlive || damage <= 0)
            return false;

        CurrentHp -= damage;

        if (CurrentHp <= 0)
        {
            Die(currentTick);
            return true;
        }

        return false;
    }
}
