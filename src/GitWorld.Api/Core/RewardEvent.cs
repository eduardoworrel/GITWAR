namespace GitWorld.Api.Core;

/// <summary>
/// Represents a reward event to be displayed on the client
/// </summary>
public class RewardEvent
{
    public Guid PlayerId { get; init; }
    public float X { get; init; }
    public float Y { get; init; }
    public int ExpGained { get; init; }
    public int GoldGained { get; init; }
    public bool LeveledUp { get; init; }
    public int NewLevel { get; init; }
    public string Source { get; init; } = string.Empty; // e.g., "Bug", "Boss", "Player:username"
    public long Tick { get; init; }
}

/// <summary>
/// Represents a level up event with stat bonuses
/// </summary>
public class LevelUpEvent
{
    public Guid PlayerId { get; init; }
    public string PlayerName { get; init; } = string.Empty;
    public int OldLevel { get; init; }
    public int NewLevel { get; init; }
    public float X { get; init; }
    public float Y { get; init; }
    public long Tick { get; init; }
}
