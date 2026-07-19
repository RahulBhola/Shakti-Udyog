namespace ShaktiUdyog.Domain.Constants;

/// <summary>
/// Fine-grained permission identifiers (requirements §19 essential_policies).
/// Permissions are granted to roles via <see cref="RolePermissions"/> and
/// surfaced as "permission" claims in access tokens. Enforcement is always
/// server-side via policy-based authorization — never frontend-only.
/// </summary>
public static class Permissions
{
    public const string ClaimType = "permission";

    public const string UsersManage = "users.manage";
    public const string RolesManage = "roles.manage";
    public const string ContentEdit = "content.edit";
    public const string ContentPublish = "content.publish";
    public const string RfqReadAssigned = "rfq.read.assigned";
    public const string RfqUpdateAssigned = "rfq.update.assigned";
    public const string QuotationCreate = "quotation.create";
    public const string OrderUpdateAssigned = "order.update.assigned";
    public const string OrderPublishCustomerStatus = "order.publish.customer_status";
    public const string InvoiceManage = "invoice.manage";
    public const string PaymentVerify = "payment.verify";
    public const string AuditRead = "audit.read";

    public static readonly IReadOnlyList<string> All =
    [
        UsersManage,
        RolesManage,
        ContentEdit,
        ContentPublish,
        RfqReadAssigned,
        RfqUpdateAssigned,
        QuotationCreate,
        OrderUpdateAssigned,
        OrderPublishCustomerStatus,
        InvoiceManage,
        PaymentVerify,
        AuditRead,
    ];
}

/// <summary>
/// Default role → permission grants, per the capability matrix in requirements
/// §13. Admin holds every permission. DataUpdater holds assigned-scope
/// operational permissions; invoice/payment permissions are admin-grantable
/// per-user in a later milestone, not defaults. Customers act only on their
/// own company's records, which is enforced by data isolation rather than
/// staff permissions.
/// </summary>
public static class RolePermissions
{
    public static readonly IReadOnlyDictionary<string, IReadOnlyList<string>> Defaults =
        new Dictionary<string, IReadOnlyList<string>>
        {
            [Roles.Admin] = Permissions.All,
            [Roles.DataUpdater] =
            [
                Permissions.ContentEdit,
                Permissions.RfqReadAssigned,
                Permissions.RfqUpdateAssigned,
                Permissions.QuotationCreate,
                Permissions.OrderUpdateAssigned,
            ],
            [Roles.Customer] = [],
        };
}
