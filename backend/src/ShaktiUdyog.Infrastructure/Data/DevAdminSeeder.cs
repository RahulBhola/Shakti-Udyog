using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Infrastructure.Data;

/// <summary>
/// DEVELOPMENT ONLY: seeds a demo admin account so authentication can be
/// exercised before the invitation/approval flows exist. The password must be
/// supplied via configuration (DevAdmin:Password — user secrets or env var);
/// nothing is seeded when it is absent. Never called outside Development.
/// </summary>
public static class DevAdminSeeder
{
    public const string Email = "admin@shaktiudyog.local";

    public static async Task SeedAsync(
        UserManager<ApplicationUser> userManager,
        string? password,
        ILogger logger)
    {
        if (string.IsNullOrEmpty(password))
        {
            logger.LogInformation("DevAdmin:Password not configured; skipping demo admin seeding.");
            return;
        }

        if (await userManager.FindByEmailAsync(Email) is not null)
        {
            return;
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = Email,
            Email = Email,
            EmailConfirmed = true,
            FullName = "Demo Administrator [placeholder]",
            IsActive = true,
        };

        var created = await userManager.CreateAsync(user, password);
        if (!created.Succeeded)
        {
            var errors = string.Join("; ", created.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to seed development admin: {errors}");
        }

        await userManager.AddToRoleAsync(user, Roles.Admin);
        logger.LogWarning("Seeded DEVELOPMENT demo admin '{Email}'. Do not use in production.", Email);
    }
}
