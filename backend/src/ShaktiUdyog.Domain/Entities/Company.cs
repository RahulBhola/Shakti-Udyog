namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Customer company (requirements §14). Customer users access records only
/// through an approved UserCompany link to a company.
/// </summary>
public class Company
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? AddressLine1 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public string? GstNumber { get; set; }
    /// <summary>Delivery addresses maintained by the customer, one per line (simple model for now).</summary>
    public string? DeliveryAddresses { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
