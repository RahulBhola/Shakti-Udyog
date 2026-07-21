using Microsoft.AspNetCore.Mvc;
using ShaktiUdyog.Api.Contracts.Integrations;
using ShaktiUdyog.Api.Services;

namespace ShaktiUdyog.Api.Controllers;

/// <summary>
/// External integrations — webhooks for receiving data from vendors,
/// partners, and external systems. No authentication required by default;
/// individual endpoints may add shared-secret validation.
/// </summary>
[ApiController]
[Route("api/v1/integrations")]
public class IntegrationsController(IInvoiceWebhookService webhookService) : ControllerBase
{
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();

    /// <summary>
    /// Receives an invoice from an external vendor/system.
    /// Validates the payload, finds or creates a company record,
    /// and creates an issued invoice linked to an optional order.
    /// </summary>
    [HttpPost("invoice-webhook")]
    [ProducesResponseType<WebhookResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ReceiveInvoice(InvoiceWebhookRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.InvoiceNumber) || string.IsNullOrWhiteSpace(request.CompanyName))
        {
            return BadRequest(new WebhookResponse("error", "InvoiceNumber and CompanyName are required.", null));
        }

        var result = await webhookService.ProcessIncomingInvoiceAsync(request, ClientIp);
        return Ok(result);
    }
}
