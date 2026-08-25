using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Hubs;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface INotificationDeliveryService
{
    Task<Notification?> SendToUserAsync(Guid userId, string type, string title, string? body, string? linkPath, CancellationToken ct = default);
    Task<IReadOnlyList<Notification>> SendToUsersAsync(IEnumerable<Guid> userIds, string type, string title, string? body, string? linkPath, CancellationToken ct = default);
    Task<IReadOnlyList<Notification>> NotifyAdminsAndEngineersAsync(string type, string title, string? body, string? linkPath, CancellationToken ct = default);
    Task<IReadOnlyList<Notification>> NotifyAdminsAsync(string type, string title, string? body, string? linkPath, CancellationToken ct = default);
    Task<IReadOnlyList<Notification>> NotifyEngineersAsync(string type, string title, string? body, string? linkPath, CancellationToken ct = default);
    Task<IReadOnlyList<Notification>> NotifyCompanyUsersAsync(Guid companyId, string type, string title, string? body, string? linkPath, CancellationToken ct = default);
}

/// <summary>
/// Centralized enterprise notification delivery service:
/// Persists notifications to DB and broadcasts them in real time over SignalR.
/// </summary>
public class NotificationDeliveryService(
    AppDbContext db,
    IPortalPush push,
    ILogger<NotificationDeliveryService> logger) : INotificationDeliveryService
{
    public async Task<Notification?> SendToUserAsync(
        Guid userId, string type, string title, string? body, string? linkPath, CancellationToken ct = default)
    {
        var list = await SendToUsersAsync([userId], type, title, body, linkPath, ct);
        return list.FirstOrDefault();
    }

    public async Task<IReadOnlyList<Notification>> SendToUsersAsync(
        IEnumerable<Guid> userIds, string type, string title, string? body, string? linkPath, CancellationToken ct = default)
    {
        var distinctIds = userIds.Distinct().ToList();
        if (distinctIds.Count == 0) return [];

        var now = DateTimeOffset.UtcNow;
        var created = new List<Notification>();

        foreach (var uid in distinctIds)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = uid,
                Type = type,
                Title = title,
                Body = body,
                LinkPath = linkPath,
                IsRead = false,
                CreatedAtUtc = now,
            };
            db.Notifications.Add(notification);
            created.Add(notification);
        }

        await db.SaveChangesAsync(ct);

        foreach (var n in created)
        {
            try
            {
                await push.NotificationCreatedAsync(n.UserId, new NotificationCreatedPayload(
                    n.Id, n.Title, n.Body, n.LinkPath, n.CreatedAtUtc));
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to push realtime notification to user {UserId}", n.UserId);
            }
        }

        return created;
    }

    public async Task<IReadOnlyList<Notification>> NotifyAdminsAndEngineersAsync(
        string type, string title, string? body, string? linkPath, CancellationToken ct = default)
    {
        var roleIds = await db.Roles
            .Where(r => r.Name == Roles.Admin || r.Name == Roles.Engineer)
            .Select(r => r.Id)
            .ToListAsync(ct);

        var userIds = await db.UserRoles
            .Where(ur => roleIds.Contains(ur.RoleId))
            .Select(ur => ur.UserId)
            .Distinct()
            .ToListAsync(ct);

        return await SendToUsersAsync(userIds, type, title, body, linkPath, ct);
    }

    public async Task<IReadOnlyList<Notification>> NotifyAdminsAsync(
        string type, string title, string? body, string? linkPath, CancellationToken ct = default)
    {
        var adminRoleId = await db.Roles
            .Where(r => r.Name == Roles.Admin)
            .Select(r => r.Id)
            .FirstOrDefaultAsync(ct);

        if (adminRoleId == default) return [];

        var userIds = await db.UserRoles
            .Where(ur => ur.RoleId == adminRoleId)
            .Select(ur => ur.UserId)
            .Distinct()
            .ToListAsync(ct);

        return await SendToUsersAsync(userIds, type, title, body, linkPath, ct);
    }

    public async Task<IReadOnlyList<Notification>> NotifyEngineersAsync(
        string type, string title, string? body, string? linkPath, CancellationToken ct = default)
    {
        var engineerRoleId = await db.Roles
            .Where(r => r.Name == Roles.Engineer)
            .Select(r => r.Id)
            .FirstOrDefaultAsync(ct);

        if (engineerRoleId == default) return [];

        var userIds = await db.UserRoles
            .Where(ur => ur.RoleId == engineerRoleId)
            .Select(ur => ur.UserId)
            .Distinct()
            .ToListAsync(ct);

        return await SendToUsersAsync(userIds, type, title, body, linkPath, ct);
    }

    public async Task<IReadOnlyList<Notification>> NotifyCompanyUsersAsync(
        Guid companyId, string type, string title, string? body, string? linkPath, CancellationToken ct = default)
    {
        var userIds = await db.UserCompanies
            .Where(uc => uc.CompanyId == companyId && uc.IsApproved)
            .Select(uc => uc.UserId)
            .Distinct()
            .ToListAsync(ct);

        return await SendToUsersAsync(userIds, type, title, body, linkPath, ct);
    }
}
