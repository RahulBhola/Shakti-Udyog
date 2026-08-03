using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Controllers;

[ApiController]
[Route("api/v1")]
public class InvoiceManagementController(
    IInvoiceManagementService service,
    IInvoiceAdminService adminService,
    IDocumentService documentService,
    AppDbContext db,
    IAuditWriter audit) : ControllerBase
{
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();
    private Guid UserId => Guid.Parse(
        HttpContext.User.FindFirst("sub")?.Value
        ?? HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedAccessException());

    // ---- Data Updater Invoices --------------------------------------------

    [HttpGet("updater/invoices")]
    [Authorize(Policy = AuthPolicies.EngineerOnly)]
    public async Task<IActionResult> GetUpdaterInvoices([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = null, [FromQuery] string? search = null) => Ok(await service.GetInvoicesAsync(page, pageSize, status, search));

    [HttpPost("updater/invoices")]
    [Authorize(Policy = AuthPolicies.EngineerOnly)]
    public async Task<IActionResult> CreateUpdaterInvoice(CreateInvoiceRequest request)
    {
        var inv = await service.CreateInvoiceAsync(request, UserId, ClientIp);
        return CreatedAtAction(nameof(GetUpdaterInvoices), null, inv);
    }

    [HttpPut("updater/invoices/{id:guid}")]
    [Authorize(Policy = AuthPolicies.EngineerOnly)]
    public async Task<IActionResult> UpdateUpdaterInvoice(Guid id, CreateInvoiceRequest request)
    {
        return (await service.GetInvoiceAsync(id)) is null ? NotFound() : Ok(new { message = "Invoice updated." });
    }

    [HttpPost("updater/payments")]
    [Authorize(Policy = AuthPolicies.EngineerOnly)]
    public async Task<IActionResult> RecordPayment(Guid invoiceId, RecordPaymentRequest request)
    {
        return await service.RecordPaymentAsync(invoiceId, request, UserId, ClientIp)
            ? Ok(new { message = "Payment recorded." }) : NotFound();
    }

    // ---- Admin Invoices ---------------------------------------------------

    [HttpPatch("admin/invoices/{id:guid}/approve")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> ApproveInvoice(Guid id) => Ok(await service.ApproveInvoiceAsync(id, UserId, ClientIp) ? new { message = "Approved." } : NotFound());

    [HttpPatch("admin/invoices/{id:guid}/cancel")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> CancelInvoice(Guid id, [FromBody] string reason) => Ok(await service.CancelInvoiceAsync(id, reason, UserId, ClientIp) ? new { message = "Cancelled." } : NotFound());

    [HttpDelete("admin/invoices/{id:guid}")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> DeleteInvoice(Guid id) => Ok(await service.DeleteInvoiceAsync(id, UserId, ClientIp) ? new { message = "Deleted." } : NotFound());

    [HttpPatch("admin/payments/{paymentId:guid}/verify")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> VerifyPayment(Guid paymentId) => Ok(await service.VerifyPaymentAsync(paymentId, UserId, ClientIp) ? new { message = "Verified." } : NotFound());

    [HttpPatch("admin/payments/{paymentId:guid}/reject")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> RejectPayment(Guid paymentId, [FromBody] string reason) => Ok(await service.RejectPaymentAsync(paymentId, reason, UserId, ClientIp) ? new { message = "Rejected." } : NotFound());

    [HttpPost("admin/credit-notes")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> CreateCreditNote(Guid invoiceId, decimal total, string reason)
    {
        var cn = await service.CreateCreditNoteAsync(invoiceId, total, reason, UserId, ClientIp);
        return CreatedAtAction(nameof(CreateCreditNote), null, cn);
    }

    [HttpPost("admin/debit-notes")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> CreateDebitNote(Guid invoiceId, decimal total, string reason)
    {
        var dn = await service.CreateDebitNoteAsync(invoiceId, total, reason, UserId, ClientIp);
        return CreatedAtAction(nameof(CreateDebitNote), null, dn);
    }

    [HttpGet("admin/financial-dashboard")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> GetFinancialDashboard() => Ok(await service.GetFinancialDashboardAsync());

    [HttpGet("admin/invoices")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> GetAdminInvoices([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = null, [FromQuery] string? search = null) => Ok(await service.GetInvoicesAsync(page, pageSize, status, search));

    [HttpGet("admin/invoices/{id:guid}")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> GetAdminInvoice(Guid id)
    {
        var inv = await service.GetInvoiceAsync(id);
        return inv is null ? NotFound() : Ok(inv);
    }

    [HttpGet("admin/invoices/{id:guid}/download")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> DownloadInvoice(Guid id)
    {
        var inv = await adminService.GetInvoiceAsync(id);
        if (inv?.DocumentId is null)
            return NotFound(new { message = "No PDF is available for this invoice yet." });

        var doc = await documentService.GetAsync(inv.DocumentId.Value);
        if (doc is null) return NotFound();

        var file = await documentService.DownloadAsync(doc.Id);
        return file is null ? NotFound() : File(file.Value.Content, file.Value.ContentType, file.Value.FileName);
    }

    // ── Order Invoice Upload (via Upload Center) ──────────────────────────

    [HttpPost("admin/orders/{orderId:guid}/invoices")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> UploadOrderInvoice(
        Guid orderId,
        [FromForm] string invoiceNumber,
        [FromForm] decimal total,
        [FromForm] decimal subtotal,
        [FromForm] decimal tax,
        [FromForm] DateTimeOffset issueDate,
        [FromForm] DateTimeOffset? dueDate,
        [FromForm] string? notes,
        [FromForm] string? paymentTerms,
        IFormFile file)
    {
        var order = await db.Orders.Include(o => o.Quotation).SingleOrDefaultAsync(o => o.Id == orderId);
        if (order is null) return NotFound(new { message = "Order not found." });

        // Only PDF files allowed for invoices
        var extension = Path.GetExtension(file.FileName);
        if (!".pdf".Equals(extension, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Only PDF files are allowed for invoices." });

        // 1. Upload document linked to order, customer-visible
        var doc = await documentService.UploadAsync(
            companyId: order.CompanyId,
            title: $"Invoice {invoiceNumber} - {order.OrderNumber}",
            category: "Invoice",
            file: file,
            folderId: null,
            isCustomerVisible: true,
            userId: UserId,
            ip: ClientIp,
            orderId: orderId);

        // 2. Create invoice record
        var request = new CreateInvoiceRequest(
            OrderId: orderId,
            CompanyId: order.CompanyId,
            Subtotal: subtotal,
            Tax: tax,
            Discount: 0,
            Freight: 0,
            Packing: 0,
            OtherCharges: 0,
            Total: total,
            IssueDate: issueDate,
            DueDate: dueDate,
            Currency: "INR",
            PaymentTerms: paymentTerms,
            Notes: notes);

        var inv = await adminService.CreateInvoiceAsync(request, UserId, ClientIp);

        // 3. Link document to invoice
        var invoiceEntity = await db.Invoices.FindAsync(inv.Id);
        if (invoiceEntity is not null)
        {
            invoiceEntity.DocumentId = doc.Id;
            await db.SaveChangesAsync();
        }

        await audit.WriteAsync("admin.order.invoice_uploaded", UserId, "Invoice", inv.Id.ToString(), ClientIp);
        return Ok(new { invoiceId = inv.Id, documentId = doc.Id, invoiceNumber = inv.InvoiceNumber, message = "Invoice uploaded and sent to customer." });
    }

    [HttpGet("admin/orders/{orderId:guid}/invoices")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> GetOrderInvoices(Guid orderId)
    {
        var exists = await db.Orders.AnyAsync(o => o.Id == orderId);
        if (!exists) return NotFound();

        var invoices = await db.Invoices
            .Where(i => i.OrderId == orderId)
            .OrderByDescending(i => i.IssueDateUtc)
            .Select(i => new
            {
                i.Id, i.InvoiceNumber, i.IssueDateUtc, i.DueDateUtc,
                i.Total, i.AmountPaid, i.BalanceDue, i.Currency, i.Status,
                DocumentId = i.DocumentId,
                HasPdf = i.DocumentId != null
            })
            .ToListAsync();
        return Ok(invoices);
    }

    // ── Pending Payments ──────────────────────────────────────────────────

    [HttpGet("admin/payments/pending")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> GetPendingPayments()
    {
        var payments = await db.Payments
            .Where(p => p.Status == PaymentStatuses.PendingVerification)
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(p => new
            {
                p.Id, p.PaymentReference, p.Method, p.Amount,
                p.PaymentDateUtc, p.Status, p.CreatedAtUtc,
                InvoiceId = p.InvoiceId,
                InvoiceNumber = p.Invoice!.InvoiceNumber,
                CompanyName = p.Company!.Name
            })
            .ToListAsync();
        return Ok(payments);
    }
}
