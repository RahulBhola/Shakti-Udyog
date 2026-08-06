using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Api.Validation;
using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Api.Controllers;

/// <summary>
/// Engineer Manufacturing Board API. Engineers see and move only orders assigned
/// to them; admins see every assigned order. Stage movement is forward-only.
/// </summary>
[ApiController]
[Route("api/v1/engineer")]
[Authorize(Policy = AuthPolicies.EngineerOnly)]
public class EngineerManufacturingController(IEngineerManufacturingService service) : ControllerBase
{
    private Guid UserId => Guid.Parse(
        HttpContext.User.FindFirst("sub")?.Value
        ?? HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedAccessException());

    private bool IsAdmin => User.IsInRole(Roles.Admin);

    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();

    /// <summary>Orders on the board — for an engineer, only their assigned orders.</summary>
    [HttpGet("orders")]
    [ProducesResponseType<IReadOnlyList<EngineerOrderDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBoardOrders() =>
        Ok(await service.GetBoardOrdersAsync(UserId, IsAdmin));

    /// <summary>
    /// Advance an assigned order to the next manufacturing stage. Mirrors drag-&amp;-drop
    /// on the Kanban: only forward, one column at a time.
    /// </summary>
    [HttpPatch("orders/{id:guid}/stage")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> MoveStage(Guid id, [FromBody] EngineerStageRequest request)
    {
        var result = await service.MoveStageAsync(id, UserId, IsAdmin, request.Stage, ClientIp);
        return result switch
        {
            null => NotFound(),
            false => Conflict(new MessageResponse("Order can only move forward one stage at a time.")),
            true => Ok(new MessageResponse("Stage updated.")),
        };
    }
}