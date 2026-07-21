using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;
using ShaktiUdyog.Infrastructure.Storage;

namespace ShaktiUdyog.Api.Services;

public interface IQuotationUpdaterService
{
    Task<PagedResult<QuotationListItemDto>> GetQuotationsAsync(int page, int pageSize, string? search, string? status);
    Task<QuotationDetailDto?> GetQuotationAsync(Guid id);
    Task<Guid> CreateQuotationAsync(CreateQuotationRequest request, Guid userId, string? ip);
    Task<bool?> UpdateQuotationAsync(Guid id, UpdateQuotationRequest request, Guid userId, string? ip);
    Task<bool?> SubmitQuotationAsync(Guid id, Guid userId, string? ip);
    Task<QuotationAttachmentDto?> AttachFileAsync(Guid id, IFormFile file, string? description, Guid userId, string? ip);
    Task<QuotationCommentDto?> AddCommentAsync(Guid id, AddCommentRequest request, Guid userId, string role, string? ip);
}

public record CreateQuotationRequest(
    Guid RfqId, Guid CompanyId, string Currency,
    decimal Subtotal, decimal Tax, decimal Discount, decimal Total,
    DateTimeOffset? ValidUntilUtc, string? PaymentTerms, string? DeliveryTerms,
    string? Freight, string? Packing, string? Remarks,
    IReadOnlyList<CreateQuotationItemRequest> Items);

public record CreateQuotationItemRequest(
    int LineNumber, string PartNumber, string Description, string? MaterialGrade,
    int Quantity, string Unit, decimal UnitPrice, decimal TaxPercent);

public record UpdateQuotationRequest(
    decimal? Subtotal, decimal? Tax, decimal? Discount, decimal? Total,
    string? PaymentTerms, string? DeliveryTerms, string? Freight,
    string? Packing, string? Remarks, DateTimeOffset? ValidUntilUtc,
    IReadOnlyList<CreateQuotationItemRequest>? Items);

public record QuotationAttachmentDto(
    Guid Id, string FileName, string ContentType, long SizeBytes, string? Description);

public record QuotationCommentDto(
    Guid Id, string Message, string AuthorRole, bool IsCustomerVisible, DateTimeOffset CreatedAtUtc);

public record AddCommentRequest(string Message, bool IsCustomerVisible = true);

