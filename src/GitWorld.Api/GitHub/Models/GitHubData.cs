namespace GitWorld.Api.GitHub.Models;

/// <summary>
/// Dados brutos coletados da API do GitHub para um usuário.
/// </summary>
public class GitHubData
{
    public string Username { get; set; } = string.Empty;
    public long GitHubId { get; set; }
    public string AvatarUrl { get; set; } = string.Empty;

    // Dados do perfil
    public DateTime CreatedAt { get; set; }
    public int Followers { get; set; }
    public int Following { get; set; }
    public int PublicRepos { get; set; }

    // Repositórios
    public int TotalRepos { get; set; }
    public int Stars { get; set; }
    public int Forks { get; set; }
    public int ExternalRepos { get; set; } // repos que contribuiu mas não é dono
    public double AvgStars { get; set; }

    // Commits
    public int Commits { get; set; }
    public int Commits30d { get; set; }
    public int Commits7d { get; set; }
    public int CommitsExternal { get; set; }

    // PRs
    public int PrsTotal { get; set; }
    public int PrsMerged { get; set; }
    public int Prs30d { get; set; }

    // Issues
    public int IssuesTotal { get; set; }
    public int IssuesClosed { get; set; }
    public int Issues30d { get; set; }

    // Reviews
    public int Reviews { get; set; }

    // Organizações e linguagens
    public int Orgs { get; set; }
    public int Languages { get; set; }
    public string MainLanguage { get; set; } = "Unknown";

    // Linguagens detalhadas (para determinar reino)
    public Dictionary<string, int> LanguageRepoCount { get; set; } = new();
}
