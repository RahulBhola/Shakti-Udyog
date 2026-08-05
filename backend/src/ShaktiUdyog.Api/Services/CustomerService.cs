using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;
using ShaktiUdyog.Infrastructure.Storage;

namespace ShaktiUdyog.Api.Services;

public record AdvancePaymentRequest(string PaymentRef);
public record CustomerCommentRequest(string Message);


/// <summary>
/// Customer portal application service. EVERY query filters by the resolved
/// customer context's approved company IDs — record IDs from the client are
/// never trusted on their own (requirements §19 customer_isolation). Missing
/// and forbidden records are indistinguishable (both null → 404).
/// </summary>
public interface ICustomerService
{
    Task<DashboardDto> GetDashboardAsync(CustomerContext ctx);

    Task<PagedResult<EnquiryListItemDto>> GetEnquiriesAsync(CustomerContext ctx, int page = 1, int pageSize = 20, string? search = null, string? status = null);
    Task<EnquiryDetailDto?> GetEnquiryAsync(CustomerContext ctx, Guid enquiryId);
    Task<Guid> CreateEnquiryAsync(CustomerContext ctx, CreateEnquiryRequest request, string? ip);
    Task<EnquiryFileDto?> AttachEnquiryFileAsync(CustomerContext ctx, Guid enquiryId, IFormFile file, string? ip);
    Task<bool?> UpdateDraftEnquiryAsync(CustomerContext ctx, Guid enquiryId, UpdateEnquiryRequest request, string? ip);
    Task<bool?> DeleteDraftEnquiryAsync(CustomerContext ctx, Guid enquiryId, string? ip);
    Task<bool?> SubmitDraftEnquiryAsync(CustomerContext ctx, Guid enquiryId, string? ip);
    Task<IReadOnlyList<EnquiryTimelineEntryDto>?> GetEnquiryTimelineAsync(CustomerContext ctx, Guid enquiryId);

    Task<IReadOnlyList<QuotationListItemDto>> GetQuotationsAsync(CustomerContext ctx);
    Task<QuotationDetailDto?> GetQuotationAsync(CustomerContext ctx, Guid quotationId);
    Task<bool?> RespondToQuotationAsync(CustomerContext ctx, Guid quotationId, QuotationResponseRequest request, string? ip);

    Task<IReadOnlyList<OrderListItemDto>> GetOrdersAsync(CustomerContext ctx);
    Task<OrderDetailDto?> GetOrderAsync(CustomerContext ctx, Guid orderId);
    Task<IReadOnlyList<TimelineEntryDto>?> GetOrderTimelineAsync(CustomerContext ctx, Guid orderId);
    Task<IReadOnlyList<OrderCommentResponseDto>?> GetOrderCommentsAsync(CustomerContext ctx, Guid orderId);
    Task<bool?> AddOrderCommentAsync(CustomerContext ctx, Guid orderId, string message, string? ip);
    Task<Guid?> CreateSupportRequestAsync(CustomerContext ctx, Guid orderId, SupportRequestRequest request, string? ip);
    Task<bool?> SubmitAdvancePaymentAsync(CustomerContext ctx, Guid orderId, AdvancePaymentRequest request, string? ip);

    Task<IReadOnlyList<InvoiceListItemDto>> GetInvoicesAsync(CustomerContext ctx);
    Task<InvoiceDetailDto?> GetInvoiceAsync(CustomerContext ctx, Guid invoiceId);
    Task<object> GetOutstandingAsync(CustomerContext ctx);

    Task<IReadOnlyList<PaymentDto>> GetPaymentsAsync(CustomerContext ctx);
    Task<PaymentDto?> SubmitPaymentProofAsync(CustomerContext ctx, PaymentProofRequest request, IFormFile? proofFile, string? ip);

    Task<IReadOnlyList<DocumentListItemDto>> GetDocumentsAsync(CustomerContext ctx, string? search, string? category);
    Task<(Stream Content, string FileName, string ContentType)?> OpenDocumentAsync(CustomerContext ctx, Guid documentId, string? ip);

    Task<PagedResult<NotificationDto>> GetNotificationsAsync(CustomerContext ctx, int page, int pageSize, bool? unreadOnly);
    Task<bool> MarkNotificationReadAsync(CustomerContext ctx, Guid notificationId);
}

