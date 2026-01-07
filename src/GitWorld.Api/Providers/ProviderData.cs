namespace GitWorld.Api.Providers;

/// <summary>
/// Dados normalizados de qualquer provedor (GitHub, GitLab, HuggingFace).
/// Estrutura comum que permite calcular stats de forma consistente.
/// </summary>
public class ProviderData
{
    public string Username { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string AvatarUrl { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;

    // Dados do perfil
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int Followers { get; set; }
    public int Following { get; set; }

    // Projetos/Repositórios
    public int TotalProjects { get; set; }
    public int Stars { get; set; }  // Stars/Likes
    public int Forks { get; set; }  // Forks/Clones
    public int ContributedProjects { get; set; }  // Projetos externos contribuídos
    public double AvgStars { get; set; }

    // Atividade de código
    public int Commits { get; set; }
    public int Commits30d { get; set; }
    public int Commits7d { get; set; }
    public int CommitsExternal { get; set; }

    // Contribuições (PRs/MRs)
    public int MergeRequestsTotal { get; set; }
    public int MergeRequestsMerged { get; set; }
    public int MergeRequests30d { get; set; }

    // Issues
    public int IssuesTotal { get; set; }
    public int IssuesClosed { get; set; }
    public int Issues30d { get; set; }

    // Reviews/Discussões
    public int Reviews { get; set; }

    // Organizações/Grupos e linguagens
    public int Organizations { get; set; }
    public int Languages { get; set; }
    public string MainLanguage { get; set; } = "Unknown";
    public Dictionary<string, int> LanguageStats { get; set; } = new();

    // HuggingFace específico (mapeado para equivalentes)
    public int Models { get; set; }  // Conta como projetos
    public int Datasets { get; set; }  // Conta como projetos
    public int Spaces { get; set; }  // Conta como projetos
    public int Downloads { get; set; }  // Conta como stars
    public int Likes { get; set; }  // Conta como stars
}

/// <summary>
/// Perfil do jogador com stats calculados.
/// </summary>
public class PlayerProfile
{
    public string Username { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string AvatarUrl { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public PlayerStats Stats { get; set; } = new();
    public DateTime LastSync { get; set; }

    // Dados de atividade para validação
    public int TotalProjects { get; set; }
    public int TotalCommits { get; set; }

    /// <summary>
    /// Verifica se o usuário tem atividade mínima para jogar.
    /// Requer pelo menos 1 projeto/repo OU 1 commit.
    /// </summary>
    public bool HasMinimumActivity => TotalProjects > 0 || TotalCommits > 0;
}

/// <summary>
/// Stats calculados do jogador.
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
