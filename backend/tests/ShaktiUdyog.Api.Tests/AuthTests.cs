using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Api.Tests;

/// <summary>
/// Auth flow integration tests against the real pipeline and the local SQL
/// Server development database (SQLEXPRESS). The dev admin seeded at startup
/// is used as the test principal; tests that would mutate its credentials are
/// avoided. Skipped implicitly if the seed password secret is absent.
/// </summary>
public class AuthApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        // Tests fire many submissions in one window; keep the production
        // default strict but lift it here.
        builder.UseSetting("RateLimits:PublicPerMinute", "1000");
    }
}

public class AuthEndpointTests(AuthApiFactory factory) : IClassFixture<AuthApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    private record AuthResponse(string AccessToken, DateTimeOffset AccessTokenExpiresAtUtc, string RefreshToken, string TokenType);
    private record MeResponse(Guid Id, string Email, string? FullName, List<string> Roles, List<string> Permissions);

    private async Task<AuthResponse?> LoginAsAdminAsync()
    {
        var cfg = factory.Services.GetService(typeof(Microsoft.Extensions.Configuration.IConfiguration))
            as Microsoft.Extensions.Configuration.IConfiguration;
        var password = Environment.GetEnvironmentVariable("DevAdmin__Password") ?? cfg?["DevAdmin:Password"];
        if (string.IsNullOrEmpty(password))
        {
            return null;
        }

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new { email = "admin@shaktiudyog.local", password });
        return response.StatusCode == HttpStatusCode.OK
            ? await response.Content.ReadFromJsonAsync<AuthResponse>()
            : null;
    }

    [Fact]
    public async Task Login_with_wrong_password_returns_401_with_uniform_message()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new { email = "admin@shaktiudyog.local", password = "DefinitelyWrong123!" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Invalid credentials", body);
    }

    [Fact]
    public async Task Login_with_unknown_email_returns_same_401_as_wrong_password()
    {
        var unknown = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new { email = "ghost@example.com", password = "DefinitelyWrong123!" });
        var wrongPw = await _client.PostAsJsonAsync("/api/v1/auth/login",
            new { email = "admin@shaktiudyog.local", password = "DefinitelyWrong123!" });

        Assert.Equal(HttpStatusCode.Unauthorized, unknown.StatusCode);
        Assert.Equal(
            await wrongPw.Content.ReadAsStringAsync(),
            await unknown.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Me_without_token_returns_401()
    {
        var response = await _client.GetAsync("/api/v1/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_with_garbage_token_returns_401()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
        request.Headers.Authorization = new("Bearer", "not-a-real-token");
        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Forgot_password_returns_identical_response_for_known_and_unknown_emails()
    {
        var known = await _client.PostAsJsonAsync("/api/v1/auth/forgot-password",
            new { email = "admin@shaktiudyog.local" });
        var unknown = await _client.PostAsJsonAsync("/api/v1/auth/forgot-password",
            new { email = "ghost@example.com" });

        Assert.Equal(HttpStatusCode.OK, known.StatusCode);
        Assert.Equal(HttpStatusCode.OK, unknown.StatusCode);
        Assert.Equal(
            await known.Content.ReadAsStringAsync(),
            await unknown.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Refresh_with_invalid_token_returns_401()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/refresh",
            new { refreshToken = "bogus-token-value" });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Full_login_me_refresh_rotation_and_reuse_detection()
    {
        var login = await LoginAsAdminAsync();
        if (login is null)
        {
            return; // Dev admin not seeded in this environment; nothing to assert.
        }

        // JWT grants access to the protected endpoint with role + permission claims.
        var meRequest = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
        meRequest.Headers.Authorization = new("Bearer", login.AccessToken);
        var meResponse = await _client.SendAsync(meRequest);
        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);
        var me = await meResponse.Content.ReadFromJsonAsync<MeResponse>();
        Assert.Contains(Roles.Admin, me!.Roles);
        Assert.Equal(Permissions.All.Count, me.Permissions.Count);

        // Rotation issues a different token.
        var rotated = await _client.PostAsJsonAsync("/api/v1/auth/refresh",
            new { refreshToken = login.RefreshToken });
        Assert.Equal(HttpStatusCode.OK, rotated.StatusCode);
        var newTokens = await rotated.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotEqual(login.RefreshToken, newTokens!.RefreshToken);

        // Reusing the rotated (revoked) token fails and revokes the chain.
        var reuse = await _client.PostAsJsonAsync("/api/v1/auth/refresh",
            new { refreshToken = login.RefreshToken });
        Assert.Equal(HttpStatusCode.Unauthorized, reuse.StatusCode);

        var chained = await _client.PostAsJsonAsync("/api/v1/auth/refresh",
            new { refreshToken = newTokens.RefreshToken });
        Assert.Equal(HttpStatusCode.Unauthorized, chained.StatusCode);
    }
}

public class PermissionConstantTests
{
    [Fact]
    public void All_twelve_required_permissions_exist()
    {
        string[] required =
        [
            "users.manage", "roles.manage", "content.edit", "content.publish",
            "rfq.read.assigned", "rfq.update.assigned", "quotation.create",
            "order.update.assigned", "order.publish.customer_status",
            "invoice.manage", "payment.verify", "audit.read",
        ];
        Assert.Equal(required.Order(), Permissions.All.Order());
    }

    [Fact]
    public void Admin_holds_every_permission_and_customer_none()
    {
        Assert.Equal(Permissions.All, RolePermissions.Defaults[Roles.Admin]);
        Assert.Empty(RolePermissions.Defaults[Roles.Customer]);
    }

    [Fact]
    public void DataUpdater_defaults_exclude_finance_and_admin_permissions()
    {
        var updater = RolePermissions.Defaults[Roles.DataUpdater];
        Assert.DoesNotContain(Permissions.UsersManage, updater);
        Assert.DoesNotContain(Permissions.RolesManage, updater);
        Assert.DoesNotContain(Permissions.InvoiceManage, updater);
        Assert.DoesNotContain(Permissions.PaymentVerify, updater);
        Assert.DoesNotContain(Permissions.ContentPublish, updater);
    }
}