public class CustomerService(
    AppDbContext db,
    UserManager<ApplicationUser> userManager,
    IFileStorageService storage,
    IAuditWriter audit) : ICustomerService
{
    // ---- Dashboard ----------------------------------------------------------

    public async Task<DashboardDto> GetDashboardAsync(CustomerContext ctx)
    {
        var companies = ctx.CompanyIds;

        var openEnquiries = await db.Enquiries.CountAsync(r =>
            r.CompanyId != null && companies.Contains(r.CompanyId.Value)
            && (r.Status == EnquiryStatuses.Received || r.Status == EnquiryStatuses.UnderReview));
        var activeQuotes = await db.Quotations.CountAsync(q =>
            companies.Contains(q.CompanyId) && q.Status == QuotationStatuses.Issued);
        var activeOrders = await db.Orders.CountAsync(o =>
            companies.Contains(o.CompanyId)
            && o.Status != OrderStatuses.Delivered);
        var unpaidInvoices = await db.Invoices.CountAsync(i =>
            companies.Contains(i.CompanyId)
            && (i.Status == InvoiceStatuses.Issued || i.Status == InvoiceStatuses.PartiallyPaid || i.Status == InvoiceStatuses.Overdue));
        var unread = await db.Notifications.CountAsync(n => n.UserId == ctx.UserId && !n.IsRead);

        var recentMilestones = await db.OrderMilestones
            .Where(m => m.IsCustomerVisible && companies.Contains(m.Order.CompanyId))
            .OrderByDescending(m => m.OccurredAtUtc)
            .Take(6)
            .Select(m => new { m.Order.OrderNumber, m.StatusCode, m.OrderId, m.OccurredAtUtc })
            .ToListAsync();

        var recentDocs = await CustomerVisibleDocuments(companies)
            .OrderByDescending(d => d.CreatedAtUtc)
            .Take(5)
            .Select(DocumentProjection)
            .ToListAsync();

        // Friendly labels resolved in memory — dictionary lookups don't translate to SQL.
        var activity = recentMilestones
            .Select(m => new ActivityItemDto(
                "Order",
                $"{m.OrderNumber}: {(OrderStatuses.Labels.TryGetValue(m.StatusCode, out var l) ? l.Label : m.StatusCode)}",
                $"/customer/orders/{m.OrderId}",
                m.OccurredAtUtc))
            .ToList();

        return new DashboardDto(openEnquiries, activeQuotes, activeOrders, unpaidInvoices, unread, activity, recentDocs);
    }

    // ---- Enquirys ---------------------------------------------------------------

    public async Task<PagedResult<EnquiryListItemDto>> GetEnquiriesAsync(
        CustomerContext ctx, int page = 1, int pageSize = 20, string? search = null, string? status = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Enquiries.Where(r => r.CompanyId != null && ctx.CompanyIds.Contains(r.CompanyId.Value));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(r => r.ProductType.Contains(term) || r.RequirementDetails.Contains(term));
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
            .Select(r => new EnquiryListItemDto(
                r.Id, r.ProductType, r.Quantity, r.Status, r.IsDraft, r.Files.Count, r.CreatedAtUtc,
                r.PartName, r.PartNumber, r.Industry, r.ProductionQuantity))
            .ToListAsync();

        return new PagedResult<EnquiryListItemDto>(items, page, pageSize, total);
    }

    public async Task<EnquiryDetailDto?> GetEnquiryAsync(CustomerContext ctx, Guid enquiryId) =>
        await db.Enquiries
            .Where(r => r.Id == enquiryId && r.CompanyId != null && ctx.CompanyIds.Contains(r.CompanyId.Value))
            .Select(r => new EnquiryDetailDto(
                r.Id, r.FullName, r.CompanyName, r.ProductType, r.MaterialGrade, r.Quantity,
                r.DeliveryLocation, r.RequirementDetails, r.Status, r.IsDraft,
                r.Files.Select(f => new EnquiryFileDto(f.Id, f.FileName, f.SizeBytes, f.UploadedAtUtc)).ToList(),
                r.CreatedAtUtc,
                r.PartName, r.PartNumber, r.Industry, r.Application,
                r.MaterialStandard, r.ApproxWeight, r.MachiningRequired, r.PatternAvailability,
                r.PrototypeQuantity, r.ProductionQuantity, r.AnnualRequirement,
                r.ExpectedDeliveryDate, r.PreferredDeliveryTerms, r.AdditionalRequirements, r.Remarks))
            .SingleOrDefaultAsync();

    public async Task<Guid> CreateEnquiryAsync(CustomerContext ctx, CreateEnquiryRequest request, string? ip)
    {
        var user = await userManager.FindByIdAsync(ctx.UserId.ToString())
            ?? throw new InvalidOperationException("Authenticated user not found.");
        var companyId = ctx.CompanyIds[0];
        var company = await db.Companies.SingleAsync(c => c.Id == companyId);

        var now = DateTimeOffset.UtcNow;
        var enquiry = new Enquiry
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            SubmittedByUserId = ctx.UserId,
            FullName = user.FullName ?? user.Email ?? "Customer",
            CompanyName = company.Name,
            Email = user.Email ?? string.Empty,
            Phone = user.PhoneNumber ?? "-",
            ProductType = request.ProductType,
            MaterialGrade = request.MaterialGrade,
            Quantity = request.Quantity,
            DeliveryLocation = request.DeliveryLocation,
            RequirementDetails = request.RequirementDetails,
            ConsentGiven = true,
            IsDraft = request.SaveAsDraft,
            Status = request.SaveAsDraft ? EnquiryStatuses.Draft : EnquiryStatuses.Submitted,
            SubmittedByIp = ip,
            PartName = request.PartName,
            PartNumber = request.PartNumber,
            Industry = request.Industry,
            Application = request.Application,
            MaterialStandard = request.MaterialStandard,
            ApproxWeight = request.ApproxWeight,
            MachiningRequired = request.MachiningRequired,
            PatternAvailability = request.PatternAvailability,
            PrototypeQuantity = request.PrototypeQuantity,
            ProductionQuantity = request.ProductionQuantity,
            AnnualRequirement = request.AnnualRequirement,
            ExpectedDeliveryDate = request.ExpectedDeliveryDate,
            PreferredDeliveryTerms = request.PreferredDeliveryTerms,
            AdditionalRequirements = request.AdditionalRequirements,
            Remarks = request.Remarks,
        };

        db.Enquiries.Add(enquiry);

        if (!request.SaveAsDraft)
        {
            db.EnquiryStatusHistories.Add(new EnquiryStatusHistory
            {
                Id = Guid.NewGuid(),
                EnquiryId = enquiry.Id,
                FromStatus = "New",
                ToStatus = EnquiryStatuses.Submitted,
                ChangedByUserId = ctx.UserId,
                ChangedByRole = "Customer",
                Note = "Enquiry created and submitted",
                CreatedAtUtc = now,
            });
        }

        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.enquiry.created", ctx.UserId, "Enquiry", enquiry.Id.ToString(), ip);
        return enquiry.Id;
    }

    public async Task<EnquiryFileDto?> AttachEnquiryFileAsync(CustomerContext ctx, Guid enquiryId, IFormFile file, string? ip)
    {
        var enquiry = await db.Enquiries.SingleOrDefaultAsync(r =>
            r.Id == enquiryId && r.CompanyId != null && ctx.CompanyIds.Contains(r.CompanyId.Value));
        if (enquiry is null)
        {
            return null;
        }

        await using var stream = file.OpenReadStream();
        var stored = await storage.SaveAsync(stream, file.FileName, file.ContentType);

        var enquiryFile = new EnquiryFile
        {
            Id = Guid.NewGuid(),
            EnquiryId = enquiry.Id,
            FileName = Path.GetFileName(file.FileName),
            ContentType = file.ContentType,
            SizeBytes = stored.SizeBytes,
            StorageKey = stored.StorageKey,
            UploadedByUserId = ctx.UserId,
        };

        db.EnquiryFiles.Add(enquiryFile);
        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.enquiry.file_uploaded", ctx.UserId, "EnquiryFile", enquiryFile.Id.ToString(), ip);
        return new EnquiryFileDto(enquiryFile.Id, enquiryFile.FileName, enquiryFile.SizeBytes, enquiryFile.UploadedAtUtc);
    }

    /// <returns>null = not found; false = not in draft state; true = saved.</returns>
    public async Task<bool?> UpdateDraftEnquiryAsync(CustomerContext ctx, Guid enquiryId, UpdateEnquiryRequest request, string? ip)
    {
        var enquiry = await db.Enquiries.SingleOrDefaultAsync(r =>
            r.Id == enquiryId && r.CompanyId != null && ctx.CompanyIds.Contains(r.CompanyId.Value));
        if (enquiry is null) return null;
        if (!enquiry.IsDraft || enquiry.Status != EnquiryStatuses.Draft) return false;

        if (request.ProductType is not null) enquiry.ProductType = request.ProductType;
        if (request.MaterialGrade is not null) enquiry.MaterialGrade = request.MaterialGrade;
        if (request.Quantity is not null) enquiry.Quantity = request.Quantity;
        if (request.DeliveryLocation is not null) enquiry.DeliveryLocation = request.DeliveryLocation;
        if (request.RequirementDetails is not null) enquiry.RequirementDetails = request.RequirementDetails;
        if (request.PartName is not null) enquiry.PartName = request.PartName;
        if (request.PartNumber is not null) enquiry.PartNumber = request.PartNumber;
        if (request.Industry is not null) enquiry.Industry = request.Industry;
        if (request.Application is not null) enquiry.Application = request.Application;
        if (request.MaterialStandard is not null) enquiry.MaterialStandard = request.MaterialStandard;
        if (request.ApproxWeight is not null) enquiry.ApproxWeight = request.ApproxWeight;
        if (request.MachiningRequired is not null) enquiry.MachiningRequired = request.MachiningRequired;
        if (request.PatternAvailability is not null) enquiry.PatternAvailability = request.PatternAvailability;
        if (request.PrototypeQuantity is not null) enquiry.PrototypeQuantity = request.PrototypeQuantity;
        if (request.ProductionQuantity is not null) enquiry.ProductionQuantity = request.ProductionQuantity;
        if (request.AnnualRequirement is not null) enquiry.AnnualRequirement = request.AnnualRequirement;
        if (request.ExpectedDeliveryDate is not null) enquiry.ExpectedDeliveryDate = request.ExpectedDeliveryDate;
        if (request.PreferredDeliveryTerms is not null) enquiry.PreferredDeliveryTerms = request.PreferredDeliveryTerms;
        if (request.AdditionalRequirements is not null) enquiry.AdditionalRequirements = request.AdditionalRequirements;
        if (request.Remarks is not null) enquiry.Remarks = request.Remarks;

        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.enquiry.updated", ctx.UserId, "Enquiry", enquiry.Id.ToString(), ip);
        return true;
    }

    /// <returns>null = not found; false = not in draft state; true = deleted.</returns>
    public async Task<bool?> DeleteDraftEnquiryAsync(CustomerContext ctx, Guid enquiryId, string? ip)
    {
        var enquiry = await db.Enquiries.SingleOrDefaultAsync(r =>
            r.Id == enquiryId && r.CompanyId != null && ctx.CompanyIds.Contains(r.CompanyId.Value));
        if (enquiry is null) return null;
        if (!enquiry.IsDraft || enquiry.Status != EnquiryStatuses.Draft) return false;

        enquiry.IsDeleted = true;
        enquiry.DeletedAtUtc = DateTimeOffset.UtcNow;
        enquiry.Status = EnquiryStatuses.Cancelled;

        db.EnquiryStatusHistories.Add(new EnquiryStatusHistory
        {
            Id = Guid.NewGuid(),
            EnquiryId = enquiry.Id,
            FromStatus = EnquiryStatuses.Draft,
            ToStatus = EnquiryStatuses.Cancelled,
            ChangedByUserId = ctx.UserId,
            ChangedByRole = "Customer",
            Note = "Draft cancelled by customer",
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.enquiry.deleted", ctx.UserId, "Enquiry", enquiry.Id.ToString(), ip);
        return true;
    }

    /// <returns>null = not found; false = not a draft; true = submitted.</returns>
    public async Task<bool?> SubmitDraftEnquiryAsync(CustomerContext ctx, Guid enquiryId, string? ip)
    {
        var enquiry = await db.Enquiries.SingleOrDefaultAsync(r =>
            r.Id == enquiryId && r.CompanyId != null && ctx.CompanyIds.Contains(r.CompanyId.Value));
        if (enquiry is null) return null;
        if (!enquiry.IsDraft || enquiry.Status != EnquiryStatuses.Draft) return false;

        var now = DateTimeOffset.UtcNow;
        enquiry.IsDraft = false;
        enquiry.Status = EnquiryStatuses.Submitted;

        db.EnquiryStatusHistories.Add(new EnquiryStatusHistory
        {
            Id = Guid.NewGuid(),
            EnquiryId = enquiry.Id,
            FromStatus = EnquiryStatuses.Draft,
            ToStatus = EnquiryStatuses.Submitted,
            ChangedByUserId = ctx.UserId,
            ChangedByRole = "Customer",
            Note = "Draft submitted by customer",
            CreatedAtUtc = now,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.enquiry.submitted", ctx.UserId, "Enquiry", enquiry.Id.ToString(), ip);
        return true;
    }

    /// <returns>null when the Enquiry is not found/accessible; timeline entries otherwise.</returns>
    public async Task<IReadOnlyList<EnquiryTimelineEntryDto>?> GetEnquiryTimelineAsync(CustomerContext ctx, Guid enquiryId)
    {
        var exists = await db.Enquiries.AnyAsync(r =>
            r.Id == enquiryId && r.CompanyId != null && ctx.CompanyIds.Contains(r.CompanyId.Value));
        if (!exists) return null;

        var history = await db.EnquiryStatusHistories
            .Where(h => h.EnquiryId == enquiryId)
            .OrderBy(h => h.CreatedAtUtc)
            .Select(h => new EnquiryTimelineEntryDto(
                h.FromStatus, h.ToStatus, h.ChangedByRole, h.Note, h.CreatedAtUtc))
            .ToListAsync();

        return history;
    }

    // ---- Quotations ---------------------------------------------------------

    public async Task<IReadOnlyList<QuotationListItemDto>> GetQuotationsAsync(CustomerContext ctx) =>
        await db.Quotations
            .Where(q => ctx.CompanyIds.Contains(q.CompanyId) && q.Status != QuotationStatuses.Draft)
            .OrderByDescending(q => q.CreatedAtUtc)
            .Select(q => new QuotationListItemDto(
                q.Id, q.QuotationNumber, q.RevisionNumber, q.EnquiryId, q.Enquiry.ProductType, q.Total, q.Currency,
                q.Status, q.ValidUntilUtc, q.CreatedAtUtc,
                q.Enquiry.CompanyName, q.Items.Count, q.PaymentTerms, q.DeliveryTime))
            .ToListAsync();

    public async Task<QuotationDetailDto?> GetQuotationAsync(CustomerContext ctx, Guid quotationId)
    {
        var q = await db.Quotations
            .Where(x => x.Id == quotationId && ctx.CompanyIds.Contains(x.CompanyId) && x.Status != QuotationStatuses.Draft)
            .Include(x => x.Items)
            .SingleOrDefaultAsync();
        if (q is null) return null;

        var order = await db.Orders
            .Where(o => o.QuotationId == q.Id)
            .Select(o => new { o.Id, o.OrderNumber })
            .FirstOrDefaultAsync();

        return new QuotationDetailDto(
            q.Id, q.QuotationNumber, q.RevisionNumber, q.EnquiryId, q.Enquiry?.ProductType ?? "",
            q.Subtotal, q.Tax, q.Discount, q.Total, q.Currency,
            q.PaymentTerms, q.DeliveryTerms, q.Freight, q.Packing, q.Remarks,
            q.DeliveryTime, q.Warranty,
            q.Status, q.CustomerResponseComment, q.CustomerRespondedAtUtc,
            q.ValidUntilUtc, q.DocumentId, q.CreatedAtUtc,
            order?.Id, order?.OrderNumber,
            q.Items.OrderBy(i => i.LineNumber).Select(i => new QuotationItemDto(
                i.LineNumber, i.PartNumber, i.Description, i.MaterialGrade,
                i.Quantity, i.Unit, i.UnitPrice, i.TaxPercent, i.LineTotal)).ToList());
    }

    /// <returns>null = not found/not visible; false = not in a respondable state; true = recorded.</returns>
    public async Task<bool?> RespondToQuotationAsync(
        CustomerContext ctx, Guid quotationId, QuotationResponseRequest request, string? ip)
    {
        var quotation = await db.Quotations.SingleOrDefaultAsync(q =>
            q.Id == quotationId && ctx.CompanyIds.Contains(q.CompanyId));
        if (quotation is null || quotation.Status == QuotationStatuses.Draft)
        {
            return null;
        }

        if (quotation.Status != QuotationStatuses.Issued)
        {
            return false; // already answered or expired
        }

        if (quotation.ValidUntilUtc is { } validity && DateTimeOffset.UtcNow > validity)
        {
            quotation.Status = QuotationStatuses.Expired;
            await db.SaveChangesAsync();
            return false;
        }

        // Only the response fields change — amounts and terms are untouchable here.
        var previousStatus = quotation.Status;
        if (request.Response == "negotiate")
        {
            quotation.Status = QuotationStatuses.Negotiating;
        }
        else
        {
            quotation.Status = request.Response == "accept" ? QuotationStatuses.Accepted : QuotationStatuses.Declined;
        }
        quotation.CustomerResponseComment = request.Comment;
        quotation.CustomerRespondedAtUtc = DateTimeOffset.UtcNow;
        quotation.RespondedByUserId = ctx.UserId;

        // Record status change in history timeline
        db.QuotationStatusHistories.Add(new QuotationStatusHistory
        {
            Id = Guid.NewGuid(),
            QuotationId = quotation.Id,
            FromStatus = previousStatus,
            ToStatus = quotation.Status,
            ChangedByUserId = ctx.UserId,
            ChangedByRole = "Customer",
            Note = request.Response == "negotiate" ? "Customer requested revision"
                : request.Response == "accept" ? "Customer accepted the quotation"
                : "Customer declined the quotation",
            CreatedAtUtc = DateTimeOffset.UtcNow,
        });

        var enquiry = await db.Enquiries.SingleOrDefaultAsync(r => r.Id == quotation.EnquiryId);
        if (enquiry is not null)
        {
            enquiry.Status = request.Response == "accept" ? EnquiryStatuses.Accepted
                : request.Response == "negotiate" ? EnquiryStatuses.UnderReview
                : EnquiryStatuses.Declined;
        }

        await db.SaveChangesAsync();
        await audit.WriteAsync(
            $"customer.quotation.{request.Response}ed", ctx.UserId, "Quotation", quotation.Id.ToString(), ip);
        return true;
    }

    // ---- Orders -------------------------------------------------------------

    public async Task<IReadOnlyList<OrderListItemDto>> GetOrdersAsync(CustomerContext ctx)
    {
        var orders = await db.Orders
            .Where(o => ctx.CompanyIds.Contains(o.CompanyId))
            .OrderByDescending(o => o.PlacedAtUtc)
            .Select(o => new
            {
                o.Id, o.OrderNumber, o.Status, o.PlacedAtUtc, o.PromisedDispatchDateUtc,
                TotalQuantity = o.Items.Sum(i => i.QuantityOrdered), o.LastUpdatedAtUtc,
            })
            .ToListAsync();

        return orders.Select(o => new OrderListItemDto(
            o.Id, o.OrderNumber, o.Status,
            OrderStatuses.Labels.TryGetValue(o.Status, out var l) ? l.Label : o.Status,
            o.PlacedAtUtc, o.PromisedDispatchDateUtc, o.TotalQuantity, o.LastUpdatedAtUtc, null, null, null, null)).ToList();
    }

    public async Task<OrderDetailDto?> GetOrderAsync(CustomerContext ctx, Guid orderId)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .Include(o => o.Shipments)
            .SingleOrDefaultAsync(o => o.Id == orderId && ctx.CompanyIds.Contains(o.CompanyId));
        if (order is null)
        {
            return null;
        }

        var invoice = await db.Invoices
            .Where(i => i.OrderId == order.Id && i.Status != InvoiceStatuses.Draft)
            .OrderByDescending(i => i.IssueDateUtc)
            .FirstOrDefaultAsync();

        var documents = await CustomerVisibleDocuments(ctx.CompanyIds)
            .Where(d => d.OrderId == order.Id)
            .OrderByDescending(d => d.CreatedAtUtc)
            .Select(DocumentProjection)
            .ToListAsync();

        var (label, description) = OrderStatuses.Labels.TryGetValue(order.Status, out var l)
            ? l : (order.Status, string.Empty);

        return new OrderDetailDto(
            order.Id, order.OrderNumber, order.PurchaseOrderReference,
            order.Status, label, description,
            order.PlacedAtUtc, order.PromisedDispatchDateUtc, order.DeliveryAddress, order.LastUpdatedAtUtc,
            order.Items.Select(i => new OrderItemDto(
                i.Id, i.PartNumber, i.Description, i.MaterialGrade, i.DrawingRevision,
                i.Unit, i.QuantityOrdered, i.QuantityProduced, i.QuantityDispatched, i.UnitRate)).ToList(),
            order.Shipments.Select(s => new ShipmentDto(
                s.Id, s.Transporter, s.TrackingNumber,
                s.VehicleNumber, s.PhoneNumber, s.DispatchDateUtc,
                s.EstimatedArrivalUtc, s.DeliveredAtUtc, s.ProofOfDeliveryDocumentId != null)).ToList(),
            invoice is null ? null : new OrderCommercialDto(
                invoice.InvoiceNumber, invoice.IssueDateUtc, invoice.DueDateUtc,
                invoice.Total, invoice.AmountPaid, invoice.BalanceDue, invoice.Status),
            documents,
            order.AdvancePercent, order.AdvanceAmount, order.AdvancePaid, order.AdvancePaidAtUtc,
            order.AdvancePaymentRef, order.AdvanceVerifiedAtUtc,
            order.QuotationTotal, order.PaymentTerms, order.QuotationId,
            order.Milestones.Select(m => new OrderMilestoneDto(
                m.Id, m.StatusCode, m.CustomerMessage, m.OccurredAtUtc)).ToList(),
            null, null);
    }

    public async Task<IReadOnlyList<TimelineEntryDto>?> GetOrderTimelineAsync(CustomerContext ctx, Guid orderId)
    {
        var exists = await db.Orders.AnyAsync(o => o.Id == orderId && ctx.CompanyIds.Contains(o.CompanyId));
        if (!exists)
        {
            return null;
        }

        // Customer-visible milestones only; InternalNote is never selected.
        var milestones = await db.OrderMilestones
            .Where(m => m.OrderId == orderId && m.IsCustomerVisible)
            .OrderBy(m => m.OccurredAtUtc)
            .Select(m => new { m.StatusCode, m.CustomerMessage, m.ActorType, m.OccurredAtUtc })
            .ToListAsync();

        return milestones.Select(m => new TimelineEntryDto(
            m.StatusCode,
            OrderStatuses.Labels.TryGetValue(m.StatusCode, out var l) ? l.Label : m.StatusCode,
            m.CustomerMessage, m.ActorType, m.OccurredAtUtc)).ToList();
    }

    /// <summary>
    /// Customer-visible conversation on an order. Only comments marked
    /// customer-visible are returned; internal staff notes stay hidden. Returns
    /// null (→ 404) when the order doesn't belong to the caller's company.
    /// </summary>
    public async Task<IReadOnlyList<OrderCommentResponseDto>?> GetOrderCommentsAsync(CustomerContext ctx, Guid orderId)
    {
        var exists = await db.Orders.AnyAsync(o => o.Id == orderId && ctx.CompanyIds.Contains(o.CompanyId));
        if (!exists)
        {
            return null;
        }

        return await (from c in db.OrderComments
                      join u in db.Users on c.AuthorUserId equals u.Id into authors
                      from u in authors.DefaultIfEmpty()
                      where c.OrderId == orderId && c.IsCustomerVisible
                      orderby c.CreatedAtUtc
                      select new OrderCommentResponseDto(
                          c.AuthorRole,
                          u != null ? u.FullName : null,
                          c.Message,
                          c.CreatedAtUtc)).ToListAsync();
    }

    /// <summary>Posts a customer-visible comment on an order owned by the caller's company.</summary>
    public async Task<bool?> AddOrderCommentAsync(CustomerContext ctx, Guid orderId, string message, string? ip)
    {
        var order = await db.Orders.SingleOrDefaultAsync(o =>
            o.Id == orderId && ctx.CompanyIds.Contains(o.CompanyId));
        if (order is null)
        {
            return null;
        }

        db.OrderComments.Add(new OrderComment
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            AuthorUserId = ctx.UserId,
            AuthorRole = "Customer",
            IsCustomerVisible = true,
            Message = message.Trim(),
        });
        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.order.comment_added", ctx.UserId, "OrderComment", order.Id.ToString(), ip);
        return true;
    }

        public async Task<bool?> SubmitAdvancePaymentAsync(CustomerContext ctx, Guid orderId, AdvancePaymentRequest request, string? ip)
    {
        var order = await db.Orders.SingleOrDefaultAsync(o => o.Id == orderId && ctx.CompanyIds.Contains(o.CompanyId));
        if (order is null) return null;
        if (order.Status != OrderStatuses.PendingAdvance) return false;
        order.Status = OrderStatuses.AwaitingApproval;
        order.AdvancePaidAtUtc = DateTimeOffset.UtcNow;
        order.AdvancePaymentRef = request.PaymentRef;
        order.Milestones.Add(new OrderMilestone { Id = Guid.NewGuid(), OrderId = order.Id, StatusCode = OrderStatuses.AwaitingApproval, CustomerMessage = "Payment proof submitted. Awaiting verification.", ActorType = "Customer" });
        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.order.advance_submitted", ctx.UserId, "Order", order.Id.ToString(), ip);
        return true;
    }

    public async Task<Guid?> CreateSupportRequestAsync(
        CustomerContext ctx, Guid orderId, SupportRequestRequest request, string? ip)
    {
        var order = await db.Orders.SingleOrDefaultAsync(o =>
            o.Id == orderId && ctx.CompanyIds.Contains(o.CompanyId));
        if (order is null)
        {
            return null;
        }

        var support = new SupportRequest
        {
            Id = Guid.NewGuid(),
            CompanyId = order.CompanyId,
            OrderId = order.Id,
            RaisedByUserId = ctx.UserId,
            Subject = request.Subject.Trim(),
            Message = request.Message.Trim(),
        };

        db.SupportRequests.Add(support);
        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.support_request.created", ctx.UserId, "SupportRequest", support.Id.ToString(), ip);
        return support.Id;
    }

    // ---- Invoices & payments ------------------------------------------------
    public async Task<object> GetOutstandingAsync(CustomerContext ctx)
    {
        var invoices = await GetInvoicesAsync(ctx);
        var totalOutstanding = invoices.Where(i => i.Status == "Issued" || i.Status == "Partially Paid" || i.Status == "Overdue").Sum(i => i.BalanceDue);
        return new { outstandingAmount = totalOutstanding, invoiceCount = invoices.Count };
    }


    public async Task<IReadOnlyList<InvoiceListItemDto>> GetInvoicesAsync(CustomerContext ctx) =>
        await db.Invoices
            .Where(i => ctx.CompanyIds.Contains(i.CompanyId) && i.Status != InvoiceStatuses.Draft)
            .OrderByDescending(i => i.IssueDateUtc)
            .Select(i => new InvoiceListItemDto(
                i.Id, i.Order != null ? i.Order.Id : Guid.Empty, i.InvoiceNumber, i.Order != null ? i.Order.OrderNumber : null,
                i.IssueDateUtc, i.DueDateUtc, i.Total, i.AmountPaid, i.BalanceDue,
                i.Currency, i.Status, i.Company != null ? i.Company.Name : null,
                i.Company != null ? i.Company.CompanyLogoUrl : null,
                i.Company != null ? i.Company.CompanyEmail : null, i.Company != null ? i.Company.CompanyPhone : null))
            .ToListAsync();

    public async Task<InvoiceDetailDto?> GetInvoiceAsync(CustomerContext ctx, Guid invoiceId) =>
        await db.Invoices
            .Where(i => i.Id == invoiceId && ctx.CompanyIds.Contains(i.CompanyId) && i.Status != InvoiceStatuses.Draft)
            .Select(i => new InvoiceDetailDto(
                i.Id, i.Order != null ? i.Order.Id : Guid.Empty, i.InvoiceNumber, i.Order != null ? i.Order.OrderNumber : null,
                i.IssueDateUtc, i.DueDateUtc, i.Subtotal, i.Tax, i.Total,
                i.AmountPaid, i.BalanceDue, i.Currency, i.Status, i.DocumentId,
                i.Company != null ? i.Company.Name : null,
                i.Items.Select(it => new InvoiceItemDto(it.Id, it.Description, it.HsnSacCode, it.Quantity, it.Unit, it.UnitPrice, it.TaxPercent, it.LineTotal)).ToList(),
                db.Payments.Where(p => p.InvoiceId == i.Id)
                    .OrderByDescending(p => p.CreatedAtUtc)
                    .Select(p => new PaymentDto(
                        p.Id, p.PaymentReference, p.Method, p.Amount, p.PaymentDateUtc, p.Status, p.CreatedAtUtc))
                    .ToList()))
            .SingleOrDefaultAsync();

    public async Task<IReadOnlyList<PaymentDto>> GetPaymentsAsync(CustomerContext ctx) =>
        await db.Payments
            .Where(p => ctx.CompanyIds.Contains(p.CompanyId))
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(p => new PaymentDto(
                p.Id, p.PaymentReference, p.Method, p.Amount, p.PaymentDateUtc, p.Status, p.CreatedAtUtc))
            .ToListAsync();

    public async Task<PaymentDto?> SubmitPaymentProofAsync(
        CustomerContext ctx, PaymentProofRequest request, IFormFile? proofFile, string? ip)
    {
        // Invoice must belong to the caller's company — never trust the ID alone.
        var invoice = await db.Invoices.SingleOrDefaultAsync(i =>
            i.Id == request.InvoiceId && ctx.CompanyIds.Contains(i.CompanyId)
            && i.Status != InvoiceStatuses.Draft && i.Status != InvoiceStatuses.Cancelled);
        if (invoice is null)
        {
            return null;
        }

        Guid? proofDocumentId = null;
        if (proofFile is not null)
        {
            await using var stream = proofFile.OpenReadStream();
            var stored = await storage.SaveAsync(stream, proofFile.FileName, proofFile.ContentType);
            var doc = new Document
            {
                Id = Guid.NewGuid(),
                CompanyId = invoice.CompanyId,
                OrderId = invoice.OrderId,
                Title = $"Payment proof — {invoice.InvoiceNumber}",
                Category = DocumentCategories.Invoice,
                FileName = Path.GetFileName(proofFile.FileName),
                ContentType = proofFile.ContentType,
                SizeBytes = stored.SizeBytes,
                StorageKey = stored.StorageKey,
                IsCustomerVisible = true,
            };
            db.Documents.Add(doc);
            proofDocumentId = doc.Id;
        }

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            CompanyId = invoice.CompanyId,
            InvoiceId = invoice.Id,
            PaymentReference = request.PaymentReference.Trim(),
            Method = request.Method.Trim(),
            Amount = request.Amount,
            PaymentDateUtc = request.PaymentDateUtc,
            ProofDocumentId = proofDocumentId,
            SubmittedByUserId = ctx.UserId,
        };

        db.Payments.Add(payment);
        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.payment_proof.submitted", ctx.UserId, "Payment", payment.Id.ToString(), ip);
        return new PaymentDto(
            payment.Id, payment.PaymentReference, payment.Method, payment.Amount,
            payment.PaymentDateUtc, payment.Status, payment.CreatedAtUtc);
    }

    // ---- Documents ----------------------------------------------------------

    public async Task<IReadOnlyList<DocumentListItemDto>> GetDocumentsAsync(
        CustomerContext ctx, string? search, string? category)
    {
        var query = CustomerVisibleDocuments(ctx.CompanyIds);
        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(d => d.Category == category);
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(d => d.Title.Contains(term) || d.FileName.Contains(term));
        }

        return await query
            .OrderByDescending(d => d.CreatedAtUtc)
            .Take(200)
            .Select(DocumentProjection)
            .ToListAsync();
    }

    public async Task<(Stream Content, string FileName, string ContentType)?> OpenDocumentAsync(
        CustomerContext ctx, Guid documentId, string? ip)
    {
        // Authorization: company ownership AND customer visibility, checked here
        // in the backend regardless of what the frontend showed.
        var document = await db.Documents.SingleOrDefaultAsync(d =>
            d.Id == documentId && d.IsCustomerVisible && ctx.CompanyIds.Contains(d.CompanyId));
        if (document is null)
        {
            return null;
        }

        var stream = await storage.OpenReadAsync(document.StorageKey);
        if (stream is null)
        {
            return null;
        }

        await audit.WriteAsync("customer.document.downloaded", ctx.UserId, "Document", document.Id.ToString(), ip);
        return (stream, document.FileName, document.ContentType);
    }

    // ---- Notifications ------------------------------------------------------

    public async Task<PagedResult<NotificationDto>> GetNotificationsAsync(
        CustomerContext ctx, int page, int pageSize, bool? unreadOnly)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Notifications.Where(n => n.UserId == ctx.UserId);
        if (unreadOnly == true)
        {
            query = query.Where(n => !n.IsRead);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(n => n.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationDto(
                n.Id, n.Type, n.Title, n.Body, n.LinkPath, n.IsRead, n.CreatedAtUtc))
            .ToListAsync();

        return new PagedResult<NotificationDto>(items, page, pageSize, total);
    }

    public async Task<bool> MarkNotificationReadAsync(CustomerContext ctx, Guid notificationId)
    {
        var notification = await db.Notifications.SingleOrDefaultAsync(n =>
            n.Id == notificationId && n.UserId == ctx.UserId);
        if (notification is null)
        {
            return false;
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAtUtc = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
        }
        return true;
    }

    // ---- Shared helpers -----------------------------------------------------

    private IQueryable<Document> CustomerVisibleDocuments(IReadOnlyList<Guid> companyIds) =>
        db.Documents.Where(d => d.IsCustomerVisible && companyIds.Contains(d.CompanyId));

    /// <summary>Projection including the related order number via subquery.</summary>
    private System.Linq.Expressions.Expression<Func<Document, DocumentListItemDto>> DocumentProjection =>
        d => new DocumentListItemDto(
            d.Id, d.Title, d.Category, d.FileName, d.SizeBytes,
            d.OrderId != null
                ? db.Orders.Where(o => o.Id == d.OrderId).Select(o => o.OrderNumber).FirstOrDefault()
                : null,
            d.CreatedAtUtc);
}
