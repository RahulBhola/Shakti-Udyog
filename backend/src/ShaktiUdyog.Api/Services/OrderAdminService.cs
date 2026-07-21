using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface IOrderAdminService
{
    Task<PagedResult<OrderListItemDto>> GetOrdersAsync(int page, int pageSize, string? search, string? status);
    Task<OrderDetailDto?> GetOrderAsync(Guid id);
    Task<bool?> ApproveCustomerUpdateAsync(Guid id, Guid userId, string? ip);
    Task<bool?> OverrideStatusAsync(Guid id, string newStatus, string? note, Guid userId, string? ip);
    Task<bool?> CancelOrderAsync(Guid id, string reason, Guid userId, string? ip);
    Task<IReadOnlyList<OrderStatusHistoryEntryDto>> GetHistoryAsync(Guid id);
}

public record OrderStatusHistoryEntryDto(string FromStatus, string ToStatus, string ChangedByRole, string? Note, DateTimeOffset OccurredAtUtc);

public class OrderAdminService(AppDbContext db, IAuditWriter audit) : IOrderAdminService
{
    public async Task<PagedResult<OrderListItemDto>> GetOrdersAsync(int page, int pageSize, string? search, string? status)
    {
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 100);
        var query = db.Orders.IgnoreQueryFilters().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(o => o.OrderNumber.Contains(search.Trim()));
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(o => o.Status == status);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(o => o.PlacedAtUtc).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(o => new OrderListItemDto(o.Id, o.OrderNumber, o.Status, o.Status, o.PlacedAtUtc, o.PromisedDispatchDateUtc, o.Items.Sum(i => i.QuantityOrdered), o.LastUpdatedAtUtc))
            .ToListAsync();
        return new PagedResult<OrderListItemDto>(items, page, pageSize, total);
    }

    public async Task<OrderDetailDto?> GetOrderAsync(Guid id)
    {
        var o = await db.Orders.IgnoreQueryFilters().Include(x => x.Items).Include(x => x.Shipments).SingleOrDefaultAsync(x => x.Id == id);
        if (o is null) return null;
        var (label, desc) = OrderStatuses.Labels.TryGetValue(o.Status, out var l) ? l : (o.Status, "");
        return new OrderDetailDto(o.Id, o.OrderNumber, o.PurchaseOrderReference, o.Status, label, desc, o.PlacedAtUtc, o.PromisedDispatchDateUtc, o.DeliveryAddress, o.LastUpdatedAtUtc,
            o.Items.Select(i => new OrderItemDto(i.PartNumber, i.Description, i.MaterialGrade, i.DrawingRevision, i.Unit, i.QuantityOrdered, i.QuantityProduced, i.QuantityDispatched)).ToList(),
            o.Shipments.Select(s => new ShipmentDto(s.Id, s.Transporter, s.TrackingNumber, s.DispatchDateUtc, s.EstimatedArrivalUtc, s.DeliveredAtUtc, s.ProofOfDeliveryDocumentId != null)).ToList(),
            null, []);
    }

    public async Task<bool?> ApproveCustomerUpdateAsync(Guid id, Guid userId, string? ip)
    {
        var o = await db.Orders.SingleOrDefaultAsync(x => x.Id == id);
        if (o is null) return null;
        o.LastUpdatedAtUtc = DateTimeOffset.UtcNow;
        db.OrderStatusHistories.Add(new OrderStatusHistory { Id = Guid.NewGuid(), OrderId = o.Id, FromStatus = o.Status, ToStatus = o.Status, ChangedByUserId = userId, ChangedByRole = "Admin", Note = "Customer-visible update approved" });
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.order.approve_update", userId, "Order", o.Id.ToString(), ip);
        return true;
    }

    public async Task<bool?> OverrideStatusAsync(Guid id, string newStatus, string? note, Guid userId, string? ip)
    {
        var o = await db.Orders.IgnoreQueryFilters().SingleOrDefaultAsync(x => x.Id == id);
        if (o is null) return null;
        var from = o.Status;
        o.Status = newStatus;
        o.LastUpdatedAtUtc = DateTimeOffset.UtcNow;
        db.OrderStatusHistories.Add(new OrderStatusHistory { Id = Guid.NewGuid(), OrderId = o.Id, FromStatus = from, ToStatus = newStatus, ChangedByUserId = userId, ChangedByRole = "Admin", Note = note ?? $"Status override: {from} → {newStatus}" });
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.order.status_overridden", userId, "Order", o.Id.ToString(), ip);
        return true;
    }

    public async Task<bool?> CancelOrderAsync(Guid id, string reason, Guid userId, string? ip)
    {
        var o = await db.Orders.SingleOrDefaultAsync(x => x.Id == id);
        if (o is null) return null;
        if (!OrderStatuses.IsValidTransition(o.Status, OrderStatuses.Cancelled)) return false;
        var from = o.Status;
        o.Status = OrderStatuses.Cancelled;
        o.LastUpdatedAtUtc = DateTimeOffset.UtcNow;
        db.OrderStatusHistories.Add(new OrderStatusHistory { Id = Guid.NewGuid(), OrderId = o.Id, FromStatus = from, ToStatus = OrderStatuses.Cancelled, ChangedByUserId = userId, ChangedByRole = "Admin", Note = reason });
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.order.cancelled", userId, "Order", o.Id.ToString(), ip);
        return true;
    }

    public async Task<IReadOnlyList<OrderStatusHistoryEntryDto>> GetHistoryAsync(Guid id)
    {
        return await db.OrderStatusHistories.IgnoreQueryFilters().Where(h => h.OrderId == id).OrderBy(h => h.CreatedAtUtc)
            .Select(h => new OrderStatusHistoryEntryDto(h.FromStatus, h.ToStatus, h.ChangedByRole, h.Note, h.CreatedAtUtc))
            .ToListAsync();
    }
}
