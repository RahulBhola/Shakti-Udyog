using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Infrastructure.Data;

/// <summary>
/// DEVELOPMENT ONLY: seeds demo admin, engineers, and customer accounts so authentication
/// and operations can be exercised in development. The password must be supplied via
/// configuration (DevAdmin:Password / DevCustomer:Password — user secrets or env var).
/// Never called outside Development.
/// </summary>
public static class DevAdminSeeder
{
    public const string Email = "lovebhola8283@gmail.com";

    public static async Task SeedAsync(
        UserManager<ApplicationUser> userManager,
        string? password,
        AppDbContext dbContext,
        ILogger logger)
    {
        if (string.IsNullOrEmpty(password))
        {
            logger.LogInformation("DevAdmin:Password not configured; skipping demo admin seeding.");
            return;
        }

        var adminUser = await userManager.FindByEmailAsync(Email);
        if (adminUser is null)
        {
            adminUser = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = Email,
                Email = Email,
                EmailConfirmed = true,
                FullName = "System Administrator",
                IsActive = true,
            };

            var created = await userManager.CreateAsync(adminUser, password);
            if (!created.Succeeded)
            {
                var errors = string.Join("; ", created.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to seed development admin: {errors}");
            }

            await userManager.AddToRoleAsync(adminUser, Roles.Admin);
            logger.LogWarning("Seeded DEVELOPMENT demo admin '{Email}'.", Email);
        }
        else
        {
            var resetToken = await userManager.GeneratePasswordResetTokenAsync(adminUser);
            await userManager.ResetPasswordAsync(adminUser, resetToken, password);
            if (!await userManager.IsInRoleAsync(adminUser, Roles.Admin))
            {
                await userManager.AddToRoleAsync(adminUser, Roles.Admin);
            }
        }

        // Seed Engineers (1 primary + multiple secondary engineers)
        var engineers = new[]
        {
            ("engineer@shaktiudyog.local", "Primary Staff Engineer"),
            ("engineer2@shaktiudyog.local", "Senior Foundry Engineer"),
            ("engineer3@shaktiudyog.local", "Quality Assurance Engineer")
        };

        foreach (var (engEmail, fullName) in engineers)
        {
            var engUser = await userManager.FindByEmailAsync(engEmail);
            if (engUser is null)
            {
                engUser = new ApplicationUser
                {
                    Id = Guid.NewGuid(),
                    UserName = engEmail,
                    Email = engEmail,
                    EmailConfirmed = true,
                    FullName = fullName,
                    IsActive = true,
                };

                var res = await userManager.CreateAsync(engUser, password);
                if (res.Succeeded)
                {
                    await userManager.AddToRoleAsync(engUser, Roles.Engineer);
                    logger.LogInformation("Seeded demo engineer '{Email}'.", engEmail);
                }
            }
            else
            {
                var token = await userManager.GeneratePasswordResetTokenAsync(engUser);
                await userManager.ResetPasswordAsync(engUser, token, password);
                if (!await userManager.IsInRoleAsync(engUser, Roles.Engineer))
                {
                    await userManager.AddToRoleAsync(engUser, Roles.Engineer);
                }
            }
        }

        await SeedCategoriesAsync(dbContext, logger);
    }

    private static async Task SeedCategoriesAsync(AppDbContext db, ILogger logger)
    {
        if (await db.Categories.AnyAsync())
            return;

        var categories = new List<Category>
        {
            new() { Id = Guid.NewGuid(), Name = "Grey Iron Castings", Slug = "grey-iron-castings", Description = "High machinability, damping capacity, thermal conductivity", DisplayOrder = 1, IsVisible = true, CreatedAtUtc = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Name = "Ductile Iron Castings", Slug = "ductile-iron-castings", Description = "Superior tensile strength and impact resistance", DisplayOrder = 2, IsVisible = true, CreatedAtUtc = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Name = "SG Iron Castings", Slug = "sg-iron-castings", Description = "Spheroidal graphite iron for demanding applications", DisplayOrder = 3, IsVisible = true, CreatedAtUtc = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Name = "Machined Components", Slug = "machined-components", Description = "Ready-to-assemble machined castings", DisplayOrder = 4, IsVisible = true, CreatedAtUtc = DateTimeOffset.UtcNow },
            new() { Id = Guid.NewGuid(), Name = "Custom Castings", Slug = "custom-castings", Description = "OEM-specific custom casting solutions", DisplayOrder = 5, IsVisible = true, CreatedAtUtc = DateTimeOffset.UtcNow },
        };

        db.Categories.AddRange(categories);
        await db.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} product categories for development.", categories.Count);
    }
}

