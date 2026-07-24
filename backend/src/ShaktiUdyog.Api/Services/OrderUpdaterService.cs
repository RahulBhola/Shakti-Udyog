using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;
using ShaktiUdyog.Infrastructure.Notifications;
using ShaktiUdyog.Infrastructure.Storage;

namespace ShaktiUdyog.Api.Services;

public interface IOrderUpdaterService
{
    Task<PagedResult<OrderListItemDto>> GetOrdersAsync(int page, int pageSize, string? search, string? status);
    Task<OrderDetailDto?> GetOrderAsync(Guid id);
    Task<bool?> UpdateMilestoneAsync(Guid id, MilestoneRequest request, Guid userId, string? ip);
    Task<bool?> CreateShipmentAsync(Guid id, CreateShipmentRequest request, Guid userId, string? ip);
    Task UploadDocumentAsync(Guid id, IFormFile file, string category, Guid userId, string? ip);
    Task<bool?> AddCommentAsync(Guid id, OrderCommentRequest request, Guid userId, string role, string? ip);
}

public record MilestoneRequest(string StatusCode, string? CustomerMessage, string? InternalNote);
public record CreateShipmentRequest(string? Transporter, string? TrackingNumber, DateTimeOffset? DispatchDateUtc, DateTimeOffset? EstimatedArrivalUtc);
public record OrderCommentRequest(string Message, bool IsCustomerVisible = true);

public class OrderUpdaterService(
    AppDbContext db,
    IFileStorageService storage,
    INotificationService notifications,
    IAuditWriter audit) : IOrderUpdaterService
{
    public async Task<PagedResult<OrderListItemDto>> GetOrdersAsync(int page, int pageSize, string? search, string? status)
    {
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 100);
        var query = db.Orders.AsQueryable();
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
        var o = await db.Orders.Include(x => x.Items).Include(x => x.Shipments).SingleOrDefaultAsync(x => x.Id == id);
        if (o is null) return null;
        var (label, desc) = OrderStatuses.Labels.TryGetValue(o.Status, out var l) ? l : (o.Status, "");
        return new OrderDetailDto(o.Id, o.OrderNumber, o.PurchaseOrderReference, o.Status, label, desc, o.PlacedAtUtc, o.PromisedDispatchDateUtc, o.DeliveryAddress, o.LastUpdatedAtUtc,
            o.Items.Select(i => new OrderItemDto(i.PartNumber, i.Description, i.MaterialGrade, i.DrawingRevision, i.Unit, i.QuantityOrdered, i.QuantityProduced, i.QuantityDispatched)).ToList(),
            o.Shipments.Select(s => new ShipmentDto(s.Id, s.Transporter, s.TrackingNumber, s.DispatchDateUtc, s.EstimatedArrivalUtc, s.DeliveredAtUtc, s.ProofOfDeliveryDocumentId != null)).ToList(),
            null, []);
    }

    public async Task<bool?> UpdateMilestoneAsync(Guid id, MilestoneRequest request, Guid userId, string? ip)
    {
        var o = await db.Orders.Include(x => x.Milestones).SingleOrDefaultAsync(x => x.Id == id);
        if (o is null) return null;
        if (!OrderStatuses.IsValidTransition(o.Status, request.StatusCode)) return false;
        var from = o.Status;
        o.Status = request.StatusCode;
        o.LastUpdatedAtUtc = DateTimeOffset.UtcNow;
        var milestone = new OrderMilestone { Id = Guid.NewGuid(), OrderId = o.Id, StatusCode = request.StatusCode, CustomerMessage = request.CustomerMessage, InternalNote = request.InternalNote, ActorType = "DataUpdater", IsCustomerVisible = true };
        db.OrderMilestones.Add(milestone);
        db.OrderStatusHistories.Add(new OrderStatusHistory { Id = Guid.NewGuid(), OrderId = o.Id, FromStatus = from, ToStatus = request.StatusCode, ChangedByUserId = userId, ChangedByRole = "DataUpdater", Note = request.CustomerMessage });
        await db.SaveChangesAsync();
        await notifications.NotifyOrderStatusChangedAsync(o, from, request.StatusCode);
        await audit.WriteAsync("updater.order.milestone_updated", userId, "Order", o.Id.ToString(), ip);
        return true;
    }

    public async Task<bool?> CreateShipmentAsync(Guid id, CreateShipmentRequest request, Guid userId, string? ip)
    {
        if (!await db.Orders.AnyAsync(x => x.Id == id)) return null;
        db.Shipments.Add(new Shipment { Id = Guid.NewGuid(), OrderId = id, Transporter = request.Transporter, TrackingNumber = request.TrackingNumber, DispatchDateUtc = request.DispatchDateUtc, EstimatedArrivalUtc = request.EstimatedArrivalUtc });
        await db.SaveChangesAsync();
        await audit.WriteAsync("updater.order.shipment_created", userId, "Shipment", id.ToString(), ip);
        return true;
    }

    public async Task UploadDocumentAsync(Guid id, IFormFile file, string category, Guid userId, string? ip)
    {
        await using var stream = file.OpenReadStream();
        var stored = await storage.SaveAsync(stream, file.FileName, file.ContentType);
        db.Documents.Add(new Document { Id = Guid.NewGuid(), CompanyId = Guid.Empty, OrderId = id, Title = file.FileName, Category = category, FileName = file.FileName, ContentType = file.ContentType, SizeBytes = stored.SizeBytes, StorageKey = stored.StorageKey, IsCustomerVisible = true });
        await db.SaveChangesAsync();
        await audit.WriteAsync("updater.order.document_uploaded", userId, "Document", id.ToString(), ip);
    }

    public async Task<bool?> AddCommentAsync(Guid id, OrderCommentRequest request, Guid userId, string role, string? ip)
    {
        if (!await db.Orders.AnyAsync(x => x.Id == id)) return null;
        db.OrderComments.Add(new OrderComment { Id = Guid.NewGuid(), OrderId = id, AuthorUserId = userId, AuthorRole = role, IsCustomerVisible = request.IsCustomerVisible, Message = request.Message.Trim() });
        await db.SaveChangesAsync();
        await audit.WriteAsync("updater.order.comment_added", userId, "OrderComment", id.ToString(), ip);
        return true;
    }
}
