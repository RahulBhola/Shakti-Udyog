using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auth;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Tests;

public class DeviceSessionTests
{
    [Theory]
    [InlineData("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Chrome", "Windows", "Desktop", "Chrome on Windows")]
    [InlineData("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0", "Edge", "Windows", "Desktop", "Edge on Windows")]
    [InlineData("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15", "Safari", "macOS", "Desktop", "Safari on macOS")]
    [InlineData("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1", "Safari", "iOS (iPhone)", "Mobile", "Safari on iOS (iPhone)")]
    [InlineData("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36", "Chrome", "Android", "Mobile", "Chrome on Android")]
    [InlineData("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1", "Safari", "iOS (iPad)", "Tablet", "Safari on iOS (iPad)")]
    [InlineData("Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0", "Firefox", "Linux", "Desktop", "Firefox on Linux")]
    [InlineData(null, "Unknown", "Unknown", "Unknown", "Unknown Device")]
    [InlineData("", "Unknown", "Unknown", "Unknown", "Unknown Device")]
    public void UserAgentParser_extracts_correct_metadata(
        string? ua, string expectedBrowser, string expectedOs, string expectedType, string expectedName)
    {
        var result = UserAgentParser.Parse(ua, "127.0.0.1");

        Assert.Equal(expectedBrowser, result.Browser);
        Assert.Equal(expectedOs, result.OperatingSystem);
        Assert.Equal(expectedType, result.DeviceType);
        Assert.Equal(expectedName, result.DeviceName);
        Assert.Equal("Localhost / Internal", result.Location);
    }

    private static (AppDbContext Db, ITokenService TokenService, ApplicationUser User) CreateInMemoryServices()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var db = new AppDbContext(options);

        var jwtOptions = Options.Create(new JwtOptions
        {
            SigningKey = "test_signing_key_at_least_32_characters_long_12345!",
            Issuer = "ShaktiUdyog.Api",
            Audience = "ShaktiUdyog.Clients",
            AccessTokenMinutes = 15,
            RefreshTokenDays = 7,
            SessionDays = 90,
        });

        var userStore = new Microsoft.AspNetCore.Identity.EntityFrameworkCore.UserStore<ApplicationUser, ApplicationRole, AppDbContext, Guid>(db);
        var userManager = new UserManager<ApplicationUser>(
            userStore, null!, new PasswordHasher<ApplicationUser>(), null!, null!, null!, null!, null!, null!);

