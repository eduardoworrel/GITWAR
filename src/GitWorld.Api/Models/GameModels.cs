namespace GitWorld.Api.Models;

public record JoinRequest(string GithubUsername);
public record JoinResponse(Guid PlayerId, Guid EntityId, string GithubLogin, string Reino, float X, float Y, StreamInfo Stream);
public record StreamInfo(string StreamName, string Basin, string BaseUrl, string? ReadToken = null);

// Scripting models
public record ScriptRequest(string Script);
public record ScriptToggleRequest(bool Enabled);
