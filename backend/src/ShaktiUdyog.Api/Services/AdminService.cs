using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Api.Contracts.Updater;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface IAdminService
{
    Task<PagedResult<UpdaterRfqListItemDto>> GetRfqsAsync(int page = 1, int pageSize = 20, string? search = null, string? status = null, bool includeDeleted = false);
    Task<UpdaterRfqDetailDto?> GetRfqAsync(Guid rfqId);
    Task<bool?> ApproveRfqAsync(Guid rfqId, Guid userId, string? ip);
    Task<bool?> RejectRfqAsync(Guid rfqId, string reason, Guid userId, string? ip);
    Task<bool?> OverrideStatusAsync(Guid rfqId, string newStatus, string? note, Guid userId, string? ip);
    Task<IReadOnlyList<RfqTimelineEntryDto>> GetRfqHistoryAsync(Guid rfqId);
    Task<IReadOnlyList<EngineerWorkloadDto>> GetEngineersWithWorkloadAsync();
    Task<bool?> AssignEngineerAsync(Guid rfqId, Guid assignedToUserId, Guid assignedByUserId, string? ip);
    Task<OrderDetailDto?> CreateOrderFromQuotationAsync(Guid quotationId, Guid userId, string? ip);
    Task<bool?> VerifyAdvancePaymentAsync(Guid orderId, Guid userId, string? ip);
    Task<bool?> UpdateOrderStageAsync(Guid orderId, string newStage, string? note, Guid userId, string? ip);
    Task<bool?> AssignOrderEngineerAsync(Guid orderId, Guid? engineerId, Guid userId, string? ip);
}

