using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public record CustomerContext(Guid UserId, IReadOnlyList<Guid> CompanyIds);

/// <summary>
/// Resolves the authenticated user's identity and APPROVED company links from
/// the database — never from anything the browser sends (requirements §19
/// customer_isolation). Every customer-portal query must filter by
/// CompanyIds. Null when the user has no approved company yet
/// (least-privilege default for new accounts).
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
            .Where(uc => uc.UserId == userId && uc.IsApproved && uc.Company.IsActive)
            .Select(uc => uc.CompanyId)
            .ToListAsync(ct);

        return companyIds.Count == 0 ? null : new CustomerContext(userId, companyIds);
    }
}
