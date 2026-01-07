namespace GitWorld.Shared;

/// <summary>
/// Sistema de territórios para os reinos.
/// Cada reino ocupa uma região do mapa onde jogadores dessa linguagem spawnam.
/// Layout do mapa 10000x10000:
///
/// ┌──────────┬─────────────────────────────────────────────────────┬──────────┐
/// │  SWIFT   │                       RUST                          │  KOTLIN  │
/// │   (2%)   │                       (3%)                          │   (2%)   │
/// ├──────────┼──────────────────────┬──────────────────────────────┼──────────┤
/// │   RUBY   │         GO           │           JAVA               │    C#    │
/// │   (5%)   │        (10%)         │           (12%)              │   (4%)   │
/// ├──────────┤                      │                              ├──────────┤
/// │  SHELL   ├──────────────────────┴───────────────────┬──────────┤   PHP    │
/// │   (3%)   │              PYTHON (14%)                │    IA    │   (5%)   │
/// ├──────────┤                                          │   (3%)   ├──────────┤
/// │    C     │                                          │ HuggingF │  SCALA   │
/// │   (4%)   │                                          │          │   (1%)   │
/// ├──────────┼──────────────────────────────────────────┴──────────┼──────────┤
/// │   C++    │                   JAVASCRIPT (10%)                  │TYPESCRIPT│
/// │   (9%)   │                                                     │   (8%)   │
/// └──────────┴─────────────────────────────────────────────────────┴──────────┘
/// </summary>
public static class Territories
{
    public record TerritoryBounds(
        int X,        // Canto superior esquerdo X
        int Y,        // Canto superior esquerdo Y
        int Width,    // Largura
        int Height    // Altura
    );

    public record Kingdom(
        string Name,
        string Language,
        TerritoryBounds Bounds,
        string[] Neighbors
    );

    // Constantes de layout
    private const int LeftColumnWidth = 1000;
    private const int RightColumnWidth = 1000;
    private const int CenterColumnWidth = 8000;
    private const int IAColumnWidth = 1500;     // Novo território IA
    private const int PythonWidth = CenterColumnWidth - IAColumnWidth;  // 6500

    // Alturas das linhas
    private const int TopRowHeight = 1000;      // Swift, Rust, Kotlin
    private const int UpperRowHeight = 2000;    // Ruby/Go/Java/C#
    private const int MiddleRowHeight = 3000;   // Shell/Python/IA/PHP
    private const int LowerRowHeight = 2000;    // C/Python cont/Scala
    private const int BottomRowHeight = 2000;   // C++/JavaScript/TypeScript

