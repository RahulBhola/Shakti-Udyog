using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Tests;

/// <summary>
/// Boots the real API pipeline. The DbContext keeps its SQL Server provider but
/// points at a test connection string that these tests never open — no endpoint
/// under test touches the database. Startup role seeding is skipped gracefully
/// when the database is unreachable in Development.
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting(
            "ConnectionStrings:DefaultConnection",
            "Server=localhost;Database=ShaktiUdyogTests;Trusted_Connection=True;TrustServerCertificate=True");
    }
}

public class MetaEndpointTests : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client;

    public MetaEndpointTests(ApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Meta_endpoint_returns_api_identity()
    {
        var response = await _client.GetAsync("/api/v1/meta");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<MetaResponse>();
        Assert.NotNull(body);
        Assert.Equal("Shakti Udyog API", body!.Name);
        Assert.Equal("v1", body.ApiVersion);
    }

    [Fact]
    public async Task Unknown_route_returns_404()
    {
        var response = await _client.GetAsync("/api/v1/does-not-exist");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private sealed record MetaResponse(string Name, string ApiVersion, string Environment);
}

public class RoleConstantTests
{
    [Fact]
    public void All_three_roles_are_defined()
    {
        Assert.Equal(
            ["Admin", "DataUpdater", "Customer"],
            ShaktiUdyog.Domain.Constants.Roles.All);
    }
}

public class AuditLogImmutabilityTests
{
    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer("Server=unused;Database=unused;Trusted_Connection=True")
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public void Modifying_an_audit_log_entry_is_rejected()
    {
        using var db = CreateContext();
        var log = new Domain.Entities.AuditLog { Id = 1, Action = "test.action" };
        db.Attach(log);
        db.Entry(log).State = EntityState.Modified;

        Assert.Throws<InvalidOperationException>(() => db.SaveChanges());
    }

    [Fact]
    public void Deleting_an_audit_log_entry_is_rejected()
    {
        using var db = CreateContext();
        var log = new Domain.Entities.AuditLog { Id = 1, Action = "test.action" };
        db.Attach(log);
        db.Entry(log).State = EntityState.Deleted;

        Assert.Throws<InvalidOperationException>(() => db.SaveChanges());
    }
}