public class AdminService(
    AppDbContext db,
    IAuditWriter audit) : IAdminService
{
    /// <summary>
    /// Lists RFQs, optionally including soft-deleted records for administrative review.
    /// </summary>
    public async Task<PagedResult<UpdaterRfqListItemDto>> GetRfqsAsync(
        int page = 1, int pageSize = 20, string? search = null, string? status = null, bool includeDeleted = false)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = includeDeleted
            ? db.Rfqs.IgnoreQueryFilters().AsQueryable()
            : db.Rfqs.AsQueryable();

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
        var pageItems = await query
            .OrderByDescending(r => r.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new
            {
                r.Id, r.ProductType, r.CompanyName, r.Quantity, r.Status, r.IsDraft,
                AssignedToUserId = (Guid?)r.Assignments.Where(a => a.IsActive).Select(a => a.AssignedToUserId).FirstOrDefault(),
                FileCount = r.Files.Count,
                r.CreatedAtUtc, r.Priority,
                FirstFileId = (Guid?)r.Files.OrderBy(f => f.UploadedAtUtc).Select(f => f.Id).FirstOrDefault(),
                FirstFileContentType = r.Files.OrderBy(f => f.UploadedAtUtc).Select(f => f.ContentType).FirstOrDefault(),
            })
            .ToListAsync();

        var assignedIds = pageItems
            .Where(x => x.AssignedToUserId != null)
            .Select(x => x.AssignedToUserId!.Value)
            .Distinct()
            .ToList();
        var names = assignedIds.Count > 0
            ? await db.Users.Where(u => assignedIds.Contains(u.Id))
                .Select(u => new { u.Id, Name = (string?)(u.FullName ?? u.UserName) })
                .ToDictionaryAsync(x => x.Id, x => x.Name)
            : new Dictionary<Guid, string?>();

        var items = pageItems.Select(x => new UpdaterRfqListItemDto(
            x.Id, x.ProductType, x.CompanyName, x.Quantity,
            x.Status, x.IsDraft,
            x.AssignedToUserId,
            x.AssignedToUserId != null && names.TryGetValue(x.AssignedToUserId.Value, out var n) ? n : null,
            x.FileCount, x.CreatedAtUtc, x.Priority, x.FirstFileId, x.FirstFileContentType)).ToList();

        return new PagedResult<UpdaterRfqListItemDto>(items, page, pageSize, total);
    }

    public async Task<UpdaterRfqDetailDto?> GetRfqAsync(Guid rfqId)
    {
        var rfq = await db.Rfqs
            .IgnoreQueryFilters()
            .Include(r => r.Files)
            .Include(r => r.StatusHistory.OrderBy(h => h.CreatedAtUtc))
            .Include(r => r.Comments.OrderBy(c => c.CreatedAtUtc))
            .Include(r => r.Assignments.Where(a => a.IsActive))
            .SingleOrDefaultAsync(r => r.Id == rfqId);

        if (rfq is null) return null;

        var assignedTo = rfq.Assignments.FirstOrDefault()?.AssignedToUserId;
        var assignedToName = assignedTo is null
            ? null
            : await db.Users.Where(u => u.Id == assignedTo)
                .Select(u => (string?)(u.FullName ?? u.UserName))
                .FirstOrDefaultAsync();

        var draftQuotationId = await db.Quotations
            .Where(q => q.RfqId == rfq.Id)
            .OrderByDescending(q => q.CreatedAtUtc)
            .Select(q => (Guid?)q.Id)
            .FirstOrDefaultAsync();

        return new UpdaterRfqDetailDto(
            rfq.Id, rfq.CompanyId ?? Guid.Empty, rfq.FullName, rfq.CompanyName, rfq.Email, rfq.Phone,
            rfq.ProductType, rfq.MaterialGrade, rfq.Quantity,
            rfq.DeliveryLocation, rfq.RequirementDetails, rfq.Status, rfq.IsDraft,
            rfq.SubmittedByIp, rfq.CreatedAtUtc,
            rfq.Files.Select(f => new UpdaterRfqFileDto(
                f.Id, f.FileName, f.ContentType, f.SizeBytes,
                f.StorageKey, f.UploadedByUserId, f.UploadedAtUtc)).ToList(),
            rfq.StatusHistory.Select(h => new RfqTimelineEntryDto(
                h.FromStatus, h.ToStatus, h.ChangedByRole, h.Note, h.CreatedAtUtc)).ToList(),
            rfq.Comments.Select(c => new RfqCommentDto(
                c.Id, c.AuthorUserId, c.AuthorRole, c.IsCustomerVisible, c.Message, c.CreatedAtUtc)).ToList(),
            assignedTo, assignedToName, rfq.Priority,
            rfq.PartName, rfq.PartNumber, rfq.Industry, rfq.Application,
            rfq.MaterialStandard, rfq.ApproxWeight,
            rfq.MachiningRequired, rfq.PatternAvailability,
            rfq.PrototypeQuantity, rfq.ProductionQuantity, rfq.AnnualRequirement,
            rfq.ExpectedDeliveryDate, rfq.PreferredDeliveryTerms,
            rfq.AdditionalRequirements, rfq.Remarks,
            draftQuotationId != null, draftQuotationId);
    }

    /// <summary>Approves an RFQ (Received → Approved).</summary>
    public async Task<bool?> ApproveRfqAsync(Guid rfqId, Guid userId, string? ip)
    {
        var rfq = await db.Rfqs.SingleOrDefaultAsync(r => r.Id == rfqId);
        if (rfq is null) return null;

        if (!RfqStatuses.IsValidTransition(rfq.Status, RfqStatuses.Approved))
            return false;

        var now = DateTimeOffset.UtcNow;
        var from = rfq.Status;
        rfq.Status = RfqStatuses.Approved;

        db.RfqStatusHistories.Add(new RfqStatusHistory
        {
            Id = Guid.NewGuid(), RfqId = rfq.Id,
            FromStatus = from, ToStatus = RfqStatuses.Approved,
            ChangedByUserId = userId, ChangedByRole = "Admin",
            Note = "Approved by administrator", CreatedAtUtc = now,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.rfq.approved", userId, "Rfq", rfq.Id.ToString(), ip);
        return true;
    }

    /// <summary>Rejects an RFQ with a reason.</summary>
    public async Task<bool?> RejectRfqAsync(Guid rfqId, string reason, Guid userId, string? ip)
    {
        var rfq = await db.Rfqs.SingleOrDefaultAsync(r => r.Id == rfqId);
        if (rfq is null) return null;

        if (!RfqStatuses.IsValidTransition(rfq.Status, RfqStatuses.Rejected))
            return false;

        var now = DateTimeOffset.UtcNow;
        var from = rfq.Status;
        rfq.Status = RfqStatuses.Rejected;

        db.RfqStatusHistories.Add(new RfqStatusHistory
        {
            Id = Guid.NewGuid(), RfqId = rfq.Id,
            FromStatus = from, ToStatus = RfqStatuses.Rejected,
            ChangedByUserId = userId, ChangedByRole = "Admin",
            Note = reason, CreatedAtUtc = now,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.rfq.rejected", userId, "Rfq", rfq.Id.ToString(), ip);
        return true;
    }

    /// <summary>Skips transition validation for emergency corrections.</summary>
    public async Task<bool?> OverrideStatusAsync(Guid rfqId, string newStatus, string? note, Guid userId, string? ip)
    {
        var rfq = await db.Rfqs.IgnoreQueryFilters().SingleOrDefaultAsync(r => r.Id == rfqId);
        if (rfq is null) return null;

        var now = DateTimeOffset.UtcNow;
        var from = rfq.Status;
        rfq.Status = newStatus;

        db.RfqStatusHistories.Add(new RfqStatusHistory
        {
            Id = Guid.NewGuid(), RfqId = rfq.Id,
            FromStatus = from, ToStatus = newStatus,
            ChangedByUserId = userId, ChangedByRole = "Admin",
            Note = note ?? $"Status override: {from} → {newStatus}",
            CreatedAtUtc = now,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.rfq.status_overridden", userId, "Rfq", rfq.Id.ToString(), ip);
        return true;
    }

    /// <summary>Lists Engineer-role users with their current active-RFQ workload.</summary>
    public async Task<IReadOnlyList<EngineerWorkloadDto>> GetEngineersWithWorkloadAsync()
    {
        var engineerRoleId = await db.Roles
            .Where(r => r.Name == Roles.Engineer)
            .Select(r => r.Id)
            .FirstOrDefaultAsync();
        if (engineerRoleId == default) return [];

        var engineers = await (from ur in db.UserRoles
                               join u in db.Users on ur.UserId equals u.Id
                               where ur.RoleId == engineerRoleId
                               orderby u.FullName
                               select new { u.Id, Name = (string?)(u.FullName ?? u.UserName) ?? "Engineer", u.Email })
            .ToListAsync();

        var engineerIds = engineers.Select(e => e.Id).ToList();
        var terminal = new[]
        {
            RfqStatuses.Rejected, RfqStatuses.Cancelled,
            RfqStatuses.Declined, RfqStatuses.Expired, RfqStatuses.Accepted,
        };

        var counts = await db.RfqAssignments
            .Where(a => a.IsActive && engineerIds.Contains(a.AssignedToUserId) && !terminal.Contains(a.Rfq.Status))
            .GroupBy(a => a.AssignedToUserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count);

        return engineers
            .Select(e => new EngineerWorkloadDto(e.Id, e.Name, e.Email, counts.GetValueOrDefault(e.Id, 0)))
            .ToList();
    }

    /// <summary>Assigns (or reassigns) an RFQ to an Engineer-role user.</summary>
    public async Task<bool?> AssignEngineerAsync(Guid rfqId, Guid assignedToUserId, Guid assignedByUserId, string? ip)
    {
        var rfqExists = await db.Rfqs.AnyAsync(r => r.Id == rfqId);
        if (!rfqExists) return null;

        var userExists = await db.Users.AnyAsync(u => u.Id == assignedToUserId);
        var engineerRoleId = await db.Roles
            .Where(r => r.Name == Roles.Engineer)
            .Select(r => r.Id)
            .FirstOrDefaultAsync();
        var isEngineer = userExists && engineerRoleId != default &&
            await db.UserRoles.AnyAsync(ur => ur.UserId == assignedToUserId && ur.RoleId == engineerRoleId);
        if (!isEngineer) return false;

        // Deactivate previous active assignments, preserving history for audit.
        var active = await db.RfqAssignments
            .Where(a => a.RfqId == rfqId && a.IsActive)
            .ToListAsync();
        foreach (var a in active)
        {
            a.IsActive = false;
            a.UnassignedAtUtc = DateTimeOffset.UtcNow;
        }

        db.RfqAssignments.Add(new RfqAssignment
        {
            Id = Guid.NewGuid(),
            RfqId = rfqId,
            AssignedToUserId = assignedToUserId,
            AssignedByUserId = assignedByUserId,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.rfq.assigned", assignedByUserId, "Rfq", rfqId.ToString(), ip);
        return true;
    }

    /// <summary>Full status history including soft-deleted records.</summary>
    public async Task<IReadOnlyList<RfqTimelineEntryDto>> GetRfqHistoryAsync(Guid rfqId)
    {
        return await db.RfqStatusHistories
            .IgnoreQueryFilters()
            .Where(h => h.RfqId == rfqId)
            .OrderBy(h => h.CreatedAtUtc)
            .Select(h => new RfqTimelineEntryDto(
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
        var rfqShortId = quotation.RfqId.ToString("N")[..8].ToUpperInvariant();
        var number = $"ORD-{DateTimeOffset.UtcNow:yyyyMMdd}-{rfqShortId}";

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
    /// Assigns (or clears) the engineer responsible for an order on the
    /// manufacturing board. First assignment seeds the starting stage.
    /// </summary>
    public async Task<bool?> AssignOrderEngineerAsync(Guid orderId, Guid? engineerId, Guid userId, string? ip)
    {
        var order = await db.Orders.SingleOrDefaultAsync(o => o.Id == orderId);
        if (order is null) return null;

        order.AssignedEngineerId = engineerId;
        order.StageUpdatedAt = DateTimeOffset.UtcNow;
        if (engineerId is not null && string.IsNullOrEmpty(order.ManufacturingStage))
            order.ManufacturingStage = ManufacturingStages.PatternDevelopment;

        await db.SaveChangesAsync();
        await audit.WriteAsync(
            engineerId is null ? "admin.order.engineer_unassigned" : "admin.order.engineer_assigned",
            userId, "Order", order.Id.ToString(), ip);
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
            m.Id, m.StatusCode, m.CustomerMessage, m.OccurredAtUtc)).ToList());
}
