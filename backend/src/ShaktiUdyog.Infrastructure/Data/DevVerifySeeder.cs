using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Infrastructure.Data;

/// <summary>
/// DEVELOPMENT ONLY: seeds a verified engineer and assigns a test order to them
/// so that the engineer can see at least one order in their board.
/// This is for verification purposes only.
/// </summary>
public static class DevVerifySeeder
{
    public static async Task SeedAsync(
        AppDbContext db,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        ILogger logger)
    {
        // Ensure Engineer role exists
        var engineerRole = await roleManager.FindByNameAsync(Roles.Engineer);
        if (engineerRole == null)
        {
            engineerRole = new ApplicationRole { Name = Roles.Engineer };
            await roleManager.CreateAsync(engineerRole);
        }

        // Create test engineer user for verification
        const string engineerEmail = "verifyengineer@test.local";
        const string engineerPassword = "Verify@123!";
        const string engineerFullName = "Verify Engineer";

        var engineerUser = await userManager.FindByEmailAsync(engineerEmail);
        if (engineerUser == null)
        {
            engineerUser = new ApplicationUser
            {
                UserName = engineerEmail,
                Email = engineerEmail,
                FullName = engineerFullName,
                EmailConfirmed = true,
                IsActive = true,
            };

            var result = await userManager.CreateAsync(engineerUser, engineerPassword);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                logger.LogError("Failed to create verification engineer user: {Errors}", errors);
                return;
            }

            await userManager.AddToRoleAsync(engineerUser, Roles.Engineer);
            logger.LogInformation("Created verification engineer user: {Email}", engineerEmail);
        }

        // Get or create a test company
        var company = await db.Companies.FirstOrDefaultAsync();
        if (company == null)
        {
            company = new Company
            {
                Name = "Verification Test Company",
                AddressLine1 = "456 Test Avenue",
                City = "Testville",
                State = "TV",
                PostalCode = "67890",
                Country = "Test Country",
                GstNumber = "VERIFY123",
            };
            db.Companies.Add(company);
            await db.SaveChangesAsync();
            logger.LogInformation("Created verification test company: {CompanyName}", company.Name);
        }

        // Create a test order and assign it to the engineer
        var orderNumber = $"VERIFY-{Guid.NewGuid():N}[..8].ToUpperInvariant()";
        var existingOrder = await db.Orders.FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);
        if (existingOrder == null)
        {
            var order = new Order
            {
                Id = Guid.NewGuid(),
                OrderNumber = orderNumber,
                CompanyId = company.Id,
                Status = OrderStatuses.Confirmed,
                PlacedAtUtc = DateTimeOffset.UtcNow.Subtract(TimeSpan.FromDays(5)),
                LastUpdatedAtUtc = DateTimeOffset.UtcNow,
                AssignedToUserId = engineerUser.Id,
            };

            db.Orders.Add(order);
            await db.SaveChangesAsync();
            logger.LogInformation("Created verification test order {OrderNumber} assigned to engineer {EngineerEmail}", orderNumber, engineerEmail);
        }
        else
        {
            logger.LogInformation("Verification test order {OrderNumber} already exists", orderNumber);
        }
    }
}