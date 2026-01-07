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
    Neutral
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

    // Equipped items (for visual display)
    public List<EquippedItemInfo> EquippedItems { get; set; } = new();

    public Entity(Guid id, string githubLogin, PlayerStats stats, string reino, float x, float y, EntityType type = EntityType.Player, int elo = 1000, int vitorias = 0, int derrotas = 0)
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

    public void SetTarget(float x, float y)
    {
        TargetX = x;
        TargetY = y;
        State = EntityState.Moving;
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
