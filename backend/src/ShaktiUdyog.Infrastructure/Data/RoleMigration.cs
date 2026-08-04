using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Infrastructure.Data;

/// <summary>
/// One-time, idempotent data migration for the role rename "DataUpdater" → "Engineer".
/// Called at startup after <see cref="RoleSeeder"/>. It reassigns any users still
/// holding the retired DataUpdater role to Engineer, updates historical audit strings,
/// and removes the DataUpdater role row. Safe to run on a fresh database (early-returns
/// when the DataUpdater role no longer exists).
/// </summary>
public static class RoleMigration
{
    public static async Task MigrateDataUpdaterToEngineerAsync(AppDbContext db)
    {
        var engineerRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == Roles.Engineer);
        var dataUpdaterRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == "DataUpdater");
        if (engineerRole == null || dataUpdaterRole == null)
        {
            // Nothing to migrate — fresh DB (DataUpdater no longer seeded) or roles not yet present.
            return;
        }

        // 1. Reassign users from DataUpdater → Engineer (dedupe), then drop the DataUpdater link.
        var dataUpdaterUserRoles = await db.UserRoles
            .Where(ur => ur.RoleId == dataUpdaterRole.Id)
            .ToListAsync();
        foreach (var ur in dataUpdaterUserRoles)
        {
            if (!await db.UserRoles.AnyAsync(x => x.UserId == ur.UserId && x.RoleId == engineerRole.Id))
            {
                db.UserRoles.Add(new IdentityUserRole<Guid> { UserId = ur.UserId, RoleId = engineerRole.Id });
            }
            db.UserRoles.Remove(ur);
        }
        await db.SaveChangesAsync();

        // 2. Update historical audit strings ("DataUpdater" → "Engineer").
        await db.EnquiryStatusHistories
            .Where(h => h.ChangedByRole == "DataUpdater")
            .ExecuteUpdateAsync(s => s.SetProperty(h => h.ChangedByRole, "Engineer"));
        await db.QuotationStatusHistories
            .Where(h => h.ChangedByRole == "DataUpdater")
            .ExecuteUpdateAsync(s => s.SetProperty(h => h.ChangedByRole, "Engineer"));
        await db.InvoiceStatusHistories
            .Where(h => h.ChangedByRole == "DataUpdater")
            .ExecuteUpdateAsync(s => s.SetProperty(h => h.ChangedByRole, "Engineer"));
        await db.OrderStatusHistories
            .Where(h => h.ChangedByRole == "DataUpdater")
            .ExecuteUpdateAsync(s => s.SetProperty(h => h.ChangedByRole, "Engineer"));
        await db.OrderMilestones
            .Where(m => m.ActorType == "DataUpdater")
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.ActorType, "Engineer"));

        // 3. Remove the retired DataUpdater role.
        db.Roles.Remove(dataUpdaterRole);
        await db.SaveChangesAsync();
    }
}
