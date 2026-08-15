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
    Task<bool?> CreateShipmentAsync(Guid orderId, CreateShipmentRequest request, Guid userId, string? ip);
    Task<bool?> UpdateShipmentAsync(Guid orderId, Guid shipmentId, CreateShipmentRequest request, Guid userId, string? ip);
    Task<bool?> DeleteShipmentAsync(Guid orderId, Guid shipmentId, Guid userId, string? ip);
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
            .Select(o => new OrderListItemDto(o.Id, o.OrderNumber, o.Status, o.Status, o.PlacedAtUtc, o.PromisedDispatchDateUtc, o.Items.Sum(i => i.QuantityOrdered), o.LastUpdatedAtUtc, o.Company!.Name, o.Quotation!.Enquiry!.ProductType,
                o.AssignedToUserId, o.AssignedToUser != null ? o.AssignedToUser.FullName : null))
            .ToListAsync();
        return new PagedResult<OrderListItemDto>(items, page, pageSize, total);
    }

    public async Task<OrderDetailDto?> GetOrderAsync(Guid id)
    {
        var o = await db.Orders.IgnoreQueryFilters().Include(x => x.Items).Include(x => x.Shipments).Include(x => x.AssignedToUser).SingleOrDefaultAsync(x => x.Id == id);
        if (o is null) return null;
        var (label, desc) = OrderStatuses.Labels.TryGetValue(o.Status, out var l) ? l : (o.Status, "");
        return new OrderDetailDto(o.Id, o.OrderNumber, o.PurchaseOrderReference, o.Status, label, desc, o.PlacedAtUtc, o.PromisedDispatchDateUtc, o.DeliveryAddress, o.LastUpdatedAtUtc,
            o.Items.Select(i => new OrderItemDto(i.Id, i.PartNumber, i.Description, i.MaterialGrade, i.DrawingRevision, i.Unit, i.QuantityOrdered, i.QuantityProduced, i.QuantityDispatched, i.UnitRate)).ToList(),
            o.Shipments.Select(s => new ShipmentDto(s.Id, s.Transporter, s.TrackingNumber, s.VehicleNumber, s.PhoneNumber, s.DispatchDateUtc, s.EstimatedArrivalUtc, s.DeliveredAtUtc, s.ProofOfDeliveryDocumentId != null)).ToList(),
            null, [],
            o.AdvancePercent, o.AdvanceAmount, o.AdvancePaid, o.AdvancePaidAtUtc,
            o.AdvancePaymentRef, o.AdvanceVerifiedAtUtc,
            o.QuotationTotal, o.PaymentTerms, o.QuotationId,
            o.Milestones.Select(m => new OrderMilestoneDto(m.Id, m.StatusCode, m.CustomerMessage, m.OccurredAtUtc)).ToList(),
            o.AssignedToUserId, o.AssignedToUser != null ? o.AssignedToUser.FullName : null);
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

    public async Task<bool?> CreateShipmentAsync(Guid orderId, CreateShipmentRequest request, Guid userId, string? ip)
    {
        var o = await db.Orders.IgnoreQueryFilters().SingleOrDefaultAsync(x => x.Id == orderId);
        if (o is null) return null;

        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            Transporter = request.Transporter,
            TrackingNumber = request.TrackingNumber,
            VehicleNumber = request.VehicleNumber,
            PhoneNumber = request.PhoneNumber,
            DispatchDateUtc = request.DispatchDateUtc,
            EstimatedArrivalUtc = request.EstimatedArrivalUtc,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        db.Shipments.Add(shipment);
        o.LastUpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.order.shipment_created", userId, "Shipment", shipment.Id.ToString(), ip);
        return true;
    }

    public async Task<bool?> UpdateShipmentAsync(Guid orderId, Guid shipmentId, CreateShipmentRequest request, Guid userId, string? ip)
    {
        var shipment = await db.Shipments.SingleOrDefaultAsync(s => s.Id == shipmentId && s.OrderId == orderId);
        if (shipment is null) return null;

        shipment.Transporter = request.Transporter;
        shipment.TrackingNumber = request.TrackingNumber;
        shipment.VehicleNumber = request.VehicleNumber;
        shipment.PhoneNumber = request.PhoneNumber;
        shipment.DispatchDateUtc = request.DispatchDateUtc;
        shipment.EstimatedArrivalUtc = request.EstimatedArrivalUtc;

        var order = await db.Orders.IgnoreQueryFilters().SingleOrDefaultAsync(x => x.Id == orderId);
        if (order != null) order.LastUpdatedAtUtc = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.order.shipment_updated", userId, "Shipment", shipmentId.ToString(), ip);
        return true;
    }

    public async Task<bool?> DeleteShipmentAsync(Guid orderId, Guid shipmentId, Guid userId, string? ip)
    {
        var shipment = await db.Shipments.SingleOrDefaultAsync(s => s.Id == shipmentId && s.OrderId == orderId);
        if (shipment is null) return null;

        db.Shipments.Remove(shipment);

        var order = await db.Orders.IgnoreQueryFilters().SingleOrDefaultAsync(x => x.Id == orderId);
        if (order != null) order.LastUpdatedAtUtc = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.order.shipment_deleted", userId, "Shipment", shipmentId.ToString(), ip);
        return true;
    }
}
