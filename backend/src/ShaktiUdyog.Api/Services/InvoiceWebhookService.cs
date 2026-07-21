using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Integrations;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface IInvoiceWebhookService
{
    Task<WebhookResponse> ProcessIncomingInvoiceAsync(InvoiceWebhookRequest request, string? ip);
}

public class InvoiceWebhookService(AppDbContext db, IAuditWriter audit) : IInvoiceWebhookService
{
    public async Task<WebhookResponse> ProcessIncomingInvoiceAsync(InvoiceWebhookRequest request, string? ip)
    {
        // Find or create company by name
        var company = await db.Companies.FirstOrDefaultAsync(c => c.Name == request.CompanyName);
        if (company is null)
        {
            company = new Company
            {
                Id = Guid.NewGuid(),
                Name = request.CompanyName,
                IsActive = true,
            };
            db.Companies.Add(company);
        }

        // Verify order exists if OrderId is provided
        if (request.OrderId.HasValue)
        {
            var orderExists = await db.Orders.AnyAsync(o => o.Id == request.OrderId.Value);
            if (!orderExists)
                return new WebhookResponse("error", $"Order {request.OrderId} not found.", null);
        }

        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            InvoiceNumber = request.InvoiceNumber,
            CompanyId = company.Id,
            OrderId = request.OrderId,
            IssueDateUtc = request.IssueDate,
            DueDateUtc = request.DueDate,
            Subtotal = request.Subtotal,
            Tax = request.Tax,
            Total = request.Total,
            AmountPaid = 0,
            BalanceDue = request.Total,
            Currency = request.Currency ?? "INR",
            Status = InvoiceStatuses.Issued,
        };

        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();
        await audit.WriteAsync("webhook.invoice.received", null, "Invoice", invoice.Id.ToString(), ip);

        return new WebhookResponse("success", $"Invoice {request.InvoiceNumber} created.", invoice.Id);
    }
}
