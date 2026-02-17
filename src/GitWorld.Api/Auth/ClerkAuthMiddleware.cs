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
        var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();

        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            var token = authHeader.Substring(7);
            var user = await validator.ValidateTokenAsync(token);

            if (user != null)
            {
                context.Items["ClerkUser"] = user;
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
