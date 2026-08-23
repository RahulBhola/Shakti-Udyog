using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Infrastructure.Data;

/// <summary>
/// DEVELOPMENT ONLY: seeds a clearly-labelled demo customer company and customer
/// user so customer authentication can be exercised in development.
/// Idempotent: skipped when the demo company already exists. Requires
/// DevCustomer:Password in configuration; skipped otherwise.
/// </summary>
public static class DevPortalSeeder
{
    public const string CustomerEmail = "customer@demo.local";
    private const string CompanyName = "Demo Engineering Works [demo data]";

    public static async Task SeedAsync(
        AppDbContext db,
        UserManager<ApplicationUser> userManager,
        string? customerPassword,
        ILogger logger)
    {
        if (string.IsNullOrEmpty(customerPassword))
        {
            logger.LogInformation("DevCustomer:Password not configured; skipping demo portal seeding.");
            return;
        }

        if (await db.Companies.AnyAsync(c => c.Name == CompanyName))
        {
            return;
        }

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = CompanyName,
            AddressLine1 = "[Demo address line]",
            City = "Ludhiana",
            State = "Punjab",
            PostalCode = "141001",
            Country = "India",
            GstNumber = "[demo]",
            DeliveryAddresses = "[Demo delivery address 1]\n[Demo delivery address 2]",
        };
        db.Companies.Add(company);

        // Customer user
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = CustomerEmail,
            Email = CustomerEmail,
            EmailConfirmed = true,
            FullName = "Demo Customer [placeholder]",
            PhoneNumber = "+91 0000000000",
            IsActive = true,
        };
        var created = await userManager.CreateAsync(user, customerPassword);
        if (!created.Succeeded)
        {
            throw new InvalidOperationException(
                "Failed to seed demo customer: " + string.Join("; ", created.Errors.Select(e => e.Description)));
        }
        await userManager.AddToRoleAsync(user, Roles.Customer);

        db.UserCompanies.Add(new UserCompany
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            CompanyId = company.Id,
            IsApproved = true,
            ApprovedAtUtc = DateTimeOffset.UtcNow,
        });

        await db.SaveChangesAsync();
        logger.LogInformation("Seeded DEVELOPMENT demo customer '{Email}'. Do not use in production.", CustomerEmail);
    }
}
