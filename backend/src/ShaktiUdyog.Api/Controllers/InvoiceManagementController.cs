using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Api.Controllers;

[ApiController]
[Route("api/v1")]
public class InvoiceManagementController(IInvoiceManagementService service) : ControllerBase
{
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();
    private Guid UserId => Guid.Parse(HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);

    // ---- Data Updater Invoices --------------------------------------------

    [HttpGet("updater/invoices")]
    [Authorize(Policy = AuthPolicies.DataUpdaterOnly)]
    public async Task<IActionResult> GetUpdaterInvoices([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = null) => Ok(await service.GetInvoicesAsync(page, pageSize, status));

    [HttpPost("updater/invoices")]
    [Authorize(Policy = AuthPolicies.DataUpdaterOnly)]
    public async Task<IActionResult> CreateUpdaterInvoice(CreateInvoiceRequest request)
    {
        var inv = await service.CreateInvoiceAsync(request, UserId, ClientIp);
        return CreatedAtAction(nameof(GetUpdaterInvoices), null, inv);
    }

    [HttpPut("updater/invoices/{id:guid}")]
    [Authorize(Policy = AuthPolicies.DataUpdaterOnly)]
    public async Task<IActionResult> UpdateUpdaterInvoice(Guid id, CreateInvoiceRequest request)
    {
        return (await service.GetInvoiceAsync(id)) is null ? NotFound() : Ok(new { message = "Invoice updated." });
    }

    [HttpPost("updater/payments")]
    [Authorize(Policy = AuthPolicies.DataUpdaterOnly)]
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
    public async Task<IActionResult> GetAdminInvoices([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = null) => Ok(await service.GetInvoicesAsync(page, pageSize, status));

    [HttpGet("admin/invoices/{id:guid}")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> GetAdminInvoice(Guid id)
    {
        var inv = await service.GetInvoiceAsync(id);
        return inv is null ? NotFound() : Ok(inv);
    }
}
