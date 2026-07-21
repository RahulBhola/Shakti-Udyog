using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Api.Contracts.Updater;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Api.Controllers;

/// <summary>
/// Admin portal API for RFQ oversight (Milestone 4 RFQ spec). All endpoints
/// require the Admin role. Admins can view all RFQs (including deleted),
/// approve/reject, override status, and view full audit history.
/// </summary>
[ApiController]
[Route("api/v1/admin")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class AdminController(IAdminService adminService) : ControllerBase
{
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();

    private Guid UserId => Guid.Parse(
        HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedAccessException());

    // ---- RFQ list -----------------------------------------------------------

    [HttpGet("rfqs")]
    [ProducesResponseType<PagedResult<UpdaterRfqListItemDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRfqs(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null, [FromQuery] string? status = null,
        [FromQuery] bool includeDeleted = false)
    {
        return Ok(await adminService.GetRfqsAsync(page, pageSize, search, status, includeDeleted));
    }

    // ---- RFQ detail ---------------------------------------------------------

    [HttpGet("rfqs/{id:guid}")]
    [ProducesResponseType<UpdaterRfqDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRfq(Guid id)
    {
        var rfq = await adminService.GetRfqAsync(id);
        return rfq is null ? NotFound() : Ok(rfq);
    }

    // ---- Approve / Reject ---------------------------------------------------

    [HttpPatch("rfqs/{id:guid}/approve")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ApproveRfq(Guid id)
    {
        var result = await adminService.ApproveRfqAsync(id, UserId, ClientIp);
        return result switch
        {
            null => NotFound(),
            false => Conflict(new MessageResponse("This RFQ cannot be approved in its current state.")),
            true => Ok(new MessageResponse("RFQ approved.")),
        };
    }

    [HttpPatch("rfqs/{id:guid}/reject")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RejectRfq(Guid id, [FromBody] string reason)
    {
        var result = await adminService.RejectRfqAsync(id, reason, UserId, ClientIp);
        return result switch
        {
            null => NotFound(),
            false => Conflict(new MessageResponse("This RFQ cannot be rejected in its current state.")),
            true => Ok(new MessageResponse("RFQ rejected.")),
        };
    }

    // ---- Status override ----------------------------------------------------

    [HttpPatch("rfqs/{id:guid}/override-status")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> OverrideStatus(Guid id, OverrideStatusRequest request)
    {
        var result = await adminService.OverrideStatusAsync(id, request.NewStatus, request.Note, UserId, ClientIp);
        return result switch
        {
            null => NotFound(),
            _ => Ok(new MessageResponse("Status overridden.")),
        };
    }

    // ---- History ------------------------------------------------------------

    [HttpGet("rfqs/{id:guid}/history")]
    [ProducesResponseType<IReadOnlyList<RfqTimelineEntryDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRfqHistory(Guid id)
    {
        var rfq = await adminService.GetRfqAsync(id);
        if (rfq is null) return NotFound();

        var history = await adminService.GetRfqHistoryAsync(id);
        return Ok(history);
    }
}

public record OverrideStatusRequest(string NewStatus, string? Note);
