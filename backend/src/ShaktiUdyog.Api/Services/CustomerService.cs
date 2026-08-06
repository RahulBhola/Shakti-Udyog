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

    Task<PagedResult<RfqListItemDto>> GetRfqsAsync(CustomerContext ctx, int page = 1, int pageSize = 20, string? search = null, string? status = null);
    Task<RfqDetailDto?> GetRfqAsync(CustomerContext ctx, Guid rfqId);
    Task<Guid> CreateRfqAsync(CustomerContext ctx, CreateRfqRequest request, string? ip);
    Task<RfqFileDto?> AttachRfqFileAsync(CustomerContext ctx, Guid rfqId, IFormFile file, string? ip);
    Task<bool?> UpdateDraftRfqAsync(CustomerContext ctx, Guid rfqId, UpdateRfqRequest request, string? ip);
    Task<bool?> DeleteDraftRfqAsync(CustomerContext ctx, Guid rfqId, string? ip);
    Task<bool?> SubmitDraftRfqAsync(CustomerContext ctx, Guid rfqId, string? ip);
    Task<IReadOnlyList<RfqTimelineEntryDto>?> GetRfqTimelineAsync(CustomerContext ctx, Guid rfqId);

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

        var openRfqs = await db.Rfqs.CountAsync(r =>
            r.CompanyId != null && companies.Contains(r.CompanyId.Value)
            && (r.Status == RfqStatuses.Received || r.Status == RfqStatuses.UnderReview));
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

        return new DashboardDto(openRfqs, activeQuotes, activeOrders, unpaidInvoices, unread, activity, recentDocs);
    }

    // ---- RFQs ---------------------------------------------------------------

    public async Task<PagedResult<RfqListItemDto>> GetRfqsAsync(
        CustomerContext ctx, int page = 1, int pageSize = 20, string? search = null, string? status = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Rfqs.Where(r => r.CompanyId != null && ctx.CompanyIds.Contains(r.CompanyId.Value));

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
            .Select(r => new RfqListItemDto(
                r.Id, r.ProductType, r.Quantity, r.Status, r.IsDraft, r.Files.Count, r.CreatedAtUtc,
                r.PartName, r.PartNumber, r.Industry, r.ProductionQuantity))
            .ToListAsync();

        return new PagedResult<RfqListItemDto>(items, page, pageSize, total);
    }

    public async Task<RfqDetailDto?> GetRfqAsync(CustomerContext ctx, Guid rfqId) =>
        await db.Rfqs
            .Where(r => r.Id == rfqId && r.CompanyId != null && ctx.CompanyIds.Contains(r.CompanyId.Value))
            .Select(r => new RfqDetailDto(
                r.Id, r.FullName, r.CompanyName, r.ProductType, r.MaterialGrade, r.Quantity,
                r.DeliveryLocation, r.RequirementDetails, r.Status, r.IsDraft,
                r.Files.Select(f => new RfqFileDto(f.Id, f.FileName, f.SizeBytes, f.UploadedAtUtc)).ToList(),
                r.CreatedAtUtc,
                r.PartName, r.PartNumber, r.Industry, r.Application,
                r.MaterialStandard, r.ApproxWeight, r.MachiningRequired, r.PatternAvailability,
                r.PrototypeQuantity, r.ProductionQuantity, r.AnnualRequirement,
                r.ExpectedDeliveryDate, r.PreferredDeliveryTerms, r.AdditionalRequirements, r.Remarks))
            .SingleOrDefaultAsync();

    public async Task<Guid> CreateRfqAsync(CustomerContext ctx, CreateRfqRequest request, string? ip)
    {
        var user = await userManager.FindByIdAsync(ctx.UserId.ToString())
            ?? throw new InvalidOperationException("Authenticated user not found.");
        var companyId = ctx.CompanyIds[0];
        var company = await db.Companies.SingleAsync(c => c.Id == companyId);

        var now = DateTimeOffset.UtcNow;
        var rfq = new Rfq
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
            Status = request.SaveAsDraft ? RfqStatuses.Draft : RfqStatuses.Submitted,
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

        db.Rfqs.Add(rfq);

        if (!request.SaveAsDraft)
        {
            db.RfqStatusHistories.Add(new RfqStatusHistory
            {
                Id = Guid.NewGuid(),
                RfqId = rfq.Id,
                FromStatus = "New",
                ToStatus = RfqStatuses.Submitted,
                ChangedByUserId = ctx.UserId,
                ChangedByRole = "Customer",
                Note = "RFQ created and submitted",
                CreatedAtUtc = now,
            });
        }

        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.rfq.created", ctx.UserId, "Rfq", rfq.Id.ToString(), ip);
        return rfq.Id;
    }

    public async Task<RfqFileDto?> AttachRfqFileAsync(CustomerContext ctx, Guid rfqId, IFormFile file, string? ip)
    {
        var rfq = await db.Rfqs.SingleOrDefaultAsync(r =>
            r.Id == rfqId && r.CompanyId != null && ctx.CompanyIds.Contains(r.CompanyId.Value));
        if (rfq is null)
        {
            return null;
        }

        await using var stream = file.OpenReadStream();
        var stored = await storage.SaveAsync(stream, file.FileName, file.ContentType);

        var rfqFile = new RfqFile
        {
            Id = Guid.NewGuid(),
            RfqId = rfq.Id,
            FileName = Path.GetFileName(file.FileName),
            ContentType = file.ContentType,
            SizeBytes = stored.SizeBytes,
            StorageKey = stored.StorageKey,
            UploadedByUserId = ctx.UserId,
        };

        db.RfqFiles.Add(rfqFile);
        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.rfq.file_uploaded", ctx.UserId, "RfqFile", rfqFile.Id.ToString(), ip);
        return new RfqFileDto(rfqFile.Id, rfqFile.FileName, rfqFile.SizeBytes, rfqFile.UploadedAtUtc);
    }

    /// <returns>null = not found; false = not in draft state; true = saved.</returns>
    public async Task<bool?> UpdateDraftRfqAsync(CustomerContext ctx, Guid rfqId, UpdateRfqRequest request, string? ip)
    {
        var rfq = await db.Rfqs.SingleOrDefaultAsync(r =>
            r.Id == rfqId && r.CompanyId != null && ctx.CompanyIds.Contains(r.CompanyId.Value));
        if (rfq is null) return null;
        if (!rfq.IsDraft || rfq.Status != RfqStatuses.Draft) return false;

        if (request.ProductType is not null) rfq.ProductType = request.ProductType;
        if (request.MaterialGrade is not null) rfq.MaterialGrade = request.MaterialGrade;
        if (request.Quantity is not null) rfq.Quantity = request.Quantity;
        if (request.DeliveryLocation is not null) rfq.DeliveryLocation = request.DeliveryLocation;
        if (request.RequirementDetails is not null) rfq.RequirementDetails = request.RequirementDetails;
        if (request.PartName is not null) rfq.PartName = request.PartName;
        if (request.PartNumber is not null) rfq.PartNumber = request.PartNumber;
        if (request.Industry is not null) rfq.Industry = request.Industry;
        if (request.Application is not null) rfq.Application = request.Application;
        if (request.MaterialStandard is not null) rfq.MaterialStandard = request.MaterialStandard;
        if (request.ApproxWeight is not null) rfq.ApproxWeight = request.ApproxWeight;
        if (request.MachiningRequired is not null) rfq.MachiningRequired = request.MachiningRequired;
        if (request.PatternAvailability is not null) rfq.PatternAvailability = request.PatternAvailability;
        if (request.PrototypeQuantity is not null) rfq.PrototypeQuantity = request.PrototypeQuantity;
        if (request.ProductionQuantity is not null) rfq.ProductionQuantity = request.ProductionQuantity;
        if (request.AnnualRequirement is not null) rfq.AnnualRequirement = request.AnnualRequirement;
        if (request.ExpectedDeliveryDate is not null) rfq.ExpectedDeliveryDate = request.ExpectedDeliveryDate;
        if (request.PreferredDeliveryTerms is not null) rfq.PreferredDeliveryTerms = request.PreferredDeliveryTerms;
        if (request.AdditionalRequirements is not null) rfq.AdditionalRequirements = request.AdditionalRequirements;
        if (request.Remarks is not null) rfq.Remarks = request.Remarks;

        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.rfq.updated", ctx.UserId, "Rfq", rfq.Id.ToString(), ip);
        return true;
    }

    /// <returns>null = not found; false = not in draft state; true = deleted.</returns>
    public async Task<bool?> DeleteDraftRfqAsync(CustomerContext ctx, Guid rfqId, string? ip)
    {
        var rfq = await db.Rfqs.SingleOrDefaultAsync(r =>
            r.Id == rfqId && r.CompanyId != null && ctx.CompanyIds.Contains(r.CompanyId.Value));
        if (rfq is null) return null;
        if (!rfq.IsDraft || rfq.Status != RfqStatuses.Draft) return false;

        rfq.IsDeleted = true;
        rfq.DeletedAtUtc = DateTimeOffset.UtcNow;
        rfq.Status = RfqStatuses.Cancelled;

        db.RfqStatusHistories.Add(new RfqStatusHistory
        {
            Id = Guid.NewGuid(),
            RfqId = rfq.Id,
            FromStatus = RfqStatuses.Draft,
            ToStatus = RfqStatuses.Cancelled,
            ChangedByUserId = ctx.UserId,
            ChangedByRole = "Customer",
            Note = "Draft cancelled by customer",
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.rfq.deleted", ctx.UserId, "Rfq", rfq.Id.ToString(), ip);
        return true;
    }

    /// <returns>null = not found; false = not a draft; true = submitted.</returns>
    public async Task<bool?> SubmitDraftRfqAsync(CustomerContext ctx, Guid rfqId, string? ip)
    {
        var rfq = await db.Rfqs.SingleOrDefaultAsync(r =>
            r.Id == rfqId && r.CompanyId != null && ctx.CompanyIds.Contains(r.CompanyId.Value));
        if (rfq is null) return null;
        if (!rfq.IsDraft || rfq.Status != RfqStatuses.Draft) return false;

        var now = DateTimeOffset.UtcNow;
        rfq.IsDraft = false;
        rfq.Status = RfqStatuses.Submitted;

        db.RfqStatusHistories.Add(new RfqStatusHistory
        {
            Id = Guid.NewGuid(),
            RfqId = rfq.Id,
            FromStatus = RfqStatuses.Draft,
            ToStatus = RfqStatuses.Submitted,
            ChangedByUserId = ctx.UserId,
            ChangedByRole = "Customer",
            Note = "Draft submitted by customer",
            CreatedAtUtc = now,
        });

        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.rfq.submitted", ctx.UserId, "Rfq", rfq.Id.ToString(), ip);
        return true;
    }

    /// <returns>null when the RFQ is not found/accessible; timeline entries otherwise.</returns>
    public async Task<IReadOnlyList<RfqTimelineEntryDto>?> GetRfqTimelineAsync(CustomerContext ctx, Guid rfqId)
    {
        var exists = await db.Rfqs.AnyAsync(r =>
            r.Id == rfqId && r.CompanyId != null && ctx.CompanyIds.Contains(r.CompanyId.Value));
        if (!exists) return null;

        var history = await db.RfqStatusHistories
            .Where(h => h.RfqId == rfqId)
            .OrderBy(h => h.CreatedAtUtc)
            .Select(h => new RfqTimelineEntryDto(
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
                q.Id, q.QuotationNumber, q.RevisionNumber, q.RfqId, q.Rfq.ProductType, q.Total, q.Currency,
                q.Status, q.ValidUntilUtc, q.CreatedAtUtc,
                q.Rfq.CompanyName, q.Items.Count, q.PaymentTerms, q.DeliveryTime))
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

        var invoice = order is null ? null : await db.Invoices
            .Where(i => i.OrderId == order.Id)
            .OrderByDescending(i => i.IssueDateUtc)
            .Select(i => new { i.Id, i.AmountPaid, i.BalanceDue })
            .FirstOrDefaultAsync();

        var proofStatus = invoice is null ? null : await db.Payments
            .Where(p => p.InvoiceId == invoice.Id)
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(p => p.Status)
            .FirstOrDefaultAsync();

        // Drives the customer "Pay Now" visibility: Unpaid when nothing has been
        // credited, Paid when the balance is settled, otherwise Partially Paid.
        string? paymentStatus = null;
        if (invoice is not null)
        {
            paymentStatus = invoice.BalanceDue <= 0 ? "Paid"
                : invoice.AmountPaid <= 0 ? "Unpaid"
                : "Partially Paid";
        }

        return new QuotationDetailDto(
            q.Id, q.QuotationNumber, q.RevisionNumber, q.RfqId, q.Rfq?.ProductType ?? "",
            q.Subtotal, q.Tax, q.Discount, q.Total, q.Currency,
            q.PaymentTerms, q.DeliveryTerms, q.Freight, q.Packing, q.Remarks,
            q.DeliveryTime, q.Warranty,
            q.Status, q.CustomerResponseComment, q.CustomerRespondedAtUtc,
            q.ValidUntilUtc, q.DocumentId, q.CreatedAtUtc,
            order?.Id, order?.OrderNumber,
            q.Items.OrderBy(i => i.LineNumber).Select(i => new QuotationItemDto(
                i.LineNumber, i.PartNumber, i.Description, i.MaterialGrade,
                i.Quantity, i.Unit, i.UnitPrice, i.TaxPercent, i.LineTotal)).ToList(),
            invoice?.Id, paymentStatus, proofStatus);
    }

    /// <returns>null = not found/not visible; false = not in a respondable state; true = recorded.</returns>
    public async Task<bool?> RespondToQuotationAsync(
        CustomerContext ctx, Guid quotationId, QuotationResponseRequest request, string? ip)
    {
        var quotation = await db.Quotations
            .Include(q => q.Items.OrderBy(i => i.LineNumber))
            .SingleOrDefaultAsync(q =>
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

        var rfq = await db.Rfqs.SingleOrDefaultAsync(r => r.Id == quotation.RfqId);
        if (rfq is not null)
        {
            rfq.Status = request.Response == "accept" ? RfqStatuses.Accepted
                : request.Response == "negotiate" ? RfqStatuses.UnderReview
                : RfqStatuses.Declined;
        }

        if (request.Response == "accept")
        {
            // Auto-create the Order + Invoice ("bill") so the customer sees it
            // immediately in their invoices/payments. The engineer who owns the
            // RFQ is carried forward so the manufacturing board shows the order.
            Guid? assignedEngineerId = quotation.RfqId == Guid.Empty ? null : await db.RfqAssignments
                .Where(a => a.RfqId == quotation.RfqId && a.IsActive)
                .Select(a => (Guid?)a.AssignedToUserId)
                .FirstOrDefaultAsync();
            CreateOrderAndInvoiceFromQuotation(quotation, ctx, assignedEngineerId);
        }

        await db.SaveChangesAsync();
        await audit.WriteAsync(
            $"customer.quotation.{request.Response}ed", ctx.UserId, "Quotation", quotation.Id.ToString(), ip);
        return true;
    }

    /// <summary>
    /// On quotation acceptance, creates the Order (confirmed, no advance sub-flow)
    /// and an Issued Invoice ("bill") with line items copied from the quotation.
    /// The quotation is marked Converted so the admin order button can't double-create.
    /// Entities are only added here — the caller's SaveChangesAsync persists them.
    /// </summary>
    private void CreateOrderAndInvoiceFromQuotation(
        Quotation quotation, CustomerContext ctx, Guid? assignedEngineerId = null)
    {
        var now = DateTimeOffset.UtcNow;
        var rfqShortId = quotation.RfqId.ToString("N")[..8].ToUpperInvariant();

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = $"ORD-{now:yyyyMMdd}-{rfqShortId}",
            CompanyId = quotation.CompanyId,
            QuotationId = quotation.Id,
            Status = OrderStatuses.Confirmed,
            AdvancePercent = 0,
            QuotationTotal = quotation.Total,
            PaymentTerms = quotation.PaymentTerms,
            AssignedEngineerId = assignedEngineerId,
            ManufacturingStage = assignedEngineerId is null ? null : ManufacturingStages.PatternDevelopment,
            StageUpdatedAt = assignedEngineerId is null ? null : now,
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
        order.Milestones.Add(new OrderMilestone
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            StatusCode = OrderStatuses.Confirmed,
            CustomerMessage = "Order confirmed. Invoice issued for payment.",
            ActorType = "System",
        });
        db.Orders.Add(order);

        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            InvoiceNumber = $"INV-{now:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}",
            CompanyId = quotation.CompanyId,
            OrderId = order.Id,
            IssueDateUtc = now,
            DueDateUtc = now.AddDays(30),
            Subtotal = quotation.Subtotal,
            Tax = quotation.Tax,
            Total = quotation.Total,
            AmountPaid = 0,
            BalanceDue = quotation.Total,
            Currency = quotation.Currency,
            PaymentTerms = quotation.PaymentTerms,
            Status = InvoiceStatuses.Issued,
            Items = quotation.Items.Select(i => new InvoiceItem
            {
                Id = Guid.NewGuid(),
                Description = i.Description,
                Quantity = i.Quantity,
                Unit = i.Unit,
                UnitPrice = i.UnitPrice,
                TaxPercent = i.TaxPercent,
                LineTotal = i.LineTotal,
            }).ToList(),
        };
        db.Invoices.Add(invoice);
        db.InvoiceStatusHistories.Add(new InvoiceStatusHistory
        {
            Id = Guid.NewGuid(),
            InvoiceId = invoice.Id,
            FromStatus = "New",
            ToStatus = InvoiceStatuses.Issued,
            ChangedByUserId = ctx.UserId,
            ChangedByRole = "Customer",
            Note = "Invoice issued on quotation acceptance",
        });

        quotation.Status = QuotationStatuses.Converted;
        db.QuotationStatusHistories.Add(new QuotationStatusHistory
        {
            Id = Guid.NewGuid(),
            QuotationId = quotation.Id,
            FromStatus = QuotationStatuses.Accepted,
            ToStatus = QuotationStatuses.Converted,
            ChangedByUserId = ctx.UserId,
            ChangedByRole = "Customer",
            Note = "Order and invoice created on acceptance",
        });
    }

    /// <summary>Reads the seller's bank account from SystemSettings (bank.* keys).</summary>
    private async Task<BankAccountDto> ReadBankAccountAsync()
    {
        var settings = await db.SystemSettings
            .Where(s => s.Key.StartsWith("bank."))
            .Select(s => new { s.Key, s.Value })
            .ToDictionaryAsync(s => s.Key, s => s.Value);

        return new BankAccountDto(
            settings.GetValueOrDefault("bank.bankName") ?? "Shakti Udyog",
            settings.GetValueOrDefault("bank.accountNumber") ?? "XXXX-XXXX-XXXX",
            settings.GetValueOrDefault("bank.ifscCode") ?? "XXXX0000000",
            settings.GetValueOrDefault("bank.accountHolder") ?? "Shakti Udyog");
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
            o.PlacedAtUtc, o.PromisedDispatchDateUtc, o.TotalQuantity, o.LastUpdatedAtUtc, null, null)).ToList();
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

        // Latest payment determines the payment-proof workflow state (Pending,
        // Uploaded, Verified, Rejected) that drives the customer "Pay Now" button.
        var latestPayment = invoice is null ? null : await db.Payments
            .Where(p => p.InvoiceId == invoice.Id)
            .OrderByDescending(p => p.CreatedAtUtc)
            .FirstOrDefaultAsync();
        var paymentProofStatus = latestPayment is null ? PaymentProofStatuses.Pending
            : latestPayment.Status == PaymentStatuses.Verified ? PaymentProofStatuses.Verified
            : latestPayment.Status == PaymentStatuses.Rejected ? PaymentProofStatuses.Rejected
            : PaymentProofStatuses.Uploaded;

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
                s.VehicleNumber, s.PhoneNumber,
                s.DispatchDateUtc, s.EstimatedArrivalUtc, s.DeliveredAtUtc, s.ProofOfDeliveryDocumentId != null)).ToList(),
            invoice is null ? null : new OrderCommercialDto(
                invoice.InvoiceNumber, invoice.IssueDateUtc, invoice.DueDateUtc,
                invoice.Total, invoice.AmountPaid, invoice.BalanceDue, invoice.Status,
                paymentProofStatus, invoice.Id),
            documents,
            order.AdvancePercent, order.AdvanceAmount, order.AdvancePaid, order.AdvancePaidAtUtc,
            order.AdvancePaymentRef, order.AdvanceVerifiedAtUtc,
            order.QuotationTotal, order.PaymentTerms, order.QuotationId,
            order.Milestones.Select(m => new OrderMilestoneDto(
                m.Id, m.StatusCode, m.CustomerMessage, m.OccurredAtUtc)).ToList());
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

    public async Task<InvoiceDetailDto?> GetInvoiceAsync(CustomerContext ctx, Guid invoiceId)
    {
        var invoice = await db.Invoices
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
                        p.Id, p.PaymentReference, p.Method, p.Amount, p.PaymentDateUtc, p.Status, p.CreatedAtUtc, p.ProofDocumentId, p.VerificationNote))
                    .ToList(),
                null))
            .SingleOrDefaultAsync();
        if (invoice is null) return null;
        return invoice with { Bank = await ReadBankAccountAsync() };
    }

    public async Task<IReadOnlyList<PaymentDto>> GetPaymentsAsync(CustomerContext ctx) =>
        await db.Payments
            .Where(p => ctx.CompanyIds.Contains(p.CompanyId))
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(p => new PaymentDto(
                p.Id, p.PaymentReference, p.Method, p.Amount, p.PaymentDateUtc, p.Status, p.CreatedAtUtc, p.ProofDocumentId, p.VerificationNote))
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

        // Re-upload guard: only one proof may be awaiting verification at a time.
        // A rejected proof is terminal, so a new submission is allowed after rejection.
        var alreadyPending = await db.Payments
            .AnyAsync(p => p.InvoiceId == invoice.Id && p.Status == PaymentStatuses.PendingVerification);
        if (alreadyPending)
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
            payment.PaymentDateUtc, payment.Status, payment.CreatedAtUtc, payment.ProofDocumentId);
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
