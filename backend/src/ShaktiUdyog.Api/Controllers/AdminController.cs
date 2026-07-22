using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Api.Contracts.Updater;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Controllers;

/// <summary>
/// Admin portal API for RFQ oversight (Milestone 4 RFQ spec). All endpoints
/// require the Admin role. Admins can view all RFQs (including deleted),
/// approve/reject, override status, and view full audit history.
/// </summary>
[ApiController]
[Route("api/v1/admin")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class AdminController(IAdminService adminService, AppDbContext db, UserManager<ApplicationUser> userManager) : ControllerBase
{
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();

    private Guid UserId => Guid.Parse(
        HttpContext.User.FindFirst("sub")?.Value
        ?? HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedAccessException());

    // ---- Dashboard ---------------------------------------------------------

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var totalCustomers = await userManager.Users.CountAsync(u => u.IsActive);
        var activeCustomers = await userManager.Users.CountAsync(u => u.IsActive);
        var pendingRfqs = await db.Rfqs.CountAsync(r => r.Status == "Received");
        var approvedRfqs = await db.Rfqs.CountAsync(r => r.Status == "Approved" || r.Status == "Quoted");
        var pendingQuotations = await db.Quotations.CountAsync(q => q.Status == "Draft" || q.Status == "Pending Approval");
        var ordersInProduction = await db.Orders.CountAsync(o => o.Status == "production" || o.Status == "quality_check");
        var ordersDispatched = await db.Orders.CountAsync(o => o.Status == "dispatched");
        var pendingPayments = await db.Invoices.CountAsync(i => i.Status == "Issued" || i.Status == "Partially Paid" || i.Status == "Overdue");
        return Ok(new { totalCustomers, activeCustomers, pendingRfqs, approvedRfqs, pendingQuotations, ordersInProduction, ordersDispatched, pendingPayments, totalRevenue = 0m, outstandingBalance = 0m });
    }

    // ---- Users ---------------------------------------------------------------

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await userManager.Users.OrderByDescending(u => u.CreatedAtUtc).Select(u => new { u.Id, u.Email, u.FullName, u.PhoneNumber, u.IsActive, u.CreatedAtUtc }).ToListAsync();
        return Ok(users);
    }

    [HttpPatch("users/{id:guid}/toggle-active")]
    public async Task<IActionResult> ToggleUserActive(Guid id)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();
        user.IsActive = !user.IsActive;
        await userManager.UpdateAsync(user);
        return Ok(new { message = user.IsActive ? "User activated." : "User deactivated." });
    }

    // ---- Companies -----------------------------------------------------------

    [HttpGet("companies")]
    public async Task<IActionResult> GetCompanies() => Ok(await db.Companies.OrderByDescending(c => c.CreatedAtUtc).ToListAsync());

    // ---- Pending Approvals (users needing company access) --------------------

    [HttpGet("pending-approvals")]
    public async Task<IActionResult> GetPendingApprovals()
    {
        // All active customer-role users who have no approved UserCompany link.
        var customerRoleId = await db.Roles
            .Where(r => r.Name == Roles.Customer)
            .Select(r => r.Id)
            .FirstOrDefaultAsync();

        var customerUserIds = await db.UserRoles
            .Where(ur => ur.RoleId == customerRoleId)
            .Select(ur => ur.UserId)
            .ToListAsync();

        var pending = await userManager.Users
            .Where(u => customerUserIds.Contains(u.Id))
            .Where(u => !db.UserCompanies.Any(uc => uc.UserId == u.Id && uc.IsApproved))
            .OrderByDescending(u => u.CreatedAtUtc)
            .Select(u => new { u.Id, u.FullName, u.CompanyName, u.Email, u.PhoneNumber, u.CreatedAtUtc })
            .ToListAsync();
        return Ok(pending);
    }

    [HttpPost("pending-approvals/{userId:guid}/approve")]
    public async Task<IActionResult> ApprovePendingUser(Guid userId, [FromBody] ApproveUserRequest request)
    {
        try
        {
            var user = await userManager.FindByIdAsync(userId.ToString());
            if (user is null) return NotFound(new MessageResponse("User not found."));

            var companyName = request.CompanyName?.Trim();
            if (string.IsNullOrEmpty(companyName))
                return BadRequest(new MessageResponse("Company name is required."));

            // Find or create the company.
            var company = await db.Companies
                .FirstOrDefaultAsync(c => c.Name == companyName);

            if (company is null)
            {
                company = new Company
                {
                    Name = companyName,
                    City = request.City?.Trim(),
                    State = request.State?.Trim(),
                    GstNumber = request.GstNumber?.Trim(),
                };
                db.Companies.Add(company);
                await db.SaveChangesAsync();
            }

            // Create approved UserCompany link.
            var existingLink = await db.UserCompanies
                .FirstOrDefaultAsync(uc => uc.UserId == userId && uc.CompanyId == company.Id);

            if (existingLink is not null)
            {
                existingLink.IsApproved = true;
                existingLink.ApprovedByUserId = UserId;
                existingLink.ApprovedAtUtc = DateTimeOffset.UtcNow;
            }
            else
            {
                db.UserCompanies.Add(new UserCompany
                {
                    UserId = userId,
                    CompanyId = company.Id,
                    IsApproved = true,
                    ApprovedByUserId = UserId,
                    ApprovedAtUtc = DateTimeOffset.UtcNow,
                });
            }

            await db.SaveChangesAsync();
            return Ok(new MessageResponse($"Approved. User linked to {company.Name}."));
        }
        catch (Exception ex)
        {
            var logger = HttpContext.RequestServices.GetRequiredService<ILogger<AdminController>>();
            logger.LogError(ex, "Failed to approve user {UserId}", userId);
            return StatusCode(500, new MessageResponse($"Approval failed: {ex.Message}"));
        }
    }

    // ---- Audit Logs ----------------------------------------------------------

    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 200);
        var query = db.AuditLogs.OrderByDescending(a => a.OccurredAtUtc);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { items, page, pageSize, totalCount = total });
    }

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

    // ---- Charts ---------------------------------------------------------------

    [HttpGet("charts")]
    public async Task<IActionResult> GetCharts()
    {
        var ordersByStatus = await db.Orders.GroupBy(o => o.Status).Select(g => new { name = g.Key, value = g.Count() }).ToListAsync();
        var invoicesByStatus = await db.Invoices.GroupBy(i => i.Status).Select(g => new { name = g.Key, value = g.Count() }).ToListAsync();
        var now = DateTimeOffset.UtcNow;
        var monthlyRfqs = await db.Rfqs.Where(r => r.CreatedAtUtc >= now.AddMonths(-12)).GroupBy(r => new { r.CreatedAtUtc.Year, r.CreatedAtUtc.Month }).Select(g => new { year = g.Key.Year, month = g.Key.Month, count = g.Count() }).OrderBy(x => x.year).ThenBy(x => x.month).ToListAsync();
        return Ok(new { ordersByStatus, invoicesByStatus, monthlyRfqs });
    }
}

public record OverrideStatusRequest(string NewStatus, string? Note);

public record ApproveUserRequest(string CompanyName, string? City = null, string? State = null, string? GstNumber = null);
