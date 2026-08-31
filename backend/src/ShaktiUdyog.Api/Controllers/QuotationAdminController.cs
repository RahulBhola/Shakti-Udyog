using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Api.Controllers;

[ApiController]
[Route("api/v1/admin")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class QuotationAdminController(IQuotationAdminService service) : ControllerBase
{
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();
    private Guid UserId => Guid.Parse(
        HttpContext.User.FindFirst("sub")?.Value
        ?? HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedAccessException());

    [HttpGet("quotations")]
    public async Task<IActionResult> GetQuotations([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, [FromQuery] string? status = null)
        => Ok(await service.GetQuotationsAsync(page, pageSize, search, status));

    [HttpGet("quotations/{id:guid}")]
    public async Task<IActionResult> GetQuotation(Guid id)
    {
        var q = await service.GetQuotationAsync(id);
        return q is null ? NotFound() : Ok(q);
    }

    [HttpPut("quotations/{id:guid}")]
    public async Task<IActionResult> UpdateQuotation(Guid id, UpdateQuotationRequest request)
    {
        var result = await service.UpdateQuotationAsync(id, request, UserId, ClientIp);
        return result switch
        {
            null => NotFound(),
            false => BadRequest(new MessageResponse("Cannot edit quotation in its current status. Quotations can only be edited before being issued to the customer.")),
            _ => Ok(new MessageResponse("Quotation updated.")),
        };
    }

    [HttpPatch("quotations/{id:guid}/approve")]
    public async Task<IActionResult> ApproveQuotation(Guid id)
    {
        var result = await service.ApproveQuotationAsync(id, UserId, ClientIp);
        return result switch { null => NotFound(), false => Conflict(new MessageResponse("Cannot approve in current state.")), _ => Ok(new MessageResponse("Quotation approved.")) };
    }

    [HttpPatch("quotations/{id:guid}/reject")]
    public async Task<IActionResult> RejectQuotation(Guid id, [FromBody] string reason)
    {
        var result = await service.RejectQuotationAsync(id, reason, UserId, ClientIp);
        return result switch { null => NotFound(), false => Conflict(new MessageResponse("Cannot reject in current state.")), _ => Ok(new MessageResponse("Quotation rejected.")) };
    }

    [HttpPatch("quotations/{id:guid}/issue")]
    public async Task<IActionResult> IssueQuotation(Guid id)
    {
        var result = await service.IssueQuotationAsync(id, UserId, ClientIp);
        return result switch { null => NotFound(), false => Conflict(new MessageResponse("Cannot issue in current state.")), _ => Ok(new MessageResponse("Quotation issued to customer.")) };
    }

    [HttpPatch("quotations/{id:guid}/cancel")]
    public async Task<IActionResult> CancelQuotation(Guid id, CancelQuotationRequest request)
    {
        var result = await service.CancelQuotationAsync(id, request.Reason, UserId, ClientIp);
        return result switch { null => NotFound(), false => Conflict(new MessageResponse("Cannot cancel in current state.")), _ => Ok(new MessageResponse("Quotation cancelled.")) };
    }

    [HttpPatch("quotations/{id:guid}/override-status")]
    public async Task<IActionResult> OverrideStatus(Guid id, OverrideStatusRequest request)
    {
        var result = await service.OverrideStatusAsync(id, request.NewStatus, request.Note, UserId, ClientIp);
        return result switch { null => NotFound(), _ => Ok(new MessageResponse("Status overridden.")) };
    }

    [HttpDelete("quotations/{id:guid}")]
    public async Task<IActionResult> DeleteQuotation(Guid id)
    {
        var result = await service.DeleteQuotationAsync(id, UserId, ClientIp);
        return result switch
        {
            null => NotFound(new MessageResponse("Quotation not found.")),
            _ => Ok(new MessageResponse("Quotation removed successfully."))
        };
    }

    [HttpGet("quotations/{id:guid}/history")]
    public async Task<IActionResult> GetHistory(Guid id)
    {
        var q = await service.GetQuotationAsync(id);
        if (q is null) return NotFound();
        return Ok(await service.GetHistoryAsync(id));
    }
}

public record CancelQuotationRequest(string Reason);
