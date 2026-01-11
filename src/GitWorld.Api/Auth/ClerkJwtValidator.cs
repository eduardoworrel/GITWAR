using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;

namespace GitWorld.Api.Auth;

public enum OAuthProvider
{
    GitHub,
    GitLab,
    HuggingFace,
    Unknown
}

public record ClerkUser(
    string ClerkId,
    OAuthProvider Provider,
    string? Username,
    string? Email
);

public record LinkedAccount(
    OAuthProvider Provider,
    string Username,
    string? AvatarUrl
);

public interface IClerkJwtValidator
{
    Task<ClerkUser?> ValidateTokenAsync(string token);
    Task<List<LinkedAccount>> GetLinkedAccountsAsync(string clerkUserId);
}

public class ClerkJwtValidator : IClerkJwtValidator
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ClerkJwtValidator> _logger;
    private readonly string _domain;
    private readonly string _secretKey;
    private JsonWebKeySet? _cachedJwks;
    private DateTime _jwksCacheExpiry = DateTime.MinValue;

    public ClerkJwtValidator(HttpClient httpClient, IConfiguration configuration, ILogger<ClerkJwtValidator> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _domain = configuration["Clerk:Domain"] ?? throw new ArgumentNullException("Clerk:Domain configuration is required");
        _secretKey = configuration["Clerk:SecretKey"] ?? "";
    }

    public async Task<ClerkUser?> ValidateTokenAsync(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();

            if (!handler.CanReadToken(token))
            {
                _logger.LogWarning("Cannot read JWT token");
                return null;
            }

            var jwtToken = handler.ReadJwtToken(token);

            // Get the JWKS
            var jwks = await GetJwksAsync();
            if (jwks == null)
            {
                _logger.LogWarning("Failed to get JWKS");
                return null;
            }

            // Validate the token
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = $"https://{_domain}",
                ValidateAudience = false,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = jwks.Keys,
                ClockSkew = TimeSpan.FromMinutes(5)
            };

            handler.ValidateToken(token, validationParameters, out _);

            // Extract user ID from token
            var clerkUserId = jwtToken.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
            if (string.IsNullOrEmpty(clerkUserId))
            {
                _logger.LogWarning("No sub claim in token");
                return null;
            }

            // Fetch user details from Clerk API to get provider and username
            var (provider, username) = await GetProviderAndUsernameFromClerkApi(clerkUserId);
            var email = jwtToken.Claims.FirstOrDefault(c => c.Type == "email")?.Value;

            _logger.LogInformation("Validated Clerk token for user {ClerkId}, Provider: {Provider}, Username: {Username}",
                clerkUserId, provider, username ?? "not found");

            return new ClerkUser(clerkUserId, provider, username, email);
        }
        catch (SecurityTokenException ex)
        {
            _logger.LogWarning(ex, "Token validation failed");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error validating token");
            return null;
        }
    }

    public async Task<List<LinkedAccount>> GetLinkedAccountsAsync(string clerkUserId)
    {
        var accounts = new List<LinkedAccount>();

        if (string.IsNullOrEmpty(_secretKey))
        {
            _logger.LogWarning("Clerk secret key not configured");
            return accounts;
        }

        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, $"https://api.clerk.com/v1/users/{clerkUserId}");
            request.Headers.Add("Authorization", $"Bearer {_secretKey}");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch user from Clerk API: {Status}", response.StatusCode);
                return accounts;
            }

            var content = await response.Content.ReadAsStringAsync();
            var json = JsonDocument.Parse(content);

            if (json.RootElement.TryGetProperty("external_accounts", out var externalAccounts))
            {
                foreach (var account in externalAccounts.EnumerateArray())
                {
                    if (account.TryGetProperty("provider", out var providerElement))
                    {
                        var providerString = providerElement.GetString()?.ToLower() ?? "";
                        string? username = null;
                        string? avatarUrl = null;

                        if (account.TryGetProperty("username", out var usernameElement))
                            username = usernameElement.GetString();

                        if (account.TryGetProperty("avatar_url", out var avatarElement))
                            avatarUrl = avatarElement.GetString();

                        // For HuggingFace, username might be null but we can use provider_user_id
                        // or extract from email
                        string? providerUserId = null;
                        if (account.TryGetProperty("provider_user_id", out var providerUserIdElement))
                            providerUserId = providerUserIdElement.GetString();

                        string? email = null;
                        if (account.TryGetProperty("email_address", out var emailElement))
                            email = emailElement.GetString();

                        OAuthProvider provider = OAuthProvider.Unknown;

                        if (providerString.Contains("github"))
                            provider = OAuthProvider.GitHub;
                        else if (providerString.Contains("gitlab"))
                            provider = OAuthProvider.GitLab;
                        else if (providerString.Contains("huggingface") || providerString.Contains("hugging"))
                            provider = OAuthProvider.HuggingFace;

                        if (provider != OAuthProvider.Unknown)
                        {
                            // Use username if available, otherwise use providerUserId for HuggingFace
                            var effectiveUsername = username;
                            if (string.IsNullOrEmpty(effectiveUsername) && provider == OAuthProvider.HuggingFace)
                            {
                                // HuggingFace doesn't always provide username via Clerk
                                // Use email prefix or provider_user_id as fallback
                                effectiveUsername = !string.IsNullOrEmpty(email)
                                    ? email.Split('@')[0]
                                    : providerUserId;
                            }

                            if (!string.IsNullOrEmpty(effectiveUsername))
                            {
                                accounts.Add(new LinkedAccount(provider, effectiveUsername, avatarUrl));
                            }
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching linked accounts from Clerk API");
        }

        return accounts;
    }

    private async Task<(OAuthProvider provider, string? username)> GetProviderAndUsernameFromClerkApi(string userId)
    {
        if (string.IsNullOrEmpty(_secretKey))
        {
            _logger.LogWarning("Clerk secret key not configured");
            return (OAuthProvider.Unknown, null);
        }

        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, $"https://api.clerk.com/v1/users/{userId}");
            request.Headers.Add("Authorization", $"Bearer {_secretKey}");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch user from Clerk API: {Status}", response.StatusCode);
                return (OAuthProvider.Unknown, null);
            }

            var content = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"[ClerkValidator] Clerk API response: {content}");
            var json = JsonDocument.Parse(content);

            // Check external_accounts for OAuth providers
            if (json.RootElement.TryGetProperty("external_accounts", out var externalAccounts))
            {
                Console.WriteLine($"[ClerkValidator] Found {externalAccounts.GetArrayLength()} external accounts");

                foreach (var account in externalAccounts.EnumerateArray())
                {
                    if (account.TryGetProperty("provider", out var providerElement))
                    {
                        var providerString = providerElement.GetString()?.ToLower() ?? "";
                        string? username = null;

                        if (account.TryGetProperty("username", out var usernameElement))
                        {
                            username = usernameElement.GetString();
                        }

                        Console.WriteLine($"[ClerkValidator] Account - Provider: '{providerString}', Username: '{username ?? "null"}'");

                        // Only return if we have a valid username
                        if (!string.IsNullOrEmpty(username))
                        {
                            // GitHub
                            if (providerString.Contains("github"))
                            {
                                return (OAuthProvider.GitHub, username);
                            }

                            // GitLab
                            if (providerString.Contains("gitlab"))
                            {
                                return (OAuthProvider.GitLab, username);
                            }

                            // HuggingFace (custom OAuth)
                            if (providerString.Contains("huggingface") || providerString.Contains("hugging"))
                            {
                                return (OAuthProvider.HuggingFace, username);
                            }
                        }
                        else
                        {
                            Console.WriteLine($"[ClerkValidator] Skipping {providerString} - no username");
                        }

                        if (string.IsNullOrEmpty(username))
                        {
                            Console.WriteLine($"[ClerkValidator] Unknown or incomplete provider: '{providerString}'");
                        }
                    }
                }
            }
            else
            {
                Console.WriteLine("[ClerkValidator] No external_accounts found in response");
            }

            // Fallback: check username field directly
            if (json.RootElement.TryGetProperty("username", out var directUsername))
            {
                return (OAuthProvider.Unknown, directUsername.GetString());
            }

            return (OAuthProvider.Unknown, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user info from Clerk API");
            return (OAuthProvider.Unknown, null);
        }
    }

    private async Task<JsonWebKeySet?> GetJwksAsync()
    {
        if (_cachedJwks != null && DateTime.UtcNow < _jwksCacheExpiry)
        {
            return _cachedJwks;
        }

        try
        {
            var jwksUrl = $"https://{_domain}/.well-known/jwks.json";
            var response = await _httpClient.GetStringAsync(jwksUrl);
            _cachedJwks = new JsonWebKeySet(response);
            _jwksCacheExpiry = DateTime.UtcNow.AddHours(1);
            return _cachedJwks;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch JWKS from Clerk");
            return _cachedJwks;
        }
    }
}