public class QuotationUpdaterService(
    AppDbContext db,
    IFileStorageService storage,
    IAuditWriter audit) : IQuotationUpdaterService
{
    private static readonly string[] AllowedStatuses = [QuotationStatuses.Draft, QuotationStatuses.PendingApproval];

    public async Task<PagedResult<QuotationListItemDto>> GetQuotationsAsync(
        int page = 1, int pageSize = 20, string? search = null, string? status = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Quotations.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(q => q.QuotationNumber.Contains(term) || q.Rfq.ProductType.Contains(term));
        }
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(q => q.Status == status);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(q => q.CreatedAtUtc)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(q => new QuotationListItemDto(
                q.Id, q.QuotationNumber, q.RevisionNumber, q.RfqId, q.Rfq.ProductType,
                q.Total, q.Currency, q.Status, q.ValidUntilUtc, q.CreatedAtUtc))
            .ToListAsync();
        return new PagedResult<QuotationListItemDto>(items, page, pageSize, total);
    }

    public async Task<QuotationDetailDto?> GetQuotationAsync(Guid id)
    {
        var q = await db.Quotations.Include(x => x.Items.OrderBy(i => i.LineNumber)).SingleOrDefaultAsync(x => x.Id == id);
        if (q is null) return null;
        return MapDetail(q);
    }

    public async Task<Guid> CreateQuotationAsync(CreateQuotationRequest request, Guid userId, string? ip)
    {
        var rfq = await db.Rfqs.SingleOrDefaultAsync(r => r.Id == request.RfqId && r.Status == RfqStatuses.Approved)
            ?? throw new InvalidOperationException("RFQ not found or not approved.");
        var number = $"QT-{DateTimeOffset.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

        var quotation = new Quotation
        {
            Id = Guid.NewGuid(),
            QuotationNumber = number,
            RfqId = request.RfqId,
            CompanyId = request.CompanyId,
            Subtotal = request.Subtotal,
            Tax = request.Tax,
            Discount = request.Discount,
            Total = request.Total,
            Currency = request.Currency,
            ValidUntilUtc = request.ValidUntilUtc,
            PaymentTerms = request.PaymentTerms,
            DeliveryTerms = request.DeliveryTerms,
            Freight = request.Freight,
            Packing = request.Packing,
            Remarks = request.Remarks,
            Status = QuotationStatuses.Draft,
            PreparedById = userId,
            Items = request.Items.Select(i => new QuotationItem
            {
                Id = Guid.NewGuid(), LineNumber = i.LineNumber, PartNumber = i.PartNumber,
                Description = i.Description, MaterialGrade = i.MaterialGrade,
                Quantity = i.Quantity, Unit = i.Unit, UnitPrice = i.UnitPrice,
                TaxPercent = i.TaxPercent,
                LineTotal = i.Quantity * i.UnitPrice * (1 + i.TaxPercent / 100m),
            }).ToList(),
        };
        db.Quotations.Add(quotation);
        await db.SaveChangesAsync();
        await audit.WriteAsync("updater.quotation.created", userId, "Quotation", quotation.Id.ToString(), ip);
        return quotation.Id;
    }

    public async Task<bool?> UpdateQuotationAsync(Guid id, UpdateQuotationRequest request, Guid userId, string? ip)
    {
        var q = await db.Quotations.Include(x => x.Items).SingleOrDefaultAsync(x => x.Id == id);
        if (q is null) return null;
        if (!AllowedStatuses.Contains(q.Status)) return false;

        if (request.Subtotal.HasValue) q.Subtotal = request.Subtotal.Value;
        if (request.Tax.HasValue) q.Tax = request.Tax.Value;
        if (request.Discount.HasValue) q.Discount = request.Discount.Value;
        if (request.Total.HasValue) q.Total = request.Total.Value;
        if (request.PaymentTerms is not null) q.PaymentTerms = request.PaymentTerms;
        if (request.DeliveryTerms is not null) q.DeliveryTerms = request.DeliveryTerms;
        if (request.Freight is not null) q.Freight = request.Freight;
        if (request.Packing is not null) q.Packing = request.Packing;
        if (request.Remarks is not null) q.Remarks = request.Remarks;
        if (request.ValidUntilUtc.HasValue) q.ValidUntilUtc = request.ValidUntilUtc;

        if (request.Items is not null)
        {
            db.QuotationItems.RemoveRange(q.Items);
            q.Items = request.Items.Select(i => new QuotationItem
            {
                Id = Guid.NewGuid(), LineNumber = i.LineNumber, PartNumber = i.PartNumber,
                Description = i.Description, MaterialGrade = i.MaterialGrade,
                Quantity = i.Quantity, Unit = i.Unit, UnitPrice = i.UnitPrice,
                TaxPercent = i.TaxPercent,
                LineTotal = i.Quantity * i.UnitPrice * (1 + i.TaxPercent / 100m),
            }).ToList();
        }

        q.RevisionNumber++;
        db.QuotationRevisions.Add(new QuotationRevision
        {
            Id = Guid.NewGuid(), QuotationId = q.Id, RevisionNumber = q.RevisionNumber,
            ChangeNotes = "Quotation updated", ChangedByUserId = userId,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("updater.quotation.updated", userId, "Quotation", q.Id.ToString(), ip);
        return true;
    }

    public async Task<bool?> SubmitQuotationAsync(Guid id, Guid userId, string? ip)
    {
        var q = await db.Quotations.SingleOrDefaultAsync(x => x.Id == id);
        if (q is null) return null;
        if (q.Status != QuotationStatuses.Draft) return false;

        var from = q.Status;
        q.Status = QuotationStatuses.PendingApproval;
        db.QuotationStatusHistories.Add(new QuotationStatusHistory
        {
            Id = Guid.NewGuid(), QuotationId = q.Id,
            FromStatus = from, ToStatus = QuotationStatuses.PendingApproval,
            ChangedByUserId = userId, ChangedByRole = "DataUpdater",
        });
        await db.SaveChangesAsync();
        await audit.WriteAsync("updater.quotation.submitted", userId, "Quotation", q.Id.ToString(), ip);
        return true;
    }

    public async Task<QuotationAttachmentDto?> AttachFileAsync(Guid id, IFormFile file, string? description, Guid userId, string? ip)
    {
        var q = await db.Quotations.AnyAsync(x => x.Id == id);
        if (!q) return null;

        await using var stream = file.OpenReadStream();
        var stored = await storage.SaveAsync(stream, file.FileName, file.ContentType);
        var attachment = new QuotationAttachment
        {
            Id = Guid.NewGuid(), QuotationId = id,
            FileName = file.FileName, ContentType = file.ContentType,
            SizeBytes = stored.SizeBytes, StorageKey = stored.StorageKey,
            Description = description, UploadedByUserId = userId,
        };
        db.QuotationAttachments.Add(attachment);
        await db.SaveChangesAsync();
        await audit.WriteAsync("updater.quotation.attachment_uploaded", userId, "QuotationAttachment", attachment.Id.ToString(), ip);
        return new QuotationAttachmentDto(attachment.Id, attachment.FileName, attachment.ContentType, attachment.SizeBytes, attachment.Description);
    }

    public async Task<QuotationCommentDto?> AddCommentAsync(Guid id, AddCommentRequest request, Guid userId, string role, string? ip)
    {
        var exists = await db.Quotations.AnyAsync(x => x.Id == id);
        if (!exists) return null;

        var comment = new QuotationComment
        {
            Id = Guid.NewGuid(), QuotationId = id,
            AuthorUserId = userId, AuthorRole = role,
            IsCustomerVisible = request.IsCustomerVisible,
            Message = request.Message.Trim(),
        };
        db.QuotationComments.Add(comment);
        await db.SaveChangesAsync();
        await audit.WriteAsync("updater.quotation.comment_added", userId, "QuotationComment", comment.Id.ToString(), ip);
        return new QuotationCommentDto(comment.Id, comment.Message, comment.AuthorRole, comment.IsCustomerVisible, comment.CreatedAtUtc);
    }

    private static QuotationDetailDto MapDetail(Quotation q) => new(
        q.Id, q.QuotationNumber, q.RevisionNumber, q.RfqId, q.Rfq?.ProductType ?? "",
        q.Subtotal, q.Tax, q.Discount, q.Total,
        q.Currency, q.PaymentTerms, q.DeliveryTerms, q.Freight, q.Packing, q.Remarks,
        q.Status, q.CustomerResponseComment, q.CustomerRespondedAtUtc,
        q.ValidUntilUtc, q.DocumentId, q.CreatedAtUtc,
        q.Items.Select(i => new QuotationItemDto(
            i.LineNumber, i.PartNumber, i.Description, i.MaterialGrade,
            i.Quantity, i.Unit, i.UnitPrice, i.TaxPercent, i.LineTotal)).ToList());
}
