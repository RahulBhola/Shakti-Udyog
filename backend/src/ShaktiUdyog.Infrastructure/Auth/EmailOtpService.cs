using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Infrastructure.Auth;

public interface IEmailOtpService
{
    /// <summary>
    /// Creates a fresh 6-digit login code for the user, superseding any earlier
    /// outstanding code. Returns the challenge id (opaque handle used by the
    /// verify/resend endpoints) plus the raw code (delivered by email only).
    /// </summary>
    Task<(Guid ChallengeId, string Code)> CreateAsync(ApplicationUser user, string? ipAddress);

    /// <summary>
    /// Regenerates the code for an existing, still-usable challenge (extends its
    /// expiry and resets the attempt counter). Returns null when the challenge is
    /// unknown, expired, used, or already exhausted.
    /// </summary>
    Task<(Guid ChallengeId, string Code, ApplicationUser User)?> ResendAsync(Guid challengeId, string? ipAddress);

    /// <summary>
    /// Validates a raw code against the challenge and, on success, consumes it
    /// (single-use) and returns the owning user. Returns null when the challenge
    /// is unknown/expired/used or the code is wrong; wrong codes count toward the
    /// per-challenge attempt limit.
    /// </summary>
    Task<ApplicationUser?> VerifyAsync(Guid challengeId, string code);
}

public class EmailOtpService(AppDbContext db, ITokenService tokenService) : IEmailOtpService
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(5);
    private const int MaxAttempts = 5;

    public async Task<(Guid ChallengeId, string Code)> CreateAsync(ApplicationUser user, string? ipAddress)
    {
        // A new login supersedes earlier outstanding codes for the same user.
        var outstanding = await db.EmailOtps
            .Where(o => o.UserId == user.Id && o.UsedAtUtc == null)
            .ToListAsync();
        foreach (var otp in outstanding)
        {
            otp.UsedAtUtc = DateTimeOffset.UtcNow;
        }

        var code = GenerateCode();
        var row = new EmailOtp
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            CodeHash = tokenService.HashToken(code),
            ExpiresAtUtc = DateTimeOffset.UtcNow.Add(Lifetime),
            CreatedByIp = ipAddress,
        };
        db.EmailOtps.Add(row);

        await db.SaveChangesAsync();
        return (row.Id, code);
    }

    public async Task<(Guid ChallengeId, string Code, ApplicationUser User)?> ResendAsync(Guid challengeId, string? ipAddress)
    {
        var otp = await db.EmailOtps
            .Include(o => o.User)
            .SingleOrDefaultAsync(o => o.Id == challengeId);

        if (otp is null || !otp.IsUsable || otp.Attempts >= MaxAttempts)
        {
            return null;
        }

        var code = GenerateCode();
        otp.CodeHash = tokenService.HashToken(code);
        otp.Attempts = 0;
        otp.ExpiresAtUtc = DateTimeOffset.UtcNow.Add(Lifetime);
        otp.CreatedByIp = ipAddress;
        await db.SaveChangesAsync();
        return (otp.Id, code, otp.User);
    }

    public async Task<ApplicationUser?> VerifyAsync(Guid challengeId, string code)
    {
        var otp = await db.EmailOtps
            .Include(o => o.User)
            .SingleOrDefaultAsync(o => o.Id == challengeId);

        if (otp is null || !otp.IsUsable)
        {
            return null;
        }

        if (otp.Attempts >= MaxAttempts)
        {
            // Exhausted attempts: burn the challenge so it cannot be replayed.
            otp.UsedAtUtc = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
            return null;
        }

        if (!FixedTimeEquals(otp.CodeHash, tokenService.HashToken(code)))
        {
            otp.Attempts += 1;
            await db.SaveChangesAsync();
            return null;
        }

        otp.UsedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return otp.User;
    }

    private static string GenerateCode() =>
        RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

    private static bool FixedTimeEquals(string a, string b) =>
        CryptographicOperations.FixedTimeEquals(
            System.Text.Encoding.UTF8.GetBytes(a),
            System.Text.Encoding.UTF8.GetBytes(b));
}
