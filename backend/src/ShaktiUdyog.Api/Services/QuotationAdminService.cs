using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;
using ShaktiUdyog.Infrastructure.Storage;

namespace ShaktiUdyog.Api.Services;

public interface IQuotationAdminService
{
    Task<PagedResult<QuotationListItemDto>> GetQuotationsAsync(int page, int pageSize, string? search, string? status);
    Task<QuotationDetailDto?> GetQuotationAsync(Guid id);
    Task<bool?> ApproveQuotationAsync(Guid id, Guid userId, string? ip);
    Task<bool?> RejectQuotationAsync(Guid id, string reason, Guid userId, string? ip);
    Task<bool?> IssueQuotationAsync(Guid id, Guid userId, string? ip);
    Task<bool?> CancelQuotationAsync(Guid id, Guid userId, string? ip);
    Task<bool?> OverrideStatusAsync(Guid id, string newStatus, string? note, Guid userId, string? ip);
    Task<IReadOnlyList<QuotationTimelineEntryDto>> GetHistoryAsync(Guid id);
}

public class QuotationAdminService(
    AppDbContext db,
    IAuditWriter audit) : IQuotationAdminService
{
    public async Task<PagedResult<QuotationListItemDto>> GetQuotationsAsync(int page = 1, int pageSize = 20, string? search = null, string? status = null)
    {
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 100);
        var query = db.Quotations.IgnoreQueryFilters().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(q => q.QuotationNumber.Contains(term) || q.Rfq.ProductType.Contains(term));
        }
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(q => q.Status == status);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(q => q.CreatedAtUtc).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(q => new QuotationListItemDto(q.Id, q.QuotationNumber, q.RevisionNumber, q.RfqId, q.Rfq.ProductType, q.Total, q.Currency, q.Status, q.ValidUntilUtc, q.CreatedAtUtc))
            .ToListAsync();
        return new PagedResult<QuotationListItemDto>(items, page, pageSize, total);
    }

    public async Task<QuotationDetailDto?> GetQuotationAsync(Guid id)
    {
        var q = await db.Quotations.IgnoreQueryFilters().Include(x => x.Items.OrderBy(i => i.LineNumber)).SingleOrDefaultAsync(x => x.Id == id);
        if (q is null) return null;
        return new QuotationDetailDto(q.Id, q.QuotationNumber, q.RevisionNumber, q.RfqId, q.Rfq?.ProductType ?? "",
            q.Subtotal, q.Tax, q.Discount, q.Total, q.Currency, q.PaymentTerms, q.DeliveryTerms, q.Freight, q.Packing, q.Remarks,
            q.Status, q.CustomerResponseComment, q.CustomerRespondedAtUtc, q.ValidUntilUtc, q.DocumentId, q.CreatedAtUtc,
            q.Items.Select(i => new QuotationItemDto(i.LineNumber, i.PartNumber, i.Description, i.MaterialGrade, i.Quantity, i.Unit, i.UnitPrice, i.TaxPercent, i.LineTotal)).ToList());
    }

    public async Task<bool?> ApproveQuotationAsync(Guid id, Guid userId, string? ip)
    {
        var q = await db.Quotations.SingleOrDefaultAsync(x => x.Id == id);
        if (q is null) return null;
        if (!QuotationStatuses.IsValidTransition(q.Status, QuotationStatuses.Approved)) return false;
        var from = q.Status; q.Status = QuotationStatuses.Approved;
        AddHistory(q.Id, from, QuotationStatuses.Approved, userId, "Admin", "Approved by administrator");
        q.ApprovedById = userId;
        db.QuotationApprovals.Add(new QuotationApproval { Id = Guid.NewGuid(), QuotationId = q.Id, ApprovedByUserId = userId, Action = "Approved" });
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.quotation.approved", userId, "Quotation", q.Id.ToString(), ip);
        return true;
    }

    public async Task<bool?> RejectQuotationAsync(Guid id, string reason, Guid userId, string? ip)
    {
        var q = await db.Quotations.SingleOrDefaultAsync(x => x.Id == id);
        if (q is null) return null;
        if (!QuotationStatuses.IsValidTransition(q.Status, QuotationStatuses.Declined)) return false;
        var from = q.Status; q.Status = QuotationStatuses.Declined;
        AddHistory(q.Id, from, QuotationStatuses.Declined, userId, "Admin", reason);
        db.QuotationApprovals.Add(new QuotationApproval { Id = Guid.NewGuid(), QuotationId = q.Id, ApprovedByUserId = userId, Action = "Rejected", Comment = reason });
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.quotation.rejected", userId, "Quotation", q.Id.ToString(), ip);
        return true;
    }

    public async Task<bool?> IssueQuotationAsync(Guid id, Guid userId, string? ip)
    {
        var q = await db.Quotations.SingleOrDefaultAsync(x => x.Id == id);
        if (q is null) return null;
        if (!QuotationStatuses.IsValidTransition(q.Status, QuotationStatuses.Issued)) return false;
        var from = q.Status; q.Status = QuotationStatuses.Issued;
        AddHistory(q.Id, from, QuotationStatuses.Issued, userId, "Admin", "Quotation issued to customer");
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.quotation.issued", userId, "Quotation", q.Id.ToString(), ip);
        return true;
    }

    public async Task<bool?> CancelQuotationAsync(Guid id, Guid userId, string? ip)
    {
        var q = await db.Quotations.SingleOrDefaultAsync(x => x.Id == id);
        if (q is null) return null;
        if (!QuotationStatuses.IsValidTransition(q.Status, QuotationStatuses.Cancelled)) return false;
        var from = q.Status; q.Status = QuotationStatuses.Cancelled;
        AddHistory(q.Id, from, QuotationStatuses.Cancelled, userId, "Admin", "Quotation cancelled");
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.quotation.cancelled", userId, "Quotation", q.Id.ToString(), ip);
        return true;
    }

    public async Task<bool?> OverrideStatusAsync(Guid id, string newStatus, string? note, Guid userId, string? ip)
    {
        var q = await db.Quotations.IgnoreQueryFilters().SingleOrDefaultAsync(x => x.Id == id);
        if (q is null) return null;
        var from = q.Status; q.Status = newStatus;
        AddHistory(q.Id, from, newStatus, userId, "Admin", note ?? $"Status override: {from} → {newStatus}");
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.quotation.status_overridden", userId, "Quotation", q.Id.ToString(), ip);
        return true;
    }

    public async Task<IReadOnlyList<QuotationTimelineEntryDto>> GetHistoryAsync(Guid id)
    {
        return await db.QuotationStatusHistories.IgnoreQueryFilters().Where(h => h.QuotationId == id).OrderBy(h => h.CreatedAtUtc)
            .Select(h => new QuotationTimelineEntryDto(h.FromStatus, h.ToStatus, h.ChangedByRole, h.Note, h.CreatedAtUtc))
            .ToListAsync();
    }

    private void AddHistory(Guid quotationId, string from, string to, Guid? userId, string role, string? note)
    {
        db.QuotationStatusHistories.Add(new QuotationStatusHistory
        {
            Id = Guid.NewGuid(), QuotationId = quotationId, FromStatus = from, ToStatus = to,
            ChangedByUserId = userId, ChangedByRole = role, Note = note,
        });
    }
}
