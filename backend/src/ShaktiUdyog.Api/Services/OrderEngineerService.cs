using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Api.Hubs;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;
using ShaktiUdyog.Infrastructure.Notifications;
using ShaktiUdyog.Infrastructure.Storage;
using ShaktiUdyog.Domain.Exceptions;

namespace ShaktiUdyog.Api.Services;

/// <summary>
/// Thrown when an Engineer attempts to manage an order that is not assigned to
/// them. Handled as a 403 Forbidden RFC 7807 response.
/// </summary>
public class OrderAccessException() : ForbiddenAccessException("You are not assigned to manage this order.");

public interface IOrderEngineerService
{
    Task<PagedResult<OrderListItemDto>> GetOrdersAsync(int page, int pageSize, string? search, string? status, Guid? companyId, bool? assigned, Guid callerUserId, bool callerIsAdmin);
    Task<OrderDetailDto?> GetOrderAsync(Guid id, Guid callerUserId, bool callerIsAdmin);
    Task<bool?> UpdateMilestoneAsync(Guid id, MilestoneRequest request, Guid userId, bool callerIsAdmin, string? ip);
    Task<bool?> CreateShipmentAsync(Guid id, CreateShipmentRequest request, Guid userId, bool callerIsAdmin, string? ip);
    Task<bool?> UpdateShipmentAsync(Guid orderId, Guid shipmentId, CreateShipmentRequest request, Guid userId, bool callerIsAdmin, string? ip);
    Task<bool?> DeleteShipmentAsync(Guid orderId, Guid shipmentId, Guid userId, bool callerIsAdmin, string? ip);
    Task<bool?> DeleteOrderAsync(Guid id, Guid userId, bool callerIsAdmin, string? ip);
    Task UploadDocumentAsync(Guid id, IFormFile file, string category, Guid userId, bool callerIsAdmin, string? ip);
    Task<bool?> AddCommentAsync(Guid id, OrderCommentRequest request, Guid userId, string role, bool callerIsAdmin, string? ip);
    Task<IReadOnlyList<OrderCommentResponseDto>> GetCommentsAsync(Guid id);
}

public record MilestoneRequest(string StatusCode, string? CustomerMessage, string? InternalNote);
public record OrderCommentRequest(string Message, bool IsCustomerVisible = true);
public record OrderCommentResponseDto(string AuthorRole, string? AuthorName, string Message, DateTimeOffset CreatedAtUtc);

