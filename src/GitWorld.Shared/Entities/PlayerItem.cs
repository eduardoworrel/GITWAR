namespace GitWorld.Shared.Entities;

public class PlayerItem
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }
    public Guid ItemId { get; set; }

    public DateTime AcquiredAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public bool IsEquipped { get; set; }

    // Navegacao
    public Player Player { get; set; } = null!;
    public Item Item { get; set; } = null!;
}
