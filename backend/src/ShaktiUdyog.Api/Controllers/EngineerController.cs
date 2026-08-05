using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Api.Contracts.Engineer;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Api.Validation;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Infrastructure.Data;
using ShaktiUdyog.Infrastructure.Storage;

namespace ShaktiUdyog.Api.Controllers;

/// <summary>
/// Engineer portal API for Enquiry management (Milestone 4 Enquiry spec). All
/// endpoints require the Engineer role (or Admin). Access is not scoped
/// to a specific company — staff see all Enquirys.
/// </summary>
[ApiController]
[Route("api/v1/engineer")]
[Authorize(Policy = AuthPolicies.EngineerOnly)]
public class EngineerController(
    IEngineerService updaterService,
    AppDbContext db,
    IFileStorageService storage) : ControllerBase
{
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();

    private Guid UserId => Guid.Parse(
        HttpContext.User.FindFirst("sub")?.Value
        ?? HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedAccessException());

    private string UserRole =>
        HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "Engineer";

    // ---- Dashboard ----------------------------------------------------------

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard() => Ok(await updaterService.GetDashboardAsync());

    // ---- Enquiry list -----------------------------------------------------------

    [HttpGet("enquiries")]
    [ProducesResponseType<PagedResult<EngineerEnquiryListItemDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEnquiries(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null, [FromQuery] string? status = null, [FromQuery] Guid? companyId = null)
    {
        return Ok(await updaterService.GetEnquiriesAsync(page, pageSize, search, status, companyId));
    }

    // ---- Enquiry detail ---------------------------------------------------------

    [HttpGet("enquiries/{id:guid}")]
    [ProducesResponseType<EngineerEnquiryDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEnquiry(Guid id)
    {
        var enquiry = await updaterService.GetEnquiryAsync(id);
        return enquiry is null ? NotFound() : Ok(enquiry);
    }

    // ---- Status change ------------------------------------------------------

    [HttpPatch("enquiries/{id:guid}/status")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateEnquiryStatus(Guid id, EnquiryStatusChangeRequest request)
    {
        var result = await updaterService.UpdateEnquiryStatusAsync(id, request, UserId, ClientIp);
        return result switch
        {
            null => NotFound(),
            false => Conflict(new MessageResponse("This status transition is not allowed.")),
            true => Ok(new MessageResponse("Status updated.")),
        };
    }

    // ---- Comments -----------------------------------------------------------

    [HttpPost("enquiries/{id:guid}/comments")]
    [ProducesResponseType<EnquiryCommentDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddComment(Guid id, EnquiryCommentRequest request)
    {
        var comment = await updaterService.AddEnquiryCommentAsync(id, request, UserId, UserRole, ClientIp);
        return comment is null ? NotFound() : StatusCode(StatusCodes.Status201Created, comment);
    }

    // ---- Assignment ---------------------------------------------------------

    [HttpPatch("enquiries/{id:guid}/assign")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignEnquiry(Guid id, EnquiryAssignmentRequest request)
    {
        var result = await updaterService.AssignEnquiryAsync(id, request, UserId, ClientIp);
        return result switch
        {
            null => NotFound(),
            true => Ok(new MessageResponse("Enquiry assigned.")),
            _ => BadRequest(new MessageResponse("Assignment failed.")),
        };
    }

    // ---- File download ----------------------------------------------------

    [HttpGet("enquiries/{id:guid}/files/{fileId:guid}/download")]
    public async Task<IActionResult> DownloadEnquiryFile(Guid id, Guid fileId)
    {
        var file = await db.EnquiryFiles
            .Where(f => f.Id == fileId && f.EnquiryId == id)
            .FirstOrDefaultAsync();

        if (file is null) return NotFound();

        var stream = await storage.OpenReadAsync(file.StorageKey);
        if (stream is null) return NotFound();

        return File(stream, file.ContentType, file.FileName);
    }
}
