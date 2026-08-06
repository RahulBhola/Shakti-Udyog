using Microsoft.AspNetCore.Identity;

namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Application role built on ASP.NET Core Identity. Seeded with the values in
/// <see cref="Constants.Roles"/>.
/// </summary>
public class ApplicationRole : IdentityRole<Guid>
{
    public ApplicationRole()
    {
    }

    public ApplicationRole(string roleName) : base(roleName)
    {
    }

    public string? Description { get; set; }
}
