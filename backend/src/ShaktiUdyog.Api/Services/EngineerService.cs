using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Api.Contracts.Updater;
using ShaktiUdyog.Api.Validation;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface IEngineerService
{
    Task<UpdaterDashboardDto> GetDashboardAsync();
    Task<UpdaterMeDto> GetMeAsync(Guid userId);
    Task<PagedResult<UpdaterRfqListItemDto>> GetRfqsAsync(int page = 1, int pageSize = 20, string? search = null, string? status = null, Guid userId = default, bool assignedOnly = false);
    Task<UpdaterRfqDetailDto?> GetRfqAsync(Guid rfqId, Guid userId = default, bool assignedOnly = false);
    Task<bool?> UpdateRfqStatusAsync(Guid rfqId, RfqStatusChangeRequest request, Guid userId, string? ip);
    Task<RfqCommentDto?> AddRfqCommentAsync(Guid rfqId, RfqCommentRequest request, Guid userId, string role, string? ip, bool assignedOnly = false);
    Task<bool?> AssignRfqAsync(Guid rfqId, RfqAssignmentRequest request, Guid userId, string? ip);
}

public record UpdaterDashboardDto(int PendingRfqs, int PendingQuotations, int OrdersInProduction, int OrdersAwaitingShipment);

public class EngineerService(
    AppDbContext db,
    IAuditWriter audit) : IEngineerService
{
    // ---- Dashboard ---------------------------------------------------------

    public async Task<UpdaterDashboardDto> GetDashboardAsync()
    {
        var pendingRfqs = await db.Rfqs.CountAsync(r => r.Status == "Received");
        var pendingQuotations = await db.Quotations.CountAsync(q => q.Status == "Draft" || q.Status == "Pending Approval");
        var ordersInProduction = await db.Orders.CountAsync(o => o.Status == "production" || o.Status == "quality_check");
        var ordersAwaitingShipment = await db.Orders.CountAsync(o => o.Status == "packed" || o.Status == "ready_to_dispatch");
        return new UpdaterDashboardDto(pendingRfqs, pendingQuotations, ordersInProduction, ordersAwaitingShipment);
    }

    // ---- Employee detail ----------------------------------------------------

    public async Task<UpdaterMeDto> GetMeAsync(Guid userId)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        var role = await db.UserRoles
            .Where(ur => ur.UserId == userId)
            .Join(db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
            .FirstOrDefaultAsync();
        return new UpdaterMeDto(
            user?.Id ?? userId, user?.FullName, user?.Email, user?.PhoneNumber,
            role ?? "Engineer", user?.LastLoginAtUtc);
    }

    // ---- RFQ list -----------------------------------------------------------

    public async Task<PagedResult<UpdaterRfqListItemDto>> GetRfqsAsync(
        int page = 1, int pageSize = 20, string? search = null, string? status = null,
        Guid userId = default, bool assignedOnly = false)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Rfqs.AsQueryable();

        if (assignedOnly)
        {
            // Engineers only see RFQs currently assigned to them.
            query = query.Where(r => r.Assignments.Any(a => a.IsActive && a.AssignedToUserId == userId));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(r =>
                r.ProductType.Contains(term) ||
                r.CompanyName.Contains(term) ||
                r.FullName.Contains(term) ||
                r.RequirementDetails.Contains(term));
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
            x.Id, x.ProductType, assignedOnly ? null : x.CompanyName, x.Quantity,
            x.Status, x.IsDraft,
            x.AssignedToUserId,
            x.AssignedToUserId != null && names.TryGetValue(x.AssignedToUserId.Value, out var n) ? n : null,
            x.FileCount, x.CreatedAtUtc, x.Priority, x.FirstFileId, x.FirstFileContentType)).ToList();

        return new PagedResult<UpdaterRfqListItemDto>(items, page, pageSize, total);
    }

    // ---- RFQ detail ---------------------------------------------------------

    public async Task<UpdaterRfqDetailDto?> GetRfqAsync(Guid rfqId, Guid userId = default, bool assignedOnly = false)
    {
        var query = db.Rfqs
            .Include(r => r.Files)
            .Include(r => r.StatusHistory.OrderBy(h => h.CreatedAtUtc))
            .Include(r => r.Comments.OrderBy(c => c.CreatedAtUtc))
            .Include(r => r.Assignments.Where(a => a.IsActive))
            .AsQueryable();

        if (assignedOnly)
        {
            query = query.Where(r => r.Assignments.Any(a => a.IsActive && a.AssignedToUserId == userId));
        }

        var rfq = await query.SingleOrDefaultAsync(r => r.Id == rfqId);
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

        // Engineers should not see customer identity — blank it out.
        var companyId = assignedOnly ? Guid.Empty : rfq.CompanyId ?? Guid.Empty;
        var fullName = assignedOnly ? string.Empty : rfq.FullName;
        var companyName = assignedOnly ? string.Empty : rfq.CompanyName;
        var email = assignedOnly ? string.Empty : rfq.Email;
        var phone = assignedOnly ? string.Empty : rfq.Phone;

        return new UpdaterRfqDetailDto(
            rfq.Id, companyId, fullName, companyName, email, phone,
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

    // ---- Status update ------------------------------------------------------

    public async Task<bool?> UpdateRfqStatusAsync(Guid rfqId, RfqStatusChangeRequest request, Guid userId, string? ip)
    {
        var rfq = await db.Rfqs.SingleOrDefaultAsync(r => r.Id == rfqId);
        if (rfq is null) return null;

        if (!RfqStatuses.IsValidTransition(rfq.Status, request.NewStatus))
        {
            return false;
        }

        var now = DateTimeOffset.UtcNow;
        var from = rfq.Status;
        rfq.Status = request.NewStatus;
        if (rfq.IsDraft && request.NewStatus != RfqStatuses.Draft)
        {
            rfq.IsDraft = false;
        }

        db.RfqStatusHistories.Add(new RfqStatusHistory
        {
            Id = Guid.NewGuid(),
            RfqId = rfq.Id,
            FromStatus = from,
            ToStatus = request.NewStatus,
            ChangedByUserId = userId,
            ChangedByRole = "Engineer",
            Note = request.Note,
            CreatedAtUtc = now,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("updater.rfq.status_changed", userId, "Rfq", rfq.Id.ToString(), ip);
        return true;
    }

    // ---- Comments -----------------------------------------------------------

    public async Task<RfqCommentDto?> AddRfqCommentAsync(Guid rfqId, RfqCommentRequest request, Guid userId, string role, string? ip, bool assignedOnly = false)
    {
        var rfq = await db.Rfqs.AnyAsync(r => r.Id == rfqId);
        if (!rfq) return null;

        if (assignedOnly)
        {
            var assigned = await db.RfqAssignments.AnyAsync(a => a.RfqId == rfqId && a.IsActive && a.AssignedToUserId == userId);
            if (!assigned) return null;
        }

        var comment = new RfqComment
        {
            Id = Guid.NewGuid(),
            RfqId = rfqId,
            AuthorUserId = userId,
            AuthorRole = role,
            IsCustomerVisible = request.IsCustomerVisible,
            Message = request.Message.Trim(),
        };

        db.RfqComments.Add(comment);
        await db.SaveChangesAsync();
        await audit.WriteAsync("updater.rfq.comment_added", userId, "RfqComment", comment.Id.ToString(), ip);

        return new RfqCommentDto(
            comment.Id, comment.AuthorUserId, comment.AuthorRole,
            comment.IsCustomerVisible, comment.Message, comment.CreatedAtUtc);
    }

    // ---- Assignment ---------------------------------------------------------

    public async Task<bool?> AssignRfqAsync(Guid rfqId, RfqAssignmentRequest request, Guid userId, string? ip)
    {
        var rfq = await db.Rfqs.AnyAsync(r => r.Id == rfqId);
        if (!rfq) return null;

        // Deactivate previous assignments
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
            AssignedToUserId = request.AssignedToUserId,
            AssignedByUserId = userId,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("updater.rfq.assigned", userId, "Rfq", rfqId.ToString(), ip);
        return true;
    }
}
