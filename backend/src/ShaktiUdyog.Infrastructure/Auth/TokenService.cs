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

    public async Task<AccessTokenResult> CreateAccessTokenAsync(ApplicationUser user)
    {
        var now = DateTimeOffset.UtcNow;
        var expires = now.AddMinutes(_options.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            // Security stamp lets us reject tokens minted before a password
            // reset / role change once stamp validation is added to the
            // pipeline; included now so issued tokens already carry it.
            new("sstamp", user.SecurityStamp ?? string.Empty),
        };

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
        return new AccessTokenResult(token, expires);
    }

    public async Task<RefreshTokenResult> IssueRefreshTokenAsync(ApplicationUser user, string? ipAddress)
    {
        var raw = GenerateRawToken();
        var entity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = HashToken(raw),
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(_options.RefreshTokenDays),
            CreatedByIp = ipAddress,
        };

        db.RefreshTokens.Add(entity);
        await db.SaveChangesAsync();
        return new RefreshTokenResult(raw, entity);
    }

    public async Task<(ApplicationUser User, RefreshTokenResult NewToken)?> RotateRefreshTokenAsync(
        string rawToken, string? ipAddress)
    {
        var hash = HashToken(rawToken);
        var stored = await db.RefreshTokens
            .Include(t => t.User)
            .SingleOrDefaultAsync(t => t.TokenHash == hash);

        if (stored is null)
        {
            return null;
        }

        if (stored.IsRevoked)
        {
            // Reuse of a rotated token indicates possible theft: revoke every
            // active token for this user so both attacker and victim sessions end.
            await RevokeAllRefreshTokensAsync(stored.UserId, ipAddress, "Refresh token reuse detected");
            return null;
        }

        if (stored.IsExpired || !stored.User.IsActive)
        {
            return null;
        }

        var replacement = await IssueRefreshTokenAsync(stored.User, ipAddress);

        stored.RevokedAtUtc = DateTimeOffset.UtcNow;
        stored.RevokedByIp = ipAddress;
        stored.RevocationReason = "Rotated";
        stored.ReplacedByTokenHash = replacement.Entity.TokenHash;
        await db.SaveChangesAsync();

        return (stored.User, replacement);
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
        await db.SaveChangesAsync();
    }

    public async Task RevokeAllRefreshTokensAsync(Guid userId, string? ipAddress, string reason)
    {
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

    public string HashToken(string rawToken) =>
        Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

    private static string GenerateRawToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
}
