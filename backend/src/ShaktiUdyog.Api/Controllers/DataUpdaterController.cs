using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Api.Contracts.Updater;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Api.Validation;
using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Api.Controllers;

/// <summary>
/// Data Updater portal API for RFQ management (Milestone 4 RFQ spec). All
/// endpoints require the DataUpdater role (or Admin). Access is not scoped
/// to a specific company — staff see all RFQs.
/// </summary>
[ApiController]
[Route("api/v1/updater")]
[Authorize(Policy = AuthPolicies.DataUpdaterOnly)]
public class DataUpdaterController(
    IDataUpdaterService updaterService) : ControllerBase
{
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();

    private Guid UserId => Guid.Parse(
        HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedAccessException());

    private string UserRole =>
        HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "DataUpdater";

    // ---- Dashboard ----------------------------------------------------------

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard() => Ok(await updaterService.GetDashboardAsync());

    // ---- RFQ list -----------------------------------------------------------

    [HttpGet("rfqs")]
    [ProducesResponseType<PagedResult<UpdaterRfqListItemDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRfqs(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null, [FromQuery] string? status = null)
    {
        return Ok(await updaterService.GetRfqsAsync(page, pageSize, search, status));
    }

    // ---- RFQ detail ---------------------------------------------------------

    [HttpGet("rfqs/{id:guid}")]
    [ProducesResponseType<UpdaterRfqDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRfq(Guid id)
    {
        var rfq = await updaterService.GetRfqAsync(id);
        return rfq is null ? NotFound() : Ok(rfq);
    }

    // ---- Status change ------------------------------------------------------

    [HttpPatch("rfqs/{id:guid}/status")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateRfqStatus(Guid id, RfqStatusChangeRequest request)
    {
        var result = await updaterService.UpdateRfqStatusAsync(id, request, UserId, ClientIp);
        return result switch
        {
            null => NotFound(),
            false => Conflict(new MessageResponse("This status transition is not allowed.")),
            true => Ok(new MessageResponse("Status updated.")),
        };
    }

    // ---- Comments -----------------------------------------------------------

    [HttpPost("rfqs/{id:guid}/comments")]
    [ProducesResponseType<RfqCommentDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddComment(Guid id, RfqCommentRequest request)
    {
        var comment = await updaterService.AddRfqCommentAsync(id, request, UserId, UserRole, ClientIp);
        return comment is null ? NotFound() : StatusCode(StatusCodes.Status201Created, comment);
    }

    // ---- Assignment ---------------------------------------------------------

    [HttpPatch("rfqs/{id:guid}/assign")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignRfq(Guid id, RfqAssignmentRequest request)
    {
        var result = await updaterService.AssignRfqAsync(id, request, UserId, ClientIp);
        return result switch
        {
            null => NotFound(),
            true => Ok(new MessageResponse("RFQ assigned.")),
            _ => BadRequest(new MessageResponse("Assignment failed.")),
        };
    }
}