    public static readonly Dictionary<string, Kingdom> Kingdoms = new()
    {
        // === LINHA SUPERIOR (Y: 0-1000) ===
        ["Swift"] = new(
            "Reino Swift",
            "Swift",
            new(0, 0, LeftColumnWidth, TopRowHeight),
            new[] { "Rust", "Ruby" }
        ),
        ["Rust"] = new(
            "Reino Rust",
            "Rust",
            new(LeftColumnWidth, 0, CenterColumnWidth, TopRowHeight),
            new[] { "Swift", "Kotlin", "Go", "Java" }
        ),
        ["Kotlin"] = new(
            "Reino Kotlin",
            "Kotlin",
            new(LeftColumnWidth + CenterColumnWidth, 0, RightColumnWidth, TopRowHeight),
            new[] { "Rust", "C#" }
        ),

        // === SEGUNDA LINHA (Y: 1000-3000) ===
        ["Ruby"] = new(
            "Reino Ruby",
            "Ruby",
            new(0, TopRowHeight, LeftColumnWidth, UpperRowHeight),
            new[] { "Swift", "Shell", "Go" }
        ),
        ["Go"] = new(
            "Reino Go",
            "Go",
            new(LeftColumnWidth, TopRowHeight, CenterColumnWidth / 2, UpperRowHeight),
            new[] { "Rust", "Ruby", "Java", "Python", "Shell" }
        ),
        ["Java"] = new(
            "Reino Java",
            "Java",
            new(LeftColumnWidth + CenterColumnWidth / 2, TopRowHeight, CenterColumnWidth / 2, UpperRowHeight),
            new[] { "Rust", "Go", "Kotlin", "C#", "Python", "PHP" }
        ),
        ["C#"] = new(
            "Reino C#",
            "C#",
            new(LeftColumnWidth + CenterColumnWidth, TopRowHeight, RightColumnWidth, UpperRowHeight),
            new[] { "Kotlin", "Java", "PHP" }
        ),

        // === LINHA DO MEIO (Y: 3000-6000) ===
        ["Shell"] = new(
            "Reino Shell",
            "Shell",
            new(0, TopRowHeight + UpperRowHeight, LeftColumnWidth, MiddleRowHeight / 2),
            new[] { "Ruby", "C", "Python" }
        ),
        ["Python"] = new(
            "Reino Python",
            "Python",
            new(LeftColumnWidth, TopRowHeight + UpperRowHeight, PythonWidth, MiddleRowHeight),
            new[] { "Go", "Java", "Shell", "C", "C++", "JavaScript", "IA" }
        ),
        ["IA"] = new(
            "Reino IA",
            "IA",
            new(LeftColumnWidth + PythonWidth, TopRowHeight + UpperRowHeight, IAColumnWidth, MiddleRowHeight),
            new[] { "Python", "Java", "PHP", "Scala", "JavaScript" }
        ),
        ["PHP"] = new(
            "Reino PHP",
            "PHP",
            new(LeftColumnWidth + CenterColumnWidth, TopRowHeight + UpperRowHeight, RightColumnWidth, MiddleRowHeight / 2),
            new[] { "C#", "Java", "IA", "Scala" }
        ),

        // === QUARTA LINHA (Y: 4500-6000 para C, 4500-6000 para Scala) ===
        ["C"] = new(
            "Reino C",
            "C",
            new(0, TopRowHeight + UpperRowHeight + MiddleRowHeight / 2, LeftColumnWidth, MiddleRowHeight / 2),
            new[] { "Shell", "C++", "Python" }
        ),
        ["Scala"] = new(
            "Reino Scala",
            "Scala",
            new(LeftColumnWidth + CenterColumnWidth, TopRowHeight + UpperRowHeight + MiddleRowHeight / 2, RightColumnWidth, MiddleRowHeight / 2),
            new[] { "PHP", "IA", "TypeScript" }
        ),

        // === LINHA INFERIOR (Y: 8000-10000) ===
        ["C++"] = new(
            "Reino C++",
            "C++",
            new(0, TopRowHeight + UpperRowHeight + MiddleRowHeight, LeftColumnWidth, BottomRowHeight),
            new[] { "C", "JavaScript", "Python" }
        ),
        ["JavaScript"] = new(
            "Reino JavaScript",
            "JavaScript",
            new(LeftColumnWidth, TopRowHeight + UpperRowHeight + MiddleRowHeight, CenterColumnWidth, BottomRowHeight),
            new[] { "Python", "C++", "TypeScript" }
        ),
        ["TypeScript"] = new(
            "Reino TypeScript",
            "TypeScript",
            new(LeftColumnWidth + CenterColumnWidth, TopRowHeight + UpperRowHeight + MiddleRowHeight, RightColumnWidth, BottomRowHeight),
            new[] { "JavaScript", "Scala" }
        ),
    };

