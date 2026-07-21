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
        var items = await query
            .OrderByDescending(r => r.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new UpdaterRfqListItemDto(
                r.Id, r.ProductType, r.CompanyName, r.Quantity,
                r.Status, r.IsDraft,
                r.Assignments.Where(a => a.IsActive).Select(a => (Guid?)a.AssignedToUserId).FirstOrDefault(),
                r.Files.Count, r.CreatedAtUtc))
            .ToListAsync();

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
            rfq.Assignments.FirstOrDefault()?.AssignedToUserId);
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
}
