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
public class AdminController(IAdminService adminService, IOrderAdminService orderAdminService, AppDbContext db, UserManager<ApplicationUser> userManager) : ControllerBase
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

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        if (id == UserId)
        {
            return BadRequest(new { message = "You cannot delete your own active administrator account." });
        }

        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound(new { message = "User not found." });

        // Check if user is an Admin, and ensure they are not the last Admin
        var roles = await userManager.GetRolesAsync(user);
        if (roles.Contains(Roles.Admin))
        {
            var allAdmins = await userManager.GetUsersInRoleAsync(Roles.Admin);
            if (allAdmins.Count <= 1)
            {
                return BadRequest(new { message = "Cannot delete the only remaining Administrator account in the system." });
            }
        }

        try
        {
            // 1. Remove refresh tokens and password reset tokens
            var tokens = await db.RefreshTokens.Where(t => t.UserId == id).ToListAsync();
            if (tokens.Count > 0) db.RefreshTokens.RemoveRange(tokens);

            var resetTokens = await db.PasswordResetTokens.Where(t => t.UserId == id).ToListAsync();
            if (resetTokens.Count > 0) db.PasswordResetTokens.RemoveRange(resetTokens);

            // 2. Remove company associations & track candidate orphan companies
            var userCompanies = await db.UserCompanies.Where(uc => uc.UserId == id).ToListAsync();
            var companyIdsToCheck = userCompanies.Select(uc => uc.CompanyId).ToList();

            if (!string.IsNullOrWhiteSpace(user.CompanyName))
            {
                var comp = await db.Companies.FirstOrDefaultAsync(c => c.Name == user.CompanyName);
                if (comp != null && !companyIdsToCheck.Contains(comp.Id))
                {
                    companyIdsToCheck.Add(comp.Id);
                }
            }

            if (userCompanies.Count > 0) db.UserCompanies.RemoveRange(userCompanies);

            // 3. Remove user board preferences
            var boardPrefs = await db.UserBoardPreferences.Where(p => p.UserId == id).ToListAsync();
            if (boardPrefs.Count > 0) db.UserBoardPreferences.RemoveRange(boardPrefs);

            // 4. Remove user roles
            var userRoles = await db.UserRoles.Where(ur => ur.UserId == id).ToListAsync();
            if (userRoles.Count > 0) db.UserRoles.RemoveRange(userRoles);

            await db.SaveChangesAsync();

            // 5. Delete the user
            var result = await userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                db.Users.Remove(user);
                await db.SaveChangesAsync();
            }

            // 6. Clean up any orphan companies that have no other registered users and no linked business documents
            foreach (var compId in companyIdsToCheck)
            {
                var hasOtherUsers = await db.UserCompanies.AnyAsync(uc => uc.CompanyId == compId);
                var hasOrders = await db.Orders.AnyAsync(o => o.CompanyId == compId);
                var hasInvoices = await db.Invoices.AnyAsync(i => i.CompanyId == compId);
                var hasEnquiries = await db.Enquiries.AnyAsync(e => e.CompanyId == compId);

                if (!hasOtherUsers && !hasOrders && !hasInvoices && !hasEnquiries)
                {
                    var comp = await db.Companies.FindAsync(compId);
                    if (comp != null)
                    {
                        var contacts = await db.ContactPersons.Where(cp => cp.CompanyId == compId).ToListAsync();
                        if (contacts.Count > 0) db.ContactPersons.RemoveRange(contacts);

                        var addrs = await db.CompanyAddresses.Where(ca => ca.CompanyId == compId).ToListAsync();
                        if (addrs.Count > 0) db.CompanyAddresses.RemoveRange(addrs);

                        var docs = await db.CompanyDocuments.Where(cd => cd.CompanyId == compId).ToListAsync();
                        if (docs.Count > 0) db.CompanyDocuments.RemoveRange(docs);

                        db.Companies.Remove(comp);
                    }
                }
            }
            await db.SaveChangesAsync();

            return Ok(new { message = $"User {user.Email} has been permanently deleted." });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = $"Failed to delete user: {ex.Message}" });
        }
    }

    // ---- Profile -------------------------------------------------------------

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var user = await userManager.FindByIdAsync(UserId.ToString());
        if (user is null) return NotFound();

        var roles = await userManager.GetRolesAsync(user);
        return Ok(new
        {
            user.Id,
            user.Email,
            user.FullName,
            user.PhoneNumber,
            user.IsActive,
            user.CreatedAtUtc,
            user.LastLoginAtUtc,
            user.CompanyName,
            Roles = roles,
        });
    }

    [HttpPatch("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateAdminProfileRequest request)
    {
        var user = await userManager.FindByIdAsync(UserId.ToString());
        if (user is null) return NotFound();

        if (request.FullName != null) user.FullName = string.IsNullOrWhiteSpace(request.FullName) ? null : request.FullName.Trim();
        if (request.PhoneNumber != null) user.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();

        var result = await userManager.UpdateAsync(user);
        return result.Succeeded
            ? Ok(new { message = "Profile updated successfully." })
            : BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
    }

    [HttpPost("profile/change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangeAdminPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new { message = "Current password and new password are required." });
        }

        var user = await userManager.FindByIdAsync(UserId.ToString());
        if (user is null) return NotFound();

        var result = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        return result.Succeeded
            ? Ok(new { message = "Password changed successfully." })
            : BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
    }

    // ---- Engineers -----------------------------------------------------------

    [HttpGet("engineers")]
    public async Task<IActionResult> GetEngineers()
    {
        var engineerRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == Roles.Engineer);
        if (engineerRole is null) return Ok(Array.Empty<object>());

        var engineerUserIds = await db.UserRoles
            .Where(ur => ur.RoleId == engineerRole.Id)
            .Select(ur => ur.UserId)
            .ToListAsync();

        var engineers = await userManager.Users
            .Where(u => engineerUserIds.Contains(u.Id))
            .OrderByDescending(u => u.CreatedAtUtc)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FullName,
                u.PhoneNumber,
                u.IsActive,
                u.CreatedAtUtc,
                u.LastLoginAtUtc,
                Role = Roles.Engineer,
            })
            .ToListAsync();

        return Ok(engineers);
    }



    // ---- Settings ------------------------------------------------------------

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

    [HttpDelete("companies/{id:guid}")]
    public async Task<IActionResult> DeleteCompany(Guid id)
    {
        var company = await db.Companies.FindAsync(id);
        if (company is null) return NotFound(new { message = "Company not found." });

        try
        {
            // Check for active orders/invoices/enquiries
            var hasOrders = await db.Orders.AnyAsync(o => o.CompanyId == id);
            var hasInvoices = await db.Invoices.AnyAsync(i => i.CompanyId == id);
            var hasEnquiries = await db.Enquiries.AnyAsync(e => e.CompanyId == id);

            if (hasOrders || hasInvoices || hasEnquiries)
            {
                company.IsActive = false;
                company.VerificationStatus = "Inactive";
                await db.SaveChangesAsync();
                return Ok(new { message = $"Company {company.Name} has linked operational records and has been deactivated." });
            }

            // Remove associated links
            var userComps = await db.UserCompanies.Where(uc => uc.CompanyId == id).ToListAsync();
            if (userComps.Count > 0) db.UserCompanies.RemoveRange(userComps);

            var contacts = await db.ContactPersons.Where(cp => cp.CompanyId == id).ToListAsync();
            if (contacts.Count > 0) db.ContactPersons.RemoveRange(contacts);

            var addrs = await db.CompanyAddresses.Where(ca => ca.CompanyId == id).ToListAsync();
            if (addrs.Count > 0) db.CompanyAddresses.RemoveRange(addrs);

            var docs = await db.CompanyDocuments.Where(cd => cd.CompanyId == id).ToListAsync();
            if (docs.Count > 0) db.CompanyDocuments.RemoveRange(docs);

            db.Companies.Remove(company);
            await db.SaveChangesAsync();

            return Ok(new { message = $"Company {company.Name} has been deleted successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = $"Failed to delete company: {ex.Message}" });
        }
    }

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

    // ---- Shipments -----------------------------------------------------------

    [HttpPost("orders/{orderId:guid}/shipments")]
    public async Task<IActionResult> CreateShipment(Guid orderId, [FromBody] CreateShipmentRequest request)
    {
        var result = await orderAdminService.CreateShipmentAsync(orderId, request, UserId, ClientIp);
        return result is null ? NotFound() : Ok(new MessageResponse("Shipment created."));
    }

    [HttpPut("orders/{orderId:guid}/shipments/{shipmentId:guid}")]
    public async Task<IActionResult> UpdateShipment(Guid orderId, Guid shipmentId, [FromBody] CreateShipmentRequest request)
    {
        var result = await orderAdminService.UpdateShipmentAsync(orderId, shipmentId, request, UserId, ClientIp);
        return result is null ? NotFound() : Ok(new MessageResponse("Shipment updated."));
    }

    [HttpDelete("orders/{orderId:guid}/shipments/{shipmentId:guid}")]
    public async Task<IActionResult> DeleteShipment(Guid orderId, Guid shipmentId)
    {
        var result = await orderAdminService.DeleteShipmentAsync(orderId, shipmentId, UserId, ClientIp);
        return result is null ? NotFound() : Ok(new MessageResponse("Shipment deleted."));
    }

// ---- Engineers --------------------------------------------------------------

    [HttpPost("engineers")]
    public async Task<IActionResult> CreateEngineer([FromBody] CreateEngineerRequest request)
    {
        var result = await adminService.CreateEngineerAsync(UserId, request, ClientIp);
        if (result is null)
        {
            return Conflict(new MessageResponse("An engineer with this name already exists."));
        }

        return Ok(result);
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

public record UpdateAdminProfileRequest(string? FullName, string? PhoneNumber);

public record ChangeAdminPasswordRequest(string CurrentPassword, string NewPassword);
