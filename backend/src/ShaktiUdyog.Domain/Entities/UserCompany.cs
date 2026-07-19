namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Placeholder mapping between a customer user and an approved customer
/// company. The Company entity itself arrives with the business entities in a
/// later milestone; until then CompanyId is an unconstrained identifier.
/// Customer data isolation (requirements §19) will filter every customer query
/// through approved rows of this table.
/// </summary>
public class UserCompany
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    /// <summary>Future FK to Companies; no navigation until that table exists.</summary>
    public Guid CompanyId { get; set; }

    /// <summary>Company access requires explicit admin approval (least privilege).</summary>
    public bool IsApproved { get; set; }

    public Guid? ApprovedByUserId { get; set; }
    public DateTimeOffset? ApprovedAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
