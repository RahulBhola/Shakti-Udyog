using System.Diagnostics;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace ShaktiUdyog.Api.Infrastructure;

/// <summary>
/// Converts unhandled exceptions into a consistent RFC 7807 ProblemDetails
/// response carrying a trace ID. Internal exception details are logged
/// server-side and never returned to the client.
/// </summary>
public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var traceId = Activity.Current?.Id ?? httpContext.TraceIdentifier;

        logger.LogError(exception, "Unhandled exception. TraceId: {TraceId}", traceId);

        var problemDetails = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "An unexpected error occurred.",
            Detail = "The request could not be processed. Quote the trace ID when contacting support.",
            Type = "https://tools.ietf.org/html/rfc9110#section-15.6.1",
        };
        problemDetails.Extensions["traceId"] = traceId;

        httpContext.Response.StatusCode = problemDetails.Status.Value;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}