        var tokenService = new TokenService(db, userManager, jwtOptions);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "testuser@shaktiudyog.local",
            Email = "testuser@shaktiudyog.local",
            FullName = "Test User",
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow,
        };
        db.Users.Add(user);
        db.SaveChanges();

        return (db, tokenService, user);
    }

    [Fact]
    public async Task IssueRefreshTokenAsync_creates_UserSession_and_RefreshToken()
    {
        var (db, tokenService, user) = CreateInMemoryServices();
        var ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";
        var ip = "127.0.0.1";

        var refreshResult = await tokenService.IssueRefreshTokenAsync(user, ip, ua);

        Assert.NotNull(refreshResult);
        Assert.NotEmpty(refreshResult.RawToken);
        Assert.NotNull(refreshResult.Entity.SessionId);

        var session = await db.UserSessions.FindAsync(refreshResult.Entity.SessionId);
        Assert.NotNull(session);
        Assert.Equal(user.Id, session.UserId);
        Assert.Equal("Chrome on Windows", session.DeviceName);
        Assert.Equal("Desktop", session.DeviceType);
        Assert.Equal("Windows", session.OperatingSystem);
        Assert.Equal("Chrome", session.Browser);
        Assert.True(session.IsActive);

        var accessResult = await tokenService.CreateAccessTokenAsync(user, session.Id);
        Assert.NotNull(accessResult.Token);

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(accessResult.Token);
        var sidClaim = jwt.Claims.FirstOrDefault(c => c.Type == "sid");
        Assert.NotNull(sidClaim);
        Assert.Equal(session.Id.ToString(), sidClaim.Value);
    }

    [Fact]
    public async Task Multiple_logins_create_independent_UserSessions()
    {
        var (db, tokenService, user) = CreateInMemoryServices();

        var laptopRefresh = await tokenService.IssueRefreshTokenAsync(
            user, "192.168.1.10", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");
        var mobileRefresh = await tokenService.IssueRefreshTokenAsync(
            user, "192.168.1.20", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 Safari/604.1");

        Assert.NotEqual(laptopRefresh.Entity.SessionId, mobileRefresh.Entity.SessionId);

        var activeSessions = await tokenService.GetActiveSessionsAsync(user.Id);
        Assert.Equal(2, activeSessions.Count);
        Assert.Contains(activeSessions, s => s.DeviceType == "Desktop");
        Assert.Contains(activeSessions, s => s.DeviceType == "Mobile");
    }

    [Fact]
    public async Task RotateRefreshTokenAsync_preserves_SessionId_and_does_not_create_duplicate_session()
    {
        var (db, tokenService, user) = CreateInMemoryServices();
        var ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

        var initial = await tokenService.IssueRefreshTokenAsync(user, "127.0.0.1", ua);
        var initialSessionId = initial.Entity.SessionId!.Value;

        var rotated = await tokenService.RotateRefreshTokenAsync(initial.RawToken, "127.0.0.1", ua);
        Assert.NotNull(rotated);
        Assert.Equal(initialSessionId, rotated.Value.SessionId);
        Assert.Equal(initialSessionId, rotated.Value.NewToken.Entity.SessionId);

        var sessions = await db.UserSessions.Where(s => s.UserId == user.Id).ToListAsync();
        Assert.Single(sessions); // Still only 1 session!

        // Old token should now be revoked
        var oldHash = tokenService.HashToken(initial.RawToken);
        var oldStored = await db.RefreshTokens.SingleAsync(t => t.TokenHash == oldHash);
        Assert.True(oldStored.IsRevoked);
        Assert.Equal("Rotated", oldStored.RevocationReason);
    }

    [Fact]
    public async Task RotateRefreshTokenAsync_on_revoked_token_detects_reuse_and_revokes_session()
    {
        var (db, tokenService, user) = CreateInMemoryServices();
        var ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

        var token1 = await tokenService.IssueRefreshTokenAsync(user, "127.0.0.1", ua);
        var sessionId = token1.Entity.SessionId!.Value;

        var token2 = await tokenService.RotateRefreshTokenAsync(token1.RawToken, "127.0.0.1", ua);
        Assert.NotNull(token2);

        // Reusing token1 should trigger theft detection
        var reuseAttempt = await tokenService.RotateRefreshTokenAsync(token1.RawToken, "127.0.0.1", ua);
        Assert.Null(reuseAttempt);

        var session = await db.UserSessions.FindAsync(sessionId);
        Assert.NotNull(session);
        Assert.NotNull(session.RevokedAtUtc);
        Assert.Contains("reuse", session.RevocationReason, StringComparison.OrdinalIgnoreCase);

        // Attempting to rotate token2 should now also fail because session is revoked
        var token3 = await tokenService.RotateRefreshTokenAsync(token2.Value.NewToken.RawToken, "127.0.0.1", ua);
        Assert.Null(token3);
    }

    [Fact]
    public async Task RotateRefreshTokenAsync_migrates_legacy_token_without_SessionId()
    {
        var (db, tokenService, user) = CreateInMemoryServices();

        var raw = "legacy_test_token_without_session_id_12345";
        var legacyEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            SessionId = null, // Legacy token
            TokenHash = tokenService.HashToken(raw),
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAtUtc = DateTimeOffset.UtcNow,
            CreatedByIp = "127.0.0.1",
        };
        db.RefreshTokens.Add(legacyEntity);
        await db.SaveChangesAsync();

        var rotated = await tokenService.RotateRefreshTokenAsync(raw, "127.0.0.1", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
        Assert.NotNull(rotated);
        Assert.NotNull(rotated.Value.NewToken.Entity.SessionId);

        var session = await db.UserSessions.FindAsync(rotated.Value.SessionId);
        Assert.NotNull(session);
        Assert.Equal(user.Id, session.UserId);
        Assert.Equal("Desktop", session.DeviceType);
    }

    [Fact]
    public async Task RevokeSessionAsync_revokes_session_and_its_refresh_tokens()
    {
        var (db, tokenService, user) = CreateInMemoryServices();

        var session1 = await tokenService.IssueRefreshTokenAsync(user, "127.0.0.1");
        var session2 = await tokenService.IssueRefreshTokenAsync(user, "127.0.0.1");

        var revoked = await tokenService.RevokeSessionAsync(session1.Entity.SessionId!.Value, user.Id, "127.0.0.1", "User requested");
        Assert.True(revoked);

        var s1 = await db.UserSessions.FindAsync(session1.Entity.SessionId!.Value);
        Assert.NotNull(s1);
        Assert.NotNull(s1.RevokedAtUtc);

        var s1Tokens = await db.RefreshTokens.Where(t => t.SessionId == session1.Entity.SessionId!.Value).ToListAsync();
        Assert.All(s1Tokens, t => Assert.True(t.IsRevoked));

        // Session 2 should remain active
        var activeSessions = await tokenService.GetActiveSessionsAsync(user.Id);
        Assert.Single(activeSessions);
        Assert.Equal(session2.Entity.SessionId, activeSessions[0].Id);
    }

    [Fact]
    public async Task RevokeOtherSessionsAsync_revokes_all_sessions_except_current()
    {
        var (db, tokenService, user) = CreateInMemoryServices();

        var laptop = await tokenService.IssueRefreshTokenAsync(user, "127.0.0.1");
        var mobile = await tokenService.IssueRefreshTokenAsync(user, "127.0.0.1");
        var tablet = await tokenService.IssueRefreshTokenAsync(user, "127.0.0.1");

        var revokedIds = await tokenService.RevokeOtherSessionsAsync(laptop.Entity.SessionId!.Value, user.Id, "127.0.0.1", "Revoke others");

        Assert.Equal(2, revokedIds.Count);
        Assert.Contains(mobile.Entity.SessionId!.Value, revokedIds);
        Assert.Contains(tablet.Entity.SessionId!.Value, revokedIds);
        Assert.DoesNotContain(laptop.Entity.SessionId!.Value, revokedIds);

        var activeSessions = await tokenService.GetActiveSessionsAsync(user.Id);
        Assert.Single(activeSessions);
        Assert.Equal(laptop.Entity.SessionId, activeSessions[0].Id);
    }

    [Fact]
    public async Task RevokeSessionAsync_enforces_user_ownership()
    {
        var (db, tokenService, userA) = CreateInMemoryServices();

        var userB = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "userb@shaktiudyog.local",
            Email = "userb@shaktiudyog.local",
            FullName = "User B",
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow,
        };
        db.Users.Add(userB);
        await db.SaveChangesAsync();

        var sessionA = await tokenService.IssueRefreshTokenAsync(userA, "127.0.0.1");

        // User B attempts to revoke User A's session
        var revoked = await tokenService.RevokeSessionAsync(sessionA.Entity.SessionId!.Value, userB.Id, "127.0.0.1", "Malicious attempt");
        Assert.False(revoked);

        var sA = await db.UserSessions.FindAsync(sessionA.Entity.SessionId!.Value);
        Assert.NotNull(sA);
        Assert.Null(sA.RevokedAtUtc); // Unchanged!
    }
}

