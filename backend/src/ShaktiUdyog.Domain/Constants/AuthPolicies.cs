namespace ShaktiUdyog.Domain.Constants;

/// <summary>
/// Named authorization policies. Registered in the API's authorization setup.
/// Fine-grained permission policies (product.publish, order.status.update, ...)
/// will be added in Milestone 2 alongside authentication.
/// </summary>
public static class AuthPolicies
{
    public const string RequireAdmin = "RequireAdmin";
    public const string RequireDataUpdater = "RequireDataUpdater";
    public const string RequireCustomer = "RequireCustomer";
}
