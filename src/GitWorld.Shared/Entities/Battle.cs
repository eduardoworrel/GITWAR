namespace GitWorld.Shared.Entities;

public class Battle
{
    public Guid Id { get; set; }

    public Guid Player1Id { get; set; }
    public Player Player1 { get; set; } = null!;

    public Guid Player2Id { get; set; }
    public Player Player2 { get; set; } = null!;

    public Guid? WinnerId { get; set; }
    public Player? Winner { get; set; }

    public int DurationMs { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
