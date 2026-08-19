using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using ShaktiUdyog.Api.Infrastructure;
using ShaktiUdyog.Domain.Exceptions;

namespace ShaktiUdyog.Api.Tests;

public class ExceptionHandlerTests
{
    private readonly GlobalExceptionHandler _handler;

    public ExceptionHandlerTests()
    {
        var env = new TestHostEnvironment { EnvironmentName = Environments.Production };
        _handler = new GlobalExceptionHandler(NullLogger<GlobalExceptionHandler>.Instance, env);
    }

    private static (DefaultHttpContext Context, MemoryStream Stream) CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        var stream = new MemoryStream();
        context.Response.Body = stream;
        context.Request.Path = "/api/v1/test-endpoint";
        return (context, stream);
    }

    private static async Task<JsonElement> ReadProblemDetailsAsync(MemoryStream stream)
    {
        stream.Seek(0, SeekOrigin.Begin);
        var doc = await JsonDocument.ParseAsync(stream);
        return doc.RootElement;
    }

    [Fact]
    public async Task NotFoundException_returns_404_problem_details()
    {
        var (context, stream) = CreateHttpContext();
        var ex = new NotFoundException("Order", Guid.NewGuid());

        var handled = await _handler.TryHandleAsync(context, ex, CancellationToken.None);

        Assert.True(handled);
        Assert.Equal(StatusCodes.Status404NotFound, context.Response.StatusCode);
        var json = await ReadProblemDetailsAsync(stream);
        Assert.Equal(404, json.GetProperty("status").GetInt32());
        Assert.Equal("Resource Not Found", json.GetProperty("title").GetString());
        Assert.Equal("NOT_FOUND", json.GetProperty("errorCode").GetString());
    }

    [Fact]
    public async Task ForbiddenAccessException_returns_403_problem_details()
    {
        var (context, stream) = CreateHttpContext();
        var ex = new ForbiddenAccessException("Access to this company's invoice is restricted.");

        var handled = await _handler.TryHandleAsync(context, ex, CancellationToken.None);

        Assert.True(handled);
        Assert.Equal(StatusCodes.Status403Forbidden, context.Response.StatusCode);
        var json = await ReadProblemDetailsAsync(stream);
        Assert.Equal(403, json.GetProperty("status").GetInt32());
        Assert.Equal("Forbidden Access", json.GetProperty("title").GetString());
        Assert.Equal("FORBIDDEN", json.GetProperty("errorCode").GetString());
    }

    [Fact]
    public async Task DomainValidationException_returns_422_with_validation_errors()
    {
        var (context, stream) = CreateHttpContext();
        var errors = new Dictionary<string, string[]>
        {
            { "Email", ["Invalid email format."] },
            { "GstNumber", ["GST number must be 15 alphanumeric characters."] }
        };
        var ex = new DomainValidationException(errors);

        var handled = await _handler.TryHandleAsync(context, ex, CancellationToken.None);

        Assert.True(handled);
        Assert.Equal(StatusCodes.Status422UnprocessableEntity, context.Response.StatusCode);
        var json = await ReadProblemDetailsAsync(stream);
        Assert.Equal(422, json.GetProperty("status").GetInt32());
        Assert.Equal("VALIDATION_FAILED", json.GetProperty("errorCode").GetString());
        Assert.True(json.TryGetProperty("errors", out var errorsProp));
        Assert.True(errorsProp.TryGetProperty("Email", out _));
        Assert.True(errorsProp.TryGetProperty("GstNumber", out _));
    }

    [Fact]
    public async Task ConflictException_returns_409_problem_details()
    {
        var (context, stream) = CreateHttpContext();
        var ex = new ConflictException("ProductCode", "PRD-001", "Product code already exists.");

        var handled = await _handler.TryHandleAsync(context, ex, CancellationToken.None);

        Assert.True(handled);
        Assert.Equal(StatusCodes.Status409Conflict, context.Response.StatusCode);
        var json = await ReadProblemDetailsAsync(stream);
        Assert.Equal(409, json.GetProperty("status").GetInt32());
        Assert.Equal("CONFLICT", json.GetProperty("errorCode").GetString());
    }

    [Fact]
    public async Task InvalidStateTransitionException_returns_422_problem_details()
    {
        var (context, stream) = CreateHttpContext();
        var ex = new InvalidStateTransitionException("Order", "Draft", "Dispatched");

        var handled = await _handler.TryHandleAsync(context, ex, CancellationToken.None);

        Assert.True(handled);
        Assert.Equal(StatusCodes.Status422UnprocessableEntity, context.Response.StatusCode);
        var json = await ReadProblemDetailsAsync(stream);
        Assert.Equal(422, json.GetProperty("status").GetInt32());
        Assert.Equal("INVALID_STATE_TRANSITION", json.GetProperty("errorCode").GetString());
    }

    [Fact]
    public async Task FileValidationException_returns_400_problem_details()
    {
        var (context, stream) = CreateHttpContext();
        var ex = new FileValidationException("File extension '.exe' is not supported.");

        var handled = await _handler.TryHandleAsync(context, ex, CancellationToken.None);

        Assert.True(handled);
        Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
        var json = await ReadProblemDetailsAsync(stream);
        Assert.Equal(400, json.GetProperty("status").GetInt32());
        Assert.Equal("FILE_VALIDATION_ERROR", json.GetProperty("errorCode").GetString());
    }

    [Fact]
    public async Task Unhandled_Exception_returns_500_and_masks_internal_details_in_production()
    {
        var (context, stream) = CreateHttpContext();
        var ex = new InvalidOperationException("Sensitive database credentials or SQL syntax error");

        var handled = await _handler.TryHandleAsync(context, ex, CancellationToken.None);

        Assert.True(handled);
        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        var json = await ReadProblemDetailsAsync(stream);
        Assert.Equal(500, json.GetProperty("status").GetInt32());
        Assert.Equal("INTERNAL_SERVER_ERROR", json.GetProperty("errorCode").GetString());
        // Detail should be generic in production
        Assert.Contains("internal server error occurred", json.GetProperty("detail").GetString()!);
        Assert.False(json.TryGetProperty("stackTrace", out _));
    }

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Production;
        public string ApplicationName { get; set; } = "ShaktiUdyog.Api";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
