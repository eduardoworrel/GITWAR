namespace GitWorld.Api.Core;

/// <summary>
/// Activity level determines broadcast frequency.
/// Higher activity = more frequent updates.
/// </summary>
public enum PlayerActivityLevel
{
    Idle,    // 2 updates/s (every 10 ticks)
    Moving,  // 5 updates/s (every 4 ticks)
    Combat   // 10 updates/s (every 2 ticks)
}

public class PlayerSession
{
    public Guid PlayerId { get; init; }
    public Guid EntityId { get; init; }
    public string GithubLogin { get; init; } = string.Empty;
    public DateTime JoinedAt { get; init; } = DateTime.UtcNow;
    public DateTime LastHeartbeat { get; set; } = DateTime.UtcNow;
    public string StreamName { get; init; } = string.Empty;

    // Adaptive frequency tracking
    public PlayerActivityLevel ActivityLevel { get; set; } = PlayerActivityLevel.Idle;
    public long LastBroadcastTick { get; set; } = 0;
}
