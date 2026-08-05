using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Api.Controllers;

[ApiController]
[Route("api/v1/engineer")]
[Authorize(Policy = AuthPolicies.EngineerOnly)]
public class OrderEngineerController(IOrderEngineerService service) : ControllerBase
{
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();
    private Guid UserId => Guid.Parse(
        HttpContext.User.FindFirst("sub")?.Value
        ?? HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedAccessException());
    private string UserRole => HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "Engineer";
    private bool IsAdmin => UserRole == Roles.Admin;

    /// <summary>Converts denied engineer access into a 403 Forbidden response.</summary>
    private IActionResult Forbid(OrderAccessException _) => StatusCode(StatusCodes.Status403Forbidden, new MessageResponse("This order is not assigned to you."));

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, [FromQuery] string? status = null, [FromQuery] Guid? companyId = null, [FromQuery] bool? assigned = null)
        => Ok(await service.GetOrdersAsync(page, pageSize, search, status, companyId, assigned, UserId, IsAdmin));

    [HttpGet("orders/{id:guid}")]
    public async Task<IActionResult> GetOrder(Guid id)
    {
        try
        {
            var o = await service.GetOrderAsync(id, UserId, IsAdmin);
            return o is null ? NotFound() : Ok(o);
        }
        catch (OrderAccessException ex) { return Forbid(ex); }
    }

    [HttpPatch("orders/{id:guid}/milestones")]
    public async Task<IActionResult> UpdateMilestone(Guid id, MilestoneRequest request)
    {
        try
        {
            var result = await service.UpdateMilestoneAsync(id, request, UserId, IsAdmin, ClientIp);
            return result switch { null => NotFound(), false => Conflict(new MessageResponse("Invalid status transition.")), _ => Ok(new MessageResponse("Milestone updated.")) };
        }
        catch (OrderAccessException ex) { return Forbid(ex); }
    }

    [HttpPost("orders/{id:guid}/shipment")]
    public async Task<IActionResult> CreateShipment(Guid id, CreateShipmentRequest request)
    {
        try
        {
            var result = await service.CreateShipmentAsync(id, request, UserId, IsAdmin, ClientIp);
            return result is null ? NotFound() : Ok(new MessageResponse("Shipment created."));
        }
        catch (OrderAccessException ex) { return Forbid(ex); }
    }

    [HttpPatch("orders/{id:guid}/shipments/{shipmentId:guid}")]
    public async Task<IActionResult> UpdateShipment(Guid id, Guid shipmentId, CreateShipmentRequest request)
    {
        try
        {
            var result = await service.UpdateShipmentAsync(id, shipmentId, request, UserId, IsAdmin, ClientIp);
            return result switch { null => NotFound(), _ => Ok(new MessageResponse("Shipment updated.")) };
        }
        catch (OrderAccessException ex) { return Forbid(ex); }
    }

    [HttpDelete("orders/{id:guid}/shipments/{shipmentId:guid}")]
    public async Task<IActionResult> DeleteShipment(Guid id, Guid shipmentId)
    {
        try
        {
            var result = await service.DeleteShipmentAsync(id, shipmentId, UserId, IsAdmin, ClientIp);
            return result switch { null => NotFound(), _ => Ok(new MessageResponse("Shipment deleted.")) };
        }
        catch (OrderAccessException ex) { return Forbid(ex); }
    }

    [HttpPost("orders/{id:guid}/documents")]
    public async Task<IActionResult> UploadDocument(Guid id, IFormFile file, [FromForm] string category)
    {
        try
        {
            await service.UploadDocumentAsync(id, file, category, UserId, IsAdmin, ClientIp);
            return Ok(new MessageResponse("Document uploaded."));
        }
        catch (OrderAccessException ex) { return Forbid(ex); }
    }

    [HttpGet("orders/{id:guid}/comments")]
    public async Task<IActionResult> GetComments(Guid id)
    {
        var comments = await service.GetCommentsAsync(id);
        return Ok(comments);
    }

    [HttpPost("orders/{id:guid}/comments")]
    public async Task<IActionResult> AddComment(Guid id, OrderCommentRequest request)
    {
        try
        {
            var result = await service.AddCommentAsync(id, request, UserId, UserRole, IsAdmin, ClientIp);
            return result is null ? NotFound() : Ok(new MessageResponse("Comment added."));
        }
        catch (OrderAccessException ex) { return Forbid(ex); }
    }
}