public class OrderEngineerService(
    AppDbContext db,
    IFileStorageService storage,
    INotificationService notifications,
    IAuditWriter audit,
    IPortalPush push) : IOrderEngineerService
{
    /// <summary>Admins manage any order; engineers only the orders assigned to them.</summary>
    private static bool CanManage(Order o, Guid callerUserId, bool callerIsAdmin)
        => callerIsAdmin || o.AssignedToUserId == callerUserId;

    public async Task<PagedResult<OrderListItemDto>> GetOrdersAsync(int page, int pageSize, string? search, string? status, Guid? companyId, bool? assigned, Guid callerUserId, bool callerIsAdmin)
    {
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 100);
        var query = db.Orders.AsQueryable();
        if (!callerIsAdmin)
            query = query.Where(o => o.AssignedToUserId == callerUserId);
        if (companyId.HasValue)
            query = query.Where(o => o.CompanyId == companyId.Value);
        if (assigned.HasValue)
            query = assigned.Value
                ? query.Where(o => o.AssignedToUserId != null)
                : query.Where(o => o.AssignedToUserId == null);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(o => o.OrderNumber.Contains(search.Trim()));
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(o => o.Status == status);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(o => o.PlacedAtUtc).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(o => new OrderListItemDto(o.Id, o.OrderNumber, o.Status, o.Status, o.PlacedAtUtc, o.PromisedDispatchDateUtc, o.Items.Sum(i => i.QuantityOrdered), o.LastUpdatedAtUtc, o.Company.Name, o.Quotation!.Enquiry!.ProductType,
                o.AssignedToUserId, o.AssignedToUser != null ? o.AssignedToUser.FullName : null,
                o.ManufacturingStage ?? (ManufacturingStages.Workflow.Contains(o.Status) ? o.Status : ManufacturingStages.PatternDevelopment),
                o.StageUpdatedAt))
            .ToListAsync();
        return new PagedResult<OrderListItemDto>(items, page, pageSize, total);
    }

    public async Task<OrderDetailDto?> GetOrderAsync(Guid id, Guid callerUserId, bool callerIsAdmin)
    {
        var o = await db.Orders
            .Include(x => x.Items)
            .Include(x => x.Shipments)
            .Include(x => x.Milestones)
            .Include(x => x.AssignedToUser)
            .SingleOrDefaultAsync(x => x.Id == id);
        if (o is null) return null;
        if (!CanManage(o, callerUserId, callerIsAdmin)) throw new OrderAccessException();

        var (label, desc) = OrderStatuses.Labels.TryGetValue(o.Status, out var l) ? l : (o.Status, "");

        // Load commercial data from invoices
        var latestInvoice = await db.Invoices
            .Where(i => i.OrderId == id)
            .OrderByDescending(i => i.IssueDateUtc)
            .Select(i => new OrderCommercialDto(i.InvoiceNumber, i.IssueDateUtc, i.DueDateUtc, i.Total, i.AmountPaid, i.BalanceDue, i.Status))
            .FirstOrDefaultAsync();

        // Load order-linked documents
        var documents = await db.Documents
            .Where(d => d.OrderId == id && !d.IsDeleted && d.Category != "Invoice")
            .OrderByDescending(d => d.CreatedAtUtc)
            .Select(d => new DocumentListItemDto(d.Id, d.Title, d.Category, d.FileName, d.SizeBytes, o.OrderNumber, d.CreatedAtUtc, d.ContentType, d.OrderId))
            .ToListAsync();

        var effectiveStage = o.ManufacturingStage ?? (ManufacturingStages.Workflow.Contains(o.Status) ? o.Status : (o.Status == OrderStatuses.Dispatched || o.Status == OrderStatuses.Delivered ? ManufacturingStages.ReadyToDispatch : ManufacturingStages.PatternDevelopment));

        var quotation = o.QuotationId.HasValue
            ? await db.Quotations.Select(q => new { q.Id, q.Subtotal, q.Tax, q.Total, q.PaymentTerms }).FirstOrDefaultAsync(q => q.Id == o.QuotationId.Value)
            : null;

        var quoteSubtotal = quotation?.Subtotal ?? (o.QuotationTotal.HasValue ? Math.Round(o.QuotationTotal.Value / 1.18m, 2) : (decimal?)null);
        var quoteTax = quotation?.Tax ?? (o.QuotationTotal.HasValue && quoteSubtotal.HasValue ? Math.Round(o.QuotationTotal.Value - quoteSubtotal.Value, 2) : (decimal?)null);

        return new OrderDetailDto(o.Id, o.OrderNumber, o.PurchaseOrderReference, o.Status, label, desc,
            o.PlacedAtUtc, o.PromisedDispatchDateUtc, o.DeliveryAddress, o.LastUpdatedAtUtc,
            o.Items.Select(i => new OrderItemDto(i.Id, i.PartNumber, i.Description, i.MaterialGrade,
                i.DrawingRevision, i.Unit, i.QuantityOrdered, i.QuantityProduced, i.QuantityDispatched, i.UnitRate)).ToList(),
            o.Shipments.Select(s => new ShipmentDto(s.Id, s.Transporter, s.TrackingNumber,
                s.VehicleNumber, s.PhoneNumber,
                s.DispatchDateUtc, s.EstimatedArrivalUtc, s.DeliveredAtUtc, s.ProofOfDeliveryDocumentId != null)).ToList(),
            latestInvoice, documents,
            o.AdvancePercent, o.AdvanceAmount, o.AdvancePaid, o.AdvancePaidAtUtc,
            o.AdvancePaymentRef, o.AdvanceVerifiedAtUtc,
            quotation?.Total ?? o.QuotationTotal, quotation?.PaymentTerms ?? o.PaymentTerms, o.QuotationId,
            o.Milestones.Select(m => new OrderMilestoneDto(m.Id, m.StatusCode, m.CustomerMessage, m.OccurredAtUtc)).ToList(),
            o.AssignedToUserId, o.AssignedToUser != null ? o.AssignedToUser.FullName : null,
            effectiveStage,
            o.StageUpdatedAt,
            quoteSubtotal,
            quoteTax);
    }

    public async Task<bool?> UpdateMilestoneAsync(Guid id, MilestoneRequest request, Guid userId, bool callerIsAdmin, string? ip)
    {
        var o = await db.Orders.Include(x => x.Milestones).SingleOrDefaultAsync(x => x.Id == id);
        if (o is null) return null;
        if (!CanManage(o, userId, callerIsAdmin)) throw new OrderAccessException();
        if (!OrderStatuses.IsValidTransition(o.Status, request.StatusCode) && !ManufacturingStages.IsValidTransition(o.ManufacturingStage ?? o.Status, request.StatusCode)) return false;
        var from = o.Status;
        var now = DateTimeOffset.UtcNow;
        o.Status = request.StatusCode;
        if (ManufacturingStages.SortOrder.ContainsKey(request.StatusCode))
        {
            o.ManufacturingStage = request.StatusCode;
            o.StageUpdatedAt = now;
        }
        o.LastUpdatedAtUtc = now;
        var milestone = new OrderMilestone
        {
            Id = Guid.NewGuid(),
            OrderId = o.Id,
            StatusCode = request.StatusCode,
            CustomerMessage = request.CustomerMessage ?? (ManufacturingStages.CustomerNotification.TryGetValue(request.StatusCode, out var msg) ? msg : OrderStatuses.ProgressionLabels.GetValueOrDefault(request.StatusCode, request.StatusCode)),
            InternalNote = request.InternalNote,
            ActorType = callerIsAdmin ? "Admin" : "Engineer",
            IsCustomerVisible = true,
            OccurredAtUtc = now
        };
        db.OrderMilestones.Add(milestone);
        db.OrderStatusHistories.Add(new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            OrderId = o.Id,
            FromStatus = from,
            ToStatus = request.StatusCode,
            ChangedByUserId = userId,
            ChangedByRole = callerIsAdmin ? "Admin" : "Engineer",
            Note = request.CustomerMessage ?? request.InternalNote,
            CreatedAtUtc = now
        });
        await db.SaveChangesAsync();
        await notifications.NotifyOrderStatusChangedAsync(o, from, request.StatusCode);
        await push.StageChangedAsync(o.Id, o.OrderNumber, from, request.StatusCode);
        await audit.WriteAsync("engineer.order.milestone_updated", userId, "Order", o.Id.ToString(), ip);
        return true;
    }

    public async Task<bool?> CreateShipmentAsync(Guid id, CreateShipmentRequest request, Guid userId, bool callerIsAdmin, string? ip)
    {
        var o = await db.Orders.SingleOrDefaultAsync(x => x.Id == id);
        if (o is null) return null;
        if (!CanManage(o, userId, callerIsAdmin)) throw new OrderAccessException();
        db.Shipments.Add(new Shipment { Id = Guid.NewGuid(), OrderId = id, Transporter = request.Transporter, VehicleNumber = request.VehicleNumber, PhoneNumber = request.PhoneNumber, DispatchDateUtc = request.DispatchDateUtc, EstimatedArrivalUtc = request.EstimatedArrivalUtc });
        await db.SaveChangesAsync();
        await audit.WriteAsync("engineer.order.shipment_created", userId, "Shipment", id.ToString(), ip);
        return true;
    }

    public async Task<bool?> UpdateShipmentAsync(Guid orderId, Guid shipmentId, CreateShipmentRequest request, Guid userId, bool callerIsAdmin, string? ip)
    {
        var o = await db.Orders.SingleOrDefaultAsync(x => x.Id == orderId);
        if (o is null) return null;
        if (!CanManage(o, userId, callerIsAdmin)) throw new OrderAccessException();

        var shipment = await db.Shipments.SingleOrDefaultAsync(s => s.Id == shipmentId && s.OrderId == orderId);
        if (shipment is null) return null;

        shipment.Transporter = request.Transporter;
        shipment.VehicleNumber = request.VehicleNumber;
        shipment.PhoneNumber = request.PhoneNumber;
        shipment.DispatchDateUtc = request.DispatchDateUtc;
        shipment.EstimatedArrivalUtc = request.EstimatedArrivalUtc;
        await db.SaveChangesAsync();
        await audit.WriteAsync("engineer.order.shipment_updated", userId, "Shipment", shipmentId.ToString(), ip);
        return true;
    }

    public async Task<bool?> DeleteShipmentAsync(Guid orderId, Guid shipmentId, Guid userId, bool callerIsAdmin, string? ip)
    {
        var o = await db.Orders.SingleOrDefaultAsync(x => x.Id == orderId);
        if (o is null) return null;
        if (!CanManage(o, userId, callerIsAdmin)) throw new OrderAccessException();

        var shipment = await db.Shipments.SingleOrDefaultAsync(s => s.Id == shipmentId && s.OrderId == orderId);
        if (shipment is null) return null;

        db.Shipments.Remove(shipment);
        await db.SaveChangesAsync();
        await audit.WriteAsync("engineer.order.shipment_deleted", userId, "Shipment", shipmentId.ToString(), ip);
        return true;
    }

    public async Task UploadDocumentAsync(Guid id, IFormFile file, string category, Guid userId, bool callerIsAdmin, string? ip)
    {
        var o = await db.Orders.SingleOrDefaultAsync(x => x.Id == id);
        if (o is null) return;
        if (!CanManage(o, userId, callerIsAdmin)) throw new OrderAccessException();
        await using var stream = file.OpenReadStream();
        var stored = await storage.SaveAsync(stream, file.FileName, file.ContentType);
        db.Documents.Add(new Document { Id = Guid.NewGuid(), CompanyId = o.CompanyId, OrderId = id, Title = file.FileName, Category = category, FileName = file.FileName, ContentType = file.ContentType, SizeBytes = stored.SizeBytes, StorageKey = stored.StorageKey, IsCustomerVisible = true });
        await db.SaveChangesAsync();
        await audit.WriteAsync("engineer.order.document_uploaded", userId, "Document", id.ToString(), ip);
    }

    public async Task<IReadOnlyList<OrderCommentResponseDto>> GetCommentsAsync(Guid id)
    {
        return await (from c in db.OrderComments
                      join u in db.Users on c.AuthorUserId equals u.Id into authors
                      from u in authors.DefaultIfEmpty()
                      where c.OrderId == id
                      orderby c.CreatedAtUtc descending
                      select new OrderCommentResponseDto(
                          c.AuthorRole,
                          u != null ? u.FullName : null,
                          c.Message,
                          c.CreatedAtUtc)).ToListAsync();
    }

    public async Task<bool?> AddCommentAsync(Guid id, OrderCommentRequest request, Guid userId, string role, bool callerIsAdmin, string? ip)
    {
        var o = await db.Orders.SingleOrDefaultAsync(x => x.Id == id);
        if (o is null) return null;
        if (!CanManage(o, userId, callerIsAdmin)) throw new OrderAccessException();
        db.OrderComments.Add(new OrderComment { Id = Guid.NewGuid(), OrderId = id, AuthorUserId = userId, AuthorRole = role, IsCustomerVisible = request.IsCustomerVisible, Message = request.Message.Trim() });
        await db.SaveChangesAsync();
        await audit.WriteAsync("engineer.order.comment_added", userId, "OrderComment", id.ToString(), ip);
        return true;
    }

    public async Task<bool?> DeleteOrderAsync(Guid id, Guid userId, bool callerIsAdmin, string? ip)
    {
        var o = await db.Orders.IgnoreQueryFilters().SingleOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (o is null) return null;
        if (!CanManage(o, userId, callerIsAdmin)) throw new OrderAccessException();

        o.IsDeleted = true;
        o.DeletedAtUtc = DateTimeOffset.UtcNow;
        o.LastUpdatedAtUtc = DateTimeOffset.UtcNow;

        db.OrderStatusHistories.Add(new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            OrderId = o.Id,
            FromStatus = o.Status,
            ToStatus = "Deleted",
            ChangedByUserId = userId,
            ChangedByRole = callerIsAdmin ? "Admin" : "Engineer",
            Note = $"Order deleted by {(callerIsAdmin ? "Administrator" : "Engineer")}"
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("engineer.order.deleted", userId, "Order", o.Id.ToString(), ip);
        return true;
    }
}
