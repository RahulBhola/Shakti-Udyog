using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Api.Controllers;

[ApiController]
[Route("api/v1/updater")]
[Authorize(Policy = AuthPolicies.DataUpdaterOnly)]
public class OrderUpdaterController(IOrderUpdaterService service) : ControllerBase
{
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();
    private Guid UserId => Guid.Parse(HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);
    private string UserRole => HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "DataUpdater";

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, [FromQuery] string? status = null)
        => Ok(await service.GetOrdersAsync(page, pageSize, search, status));

    [HttpGet("orders/{id:guid}")]
    public async Task<IActionResult> GetOrder(Guid id)
    {
        var o = await service.GetOrderAsync(id);
        return o is null ? NotFound() : Ok(o);
    }

    [HttpPatch("orders/{id:guid}/milestones")]
    public async Task<IActionResult> UpdateMilestone(Guid id, MilestoneRequest request)
    {
        var result = await service.UpdateMilestoneAsync(id, request, UserId, ClientIp);
        return result switch { null => NotFound(), false => Conflict(new MessageResponse("Invalid status transition.")), _ => Ok(new MessageResponse("Milestone updated.")) };
    }

    [HttpPost("orders/{id:guid}/shipment")]
    public async Task<IActionResult> CreateShipment(Guid id, CreateShipmentRequest request)
    {
        var result = await service.CreateShipmentAsync(id, request, UserId, ClientIp);
        return result is null ? NotFound() : Ok(new MessageResponse("Shipment created."));
    }

    [HttpPost("orders/{id:guid}/documents")]
    public async Task<IActionResult> UploadDocument(Guid id, IFormFile file, [FromForm] string category)
    {
        await service.UploadDocumentAsync(id, file, category, UserId, ClientIp);
        return Ok(new MessageResponse("Document uploaded."));
    }

    [HttpPost("orders/{id:guid}/comments")]
    public async Task<IActionResult> AddComment(Guid id, OrderCommentRequest request)
    {
        var result = await service.AddCommentAsync(id, request, UserId, UserRole, ClientIp);
        return result is null ? NotFound() : Ok(new MessageResponse("Comment added."));
    }
}
