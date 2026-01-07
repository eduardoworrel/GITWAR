namespace GitWorld.Api.GitHub.Models;

/// <summary>
/// Stats calculados do jogador baseados nos dados do GitHub.
/// </summary>
public class PlayerStats
{
    public int Hp { get; set; }
    public int Dano { get; set; }
    public int VelocidadeAtaque { get; set; }
    public int VelocidadeMovimento { get; set; }
    public int Critico { get; set; }
    public int Evasao { get; set; }
    public int Armadura { get; set; }
    public string Reino { get; set; } = "Unknown";

    public PlayerStats() { }

    public PlayerStats(int hp, int dano, int velocidadeAtaque, int velocidadeMovimento, int critico, int evasao, int armadura, string reino)
    {
        Hp = hp;
        Dano = dano;
        VelocidadeAtaque = velocidadeAtaque;
        VelocidadeMovimento = velocidadeMovimento;
        Critico = critico;
        Evasao = evasao;
        Armadura = armadura;
        Reino = reino;
    }
}

/// <summary>
/// Perfil completo do jogador (dados GitHub + stats calculados).
/// </summary>
public class PlayerProfile
{
    public string Username { get; set; } = string.Empty;
    public long GitHubId { get; set; }
    public string AvatarUrl { get; set; } = string.Empty;
    public PlayerStats Stats { get; set; } = new();
    public DateTime LastSync { get; set; }

    // Dados de atividade para validação
    public int TotalProjects { get; set; }
    public int TotalCommits { get; set; }
}