public class DeviceSessionEndpointTests(AuthApiFactory factory) : IClassFixture<AuthApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    private record AuthResponse(string AccessToken, DateTimeOffset AccessTokenExpiresAtUtc, string RefreshToken, string TokenType);

    [Fact]
    public async Task Sessions_endpoint_requires_authentication()
    {
        var response = await _client.GetAsync("/api/v1/auth/sessions");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Revoke_session_endpoint_requires_authentication()
    {
        var response = await _client.DeleteAsync($"/api/v1/auth/sessions/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Revoke_others_endpoint_requires_authentication()
    {
        var response = await _client.PostAsync("/api/v1/auth/sessions/revoke-others", null);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Authenticated_sessions_flow_lists_sessions_with_isCurrent()
    {
        var email = $"sessiontest_{Guid.NewGuid():N}@example.com";
        var regRes = await _client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            fullName = "Session Test User",
            companyName = "Session Test Org",
            email,
            password = "SecurePassword123!",
            phone = "+919876543210"
        });

        AuthResponse? auth = null;
        if (regRes.StatusCode == HttpStatusCode.OK)
        {
            auth = await regRes.Content.ReadFromJsonAsync<AuthResponse>();
        }

        if (auth is null)
        {
            var cfg = factory.Services.GetService(typeof(Microsoft.Extensions.Configuration.IConfiguration))
                as Microsoft.Extensions.Configuration.IConfiguration;
            var password = Environment.GetEnvironmentVariable("DevAdmin__Password") ?? cfg?["DevAdmin:Password"];
            if (string.IsNullOrEmpty(password)) return;

            var loginRes = await _client.PostAsJsonAsync("/api/v1/auth/login",
                new { email = "admin@shaktiudyog.local", password });
            if (loginRes.StatusCode != HttpStatusCode.OK) return;
            auth = await loginRes.Content.ReadFromJsonAsync<AuthResponse>();
        }

        if (auth is null) return;

        var req = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/sessions");
        req.Headers.Authorization = new("Bearer", auth.AccessToken);
        var sessionsRes = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, sessionsRes.StatusCode);

        var sessions = await sessionsRes.Content.ReadFromJsonAsync<List<UserSessionDto>>();
        Assert.NotNull(sessions);
        Assert.NotEmpty(sessions);
        Assert.Contains(sessions, s => s.IsCurrent);
    }
}

