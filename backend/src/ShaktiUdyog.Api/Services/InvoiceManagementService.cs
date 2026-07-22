using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;
using ShaktiUdyog.Infrastructure.Storage;

namespace ShaktiUdyog.Api.Services;

public interface IInvoiceManagementService
{
    // Data Updater
    Task<PagedResult<InvoiceListItemDto>> GetInvoicesAsync(int page, int pageSize, string? status);
    Task<InvoiceDetailDto?> GetInvoiceAsync(Guid id);
    Task<InvoiceDetailDto> CreateInvoiceAsync(CreateInvoiceRequest request, Guid userId, string? ip);
    Task<bool> RecordPaymentAsync(Guid invoiceId, RecordPaymentRequest request, Guid userId, string? ip);

    // Admin
    Task<bool> ApproveInvoiceAsync(Guid id, Guid userId, string? ip);
    Task<bool> CancelInvoiceAsync(Guid id, string reason, Guid userId, string? ip);
    Task<bool> VerifyPaymentAsync(Guid paymentId, Guid userId, string? ip);
    Task<bool> RejectPaymentAsync(Guid paymentId, string reason, Guid userId, string? ip);
    Task<CreditNote> CreateCreditNoteAsync(Guid invoiceId, decimal total, string reason, Guid userId, string? ip);
    Task<DebitNote> CreateDebitNoteAsync(Guid invoiceId, decimal total, string reason, Guid userId, string? ip);

    // Dashboard
    Task<object> GetFinancialDashboardAsync();
}

