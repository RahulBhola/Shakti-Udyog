using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public record CreateInvoiceRequest(
    Guid? OrderId, Guid CompanyId, decimal Subtotal, decimal Tax, decimal Discount,
    decimal Freight, decimal Packing, decimal OtherCharges, decimal Total,
    DateTimeOffset IssueDate, DateTimeOffset? DueDate, string Currency,
    string? PaymentTerms, string? Notes);

public interface IInvoiceAdminService
{
    Task<InvoiceDetailDto?> GetInvoiceAsync(Guid id);
    Task<PagedResult<InvoiceListItemDto>> GetInvoicesAsync(int page, int pageSize, string? status);
    Task<InvoiceDetailDto> CreateInvoiceAsync(CreateInvoiceRequest request, Guid userId, string? ip);
}

public class InvoiceAdminService(AppDbContext db, IAuditWriter audit) : IInvoiceAdminService
{
    public async Task<PagedResult<InvoiceListItemDto>> GetInvoicesAsync(int page = 1, int pageSize = 20, string? status = null)
    {
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 100);
        var query = db.Invoices.AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(i => i.Status == status);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(i => i.IssueDateUtc).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(i => new InvoiceListItemDto(i.Id, i.InvoiceNumber, i.Order != null ? i.Order.OrderNumber : null,
                i.IssueDateUtc, i.DueDateUtc, i.Total, i.AmountPaid, i.BalanceDue, i.Currency, i.Status))
            .ToListAsync();
        return new PagedResult<InvoiceListItemDto>(items, page, pageSize, total);
    }

    public async Task<InvoiceDetailDto?> GetInvoiceAsync(Guid id)
    {
        return await db.Invoices.Where(i => i.Id == id)
            .Select(i => new InvoiceDetailDto(i.Id, i.InvoiceNumber, i.Order != null ? i.Order.OrderNumber : null,
                i.IssueDateUtc, i.DueDateUtc, i.Subtotal, i.Tax, i.Total, i.AmountPaid, i.BalanceDue,
                i.Currency, i.Status, i.DocumentId,
                db.Payments.Where(p => p.InvoiceId == i.Id).OrderByDescending(p => p.CreatedAtUtc)
                    .Select(p => new PaymentDto(p.Id, p.PaymentReference, p.Method, p.Amount, p.PaymentDateUtc, p.Status, p.CreatedAtUtc)).ToList()))
            .SingleOrDefaultAsync();
    }

    public async Task<InvoiceDetailDto> CreateInvoiceAsync(CreateInvoiceRequest request, Guid userId, string? ip)
    {
        var number = $"INV-{DateTimeOffset.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
        var invoice = new Invoice
        {
            Id = Guid.NewGuid(), InvoiceNumber = number, OrderId = request.OrderId,
            CompanyId = request.CompanyId, IssueDateUtc = request.IssueDate, DueDateUtc = request.DueDate,
            Subtotal = request.Subtotal, Tax = request.Tax, Discount = request.Discount,
            Freight = request.Freight, Packing = request.Packing, OtherCharges = request.OtherCharges,
            Total = request.Total, AmountPaid = 0, BalanceDue = request.Total,
            Currency = request.Currency ?? "INR", PaymentTerms = request.PaymentTerms, Notes = request.Notes,
            Status = InvoiceStatuses.Issued,
        };
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.invoice.created", userId, "Invoice", invoice.Id.ToString(), ip);
        return await GetInvoiceAsync(invoice.Id) ?? throw new InvalidOperationException("Failed to retrieve created invoice.");
    }
}
