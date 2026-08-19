using System.Diagnostics;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Exceptions;

namespace ShaktiUdyog.Api.Infrastructure;

/// <summary>
/// Centralized ASP.NET Core exception handler implementing RFC 7807 / RFC 9110 Problem Details.
/// Maps domain, security, validation, database concurrency, and unhandled system exceptions
/// to standardized JSON error responses with distributed trace IDs.
/// </summary>
public sealed class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    IHostEnvironment environment) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        // If the client aborted the request (e.g. navigation cancelled or timeout), log and exit gracefully
        if (exception is OperationCanceledException && httpContext.RequestAborted.IsCancellationRequested)
        {
            logger.LogInformation("Request was cancelled by the client. Path: {Path}", httpContext.Request.Path);
            return true;
        }

        var traceId = Activity.Current?.Id ?? httpContext.TraceIdentifier;
        var (statusCode, title, detail, errorCode, errorType, validationErrors) = MapException(exception);

        // Server errors (5xx) log as Error with full stack trace; Client errors (4xx) log as Warning
        if (statusCode >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Unhandled server error [HTTP {StatusCode}]: {Message}. TraceId: {TraceId}, Path: {Path}",
                statusCode, exception.Message, traceId, httpContext.Request.Path);
        }
        else
        {
            logger.LogWarning("Client application error [HTTP {StatusCode} - {ErrorCode}]: {Message}. TraceId: {TraceId}, Path: {Path}",
                statusCode, errorCode, detail, traceId, httpContext.Request.Path);
        }

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Type = errorType,
            Instance = httpContext.Request.Path
        };

        problemDetails.Extensions["traceId"] = traceId;
        problemDetails.Extensions["timestamp"] = DateTimeOffset.UtcNow;
        problemDetails.Extensions["errorCode"] = errorCode;

        if (validationErrors != null && validationErrors.Count > 0)
        {
            problemDetails.Extensions["errors"] = validationErrors;
        }

        // In Development, attach debug details for rapid diagnosing
        if (environment.IsDevelopment() && statusCode >= StatusCodes.Status500InternalServerError)
        {
            problemDetails.Extensions["exceptionType"] = exception.GetType().FullName;
            problemDetails.Extensions["stackTrace"] = exception.StackTrace;
        }

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/problem+json";
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }

    private static (
        int StatusCode,
        string Title,
        string Detail,
        string ErrorCode,
        string ErrorType,
        IDictionary<string, string[]>? ValidationErrors
    ) MapException(Exception ex)
    {
        return ex switch
        {
            // ── Domain Specific Exceptions ──────────────────────────────────
            NotFoundException nf => (
                StatusCodes.Status404NotFound,
                "Resource Not Found",
                nf.Message,
                nf.ErrorCode,
                "https://tools.ietf.org/html/rfc9110#section-15.5.5",
                null
            ),

            KeyNotFoundException knf => (
                StatusCodes.Status404NotFound,
                "Resource Not Found",
                knf.Message,
                "NOT_FOUND",
                "https://tools.ietf.org/html/rfc9110#section-15.5.5",
                null
            ),

            ForbiddenAccessException fa => (
                StatusCodes.Status403Forbidden,
                "Forbidden Access",
                fa.Message,
                fa.ErrorCode,
                "https://tools.ietf.org/html/rfc9110#section-15.5.4",
                null
            ),

            UnauthorizedAccessException ua => (
                StatusCodes.Status401Unauthorized,
                "Unauthorized",
                string.IsNullOrWhiteSpace(ua.Message) ? "Authentication credentials are required to access this resource." : ua.Message,
                "UNAUTHORIZED",
                "https://tools.ietf.org/html/rfc9110#section-15.5.2",
                null
            ),

            ConflictException ce => (
                StatusCodes.Status409Conflict,
                "Resource Conflict",
                ce.Message,
                ce.ErrorCode,
                "https://tools.ietf.org/html/rfc9110#section-15.5.10",
                null
            ),

            InvalidStateTransitionException ist => (
                StatusCodes.Status422UnprocessableEntity,
                "Invalid State Transition",
                ist.Message,
                ist.ErrorCode,
                "https://tools.ietf.org/html/rfc9110#section-15.5.21",
                null
            ),

            DomainValidationException ve => (
                StatusCodes.Status422UnprocessableEntity,
                "Validation Failure",
                ve.Message,
                ve.ErrorCode,
                "https://tools.ietf.org/html/rfc9110#section-15.5.21",
                ve.Errors
            ),

            FileValidationException fv => (
                StatusCodes.Status400BadRequest,
                "Invalid File Upload",
                fv.Message,
                fv.ErrorCode,
                "https://tools.ietf.org/html/rfc9110#section-15.5.1",
                null
            ),

            // ── Database & EF Core Concurrency / Constraint Exceptions ───────
            DbUpdateConcurrencyException => (
                StatusCodes.Status409Conflict,
                "Concurrency Conflict",
                "The record was modified or deleted by another user or operation since it was loaded. Please reload and retry.",
                "CONCURRENCY_CONFLICT",
                "https://tools.ietf.org/html/rfc9110#section-15.5.10",
                null
            ),

            DbUpdateException dbEx when IsUniqueConstraintViolation(dbEx) => (
                StatusCodes.Status409Conflict,
                "Unique Constraint Violation",
                "A record with one or more duplicate unique fields (e.g. code, email, GST, PAN) already exists.",
                "DUPLICATE_ENTITY",
                "https://tools.ietf.org/html/rfc9110#section-15.5.10",
                null
            ),

            DbUpdateException dbEx when IsForeignKeyViolation(dbEx) => (
                StatusCodes.Status400BadRequest,
                "Reference Constraint Violation",
                "The operation cannot be completed because a referenced relational entity does not exist or has active dependencies.",
                "FOREIGN_KEY_VIOLATION",
                "https://tools.ietf.org/html/rfc9110#section-15.5.1",
                null
            ),

            // ── Standard Framework & Argument Exceptions ─────────────────────
            ArgumentNullException ane => (
                StatusCodes.Status400BadRequest,
                "Missing Required Argument",
                $"Required argument '{ane.ParamName}' was null or missing.",
                "MISSING_ARGUMENT",
                "https://tools.ietf.org/html/rfc9110#section-15.5.1",
                null
            ),

            ArgumentException ae => (
                StatusCodes.Status400BadRequest,
                "Invalid Argument",
                ae.Message,
                "INVALID_ARGUMENT",
                "https://tools.ietf.org/html/rfc9110#section-15.5.1",
                null
            ),

            BadHttpRequestException bhe => (
                StatusCodes.Status400BadRequest,
                "Malformed HTTP Request",
                bhe.Message,
                "BAD_REQUEST",
                "https://tools.ietf.org/html/rfc9110#section-15.5.1",
                null
            ),

            // ── Fallback Internal Server Error (500) ─────────────────────────
            _ => (
                StatusCodes.Status500InternalServerError,
                "An unexpected error occurred",
                "An internal server error occurred while processing your request. Please quote the trace ID when reporting this issue.",
                "INTERNAL_SERVER_ERROR",
                "https://tools.ietf.org/html/rfc9110#section-15.6.1",
                null
            )
        };
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        if (ex.InnerException is SqlException sqlEx)
        {
            // SQL Server Error numbers: 2601 (Cannot insert duplicate key row) and 2627 (Violation of PRIMARY KEY / UNIQUE constraint)
            return sqlEx.Number is 2601 or 2627;
        }
        return false;
    }

    private static bool IsForeignKeyViolation(DbUpdateException ex)
    {
        if (ex.InnerException is SqlException sqlEx)
        {
            // SQL Server Error number: 547 (The INSERT/UPDATE/DELETE statement conflicted with the FOREIGN KEY constraint)
            return sqlEx.Number is 547;
        }
        return false;
    }
}
