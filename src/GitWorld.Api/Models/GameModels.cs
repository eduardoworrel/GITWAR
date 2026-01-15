namespace GitWorld.Api.Models;

public record JoinRequest(string GithubUsername);
public record JoinResponse(Guid PlayerId, Guid EntityId, string GithubLogin, string Reino, float X, float Y, StreamInfo Stream, List<EntityInfo>? InitialState = null);
public record StreamInfo(string StreamName, string Basin, string BaseUrl, string? ReadToken = null);

// Full entity info for initial state
public record EntityInfo(
    Guid Id,
    string Login,
    float X,
    float Y,
    int Hp,
    int HpMax,
    string Estado,
    string Reino,
    string Type,
    int Level,
    int Exp,
    int Gold,
    int Dano,
    int Critico,
    int Evasao,
    int Armadura,
    int VelocidadeAtaque,
    int VelocidadeMovimento,
    int Elo,
    int Vitorias,
    int Derrotas
);

// Scripting models
public record ScriptRequest(string Script);
public record ScriptToggleRequest(bool Enabled);
