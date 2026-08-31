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
    Task<bool?> UpdateQuotationAsync(Guid id, UpdateQuotationRequest request, Guid userId, string? ip);
    Task<bool?> ApproveQuotationAsync(Guid id, Guid userId, string? ip);
    Task<bool?> RejectQuotationAsync(Guid id, string reason, Guid userId, string? ip);
    Task<bool?> IssueQuotationAsync(Guid id, Guid userId, string? ip);
    Task<bool?> CancelQuotationAsync(Guid id, string? reason, Guid userId, string? ip);
    Task<bool?> DeleteQuotationAsync(Guid id, Guid userId, string? ip);
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
        var query = db.Quotations.Where(q => !q.IsDeleted).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(q => q.QuotationNumber.Contains(term) || q.Enquiry.ProductType.Contains(term));
        }
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(q => q.Status == status);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(q => q.CreatedAtUtc).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(q => new QuotationListItemDto(q.Id, q.QuotationNumber, q.RevisionNumber, q.EnquiryId, q.Enquiry.ProductType, q.Total, q.Currency, q.Status, q.ValidUntilUtc, q.CreatedAtUtc, q.Enquiry.CompanyName, q.Items.Count, q.PaymentTerms, q.DeliveryTime))
            .ToListAsync();
        return new PagedResult<QuotationListItemDto>(items, page, pageSize, total);
    }

    public async Task<QuotationDetailDto?> GetQuotationAsync(Guid id)
    {
        var q = await db.Quotations.Include(x => x.Items.OrderBy(i => i.LineNumber)).SingleOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (q is null) return null;

        var order = await db.Orders
            .Where(o => o.QuotationId == q.Id)
            .Select(o => new { o.Id, o.OrderNumber })
            .FirstOrDefaultAsync();

        string? advanceRef = null;
        DateTimeOffset? advancePaidAt = null;
        if (!string.IsNullOrEmpty(q.CustomerResponseComment) && q.CustomerResponseComment.Contains("[Payment UTR:"))
        {
            var start = q.CustomerResponseComment.IndexOf("[Payment UTR:") + 13;
            var end = q.CustomerResponseComment.IndexOf(']', start);
            if (end > start)
            {
                advanceRef = q.CustomerResponseComment[start..end].Trim();
                advancePaidAt = q.CustomerRespondedAtUtc;
            }
        }

        var advancePercent = PaymentTermsHelper.ExtractAdvancePercent(q.PaymentTerms);
        var advanceAmount = PaymentTermsHelper.CalculateAdvanceAmount(q.Total, q.PaymentTerms);
        var hasAdvance = !string.IsNullOrEmpty(advanceRef);

        return new QuotationDetailDto(q.Id, q.QuotationNumber, q.RevisionNumber, q.EnquiryId, q.Enquiry?.ProductType ?? "",
            q.Subtotal, q.Tax, q.Discount, q.Total, q.Currency, q.PaymentTerms, q.DeliveryTerms, q.Freight, q.Packing, q.Remarks,
            q.DeliveryTime, q.Warranty,
            q.Status, q.CustomerResponseComment, q.CustomerRespondedAtUtc, q.ValidUntilUtc, q.DocumentId, q.CreatedAtUtc,
            order?.Id, order?.OrderNumber,
            q.Items.Select(i => new QuotationItemDto(i.LineNumber, i.PartNumber, i.Description, i.MaterialGrade, i.Quantity, i.Unit, i.UnitPrice, i.TaxPercent, i.LineTotal)).ToList(),
            advanceAmount, advanceRef, advancePaidAt, hasAdvance, q.Company?.Name,
            advancePercent);
    }

    public async Task<bool?> UpdateQuotationAsync(Guid id, UpdateQuotationRequest request, Guid userId, string? ip)
    {
        var q = await db.Quotations.SingleOrDefaultAsync(x => x.Id == id);
        if (q is null) return null;
        var allowedStatuses = new[] { QuotationStatuses.Draft, QuotationStatuses.PendingApproval, QuotationStatuses.Approved, QuotationStatuses.Negotiating };
        if (!allowedStatuses.Contains(q.Status)) return false;

        q.Subtotal = request.Subtotal ?? q.Subtotal;
        q.Tax = request.Tax ?? q.Tax;
        q.Discount = request.Discount ?? q.Discount;
        q.Total = request.Total ?? q.Total;
        if (request.PaymentTerms is not null) q.PaymentTerms = string.IsNullOrEmpty(request.PaymentTerms) ? null : request.PaymentTerms;
        if (request.DeliveryTerms is not null) q.DeliveryTerms = string.IsNullOrEmpty(request.DeliveryTerms) ? null : request.DeliveryTerms;
        if (request.Freight is not null) q.Freight = string.IsNullOrEmpty(request.Freight) ? null : request.Freight;
        if (request.Packing is not null) q.Packing = string.IsNullOrEmpty(request.Packing) ? null : request.Packing;
        if (request.Remarks is not null) q.Remarks = string.IsNullOrEmpty(request.Remarks) ? null : request.Remarks;
        if (request.DeliveryTime is not null) q.DeliveryTime = string.IsNullOrEmpty(request.DeliveryTime) ? null : request.DeliveryTime;
        if (request.Warranty is not null) q.Warranty = string.IsNullOrEmpty(request.Warranty) ? null : request.Warranty;
        if (request.ValidUntilUtc.HasValue) q.ValidUntilUtc = request.ValidUntilUtc;

        if (request.Items is not null)
        {
            await db.Database.ExecuteSqlRawAsync("DELETE FROM QuotationItems WHERE QuotationId = {0}", id);
            foreach (var item in request.Items)
            {
                db.QuotationItems.Add(new QuotationItem
                {
                    Id = Guid.NewGuid(),
                    QuotationId = id,
                    LineNumber = item.LineNumber,
                    PartNumber = item.PartNumber,
                    Description = item.Description,
                    MaterialGrade = item.MaterialGrade,
                    Quantity = item.Quantity,
                    Unit = item.Unit,
                    UnitPrice = item.UnitPrice,
                    TaxPercent = item.TaxPercent,
                    LineTotal = item.Quantity * item.UnitPrice * (1 + item.TaxPercent / 100m),
                });
            }
        }

        q.RevisionNumber++;
        db.QuotationRevisions.Add(new QuotationRevision
        {
            Id = Guid.NewGuid(),
            QuotationId = q.Id,
            RevisionNumber = q.RevisionNumber,
            ChangeNotes = "Quotation updated by administrator",
            ChangedByUserId = userId,
        });

        if (q.Status == QuotationStatuses.Negotiating)
        {
            q.Status = QuotationStatuses.Draft;
        }

        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.quotation.updated", userId, "Quotation", q.Id.ToString(), ip);
        return true;
    }

    public async Task<bool?> ApproveQuotationAsync(Guid id, Guid userId, string? ip)
    {
        var q = await db.Quotations.SingleOrDefaultAsync(x => x.Id == id);
        if (q is null) return null;
        if (!QuotationStatuses.IsValidTransition(q.Status, QuotationStatuses.Approved)) return false;
        var from = q.Status;
        q.Status = QuotationStatuses.Approved;
        AddHistory(q.Id, from, QuotationStatuses.Approved, userId, "Admin", "Approved by administrator");
        q.ApprovedById = userId;
        db.QuotationApprovals.Add(new QuotationApproval { Id = Guid.NewGuid(), QuotationId = q.Id, ApprovedByUserId = userId, Action = "Approved" });

        // Auto-issue to customer so they can accept/decline
        if (QuotationStatuses.IsValidTransition(QuotationStatuses.Approved, QuotationStatuses.Issued))
        {
            q.Status = QuotationStatuses.Issued;
            AddHistory(q.Id, QuotationStatuses.Approved, QuotationStatuses.Issued, userId, "Admin", "Quotation issued to customer");
        }

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

    public async Task<bool?> CancelQuotationAsync(Guid id, string? reason, Guid userId, string? ip)
    {
        var q = await db.Quotations.SingleOrDefaultAsync(x => x.Id == id);
        if (q is null) return null;
        if (!QuotationStatuses.IsValidTransition(q.Status, QuotationStatuses.Cancelled)) return false;
        var from = q.Status; q.Status = QuotationStatuses.Cancelled;
        AddHistory(q.Id, from, QuotationStatuses.Cancelled, userId, "Admin", reason ?? "Quotation cancelled");
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.quotation.cancelled", userId, "Quotation", q.Id.ToString(), ip);
        return true;
    }

    public async Task<bool?> DeleteQuotationAsync(Guid id, Guid userId, string? ip)
    {
        var q = await db.Quotations.SingleOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (q is null) return null;

        q.IsDeleted = true;
        q.DeletedAtUtc = DateTimeOffset.UtcNow;
        AddHistory(q.Id, q.Status, "Deleted", userId, "Admin", "Quotation deleted by Admin.");
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.quotation.deleted", userId, "Quotation", q.Id.ToString(), ip);
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
