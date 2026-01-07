namespace GitWorld.Api.Models;

public record JoinRequest(string GithubUsername);
public record JoinResponse(Guid PlayerId, Guid EntityId, string GithubLogin, string Reino, float X, float Y, StreamInfo Stream);
public record StreamInfo(string StreamName, string Basin, string BaseUrl);
