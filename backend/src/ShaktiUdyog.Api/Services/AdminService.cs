using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Api.Contracts.Engineer;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface IAdminService
{
    Task<PagedResult<EngineerEnquiryListItemDto>> GetEnquiriesAsync(int page = 1, int pageSize = 20, string? search = null, string? status = null, bool includeDeleted = false);
    Task<EngineerEnquiryDetailDto?> GetEnquiryAsync(Guid enquiryId);
    Task<bool?> ApproveEnquiryAsync(Guid enquiryId, Guid userId, string? ip);
    Task<bool?> RejectEnquiryAsync(Guid enquiryId, string reason, Guid userId, string? ip);
    Task<bool?> OverrideStatusAsync(Guid enquiryId, string newStatus, string? note, Guid userId, string? ip);
    Task<IReadOnlyList<EnquiryTimelineEntryDto>> GetEnquiryHistoryAsync(Guid enquiryId);
    Task<OrderDetailDto?> CreateOrderFromQuotationAsync(Guid quotationId, Guid userId, string? ip);
    Task<bool?> VerifyAdvancePaymentAsync(Guid orderId, Guid userId, string? ip);
    Task<bool?> UpdateOrderStageAsync(Guid orderId, string newStage, string? note, Guid userId, string? ip);
    Task<bool?> AssignOrderAsync(Guid orderId, Guid? assignedToUserId, Guid userId, string? ip);
}

