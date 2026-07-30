namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Contact person for a customer company. A company can have multiple contacts,
/// one of which can be marked as primary.
/// </summary>
public class ContactPerson
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public required string FullName { get; set; }
    public required string Designation { get; set; }
    public string? Department { get; set; }
    public required string Email { get; set; }
    public required string Phone { get; set; }
    public bool IsPrimary { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}