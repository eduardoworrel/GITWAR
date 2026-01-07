namespace GitWorld.Api.Auth;

public class ClerkAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ClerkAuthMiddleware> _logger;

    public ClerkAuthMiddleware(RequestDelegate next, ILogger<ClerkAuthMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IClerkJwtValidator validator)
    {
        _logger.LogInformation("[ClerkMiddleware] Request: {Method} {Path}", context.Request.Method, context.Request.Path);
        var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
        _logger.LogInformation("[ClerkMiddleware] Auth header present: {HasAuth}", !string.IsNullOrEmpty(authHeader));

        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation("[ClerkMiddleware] Calling validator...");
            var token = authHeader.Substring(7);
            var user = await validator.ValidateTokenAsync(token);

            if (user != null)
            {
                context.Items["ClerkUser"] = user;
                _logger.LogInformation("[ClerkMiddleware] User authenticated: {ClerkId}, Provider: {Provider}, Username: {Username}", user.ClerkId, user.Provider, user.Username ?? "null");
            }
            else
            {
                _logger.LogWarning("[ClerkMiddleware] Validator returned null");
            }
        }

        await _next(context);
    }
}

public static class ClerkAuthMiddlewareExtensions
{
    public static IApplicationBuilder UseClerkAuth(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ClerkAuthMiddleware>();
    }
}
