namespace ShaktiUdyog.Domain.Constants;

/// <summary>
/// Named authorization policies. Role policies are registered explicitly;
/// permission policies use the "permission:" prefix and are resolved
/// dynamically by the API's permission policy provider, e.g.
/// [Authorize(Policy = AuthPolicies.Permission(Permissions.InvoiceManage))].
/// </summary>
public static class AuthPolicies
{
    public const string AdminOnly = "AdminOnly";
    public const string DataUpdaterOnly = "DataUpdaterOnly";
    public const string CustomerOnly = "CustomerOnly";

    // Milestone 1 aliases, kept so existing registrations stay valid.
    public const string RequireAdmin = "RequireAdmin";
    public const string RequireDataUpdater = "RequireDataUpdater";
    public const string RequireCustomer = "RequireCustomer";

    public const string PermissionPolicyPrefix = "permission:";

    public static string Permission(string permission) => PermissionPolicyPrefix + permission;
}
