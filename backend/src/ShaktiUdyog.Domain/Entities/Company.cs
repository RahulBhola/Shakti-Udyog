namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Customer company (requirements §14). Customer users access records only
/// through an approved UserCompany link to a company.
/// </summary>
public class Company
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? LegalBusinessName { get; set; }
    public string? BusinessType { get; set; }
    public string? Industry { get; set; }
    public string? Website { get; set; }
    public string? CompanyEmail { get; set; }
    public string? CompanyPhone { get; set; }
    public string? PurchaseEmail { get; set; }
    public string? AccountsEmail { get; set; }
    public string? AddressLine1 { get; set; }
    public string? FactoryAddress { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? PinCode { get; set; }
    public string? Country { get; set; }
    public string? GstNumber { get; set; }
    public string? PANNumber { get; set; }
    public string? CINNumber { get; set; }
    public string? MSMENumber { get; set; }
    public string? PreferredCurrency { get; set; }
    public string? PreferredPaymentMethod { get; set; }
    public string? PreferredCommunication { get; set; }
    public string? PreferredLanguage { get; set; }
    public string? CompanyLogoUrl { get; set; }
    public string? VerificationStatus { get; set; } = "Pending";
    public string? DeliveryAddresses { get; set; }
    public DateTimeOffset? VerificationSubmittedOn { get; set; }
    public DateTimeOffset? VerifiedOn { get; set; }
    public Guid? VerifiedByUserId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    // Navigation
    public ApplicationUser? VerifiedBy { get; set; }
    public List<ContactPerson> ContactPersons { get; set; } = [];
    public List<CompanyAddress> Addresses { get; set; } = [];
    public List<CompanyDocument> Documents { get; set; } = [];
}
