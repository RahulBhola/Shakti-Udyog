using Microsoft.AspNetCore.Identity;

namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Application user built on ASP.NET Core Identity.
/// Company membership (customer isolation) is added in a later milestone via
/// a UserCompany mapping table; do not attach company data directly here.
/// </summary>
public class ApplicationUser : IdentityUser<Guid>
{
    public string? FullName { get; set; }
    public string? CompanyName { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastLoginAtUtc { get; set; }
}
