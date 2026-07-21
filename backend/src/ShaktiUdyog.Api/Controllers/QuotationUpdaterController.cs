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
public class QuotationUpdaterController(IQuotationUpdaterService service) : ControllerBase
{
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();
    private Guid UserId => Guid.Parse(HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);

    [HttpGet("quotations")]
    public async Task<IActionResult> GetQuotations([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, [FromQuery] string? status = null)
        => Ok(await service.GetQuotationsAsync(page, pageSize, search, status));

    [HttpGet("quotations/{id:guid}")]
    public async Task<IActionResult> GetQuotation(Guid id)
    {
        var q = await service.GetQuotationAsync(id);
        return q is null ? NotFound() : Ok(q);
    }

    [HttpPost("quotations")]
    public async Task<IActionResult> CreateQuotation(CreateQuotationRequest request)
    {
        var id = await service.CreateQuotationAsync(request, UserId, ClientIp);
        return CreatedAtAction(nameof(GetQuotation), new { id }, new { id });
    }

    [HttpPut("quotations/{id:guid}")]
    public async Task<IActionResult> UpdateQuotation(Guid id, UpdateQuotationRequest request)
    {
        var result = await service.UpdateQuotationAsync(id, request, UserId, ClientIp);
        return result switch { null => NotFound(), false => BadRequest(new MessageResponse("Cannot edit a non-draft quotation.")), _ => Ok(new MessageResponse("Quotation updated.")) };
    }

    [HttpPost("quotations/{id:guid}/submit")]
    public async Task<IActionResult> SubmitQuotation(Guid id)
    {
        var result = await service.SubmitQuotationAsync(id, UserId, ClientIp);
        return result switch { null => NotFound(), false => Conflict(new MessageResponse("Only drafts can be submitted.")), _ => Ok(new MessageResponse("Quotation submitted for approval.")) };
    }

    [HttpPost("quotations/{id:guid}/attachments")]
    public async Task<IActionResult> UploadAttachment(Guid id, [FromForm] string? description, IFormFile file)
    {
        var result = await service.AttachFileAsync(id, file, description, UserId, ClientIp);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("quotations/{id:guid}/comments")]
    public async Task<IActionResult> AddComment(Guid id, AddCommentRequest request)
    {
        var role = HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "DataUpdater";
        var result = await service.AddCommentAsync(id, request, UserId, role, ClientIp);
        return result is null ? NotFound() : StatusCode(201, result);
    }
}
