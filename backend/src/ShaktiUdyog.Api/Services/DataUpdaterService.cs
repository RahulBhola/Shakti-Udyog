using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Api.Contracts.Updater;
using ShaktiUdyog.Api.Validation;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface IDataUpdaterService
{
    Task<UpdaterDashboardDto> GetDashboardAsync();
    Task<PagedResult<UpdaterRfqListItemDto>> GetRfqsAsync(int page = 1, int pageSize = 20, string? search = null, string? status = null);
    Task<UpdaterRfqDetailDto?> GetRfqAsync(Guid rfqId);
    Task<bool?> UpdateRfqStatusAsync(Guid rfqId, RfqStatusChangeRequest request, Guid userId, string? ip);
    Task<RfqCommentDto?> AddRfqCommentAsync(Guid rfqId, RfqCommentRequest request, Guid userId, string role, string? ip);
    Task<bool?> AssignRfqAsync(Guid rfqId, RfqAssignmentRequest request, Guid userId, string? ip);
}

public record UpdaterDashboardDto(int PendingRfqs, int PendingQuotations, int OrdersInProduction, int OrdersAwaitingShipment);

public class DataUpdaterService(
    AppDbContext db,
    IAuditWriter audit) : IDataUpdaterService
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

    // ---- RFQ list -----------------------------------------------------------

    public async Task<PagedResult<UpdaterRfqListItemDto>> GetRfqsAsync(
        int page = 1, int pageSize = 20, string? search = null, string? status = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Rfqs.AsQueryable();

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
        var items = await query
            .OrderByDescending(r => r.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new UpdaterRfqListItemDto(
                r.Id, r.ProductType, r.CompanyName, r.Quantity,
                r.Status, r.IsDraft,
                r.Assignments.Where(a => a.IsActive).Select(a => (Guid?)a.AssignedToUserId).FirstOrDefault(),
                r.Files.Count, r.CreatedAtUtc, r.Priority))
            .ToListAsync();

        return new PagedResult<UpdaterRfqListItemDto>(items, page, pageSize, total);
    }

    // ---- RFQ detail ---------------------------------------------------------

    public async Task<UpdaterRfqDetailDto?> GetRfqAsync(Guid rfqId)
    {
        var rfq = await db.Rfqs
            .Include(r => r.Files)
            .Include(r => r.StatusHistory.OrderBy(h => h.CreatedAtUtc))
            .Include(r => r.Comments.OrderBy(c => c.CreatedAtUtc))
            .Include(r => r.Assignments.Where(a => a.IsActive))
            .SingleOrDefaultAsync(r => r.Id == rfqId);

        if (rfq is null) return null;

        return new UpdaterRfqDetailDto(
            rfq.Id, rfq.FullName, rfq.CompanyName, rfq.Email, rfq.Phone,
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
            rfq.Assignments.FirstOrDefault()?.AssignedToUserId, rfq.Priority);
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
            ChangedByRole = "DataUpdater",
            Note = request.Note,
            CreatedAtUtc = now,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("updater.rfq.status_changed", userId, "Rfq", rfq.Id.ToString(), ip);
        return true;
    }

    // ---- Comments -----------------------------------------------------------

    public async Task<RfqCommentDto?> AddRfqCommentAsync(Guid rfqId, RfqCommentRequest request, Guid userId, string role, string? ip)
    {
        var rfq = await db.Rfqs.AnyAsync(r => r.Id == rfqId);
        if (!rfq) return null;

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
