namespace GitWorld.Api.Providers;

/// <summary>
/// Interface comum para buscar dados de qualquer provedor.
/// </summary>
public interface IProviderFetcher
{
    /// <summary>
    /// Nome do provedor (github, gitlab, huggingface).
    /// </summary>
    string ProviderName { get; }

    /// <summary>
    /// Busca dados do usuário no provedor.
    /// </summary>
    Task<ProviderData> FetchUserDataAsync(string username, string? accessToken = null);
}
