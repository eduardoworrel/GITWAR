namespace GitWorld.Api.Core;

public class PlayerSession
{
    public Guid PlayerId { get; init; }
    public Guid EntityId { get; init; }
    public string GithubLogin { get; init; } = string.Empty;
    public DateTime JoinedAt { get; init; } = DateTime.UtcNow;
    public DateTime LastHeartbeat { get; set; } = DateTime.UtcNow;
    public string StreamName { get; init; } = string.Empty;
}
