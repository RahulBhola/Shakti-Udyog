using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Api.Contracts.Engineer;
using ShaktiUdyog.Api.Validation;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Domain.Interfaces;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface IEngineerService
{
    Task<EngineerDashboardDto> GetDashboardAsync();
    Task<PagedResult<EngineerEnquiryListItemDto>> GetEnquiriesAsync(int page = 1, int pageSize = 20, string? search = null, string? status = null, Guid? companyId = null);
    Task<EngineerEnquiryDetailDto?> GetEnquiryAsync(Guid enquiryId);
    Task<bool?> UpdateEnquiryStatusAsync(Guid enquiryId, EnquiryStatusChangeRequest request, Guid userId, string? ip);
    Task<EnquiryCommentDto?> AddEnquiryCommentAsync(Guid enquiryId, EnquiryCommentRequest request, Guid userId, string role, string? ip);
    Task<bool?> AssignEnquiryAsync(Guid enquiryId, EnquiryAssignmentRequest request, Guid userId, string? ip);
}

public record EngineerDashboardDto(int PendingEnquiries, int PendingQuotations, int OrdersInProduction, int OrdersAwaitingShipment);

public class EngineerService(
    AppDbContext db,
    IUnitOfWork uow,
    IAuditWriter audit) : IEngineerService
{
    // ---- Dashboard ---------------------------------------------------------

    public async Task<EngineerDashboardDto> GetDashboardAsync()
    {
        var pendingEnquiries = await uow.Enquiries.CountAsync(r => r.Status == "Received");
        var pendingQuotations = await uow.Quotations.CountAsync(q => q.Status == "Draft" || q.Status == "Pending Approval");
        var ordersInProduction = await uow.Orders.CountAsync(o => o.Status == "production" || o.Status == "quality_check");
        var ordersAwaitingShipment = await uow.Orders.CountAsync(o => o.Status == "packed" || o.Status == "ready_to_dispatch");
        return new EngineerDashboardDto(pendingEnquiries, pendingQuotations, ordersInProduction, ordersAwaitingShipment);
    }

    // ---- Enquiry list -----------------------------------------------------------

    public async Task<PagedResult<EngineerEnquiryListItemDto>> GetEnquiriesAsync(
        int page = 1, int pageSize = 20, string? search = null, string? status = null, Guid? companyId = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Enquiries.Where(r => !r.IsDeleted).AsQueryable();

        if (companyId.HasValue)
            query = query.Where(r => r.CompanyId == companyId);

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
            .Select(r => new EngineerEnquiryListItemDto(
                r.Id, r.ProductType, r.CompanyName, r.Quantity,
                r.Status, r.IsDraft,
                r.Assignments.Where(a => a.IsActive).Select(a => (Guid?)a.AssignedToUserId).FirstOrDefault(),
                r.Files.Count, r.CreatedAtUtc, r.Priority,
                r.Files.OrderByDescending(f => f.ContentType.StartsWith("image/")).ThenBy(f => f.UploadedAtUtc).Select(f => (Guid?)f.Id).FirstOrDefault(),
                r.Files.OrderByDescending(f => f.ContentType.StartsWith("image/")).ThenBy(f => f.UploadedAtUtc).Select(f => f.ContentType).FirstOrDefault()))
            .ToListAsync();

        return new PagedResult<EngineerEnquiryListItemDto>(items, page, pageSize, total);
    }

    // ---- Enquiry detail ---------------------------------------------------------

    public async Task<EngineerEnquiryDetailDto?> GetEnquiryAsync(Guid enquiryId)
    {
        var enquiry = await db.Enquiries
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

        if (draftQuotationId != null && (enquiry.Status == EnquiryStatuses.UnderReview || enquiry.Status == EnquiryStatuses.Approved))
        {
            enquiry.Status = EnquiryStatuses.Quoted;
            try { await db.SaveChangesAsync(); } catch { }
        }

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

    // ---- Status update ------------------------------------------------------

    public async Task<bool?> UpdateEnquiryStatusAsync(Guid enquiryId, EnquiryStatusChangeRequest request, Guid userId, string? ip)
    {
        var enquiry = await db.Enquiries.SingleOrDefaultAsync(r => r.Id == enquiryId);
        if (enquiry is null) return null;

        if (!EnquiryStatuses.IsValidTransition(enquiry.Status, request.NewStatus))
        {
            return false;
        }

        var now = DateTimeOffset.UtcNow;
        var from = enquiry.Status;
        enquiry.Status = request.NewStatus;
        if (enquiry.IsDraft && request.NewStatus != EnquiryStatuses.Draft)
        {
            enquiry.IsDraft = false;
        }

        db.EnquiryStatusHistories.Add(new EnquiryStatusHistory
        {
            Id = Guid.NewGuid(),
            EnquiryId = enquiry.Id,
            FromStatus = from,
            ToStatus = request.NewStatus,
            ChangedByUserId = userId,
            ChangedByRole = "Engineer",
            Note = request.Note,
            CreatedAtUtc = now,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("engineer.enquiry.status_changed", userId, "Enquiry", enquiry.Id.ToString(), ip);
        return true;
    }

    // ---- Comments -----------------------------------------------------------

    public async Task<EnquiryCommentDto?> AddEnquiryCommentAsync(Guid enquiryId, EnquiryCommentRequest request, Guid userId, string role, string? ip)
    {
        var enquiry = await db.Enquiries.AnyAsync(r => r.Id == enquiryId);
        if (!enquiry) return null;

        var comment = new EnquiryComment
        {
            Id = Guid.NewGuid(),
            EnquiryId = enquiryId,
            AuthorUserId = userId,
            AuthorRole = role,
            IsCustomerVisible = request.IsCustomerVisible,
            Message = request.Message.Trim(),
        };

        db.EnquiryComments.Add(comment);
        await db.SaveChangesAsync();
        await audit.WriteAsync("engineer.enquiry.comment_added", userId, "EnquiryComment", comment.Id.ToString(), ip);

        return new EnquiryCommentDto(
            comment.Id, comment.AuthorUserId, comment.AuthorRole,
            comment.IsCustomerVisible, comment.Message, comment.CreatedAtUtc);
    }

    // ---- Assignment ---------------------------------------------------------

    public async Task<bool?> AssignEnquiryAsync(Guid enquiryId, EnquiryAssignmentRequest request, Guid userId, string? ip)
    {
        var enquiry = await db.Enquiries.AnyAsync(r => r.Id == enquiryId);
        if (!enquiry) return null;

        // Deactivate previous assignments
        var active = await db.EnquiryAssignments
            .Where(a => a.EnquiryId == enquiryId && a.IsActive)
            .ToListAsync();
        foreach (var a in active)
        {
            a.IsActive = false;
            a.UnassignedAtUtc = DateTimeOffset.UtcNow;
        }

        db.EnquiryAssignments.Add(new EnquiryAssignment
        {
            Id = Guid.NewGuid(),
            EnquiryId = enquiryId,
            AssignedToUserId = request.AssignedToUserId,
            AssignedByUserId = userId,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("engineer.enquiry.assigned", userId, "Enquiry", enquiryId.ToString(), ip);
        return true;
    }
}
