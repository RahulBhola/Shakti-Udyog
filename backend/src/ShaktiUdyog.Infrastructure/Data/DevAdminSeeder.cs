using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
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
        AppDbContext dbContext,
        ILogger logger)
    {
        if (string.IsNullOrEmpty(password))
        {
            logger.LogInformation("DevAdmin:Password not configured; skipping demo admin seeding.");
            return;
        }

        if (await userManager.FindByEmailAsync(Email) is not null)
        {
            // Still seed categories if they're missing
            await SeedCategoriesAsync(dbContext, logger);
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
        await SeedCategoriesAsync(dbContext, logger);
        logger.LogWarning("Seeded DEVELOPMENT demo admin '{Email}'. Do not use in production.", Email);
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
