namespace GitWorld.Shared.Entities;

public class Item
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Tier { get; set; } = "F";

    // Stats bonuses (podem ser negativos)
    public int DanoBonus { get; set; }
    public int ArmaduraBonus { get; set; }
    public int HpBonus { get; set; }
    public int CriticoBonus { get; set; }
    public int EvasaoBonus { get; set; }
    public int VelocidadeAtaqueBonus { get; set; }
    public int VelocidadeMovimentoBonus { get; set; }

    // Duracao em minutos (NULL = permanente)
    public int? DurationMinutes { get; set; }

    // Condicao especial ("top_1", "top_3", "streak")
    public string? DurationCondition { get; set; }

    // Visual
    public string? VisualDescription { get; set; }

    // Price based on tier
    public int Price { get; set; } = 0;

    // Navegacao
    public ICollection<PlayerItem> PlayerItems { get; set; } = new List<PlayerItem>();
}
