using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public record CustomerContext(Guid UserId, IReadOnlyList<Guid> CompanyIds);

/// <summary>
/// Resolves the authenticated customer's identity and linked company from
/// the database. Auto-provisions/links the company if not yet linked so customers
/// have immediate, friction-free portal access without admin approval.
/// </summary>
public interface ICustomerContextService
{
    Task<CustomerContext?> GetCurrentAsync(CancellationToken ct = default);
}

public class CustomerContextService(
    AppDbContext db,
    IHttpContextAccessor httpContextAccessor) : ICustomerContextService
{
    public async Task<CustomerContext?> GetCurrentAsync(CancellationToken ct = default)
    {
        var principal = httpContextAccessor.HttpContext?.User;
        var subject = principal?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(subject, out var userId))
        {
            return null;
        }

        var companyIds = await db.UserCompanies
            .Where(uc => uc.UserId == userId && uc.Company.IsActive)
            .Select(uc => uc.CompanyId)
            .ToListAsync(ct);

        if (companyIds.Count == 0)
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
            if (user != null)
            {
                var compName = !string.IsNullOrWhiteSpace(user.CompanyName)
                    ? user.CompanyName.Trim()
                    : (!string.IsNullOrWhiteSpace(user.FullName) ? user.FullName.Trim() : (user.Email ?? "Customer Account"));

                var comp = await db.Companies.FirstOrDefaultAsync(c => c.Name == compName, ct);
                if (comp == null)
                {
                    comp = new Company
                    {
                        Name = compName,
                        CompanyEmail = user.Email,
                        CompanyPhone = user.PhoneNumber,
                        VerificationStatus = "Approved",
                        IsActive = true,
                        CreatedAtUtc = DateTimeOffset.UtcNow,
                    };
                    db.Companies.Add(comp);
                    await db.SaveChangesAsync(ct);
                }

                var uc = await db.UserCompanies.FirstOrDefaultAsync(x => x.UserId == userId && x.CompanyId == comp.Id, ct);
                if (uc == null)
                {
                    uc = new UserCompany
                    {
                        UserId = userId,
                        CompanyId = comp.Id,
                        IsApproved = true,
                        ApprovedAtUtc = DateTimeOffset.UtcNow,
                    };
                    db.UserCompanies.Add(uc);
                }
                else
                {
                    uc.IsApproved = true;
                }
                await db.SaveChangesAsync(ct);
                companyIds = [comp.Id];
            }
        }

        return companyIds.Count == 0 ? null : new CustomerContext(userId, companyIds);
    }
}
