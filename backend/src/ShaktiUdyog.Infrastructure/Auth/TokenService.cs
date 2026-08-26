using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Auth;

public class TokenService(
    AppDbContext db,
    UserManager<ApplicationUser> userManager,
    IOptions<JwtOptions> jwtOptions) : ITokenService
{
    private readonly JwtOptions _options = jwtOptions.Value;

    public async Task<AccessTokenResult> CreateAccessTokenAsync(ApplicationUser user, Guid? sessionId = null)
    {
        var now = DateTimeOffset.UtcNow;
        var expires = now.AddMinutes(_options.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new("sstamp", user.SecurityStamp ?? string.Empty),
        };

        if (sessionId.HasValue && sessionId.Value != Guid.Empty)
        {
            claims.Add(new Claim("sid", sessionId.Value.ToString()));
            claims.Add(new Claim(ClaimTypes.Sid, sessionId.Value.ToString()));
        }

        if (!string.IsNullOrEmpty(user.FullName))
        {
            claims.Add(new Claim("name", user.FullName));
        }

        if (!string.IsNullOrEmpty(user.AvatarUrl))
        {
            claims.Add(new Claim("picture", user.AvatarUrl));
            claims.Add(new Claim("avatar_url", user.AvatarUrl));
        }

        var roles = await userManager.GetRolesAsync(user);
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));

            if (RolePermissions.Defaults.TryGetValue(role, out var permissions))
            {
                foreach (var permission in permissions)
                {
                    claims.Add(new Claim(Permissions.ClaimType, permission));
                }
            }
        }

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = _options.Issuer,
            Audience = _options.Audience,
            NotBefore = now.UtcDateTime,
            Expires = expires.UtcDateTime,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey)),
                SecurityAlgorithms.HmacSha256),
        };

        var token = new JsonWebTokenHandler().CreateToken(descriptor);
        return new AccessTokenResult(token, expires, sessionId);
    }

    public async Task<RefreshTokenResult> IssueRefreshTokenAsync(
        ApplicationUser user, string? ipAddress, string? userAgent = null, Guid? sessionId = null)
    {
        Guid targetSessionId;

        if (sessionId.HasValue && sessionId.Value != Guid.Empty)
        {
            var existingSession = await db.UserSessions.FindAsync(sessionId.Value);
            if (existingSession is not null && existingSession.UserId == user.Id)
            {
                existingSession.LastActiveAtUtc = DateTimeOffset.UtcNow;
                if (!string.IsNullOrWhiteSpace(ipAddress))
                {
                    existingSession.IpAddress = ipAddress;
                }
                if (!string.IsNullOrWhiteSpace(userAgent))
                {
                    existingSession.UserAgent = userAgent.Length > 500 ? userAgent[..500] : userAgent;
                }
                targetSessionId = existingSession.Id;
            }
            else
            {
                var parsed = UserAgentParser.Parse(userAgent, ipAddress);
                var newSession = new UserSession
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    DeviceName = parsed.DeviceName,
                    DeviceType = parsed.DeviceType,
                    OperatingSystem = parsed.OperatingSystem,
                    Browser = parsed.Browser,
                    UserAgent = userAgent?.Length > 500 ? userAgent[..500] : userAgent,
                    IpAddress = ipAddress,
                    Location = parsed.Location,
                    CreatedAtUtc = DateTimeOffset.UtcNow,
                    LastActiveAtUtc = DateTimeOffset.UtcNow,
                    ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(_options.SessionDays),
                };
                db.UserSessions.Add(newSession);
                targetSessionId = newSession.Id;
            }
        }
        else
        {
            var parsed = UserAgentParser.Parse(userAgent, ipAddress);
            var newSession = new UserSession
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                DeviceName = parsed.DeviceName,
                DeviceType = parsed.DeviceType,
                OperatingSystem = parsed.OperatingSystem,
                Browser = parsed.Browser,
                UserAgent = userAgent?.Length > 500 ? userAgent[..500] : userAgent,
                IpAddress = ipAddress,
                Location = parsed.Location,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                LastActiveAtUtc = DateTimeOffset.UtcNow,
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(_options.SessionDays),
            };
            db.UserSessions.Add(newSession);
            targetSessionId = newSession.Id;
        }

        var raw = GenerateRawToken();
        var entity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            SessionId = targetSessionId,
            TokenHash = HashToken(raw),
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(_options.RefreshTokenDays),
            CreatedByIp = ipAddress,
        };

        db.RefreshTokens.Add(entity);

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            var entry = db.Entry(user);
            if (entry.State != EntityState.Detached)
            {
                entry.State = EntityState.Detached;
            }
            await db.SaveChangesAsync();
        }

        return new RefreshTokenResult(raw, entity);
    }

    public async Task<(ApplicationUser User, RefreshTokenResult NewToken, Guid SessionId)?> RotateRefreshTokenAsync(
        string rawToken, string? ipAddress, string? userAgent = null)
    {
        var hash = HashToken(rawToken);
        var stored = await db.RefreshTokens
            .Include(t => t.User)
            .Include(t => t.Session)
            .SingleOrDefaultAsync(t => t.TokenHash == hash);

        if (stored is null)
        {
            return null;
        }

        if (stored.IsRevoked)
        {
            // Reuse of a rotated token indicates possible theft: revoke the session and token family
            if (stored.SessionId.HasValue)
            {
                var session = stored.Session ?? await db.UserSessions.FindAsync(stored.SessionId.Value);
                if (session is not null)
                {
                    session.RevokedAtUtc = DateTimeOffset.UtcNow;
                    session.RevocationReason = "Refresh token reuse detected";
                }

                var sessionTokens = await db.RefreshTokens
                    .Where(t => t.SessionId == stored.SessionId && t.RevokedAtUtc == null)
                    .ToListAsync();
                foreach (var t in sessionTokens)
                {
                    t.RevokedAtUtc = DateTimeOffset.UtcNow;
                    t.RevokedByIp = ipAddress;
                    t.RevocationReason = "Refresh token reuse detected";
                }
            }

            await RevokeAllRefreshTokensAsync(stored.UserId, ipAddress, "Refresh token reuse detected");
            return null;
        }

        if (stored.IsExpired || !stored.User.IsActive)
        {
            return null;
        }

        Guid targetSessionId = Guid.NewGuid();

        // Legacy token migration support: if legacy token has no SessionId, create one now
        if (!stored.SessionId.HasValue || stored.SessionId.Value == Guid.Empty)
        {
            var parsed = UserAgentParser.Parse(userAgent, ipAddress);
            var legacySession = new UserSession
            {
                Id = Guid.NewGuid(),
                UserId = stored.UserId,
                DeviceName = parsed.DeviceName,
                DeviceType = parsed.DeviceType,
                OperatingSystem = parsed.OperatingSystem,
                Browser = parsed.Browser,
                UserAgent = userAgent?.Length > 500 ? userAgent[..500] : userAgent,
                IpAddress = ipAddress,
                Location = parsed.Location,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                LastActiveAtUtc = DateTimeOffset.UtcNow,
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(_options.SessionDays),
            };
            db.UserSessions.Add(legacySession);
            stored.SessionId = legacySession.Id;
            targetSessionId = legacySession.Id;
        }
        else
        {
            var session = stored.Session ?? await db.UserSessions.FindAsync(stored.SessionId.Value);
            if (session is not null && session.RevokedAtUtc == null && session.ExpiresAtUtc > DateTimeOffset.UtcNow)
            {
                session.LastActiveAtUtc = DateTimeOffset.UtcNow;
                if (!string.IsNullOrWhiteSpace(ipAddress))
                {
                    session.IpAddress = ipAddress;
                }
                targetSessionId = session.Id;
            }
            else
            {
                var parsed = UserAgentParser.Parse(userAgent, ipAddress);
                var newSession = new UserSession
                {
                    Id = Guid.NewGuid(),
                    UserId = stored.UserId,
                    DeviceName = parsed.DeviceName,
                    DeviceType = parsed.DeviceType,
                    OperatingSystem = parsed.OperatingSystem,
                    Browser = parsed.Browser,
                    UserAgent = userAgent?.Length > 500 ? userAgent[..500] : userAgent,
                    IpAddress = ipAddress,
                    Location = parsed.Location,
                    CreatedAtUtc = DateTimeOffset.UtcNow,
                    LastActiveAtUtc = DateTimeOffset.UtcNow,
                    ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(_options.SessionDays),
                };
                db.UserSessions.Add(newSession);
                targetSessionId = newSession.Id;
            }
        }

        var rawReplacement = GenerateRawToken();
        var replacement = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = stored.UserId,
            SessionId = targetSessionId,
            TokenHash = HashToken(rawReplacement),
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(_options.RefreshTokenDays),
            CreatedByIp = ipAddress,
        };

        stored.RevokedAtUtc = DateTimeOffset.UtcNow;
        stored.RevokedByIp = ipAddress;
        stored.RevocationReason = "Rotated";
        stored.ReplacedByTokenHash = replacement.TokenHash;

        db.RefreshTokens.Add(replacement);

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            var entry = db.Entry(stored.User);
            if (entry.State != EntityState.Detached)
            {
                entry.State = EntityState.Detached;
            }
            await db.SaveChangesAsync();
        }

        return (stored.User, new RefreshTokenResult(rawReplacement, replacement), targetSessionId);
    }

    public async Task RevokeRefreshTokenAsync(string rawToken, string? ipAddress, string reason)
    {
        var hash = HashToken(rawToken);
        var stored = await db.RefreshTokens.SingleOrDefaultAsync(t => t.TokenHash == hash);
        if (stored is null || stored.IsRevoked)
        {
            return;
        }

        stored.RevokedAtUtc = DateTimeOffset.UtcNow;
        stored.RevokedByIp = ipAddress;
        stored.RevocationReason = reason;

        if (stored.SessionId.HasValue)
        {
            var session = await db.UserSessions.FindAsync(stored.SessionId.Value);
            if (session is not null && session.RevokedAtUtc is null)
            {
                session.RevokedAtUtc = DateTimeOffset.UtcNow;
                session.RevocationReason = reason;
            }
        }

        await db.SaveChangesAsync();
    }

    public async Task RevokeAllRefreshTokensAsync(Guid userId, string? ipAddress, string reason)
    {
        var activeSessions = await db.UserSessions
            .Where(s => s.UserId == userId && s.RevokedAtUtc == null)
            .ToListAsync();

        foreach (var session in activeSessions)
        {
            session.RevokedAtUtc = DateTimeOffset.UtcNow;
            session.RevocationReason = reason;
        }

        var active = await db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAtUtc == null && t.ExpiresAtUtc > DateTimeOffset.UtcNow)
            .ToListAsync();

        foreach (var token in active)
        {
            token.RevokedAtUtc = DateTimeOffset.UtcNow;
            token.RevokedByIp = ipAddress;
            token.RevocationReason = reason;
        }

        await db.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<UserSession>> GetActiveSessionsAsync(Guid userId)
    {
        return await db.UserSessions
            .Where(s => s.UserId == userId && s.RevokedAtUtc == null && s.ExpiresAtUtc > DateTimeOffset.UtcNow)
            .OrderByDescending(s => s.LastActiveAtUtc)
            .ToListAsync();
    }

    public async Task<bool> RevokeSessionAsync(Guid sessionId, Guid userId, string? ipAddress, string reason)
    {
        var session = await db.UserSessions.FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);
        if (session is null)
        {
            return false;
        }

        session.RevokedAtUtc = DateTimeOffset.UtcNow;
        session.RevocationReason = reason;

        var tokens = await db.RefreshTokens
            .Where(t => t.SessionId == sessionId && t.RevokedAtUtc == null)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.RevokedAtUtc = DateTimeOffset.UtcNow;
            token.RevokedByIp = ipAddress;
            token.RevocationReason = reason;
        }

        await db.SaveChangesAsync();
        return true;
    }

    public async Task<IReadOnlyList<Guid>> RevokeOtherSessionsAsync(Guid currentSessionId, Guid userId, string? ipAddress, string reason)
    {
        var otherSessions = await db.UserSessions
            .Where(s => s.UserId == userId && s.Id != currentSessionId && s.RevokedAtUtc == null)
            .ToListAsync();

        var revokedIds = new List<Guid>();
        foreach (var session in otherSessions)
        {
            session.RevokedAtUtc = DateTimeOffset.UtcNow;
            session.RevocationReason = reason;
            revokedIds.Add(session.Id);
        }

        var tokens = await db.RefreshTokens
            .Where(t => t.UserId == userId && t.SessionId != currentSessionId && t.RevokedAtUtc == null)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.RevokedAtUtc = DateTimeOffset.UtcNow;
            token.RevokedByIp = ipAddress;
            token.RevocationReason = reason;
        }

        await db.SaveChangesAsync();
        return revokedIds;
    }

    public string HashToken(string rawToken) =>
        Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

    private static string GenerateRawToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
}
