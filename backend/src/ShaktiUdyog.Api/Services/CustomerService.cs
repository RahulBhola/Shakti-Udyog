using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;
using ShaktiUdyog.Infrastructure.Storage;

namespace ShaktiUdyog.Api.Services;

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
    Task<Guid?> CreateSupportRequestAsync(CustomerContext ctx, Guid orderId, SupportRequestRequest request, string? ip);

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
                r.Id, r.ProductType, r.Quantity, r.Status, r.IsDraft, r.Files.Count, r.CreatedAtUtc))
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
                r.CreatedAtUtc))
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
                q.Status, q.ValidUntilUtc, q.CreatedAtUtc))
            .ToListAsync();

    public async Task<QuotationDetailDto?> GetQuotationAsync(CustomerContext ctx, Guid quotationId) =>
        await db.Quotations
            .Where(q => q.Id == quotationId && ctx.CompanyIds.Contains(q.CompanyId) && q.Status != QuotationStatuses.Draft)
            .Select(q => new QuotationDetailDto(
                q.Id, q.QuotationNumber, q.RevisionNumber, q.RfqId, q.Rfq.ProductType,
                q.Subtotal, q.Tax, q.Discount, q.Total, q.Currency,
                q.PaymentTerms, q.DeliveryTerms, q.Freight, q.Packing, q.Remarks,
                q.Status, q.CustomerResponseComment, q.CustomerRespondedAtUtc,
                q.ValidUntilUtc, q.DocumentId, q.CreatedAtUtc,
                q.Items.OrderBy(i => i.LineNumber).Select(i => new QuotationItemDto(
                    i.LineNumber, i.PartNumber, i.Description, i.MaterialGrade,
                    i.Quantity, i.Unit, i.UnitPrice, i.TaxPercent, i.LineTotal)).ToList()))
            .SingleOrDefaultAsync();

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
        quotation.Status = request.Response == "accept" ? QuotationStatuses.Accepted : QuotationStatuses.Declined;
        quotation.CustomerResponseComment = request.Comment;
        quotation.CustomerRespondedAtUtc = DateTimeOffset.UtcNow;
        quotation.RespondedByUserId = ctx.UserId;

        var rfq = await db.Rfqs.SingleOrDefaultAsync(r => r.Id == quotation.RfqId);
        if (rfq is not null)
        {
            rfq.Status = request.Response == "accept" ? RfqStatuses.Accepted : RfqStatuses.Declined;
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
            o.PlacedAtUtc, o.PromisedDispatchDateUtc, o.TotalQuantity, o.LastUpdatedAtUtc)).ToList();
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
                i.PartNumber, i.Description, i.MaterialGrade, i.DrawingRevision,
                i.Unit, i.QuantityOrdered, i.QuantityProduced, i.QuantityDispatched)).ToList(),
            order.Shipments.Select(s => new ShipmentDto(
                s.Id, s.Transporter, s.TrackingNumber, s.DispatchDateUtc,
                s.EstimatedArrivalUtc, s.DeliveredAtUtc, s.ProofOfDeliveryDocumentId != null)).ToList(),
            invoice is null ? null : new OrderCommercialDto(
                invoice.InvoiceNumber, invoice.IssueDateUtc, invoice.DueDateUtc,
                invoice.Total, invoice.AmountPaid, invoice.BalanceDue, invoice.Status),
            documents);
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
                i.Id, i.InvoiceNumber, i.Order != null ? i.Order.OrderNumber : null,
                i.IssueDateUtc, i.DueDateUtc, i.Total, i.AmountPaid, i.BalanceDue,
                i.Currency, i.Status))
            .ToListAsync();

    public async Task<InvoiceDetailDto?> GetInvoiceAsync(CustomerContext ctx, Guid invoiceId) =>
        await db.Invoices
            .Where(i => i.Id == invoiceId && ctx.CompanyIds.Contains(i.CompanyId) && i.Status != InvoiceStatuses.Draft)
            .Select(i => new InvoiceDetailDto(
                i.Id, i.InvoiceNumber, i.Order != null ? i.Order.OrderNumber : null,
                i.IssueDateUtc, i.DueDateUtc, i.Subtotal, i.Tax, i.Total,
                i.AmountPaid, i.BalanceDue, i.Currency, i.Status, i.DocumentId,
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
