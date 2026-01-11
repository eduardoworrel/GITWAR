namespace GitWorld.Shared.Entities;

public class Player
{
    public Guid Id { get; set; }
    public long GitHubId { get; set; }
    public string GitHubLogin { get; set; } = string.Empty;

    // Stats calculados do GitHub
    public int Hp { get; set; }
    public int HpMax { get; set; }
    public int Dano { get; set; }
    public int VelocidadeAtaque { get; set; }
    public int VelocidadeMovimento { get; set; }
    public int Critico { get; set; }
    public int Evasao { get; set; }
    public int Armadura { get; set; }

    // Reino (linguagem principal)
    public string Reino { get; set; } = string.Empty;

    // Posicao no mundo
    public float X { get; set; } = 5000f;
    public float Y { get; set; } = 5000f;

    // Estado atual
    public PlayerState Estado { get; set; } = PlayerState.Idle;
    public Guid? AlvoId { get; set; }

    // Ranking
    public int Elo { get; set; } = 1000;
    public int Vitorias { get; set; }
    public int Derrotas { get; set; }

    // Progressão
    public int Level { get; set; } = 1;
    public int Exp { get; set; } = 0;
    public int Gold { get; set; } = 0;

    // Metadata
    public DateTime LastGitHubSync { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navegacao
    public ICollection<Battle> BattlesAsPlayer1 { get; set; } = new List<Battle>();
    public ICollection<Battle> BattlesAsPlayer2 { get; set; } = new List<Battle>();
    public ICollection<Battle> BattlesWon { get; set; } = new List<Battle>();
    public ICollection<PlayerItem> PlayerItems { get; set; } = new List<PlayerItem>();
}

public enum PlayerState
{
    Idle,
    Moving,
    Fighting,
    Dead
}
