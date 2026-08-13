using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Hubs;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

/// <summary>An order card on the engineer manufacturing Kanban.</summary>
public record EngineerOrderDto(
    Guid Id, string OrderNumber, string? CompanyName, string? ProductType,
    int TotalQuantity, string ManufacturingStage, DateTimeOffset? StageUpdatedAt, DateTimeOffset PlacedAtUtc);

/// <summary>Body for the engineer stage-move endpoint.</summary>
public record EngineerStageRequest(string Stage);

public interface IEngineerManufacturingService
{
    /// <summary>Orders on the manufacturing board visible to the caller (only assigned, or all for admins).</summary>
    Task<IReadOnlyList<EngineerOrderDto>> GetBoardOrdersAsync(Guid userId, bool isAdmin);
    /// <summary>null = not found / not visible; false = transition not allowed; true = moved.</summary>
    Task<bool?> MoveStageAsync(Guid orderId, Guid userId, bool isAdmin, string targetStage, string? ip);
}

/// <summary>
/// Order-level manufacturing board for engineers. Unlike the job-level
/// ProductionBoard, this drives the customer-visible Order lifecycle: each stage
/// advance updates the order status, appends a milestone, notifies the customer,
/// and broadcasts the change to engineers/admins in realtime.
/// </summary>
public class EngineerManufacturingService(
    AppDbContext db,
    IPortalPush push,
    IAuditWriter audit) : IEngineerManufacturingService
{
    public async Task<IReadOnlyList<EngineerOrderDto>> GetBoardOrdersAsync(Guid userId, bool isAdmin)
    {
        var query = db.Orders
            .Where(o => o.AssignedToUserId != null && o.Status != OrderStatuses.Cancelled);

        if (!isAdmin)
            query = query.Where(o => o.AssignedToUserId == userId);

        return await query
            .OrderByDescending(o => o.StageUpdatedAt ?? o.PlacedAtUtc)
            .Select(o => new EngineerOrderDto(
                o.Id,
                o.OrderNumber,
                o.Company.Name,
                o.Quotation != null ? o.Quotation.Enquiry.ProductType : null,
                o.Items.Sum(i => i.QuantityOrdered),
                o.ManufacturingStage ?? ManufacturingStages.PatternDevelopment,
                o.StageUpdatedAt,
                o.PlacedAtUtc))
            .ToListAsync();
    }

    public async Task<bool?> MoveStageAsync(Guid orderId, Guid userId, bool isAdmin, string targetStage, string? ip)
    {
        var order = await db.Orders.SingleOrDefaultAsync(o => o.Id == orderId);
        if (order is null) return null;
        if (!isAdmin && order.AssignedToUserId != userId) return null;
        if (order.Status == OrderStatuses.Cancelled) return false;

        var fromStage = order.ManufacturingStage ?? ManufacturingStages.PatternDevelopment;
        if (!ManufacturingStages.IsValidForwardTransition(fromStage, targetStage)) return false;

        var now = DateTimeOffset.UtcNow;
        order.ManufacturingStage = targetStage;
        order.StageUpdatedAt = now;
        order.Status = targetStage;   // keep the order status in sync with the board
        order.LastUpdatedAtUtc = now;

        db.OrderMilestones.Add(new OrderMilestone
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            StatusCode = targetStage,
            CustomerMessage = ManufacturingStages.MessageFor(targetStage),
            ActorType = "Engineer",
            IsCustomerVisible = true,
            OccurredAtUtc = now,
        });

        db.OrderStatusHistories.Add(new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            FromStatus = fromStage,
            ToStatus = targetStage,
            ChangedByUserId = userId,
            ChangedByRole = "Engineer",
            Note = ManufacturingStages.MessageFor(targetStage),
            CreatedAtUtc = now,
        });

        // Notify every user linked to the order's company.
        var userIds = await db.UserCompanies
            .Where(uc => uc.CompanyId == order.CompanyId)
            .Select(uc => uc.UserId)
            .Distinct()
            .ToListAsync();

        foreach (var uid in userIds)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = uid,
                Type = NotificationTypes.Order,
                Title = ManufacturingStages.LabelFor(targetStage),
                Body = ManufacturingStages.MessageFor(targetStage),
                LinkPath = $"/customer/orders/{order.Id}",
                CreatedAtUtc = now,
            };
            db.Notifications.Add(notification);
            await push.NotificationCreatedAsync(uid, new NotificationCreatedPayload(
                notification.Id, notification.Title, notification.Body, notification.LinkPath, now));
        }

        await db.SaveChangesAsync();
        await push.StageChangedAsync(order.Id, order.OrderNumber, fromStage, targetStage);
        await audit.WriteAsync("engineer.order.stage_changed", userId, "Order", order.Id.ToString(), ip);
        return true;
    }
}
