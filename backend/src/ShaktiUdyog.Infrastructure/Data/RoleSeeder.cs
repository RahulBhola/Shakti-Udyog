using Microsoft.AspNetCore.Identity;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Infrastructure.Data;

/// <summary>
/// Seeds the fixed application roles. Idempotent; safe to run at every startup.
/// No users are seeded here — accounts are created only through the invitation /
/// admin-approval flows built in Milestone 2.
/// </summary>
public static class RoleSeeder
{
    private static readonly Dictionary<string, string> RoleDescriptions = new()
    {
        [Roles.Admin] = "Full administrative access: users, roles, approvals, audit logs, and system settings.",
        [Roles.DataUpdater] = "Internal staff: content, enquiry, quotation, and order-milestone updates within assigned scope.",
        [Roles.Customer] = "Approved customer users: access restricted to records of their approved company.",
    };

    public static async Task SeedAsync(RoleManager<ApplicationRole> roleManager)
    {
        foreach (var roleName in Roles.All)
        {
            if (await roleManager.RoleExistsAsync(roleName))
            {
                continue;
            }

            var result = await roleManager.CreateAsync(new ApplicationRole(roleName)
            {
                Description = RoleDescriptions[roleName],
            });

            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to seed role '{roleName}': {errors}");
            }
        }
    }
}