public class AdminService(
    AppDbContext db,
    IAuditWriter audit) : IAdminService
{
    /// <summary>
    /// Lists Enquirys, optionally including soft-deleted records for administrative review.
    /// </summary>
    public async Task<PagedResult<EngineerEnquiryListItemDto>> GetEnquiriesAsync(
        int page = 1, int pageSize = 20, string? search = null, string? status = null, bool includeDeleted = false)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = includeDeleted
            ? db.Enquiries.IgnoreQueryFilters().AsQueryable()
            : db.Enquiries.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(r =>
                r.ProductType.Contains(term) ||
                r.CompanyName.Contains(term) ||
                r.FullName.Contains(term));
        }
        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(r => r.Status == status);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new EngineerEnquiryListItemDto(
                r.Id, r.ProductType, r.CompanyName, r.Quantity,
                r.Status, r.IsDraft,
                r.Assignments.Where(a => a.IsActive).Select(a => (Guid?)a.AssignedToUserId).FirstOrDefault(),
                r.Files.Count, r.CreatedAtUtc, r.Priority,
                r.Files.OrderBy(f => f.UploadedAtUtc).Select(f => (Guid?)f.Id).FirstOrDefault(),
                r.Files.OrderBy(f => f.UploadedAtUtc).Select(f => f.ContentType).FirstOrDefault()))
            .ToListAsync();

        return new PagedResult<EngineerEnquiryListItemDto>(items, page, pageSize, total);
    }

    public async Task<EngineerEnquiryDetailDto?> GetEnquiryAsync(Guid enquiryId)
    {
        var enquiry = await db.Enquiries
            .IgnoreQueryFilters()
            .Include(r => r.Files)
            .Include(r => r.StatusHistory.OrderBy(h => h.CreatedAtUtc))
            .Include(r => r.Comments.OrderBy(c => c.CreatedAtUtc))
            .Include(r => r.Assignments.Where(a => a.IsActive))
            .SingleOrDefaultAsync(r => r.Id == enquiryId);

        if (enquiry is null) return null;

        var draftQuotationId = await db.Quotations
            .Where(q => q.EnquiryId == enquiry.Id)
            .OrderByDescending(q => q.CreatedAtUtc)
            .Select(q => (Guid?)q.Id)
            .FirstOrDefaultAsync();

        return new EngineerEnquiryDetailDto(
            enquiry.Id, enquiry.CompanyId ?? Guid.Empty, enquiry.FullName, enquiry.CompanyName, enquiry.Email, enquiry.Phone,
            enquiry.ProductType, enquiry.MaterialGrade, enquiry.Quantity,
            enquiry.DeliveryLocation, enquiry.RequirementDetails, enquiry.Status, enquiry.IsDraft,
            enquiry.SubmittedByIp, enquiry.CreatedAtUtc,
            enquiry.Files.Select(f => new EngineerEnquiryFileDto(
                f.Id, f.FileName, f.ContentType, f.SizeBytes,
                f.StorageKey, f.UploadedByUserId, f.UploadedAtUtc)).ToList(),
            enquiry.StatusHistory.Select(h => new EnquiryTimelineEntryDto(
                h.FromStatus, h.ToStatus, h.ChangedByRole, h.Note, h.CreatedAtUtc)).ToList(),
            enquiry.Comments.Select(c => new EnquiryCommentDto(
                c.Id, c.AuthorUserId, c.AuthorRole, c.IsCustomerVisible, c.Message, c.CreatedAtUtc)).ToList(),
            enquiry.Assignments.FirstOrDefault()?.AssignedToUserId, enquiry.Priority,
            enquiry.PartName, enquiry.PartNumber, enquiry.Industry, enquiry.Application,
            enquiry.MaterialStandard, enquiry.ApproxWeight,
            enquiry.MachiningRequired, enquiry.PatternAvailability,
            enquiry.PrototypeQuantity, enquiry.ProductionQuantity, enquiry.AnnualRequirement,
            enquiry.ExpectedDeliveryDate, enquiry.PreferredDeliveryTerms,
            enquiry.AdditionalRequirements, enquiry.Remarks,
            draftQuotationId != null, draftQuotationId);
    }

    /// <summary>Approves an Enquiry (Received → Approved).</summary>
    public async Task<bool?> ApproveEnquiryAsync(Guid enquiryId, Guid userId, string? ip)
    {
        var enquiry = await db.Enquiries.SingleOrDefaultAsync(r => r.Id == enquiryId);
        if (enquiry is null) return null;

        if (!EnquiryStatuses.IsValidTransition(enquiry.Status, EnquiryStatuses.Approved))
            return false;

        var now = DateTimeOffset.UtcNow;
        var from = enquiry.Status;
        enquiry.Status = EnquiryStatuses.Approved;

        db.EnquiryStatusHistories.Add(new EnquiryStatusHistory
        {
            Id = Guid.NewGuid(), EnquiryId = enquiry.Id,
            FromStatus = from, ToStatus = EnquiryStatuses.Approved,
            ChangedByUserId = userId, ChangedByRole = "Admin",
            Note = "Approved by administrator", CreatedAtUtc = now,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.enquiry.approved", userId, "Enquiry", enquiry.Id.ToString(), ip);
        return true;
    }

    /// <summary>Rejects an Enquiry with a reason.</summary>
    public async Task<bool?> RejectEnquiryAsync(Guid enquiryId, string reason, Guid userId, string? ip)
    {
        var enquiry = await db.Enquiries.SingleOrDefaultAsync(r => r.Id == enquiryId);
        if (enquiry is null) return null;

        if (!EnquiryStatuses.IsValidTransition(enquiry.Status, EnquiryStatuses.Rejected))
            return false;

        var now = DateTimeOffset.UtcNow;
        var from = enquiry.Status;
        enquiry.Status = EnquiryStatuses.Rejected;

        db.EnquiryStatusHistories.Add(new EnquiryStatusHistory
        {
            Id = Guid.NewGuid(), EnquiryId = enquiry.Id,
            FromStatus = from, ToStatus = EnquiryStatuses.Rejected,
            ChangedByUserId = userId, ChangedByRole = "Admin",
            Note = reason, CreatedAtUtc = now,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.enquiry.rejected", userId, "Enquiry", enquiry.Id.ToString(), ip);
        return true;
    }

    /// <summary>Skips transition validation for emergency corrections.</summary>
    public async Task<bool?> OverrideStatusAsync(Guid enquiryId, string newStatus, string? note, Guid userId, string? ip)
    {
        var enquiry = await db.Enquiries.IgnoreQueryFilters().SingleOrDefaultAsync(r => r.Id == enquiryId);
        if (enquiry is null) return null;

        var now = DateTimeOffset.UtcNow;
        var from = enquiry.Status;
        enquiry.Status = newStatus;

        db.EnquiryStatusHistories.Add(new EnquiryStatusHistory
        {
            Id = Guid.NewGuid(), EnquiryId = enquiry.Id,
            FromStatus = from, ToStatus = newStatus,
            ChangedByUserId = userId, ChangedByRole = "Admin",
            Note = note ?? $"Status override: {from} → {newStatus}",
            CreatedAtUtc = now,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.enquiry.status_overridden", userId, "Enquiry", enquiry.Id.ToString(), ip);
        return true;
    }

    /// <summary>Full status history including soft-deleted records.</summary>
    public async Task<IReadOnlyList<EnquiryTimelineEntryDto>> GetEnquiryHistoryAsync(Guid enquiryId)
    {
        return await db.EnquiryStatusHistories
            .IgnoreQueryFilters()
            .Where(h => h.EnquiryId == enquiryId)
            .OrderBy(h => h.CreatedAtUtc)
            .Select(h => new EnquiryTimelineEntryDto(
                h.FromStatus, h.ToStatus, h.ChangedByRole, h.Note, h.CreatedAtUtc))
            .ToListAsync();
    }

    // ---- Order from Quotation ------------------------------------------------

    public async Task<OrderDetailDto?> CreateOrderFromQuotationAsync(Guid quotationId, Guid userId, string? ip)
    {
        var quotation = await db.Quotations
            .Include(q => q.Items.OrderBy(i => i.LineNumber))
            .Include(q => q.Company)
            .SingleOrDefaultAsync(q => q.Id == quotationId && q.Status == QuotationStatuses.Accepted);
        if (quotation is null) return null;

        var advanceAmount = quotation.Total * 30m / 100m;
        var enquiryShortId = quotation.EnquiryId.ToString("N")[..8].ToUpperInvariant();
        var number = $"ORD-{DateTimeOffset.UtcNow:yyyyMMdd}-{enquiryShortId}";

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = number,
            CompanyId = quotation.CompanyId,
            QuotationId = quotation.Id,
            Status = OrderStatuses.PendingAdvance,
            AdvancePercent = 30,
            AdvanceAmount = advanceAmount,
            QuotationTotal = quotation.Total,
            PaymentTerms = quotation.PaymentTerms,
            Items = quotation.Items.Select(i => new OrderItem
            {
                Id = Guid.NewGuid(),
                PartNumber = i.PartNumber,
                Description = i.Description,
                MaterialGrade = i.MaterialGrade,
                Unit = i.Unit,
                QuantityOrdered = i.Quantity,
                UnitRate = i.UnitPrice,
            }).ToList(),
        };

        db.Orders.Add(order);
        order.Milestones.Add(new OrderMilestone
        {
            Id = Guid.NewGuid(), OrderId = order.Id, StatusCode = OrderStatuses.PendingAdvance,
            CustomerMessage = "Order created. Advance payment required.", ActorType = "System",
        });

        quotation.Status = QuotationStatuses.Converted;
        db.QuotationStatusHistories.Add(new QuotationStatusHistory
        {
            Id = Guid.NewGuid(), QuotationId = quotation.Id,
            FromStatus = QuotationStatuses.Accepted, ToStatus = QuotationStatuses.Converted,
            ChangedByUserId = userId, ChangedByRole = "Admin",
            Note = "Order created from quotation",
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.order.created", userId, "Order", order.Id.ToString(), ip);
        return MapOrderDetail(order);
    }

    public async Task<bool?> VerifyAdvancePaymentAsync(Guid orderId, Guid userId, string? ip)
    {
        var order = await db.Orders.SingleOrDefaultAsync(o => o.Id == orderId);
        if (order is null) return null;
        if (order.Status != OrderStatuses.AwaitingApproval) return false;
        var from = order.Status;
        order.Status = OrderStatuses.AdvancePaid;
        order.AdvancePaid = true;
        order.AdvanceVerifiedAtUtc = DateTimeOffset.UtcNow;
        order.AdvanceVerifiedById = userId;
        order.Milestones.Add(new OrderMilestone
        {
            Id = Guid.NewGuid(), OrderId = order.Id, StatusCode = OrderStatuses.AdvancePaid,
            CustomerMessage = "Advance payment verified.", ActorType = "Admin",
        });
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.order.advance_verified", userId, "Order", order.Id.ToString(), ip);
        return true;
    }

    public async Task<bool?> UpdateOrderStageAsync(Guid orderId, string newStage, string? note, Guid userId, string? ip)
    {
        var order = await db.Orders.SingleOrDefaultAsync(o => o.Id == orderId);
        if (order is null) return null;
        if (!OrderStatuses.IsValidTransition(order.Status, newStage) && !OrderStatuses.IsValidTransition(newStage, order.Status)) return false;
        var from = order.Status;
        order.Status = newStage;
        order.LastUpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        db.OrderMilestones.Add(new OrderMilestone
        {
            Id = Guid.NewGuid(), OrderId = order.Id, StatusCode = newStage,
            CustomerMessage = OrderStatuses.ProgressionLabels.TryGetValue(newStage, out var label) ? label : newStage.Replace("_", " "),
            InternalNote = note, ActorType = "Admin",
        });
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.order.stage_updated", userId, "Order", order.Id.ToString(), ip);
        return true;
    }

    /// <summary>
    /// Assigns (or unassigns when <paramref name="assignedToUserId"/> is null) an order
    /// to a staff member (Engineer/Admin). Deactivates the previous active assignment so
    /// reassignment history is preserved; the Order.AssignedToUserId denormalizes the
    /// current assignee. Cannot be assigned to a Customer.
    /// </summary>
    public async Task<bool?> AssignOrderAsync(Guid orderId, Guid? assignedToUserId, Guid userId, string? ip)
    {
        var order = await db.Orders.Include(o => o.Assignments).SingleOrDefaultAsync(o => o.Id == orderId);
        if (order is null) return null;

        // Unassign
        if (!assignedToUserId.HasValue)
        {
            var active = order.Assignments.Where(a => a.IsActive).ToList();
            foreach (var a in active) { a.IsActive = false; a.UnassignedAtUtc = DateTimeOffset.UtcNow; }
            order.AssignedToUserId = null;
            order.LastUpdatedAtUtc = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
            await audit.WriteAsync("admin.order.unassigned", userId, "Order", order.Id.ToString(), ip);
            return true;
        }

        // Validate the target user exists and is not a Customer (least-privilege default).
        var targetExists = await db.Users.AnyAsync(u => u.Id == assignedToUserId.Value);
        if (!targetExists) return false;
        var customerRoleId = await db.Roles.Where(r => r.Name == Roles.Customer).Select(r => r.Id).FirstOrDefaultAsync();
        var targetIsCustomer = await db.UserRoles.AnyAsync(ur => ur.UserId == assignedToUserId.Value && ur.RoleId == customerRoleId);
        if (targetIsCustomer) return false;

        // Deactivate previous active assignments, preserving history.
        foreach (var a in order.Assignments.Where(a => a.IsActive))
        {
            a.IsActive = false;
            a.UnassignedAtUtc = DateTimeOffset.UtcNow;
        }

        order.AssignedToUserId = assignedToUserId.Value;
        order.LastUpdatedAtUtc = DateTimeOffset.UtcNow;
        order.Assignments.Add(new OrderAssignment
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            AssignedToUserId = assignedToUserId.Value,
            AssignedByUserId = userId,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.order.assigned", userId, "Order", order.Id.ToString(), ip);
        return true;
    }

    private static OrderDetailDto MapOrderDetail(Order o) => new(
        o.Id, o.OrderNumber, null, o.Status, o.Status, "",
        o.PlacedAtUtc, o.PromisedDispatchDateUtc, o.DeliveryAddress, o.LastUpdatedAtUtc,
        o.Items.Select(i => new OrderItemDto(
            i.Id, i.PartNumber, i.Description, i.MaterialGrade, i.DrawingRevision,
            i.Unit, i.QuantityOrdered, i.QuantityProduced, i.QuantityDispatched, i.UnitRate)).ToList(),
        [], null, [],
        o.AdvancePercent, o.AdvanceAmount, o.AdvancePaid, o.AdvancePaidAtUtc,
        o.AdvancePaymentRef, o.AdvanceVerifiedAtUtc,
        o.QuotationTotal, o.PaymentTerms, o.QuotationId,
        o.Milestones.Select(m => new OrderMilestoneDto(
            m.Id, m.StatusCode, m.CustomerMessage, m.OccurredAtUtc)).ToList(),
        null, null);
}
