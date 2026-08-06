using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Infrastructure.Data;

/// <summary>
/// DEVELOPMENT ONLY: seeds a demo Engineer (internal staff) account so the
/// staff portal is explorable before the invitation/approval flows exist.
/// The password must be supplied via configuration (DevEngineer:Password —
/// user secrets or env var); nothing is seeded when it is absent. Never
/// called outside Development.
/// </summary>
public static class DevEngineerSeeder
{
    public const string Email = "engineer@shaktiudyog.local";

    public static async Task SeedAsync(
        UserManager<ApplicationUser> userManager,
        string? password,
        ILogger logger)
    {
        if (string.IsNullOrEmpty(password))
        {
            logger.LogInformation("DevEngineer:Password not configured; skipping demo engineer seeding.");
            return;
        }

        if (await userManager.FindByEmailAsync(Email) is not null)
        {
            // Already seeded; nothing to do.
            return;
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = Email,
            Email = Email,
            EmailConfirmed = true,
            FullName = "Demo Engineer [placeholder]",
            IsActive = true,
        };

        var created = await userManager.CreateAsync(user, password);
        if (!created.Succeeded)
        {
            var errors = string.Join("; ", created.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to seed development engineer: {errors}");
        }

        await userManager.AddToRoleAsync(user, Roles.Engineer);
        logger.LogWarning("Seeded DEVELOPMENT demo engineer '{Email}'. Do not use in production.", Email);
    }
}
