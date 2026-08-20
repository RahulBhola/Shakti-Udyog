using System.Diagnostics;
using System.Security.Claims;

namespace ShaktiUdyog.Api.Infrastructure.Performance;

/// <summary>
/// High-resolution request performance profiling middleware.
/// Injects W3C 'Server-Timing' and 'X-Response-Time-Ms' response headers,
/// and logs warnings for any slow HTTP transactions (> 500ms).
/// </summary>
public class PerformanceMonitoringMiddleware(
    RequestDelegate next,
    ILogger<PerformanceMonitoringMiddleware> logger)
{
    private const long SlowRequestThresholdMs = 500;

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();

        context.Response.OnStarting(() =>
        {
            sw.Stop();
            var elapsedMs = sw.Elapsed.TotalMilliseconds;

            // Injects W3C Server-Timing header (standard for browser devtools & APMs)
            context.Response.Headers["Server-Timing"] = $"total;dur={elapsedMs:F2}";
            context.Response.Headers["X-Response-Time-Ms"] = $"{elapsedMs:F2}";

            if (elapsedMs >= SlowRequestThresholdMs)
            {
                var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
                logger.LogWarning(
                    "SLOW REQUEST DETECTED: [{Method}] {Path} responded in {ElapsedMs:F2}ms (HTTP {StatusCode}) - User: {UserId}",
                    context.Request.Method,
                    context.Request.Path,
                    elapsedMs,
                    context.Response.StatusCode,
                    userId);
            }

            return Task.CompletedTask;
        });

        await next(context);
    }
}