    /// <summary>
    /// Mapeamento de linguagens raras para reinos válidos.
    /// Quando um jogador usa uma linguagem não suportada, é mapeado para reino relacionado.
    /// </summary>
    public static readonly Dictionary<string, string> RareLanguageMapping = new(StringComparer.OrdinalIgnoreCase)
    {
        // Funcionais → Scala
        ["Haskell"] = "Scala",
        ["Elixir"] = "Scala",
        ["Erlang"] = "Scala",
        ["Clojure"] = "Scala",
        ["F#"] = "Scala",
        ["OCaml"] = "Scala",
        ["Scheme"] = "Scala",
        ["Lisp"] = "Scala",
        ["Common Lisp"] = "Scala",
        ["Racket"] = "Scala",

        // Scripting → Python
        ["Perl"] = "Python",
        ["Lua"] = "Python",
        ["R"] = "Python",
        ["Julia"] = "Python",
        ["MATLAB"] = "Python",
        ["PowerShell"] = "Shell",
        ["Makefile"] = "Shell",
        ["Dockerfile"] = "Shell",

        // Mobile → Swift/Kotlin
        ["Dart"] = "Kotlin",
        ["Objective-C"] = "Swift",
        ["Objective-C++"] = "Swift",

        // Sistemas → Rust/C++
        ["Zig"] = "Rust",
        ["Nim"] = "Rust",
        ["D"] = "C++",
        ["Assembly"] = "C",

        // Web → JavaScript/TypeScript
        ["CoffeeScript"] = "JavaScript",
        ["Elm"] = "TypeScript",
        ["ReasonML"] = "TypeScript",
        ["PureScript"] = "TypeScript",
        ["Vue"] = "JavaScript",
        ["Svelte"] = "JavaScript",

        // Legadas → Java/C#
        ["COBOL"] = "Java",
        ["Fortran"] = "C",
        ["Pascal"] = "C",
        ["Delphi"] = "C",
        ["Visual Basic"] = "C#",
        ["VB.NET"] = "C#",
        ["Groovy"] = "Java",

        // Outros
        ["HTML"] = "JavaScript",
        ["CSS"] = "JavaScript",
        ["SCSS"] = "JavaScript",
        ["Sass"] = "JavaScript",
        ["Less"] = "JavaScript",
        ["SQL"] = "Java",
        ["PLSQL"] = "Java",
        ["Solidity"] = "JavaScript",
    };

    /// <summary>
    /// Retorna a posição de spawn para um jogador.
    /// Todos spawnam no centro da mesa (spawn único).
    /// </summary>
    public static (float x, float y) GetSpawnPosition(string reino, Random random)
    {
        // Spawn único no centro da mesa com pequena variação para não empilhar
        var offsetX = (random.NextSingle() - 0.5f) * 200;
        var offsetY = (random.NextSingle() - 0.5f) * 200;
        return (GameConstants.SpawnX + offsetX, GameConstants.SpawnY + offsetY);
    }

    /// <summary>
    /// Mapeia linguagens raras para reinos válidos.
    /// </summary>
    public static string MapRareLanguage(string language)
    {
        if (string.IsNullOrEmpty(language))
            return "Python";

        // Se já é um reino válido, retorna direto
        if (Kingdoms.ContainsKey(language))
            return language;

        // Tentar mapear linguagem rara
        if (RareLanguageMapping.TryGetValue(language, out var mapped))
            return mapped;

        // Fallback para Python
        return "Python";
    }

    /// <summary>
    /// Verifica se uma posição está dentro de um território.
    /// </summary>
    public static bool IsInTerritory(float x, float y, string reino)
    {
        if (!Kingdoms.TryGetValue(reino, out var kingdom))
            return false;

        var bounds = kingdom.Bounds;
        return x >= bounds.X && x < bounds.X + bounds.Width &&
               y >= bounds.Y && y < bounds.Y + bounds.Height;
    }

    /// <summary>
    /// Retorna o reino em uma posição específica.
    /// </summary>
    public static string? GetKingdomAt(float x, float y)
    {
        foreach (var (name, kingdom) in Kingdoms)
        {
            var bounds = kingdom.Bounds;
            if (x >= bounds.X && x < bounds.X + bounds.Width &&
                y >= bounds.Y && y < bounds.Y + bounds.Height)
            {
                return name;
            }
        }
        return null;
    }
}
