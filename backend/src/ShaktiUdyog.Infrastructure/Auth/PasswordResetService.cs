using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Auth;

public interface IPasswordResetService
{
    /// <summary>
    /// Creates a one-time reset token for the user, invalidating any earlier
    /// unused tokens. Returns the raw token (to be delivered by email; only
    /// the hash is stored).
    /// </summary>
    Task<string> CreateTokenAsync(ApplicationUser user, string? ipAddress);

    /// <summary>
    /// Validates a raw token and marks it used. Returns the owning user, or
    /// null when the token is unknown, expired, or already used.
    /// </summary>
    Task<ApplicationUser?> ConsumeTokenAsync(string rawToken);
}

public class PasswordResetService(AppDbContext db, ITokenService tokenService) : IPasswordResetService
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(20);

    public async Task<string> CreateTokenAsync(ApplicationUser user, string? ipAddress)
    {
        // A new request supersedes older outstanding tokens.
        var outstanding = await db.PasswordResetTokens
            .Where(t => t.UserId == user.Id && t.UsedAtUtc == null)
            .ToListAsync();
        foreach (var token in outstanding)
        {
            token.UsedAtUtc = DateTimeOffset.UtcNow;
        }

        var raw = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        db.PasswordResetTokens.Add(new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenService.HashToken(raw),
            ExpiresAtUtc = DateTimeOffset.UtcNow.Add(Lifetime),
            RequestedByIp = ipAddress,
        });

        await db.SaveChangesAsync();
        return raw;
    }

    public async Task<ApplicationUser?> ConsumeTokenAsync(string rawToken)
    {
        var hash = tokenService.HashToken(rawToken);
        var stored = await db.PasswordResetTokens
            .Include(t => t.User)
            .SingleOrDefaultAsync(t => t.TokenHash == hash);

        if (stored is null || !stored.IsUsable)
        {
            return null;
        }

        stored.UsedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return stored.User;
    }
}
