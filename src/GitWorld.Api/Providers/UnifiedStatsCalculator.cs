namespace GitWorld.Api.Providers;

/// <summary>
/// Calcula stats do jogador a partir de ProviderData (estrutura comum).
/// Funciona com GitHub, GitLab, e HuggingFace.
/// </summary>
public interface IUnifiedStatsCalculator
{
    PlayerStats Calculate(ProviderData data);
}

public class UnifiedStatsCalculator : IUnifiedStatsCalculator
{
    // Reinos válidos (linguagens de programação + IA)
    private static readonly HashSet<string> ValidKingdoms = new(StringComparer.OrdinalIgnoreCase)
    {
        "Python", "JavaScript", "TypeScript", "Java", "C#",
        "Go", "Rust", "Ruby", "PHP", "C++", "C", "Swift",
        "Kotlin", "Shell", "Scala", "IA"
    };

    public PlayerStats Calculate(ProviderData data)
    {
        var dias = (DateTime.UtcNow - data.CreatedAt).Days;

        // HP: (dias×0.5) + (commits×0.3) + (projetos×10) + 200
        // HuggingFace: models/datasets/spaces contam como projetos
        var totalProjects = data.TotalProjects + data.Models + data.Datasets + data.Spaces;
        var hp = (int)((dias * 0.5) + (data.Commits * 0.3) + (totalProjects * 10) + 200);

        // Dano: 30 + (commits/50) + (commits30d×2) + (stars/5) + (forks×3)
        // HuggingFace: downloads/likes mapeados para stars
        var stars = data.Stars + (data.Likes / 2) + (int)(Math.Log10(data.Downloads + 1) * 10);
        var dano = (int)(30 + (data.Commits / 50.0) + (data.Commits30d * 2) + (stars / 5.0) + (data.Forks * 3));

        // Vel. Ataque: 20 + (commits/80) + (commits7d×1.5) + (commits30d×0.5)
        var velocidadeAtaque = (int)(20 + (data.Commits / 80.0) + (data.Commits7d * 1.5) + (data.Commits30d * 0.5));

        // Velocidade de Movimento: baseado em projetos + linguagens
        var velocidadeMovimento = ((totalProjects * 2) + (data.Languages * 5)) * 2;

        // Crítico: 5 + (commits/200) + (merged_ratio×20) + (avgStars×3) + (reviews/30)
        var mergeRatio = data.MergeRequestsTotal > 0 ? (double)data.MergeRequestsMerged / data.MergeRequestsTotal : 0;
        var critico = (int)(5 + (data.Commits / 200.0) + (mergeRatio * 20) + (data.AvgStars * 3) + (data.Reviews / 30.0));

        // Evasão: 5 + (projetos/10) + langs + orgs + (extProjetos/2) + (followers/500)
        var evasao = (int)(5 + (totalProjects / 10.0) + data.Languages + data.Organizations
                     + (data.ContributedProjects / 2.0) + (data.Followers / 500.0));

        // Armadura: 5 + (issues×0.5) + (reviews×0.8) + (commits/100) + (extCommits/20)
        var armadura = (int)(5 + (data.IssuesClosed * 0.5) + (data.Reviews * 0.8)
                       + (data.Commits / 100.0) + (data.CommitsExternal / 20.0));

        // Determinar reino (linguagem principal válida)
        var reino = DetermineKingdom(data);

        // Garantir valores mínimos
        hp = Math.Max(100, hp);
        dano = Math.Max(10, dano);
        velocidadeAtaque = Math.Max(1, velocidadeAtaque);
        velocidadeMovimento = Math.Max(50, velocidadeMovimento);
        critico = Math.Max(5, critico);
        evasao = Math.Max(5, evasao);
        armadura = Math.Max(5, armadura);

        return new PlayerStats(hp, dano, velocidadeAtaque, velocidadeMovimento, critico, evasao, armadura, reino);
    }

    private string DetermineKingdom(ProviderData data)
    {
        // Para HuggingFace, sempre IA
        if (data.Provider == "huggingface")
        {
            return "IA";
        }

        // Ordenar linguagens por quantidade
        var sortedLanguages = data.LanguageStats
            .OrderByDescending(kv => kv.Value)
            .ToList();

        // Encontrar a primeira linguagem válida como reino
        foreach (var lang in sortedLanguages)
        {
            var normalizedLang = NormalizeLanguageName(lang.Key);

            if (ValidKingdoms.Contains(normalizedLang))
            {
                return normalizedLang;
            }

            // Tentar mapear linguagem rara para reino válido
            var mappedKingdom = GitWorld.Shared.Territories.MapRareLanguage(normalizedLang);
            if (ValidKingdoms.Contains(mappedKingdom))
            {
                return mappedKingdom;
            }
        }

        // Fallback: usar MainLanguage
        if (!string.IsNullOrEmpty(data.MainLanguage) && data.MainLanguage != "Unknown")
        {
            var normalized = NormalizeLanguageName(data.MainLanguage);

            if (ValidKingdoms.Contains(normalized))
            {
                return normalized;
            }

            var mappedKingdom = GitWorld.Shared.Territories.MapRareLanguage(normalized);
            if (ValidKingdoms.Contains(mappedKingdom))
            {
                return mappedKingdom;
            }
        }

        // Fallback por provedor
        return data.Provider switch
        {
            "gitlab" => "Ruby",  // GitLab é feito em Ruby
            "huggingface" => "IA",  // HuggingFace users go to IA kingdom
            _ => "Python"  // Default para o maior território
        };
    }

    private static string NormalizeLanguageName(string language)
    {
        return language.ToLower() switch
        {
            "python" => "Python",
            "javascript" => "JavaScript",
            "typescript" => "TypeScript",
            "java" => "Java",
            "c#" => "C#",
            "csharp" => "C#",
            "go" => "Go",
            "golang" => "Go",
            "rust" => "Rust",
            "ruby" => "Ruby",
            "php" => "PHP",
            "c++" => "C++",
            "cpp" => "C++",
            "c" => "C",
            "swift" => "Swift",
            "kotlin" => "Kotlin",
            "shell" => "Shell",
            "bash" => "Shell",
            "scala" => "Scala",
            _ => language
        };
    }
}
