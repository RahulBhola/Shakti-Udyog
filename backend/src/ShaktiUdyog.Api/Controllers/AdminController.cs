using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Api.Contracts.Engineer;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Controllers;

/// <summary>
/// Admin portal API for Enquiry oversight (Milestone 4 Enquiry spec). All endpoints
/// require the Admin role. Admins can view all Enquirys (including deleted),
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
        var pendingEnquiries = await db.Enquiries.CountAsync(r => r.Status == "Received");
        var approvedEnquiries = await db.Enquiries.CountAsync(r => r.Status == "Approved" || r.Status == "Quoted");
        var pendingQuotations = await db.Quotations.CountAsync(q => q.Status == "Draft" || q.Status == "Pending Approval");
        var ordersInProduction = await db.Orders.CountAsync(o => o.Status == "production" || o.Status == "quality_check");
        var ordersDispatched = await db.Orders.CountAsync(o => o.Status == "dispatched");
        var pendingPayments = await db.Invoices.CountAsync(i => i.Status == "Issued" || i.Status == "Partially Paid" || i.Status == "Overdue");
        return Ok(new { totalCustomers, activeCustomers, pendingEnquiries, approvedEnquiries, pendingQuotations, ordersInProduction, ordersDispatched, pendingPayments, totalRevenue = 0m, outstandingBalance = 0m });
    }

    // ---- Users ---------------------------------------------------------------

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var userRoles = await db.UserRoles.ToListAsync();
        var roleNames = await db.Roles.Select(r => new { r.Id, r.Name }).ToListAsync();
        var roleNameById = roleNames.ToDictionary(r => r.Id, r => r.Name);
        var rolesByUser = userRoles
            .GroupBy(ur => ur.UserId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(ur => roleNameById.TryGetValue(ur.RoleId, out var n) ? n! : Roles.Customer).ToList());

        var users = await userManager.Users
            .OrderByDescending(u => u.CreatedAtUtc)
            .Select(u => new { u.Id, u.Email, u.FullName, u.PhoneNumber, u.IsActive, u.CreatedAtUtc, u.LastLoginAtUtc, u.CompanyName })
            .ToListAsync();

        var result = users.Select(u =>
        {
            var roles = rolesByUser.TryGetValue(u.Id, out var rs) ? rs : new List<string>();
            var role = roles.Contains(Roles.Admin) ? Roles.Admin
                : roles.Contains(Roles.Engineer) ? Roles.Engineer
                : roles.Count > 0 ? roles[0]
                : Roles.Customer;
            return new
            {
                u.Id, u.Email, u.FullName, u.PhoneNumber, u.IsActive,
                u.CreatedAtUtc, u.LastLoginAtUtc, u.CompanyName,
                Role = role
            };
        });
        return Ok(result);
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

    // ---- Settings -------------------------------------------------------------

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        var settings = await db.SystemSettings.AsNoTracking().ToDictionaryAsync(s => s.Key, s => s.Value);
        return Ok(settings);
    }

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] Dictionary<string, string?> updates)
    {
        if (updates == null || updates.Count == 0)
        {
            return BadRequest(new { message = "No settings provided." });
        }

        var now = DateTimeOffset.UtcNow;
        foreach (var (key, value) in updates)
        {
            if (string.IsNullOrWhiteSpace(key)) continue;

            var existing = await db.SystemSettings.FirstOrDefaultAsync(s => s.Key == key);
            if (existing is null)
            {
                db.SystemSettings.Add(new SystemSetting { Key = key, Value = value, UpdatedByUserId = UserId, UpdatedAtUtc = now });
            }
            else
            {
                existing.Value = value;
                existing.UpdatedByUserId = UserId;
                existing.UpdatedAtUtc = now;
            }
        }
        await db.SaveChangesAsync();
        return Ok(new { message = "Settings saved." });
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

    // ---- Enquiry list -----------------------------------------------------------

    [HttpGet("enquiries")]
    [ProducesResponseType<PagedResult<EngineerEnquiryListItemDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEnquiries(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null, [FromQuery] string? status = null,
        [FromQuery] bool includeDeleted = false)
    {
        return Ok(await adminService.GetEnquiriesAsync(page, pageSize, search, status, includeDeleted));
    }

    // ---- Enquiry detail ---------------------------------------------------------

    [HttpGet("enquiries/{id:guid}")]
    [ProducesResponseType<EngineerEnquiryDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEnquiry(Guid id)
    {
        var enquiry = await adminService.GetEnquiryAsync(id);
        return enquiry is null ? NotFound() : Ok(enquiry);
    }

    // ---- Approve / Reject ---------------------------------------------------

    [HttpPatch("enquiries/{id:guid}/approve")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ApproveEnquiry(Guid id)
    {
        var result = await adminService.ApproveEnquiryAsync(id, UserId, ClientIp);
        return result switch
        {
            null => NotFound(),
            false => Conflict(new MessageResponse("This Enquiry cannot be approved in its current state.")),
            true => Ok(new MessageResponse("Enquiry approved.")),
        };
    }

    [HttpPatch("enquiries/{id:guid}/reject")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RejectEnquiry(Guid id, [FromBody] string reason)
    {
        var result = await adminService.RejectEnquiryAsync(id, reason, UserId, ClientIp);
        return result switch
        {
            null => NotFound(),
            false => Conflict(new MessageResponse("This Enquiry cannot be rejected in its current state.")),
            true => Ok(new MessageResponse("Enquiry rejected.")),
        };
    }

    // ---- Status override ----------------------------------------------------

    [HttpPatch("enquiries/{id:guid}/override-status")]
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

    [HttpGet("enquiries/{id:guid}/history")]
    [ProducesResponseType<IReadOnlyList<EnquiryTimelineEntryDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEnquiryHistory(Guid id)
    {
        var enquiry = await adminService.GetEnquiryAsync(id);
        if (enquiry is null) return NotFound();

        var history = await adminService.GetEnquiryHistoryAsync(id);
        return Ok(history);
    }

    
    // ---- Orders from Quotations ---------------------------------------------

    [HttpPost("quotations/{quotationId:guid}/create-order")]
    public async Task<IActionResult> CreateOrderFromQuotation(Guid quotationId)
    {
        var result = await adminService.CreateOrderFromQuotationAsync(quotationId, UserId, ClientIp);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPatch("orders/{orderId:guid}/verify-advance")]
    public async Task<IActionResult> VerifyAdvancePayment(Guid orderId)
    {
        var result = await adminService.VerifyAdvancePaymentAsync(orderId, UserId, ClientIp);
        return result switch { null => NotFound(), false => BadRequest(new { message = "Cannot verify in current state." }), _ => Ok(new { message = "Payment verified. Production can start." }) };
    }

    [HttpPatch("orders/{orderId:guid}/stage")]
    public async Task<IActionResult> UpdateOrderStage(Guid orderId, [FromBody] UpdateStageRequest request)
    {
        var result = await adminService.UpdateOrderStageAsync(orderId, request.StatusCode, request.Note, UserId, ClientIp);
        return result switch { null => NotFound(), false => BadRequest(new { message = "Invalid stage transition." }), _ => Ok(new { message = "Stage updated." }) };
    }

    [HttpPatch("orders/{orderId:guid}/assign")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AssignOrder(Guid orderId, [FromBody] AssignOrderRequest request)
    {
        var result = await adminService.AssignOrderAsync(orderId, request.AssignedToUserId, UserId, ClientIp);
        return result switch
        {
            null => NotFound(),
            false => BadRequest(new MessageResponse("Assignment failed. Ensure the user exists and is not a Customer.")),
            _ => Ok(new MessageResponse(request.AssignedToUserId.HasValue ? "Order assigned." : "Order unassigned.")),
        };
    }

// ---- Charts ---------------------------------------------------------------

    [HttpGet("charts")]
    public async Task<IActionResult> GetCharts()
    {
        var ordersByStatus = await db.Orders.GroupBy(o => o.Status).Select(g => new { name = g.Key, value = g.Count() }).ToListAsync();
        var invoicesByStatus = await db.Invoices.GroupBy(i => i.Status).Select(g => new { name = g.Key, value = g.Count() }).ToListAsync();
        var now = DateTimeOffset.UtcNow;
        var monthlyEnquiries = await db.Enquiries.Where(r => r.CreatedAtUtc >= now.AddMonths(-12)).GroupBy(r => new { r.CreatedAtUtc.Year, r.CreatedAtUtc.Month }).Select(g => new { year = g.Key.Year, month = g.Key.Month, count = g.Count() }).OrderBy(x => x.year).ThenBy(x => x.month).ToListAsync();

        // Last 12 calendar months (incl. current), zero-filled so the trend has a continuous line.
        var start = new DateTimeOffset(new DateTime(now.Year, now.Month, 1), now.Offset);
        var months = Enumerable.Range(0, 12).Select(i => start.AddMonths(i - 11)).ToList();
        var revenueByMonth = await db.Invoices
            .Where(i => i.Status != InvoiceStatuses.Draft && i.IssueDateUtc >= start.AddMonths(-11))
            .GroupBy(i => new { i.IssueDateUtc.Year, i.IssueDateUtc.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, revenue = g.Sum(x => x.Total) })
            .ToListAsync();
        var monthlyRevenue = months.Select(m => new
        {
            year = m.Year,
            month = m.Month,
            revenue = revenueByMonth.FirstOrDefault(r => r.Year == m.Year && r.Month == m.Month)?.revenue ?? 0,
        }).ToList();

        return Ok(new { ordersByStatus, invoicesByStatus, monthlyEnquiries, monthlyRevenue });
    }
}

public record UpdateStageRequest(string StatusCode, string? Note);

public record OverrideStatusRequest(string NewStatus, string? Note);

public record ApproveUserRequest(string CompanyName, string? City = null, string? State = null, string? GstNumber = null);

public record AssignOrderRequest(Guid? AssignedToUserId);