public record RecordPaymentRequest(decimal Amount, string Method, string PaymentReference, DateTimeOffset PaymentDate);
public class InvoiceManagementService(AppDbContext db, IAuditWriter audit) : IInvoiceManagementService
{
    public async Task<PagedResult<InvoiceListItemDto>> GetInvoicesAsync(int page, int pageSize, string? status)
    {
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 100);
        var query = db.Invoices.AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(i => i.Status == status);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(i => i.IssueDateUtc).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(i => new InvoiceListItemDto(i.Id, i.InvoiceNumber, i.Order!.OrderNumber, i.IssueDateUtc, i.DueDateUtc, i.Total, i.AmountPaid, i.BalanceDue, i.Currency, i.Status)).ToListAsync();
        return new PagedResult<InvoiceListItemDto>(items, page, pageSize, total);
    }

    public async Task<InvoiceDetailDto?> GetInvoiceAsync(Guid id) => await db.Invoices.Where(i => i.Id == id)
        .Include(i => i.Items).Select(i => new InvoiceDetailDto(i.Id, i.InvoiceNumber, i.Order!.OrderNumber, i.IssueDateUtc, i.DueDateUtc, i.Subtotal, i.Tax, i.Total, i.AmountPaid, i.BalanceDue, i.Currency, i.Status, i.DocumentId,
            db.Payments.Where(p => p.InvoiceId == i.Id).Select(p => new PaymentDto(p.Id, p.PaymentReference, p.Method, p.Amount, p.PaymentDateUtc, p.Status, p.CreatedAtUtc)).ToList())).SingleOrDefaultAsync();

    public async Task<InvoiceDetailDto> CreateInvoiceAsync(CreateInvoiceRequest request, Guid userId, string? ip)
    {
        var number = $"INV-{DateTimeOffset.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
        var invoice = new Invoice
        {
            Id = Guid.NewGuid(), InvoiceNumber = number, OrderId = request.OrderId, CompanyId = request.CompanyId,
            IssueDateUtc = request.IssueDate, DueDateUtc = request.DueDate,
            Subtotal = request.Subtotal, Tax = request.Tax, Discount = request.Discount,
            Freight = request.Freight, Packing = request.Packing, OtherCharges = request.OtherCharges,
            Total = request.Total, AmountPaid = 0, BalanceDue = request.Total,
            Currency = request.Currency ?? "INR", PaymentTerms = request.PaymentTerms, Notes = request.Notes,
            Status = InvoiceStatuses.Issued,
        };
        db.Invoices.Add(invoice);
        db.InvoiceStatusHistories.Add(new InvoiceStatusHistory { Id = Guid.NewGuid(), InvoiceId = invoice.Id, FromStatus = "New", ToStatus = InvoiceStatuses.Issued, ChangedByUserId = userId, ChangedByRole = "DataUpdater", Note = "Invoice created" });
        await db.SaveChangesAsync();
        await audit.WriteAsync("updater.invoice.created", userId, "Invoice", invoice.Id.ToString(), ip);
        return (await GetInvoiceAsync(invoice.Id))!;
    }

    public async Task<bool> RecordPaymentAsync(Guid invoiceId, RecordPaymentRequest request, Guid userId, string? ip)
    {
        var invoice = await db.Invoices.FindAsync(invoiceId);
        if (invoice is null) return false;
        var payment = new Payment
        {
            Id = Guid.NewGuid(), CompanyId = invoice.CompanyId, InvoiceId = invoiceId,
            PaymentReference = request.PaymentReference, Method = request.Method,
            Amount = request.Amount, PaymentDateUtc = request.PaymentDate,
            Status = PaymentStatuses.PendingVerification, SubmittedByUserId = userId,
        };
        db.Payments.Add(payment);
        invoice.AmountPaid += request.Amount;
        invoice.BalanceDue = invoice.Total - invoice.AmountPaid;
        invoice.Status = invoice.BalanceDue <= 0 ? InvoiceStatuses.Paid : InvoiceStatuses.PartiallyPaid;
        db.InvoiceStatusHistories.Add(new InvoiceStatusHistory { Id = Guid.NewGuid(), InvoiceId = invoiceId, FromStatus = invoice.Status, ToStatus = invoice.Status, ChangedByUserId = userId, ChangedByRole = "DataUpdater", Note = $"Payment recorded: {request.Amount}" });
        await db.SaveChangesAsync();
        await audit.WriteAsync("updater.payment.recorded", userId, "Payment", payment.Id.ToString(), ip);
        return true;
    }

    public async Task<bool> ApproveInvoiceAsync(Guid id, Guid userId, string? ip)
    {
        var inv = await db.Invoices.FindAsync(id);
        if (inv is null) return false;
        inv.Status = InvoiceStatuses.Issued;
        db.InvoiceStatusHistories.Add(new InvoiceStatusHistory { Id = Guid.NewGuid(), InvoiceId = id, FromStatus = InvoiceStatuses.Draft, ToStatus = InvoiceStatuses.Issued, ChangedByUserId = userId, ChangedByRole = "Admin", Note = "Invoice approved" });
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.invoice.approved", userId, "Invoice", id.ToString(), ip);
        return true;
    }

    public async Task<bool> CancelInvoiceAsync(Guid id, string reason, Guid userId, string? ip)
    {
        var inv = await db.Invoices.FindAsync(id);
        if (inv is null) return false;
        inv.Status = InvoiceStatuses.Cancelled;
        db.InvoiceStatusHistories.Add(new InvoiceStatusHistory { Id = Guid.NewGuid(), InvoiceId = id, FromStatus = inv.Status, ToStatus = InvoiceStatuses.Cancelled, ChangedByUserId = userId, ChangedByRole = "Admin", Note = reason });
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.invoice.cancelled", userId, "Invoice", id.ToString(), ip);
        return true;
    }

    public async Task<bool> VerifyPaymentAsync(Guid paymentId, Guid userId, string? ip)
    {
        var p = await db.Payments.FindAsync(paymentId);
        if (p is null) return false;
        p.Status = PaymentStatuses.Verified;
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.payment.verified", userId, "Payment", paymentId.ToString(), ip);
        return true;
    }

    public async Task<bool> RejectPaymentAsync(Guid paymentId, string reason, Guid userId, string? ip)
    {
        var p = await db.Payments.FindAsync(paymentId);
        if (p is null) return false;
        p.Status = PaymentStatuses.Rejected;
        p.VerificationNote = reason;
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.payment.rejected", userId, "Payment", paymentId.ToString(), ip);
        return true;
    }

    public async Task<CreditNote> CreateCreditNoteAsync(Guid invoiceId, decimal total, string reason, Guid userId, string? ip)
    {
        var inv = await db.Invoices.FindAsync(invoiceId) ?? throw new InvalidOperationException("Invoice not found.");
        var cn = new CreditNote { Id = Guid.NewGuid(), CreditNoteNumber = $"CN-{DateTimeOffset.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}", InvoiceId = invoiceId, CompanyId = inv.CompanyId, Total = total, Reason = reason };
        db.CreditNotes.Add(cn);
        inv.Status = InvoiceStatuses.CreditNoteIssued;
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.credit_note.created", userId, "CreditNote", cn.Id.ToString(), ip);
        return cn;
    }

    public async Task<DebitNote> CreateDebitNoteAsync(Guid invoiceId, decimal total, string reason, Guid userId, string? ip)
    {
        var inv = await db.Invoices.FindAsync(invoiceId) ?? throw new InvalidOperationException("Invoice not found.");
        var dn = new DebitNote { Id = Guid.NewGuid(), DebitNoteNumber = $"DN-{DateTimeOffset.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}", InvoiceId = invoiceId, CompanyId = inv.CompanyId, Total = total, Reason = reason };
        db.DebitNotes.Add(dn);
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.debit_note.created", userId, "DebitNote", dn.Id.ToString(), ip);
        return dn;
    }

    public async Task<object> GetFinancialDashboardAsync()
    {
        var outstanding = await db.Invoices.Where(i => i.Status == "Issued" || i.Status == "Partially Paid" || i.Status == "Overdue").SumAsync(i => i.BalanceDue);
        var collected = await db.Invoices.SumAsync(i => i.AmountPaid);
        var pendingVerification = await db.Payments.CountAsync(p => p.Status == "Pending Verification");
        var overdue = await db.Invoices.CountAsync(i => i.Status == "Overdue" || (i.Status == "Issued" && i.DueDateUtc != null && i.DueDateUtc < DateTimeOffset.UtcNow));
        var invoicesThisMonth = await db.Invoices.CountAsync(i => i.IssueDateUtc.Year == DateTimeOffset.UtcNow.Year && i.IssueDateUtc.Month == DateTimeOffset.UtcNow.Month);
        var paymentsThisMonth = await db.Payments.CountAsync(p => p.CreatedAtUtc.Year == DateTimeOffset.UtcNow.Year && p.CreatedAtUtc.Month == DateTimeOffset.UtcNow.Month);
        return new { outstandingAmount = outstanding, collectedAmount = collected, pendingVerification, overdueInvoices = overdue, invoicesThisMonth, paymentsThisMonth };
    }
}
