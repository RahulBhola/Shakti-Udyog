using Microsoft.AspNetCore.Authorization;
using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Api.Authorization;

/// <summary>Requires the authenticated user to hold a specific permission claim.</summary>
public class PermissionRequirement(string permission) : IAuthorizationRequirement
{
    public string Permission { get; } = permission;
}

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        if (context.User.HasClaim(Permissions.ClaimType, requirement.Permission))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
