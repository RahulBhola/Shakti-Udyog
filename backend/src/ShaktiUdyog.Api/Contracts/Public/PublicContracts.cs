using System.ComponentModel.DataAnnotations;

namespace ShaktiUdyog.Api.Contracts.Public;

// ---- Catalogue (read) -------------------------------------------------------

public record ProductDto(
    string Slug,
    string Title,
    string Summary,
    IReadOnlyList<string> Description,
    IReadOnlyList<string> TypicalApplications,
    string CommonGrades,
    string CastingWeightRange,
    string AvailableFinish);

public record ResourceDto(
    string Slug,
    string Title,
    string Summary,
    IReadOnlyList<string> Body);

// ---- Submissions (write) ----------------------------------------------------

/// <summary>
/// Contact enquiry (requirements §10 contact_form). "Website" is a honeypot:
/// humans never see it; bots that fill it get a fake success and no record.
/// </summary>
public record EnquiryRequest(
    [Required, StringLength(150, MinimumLength = 2)] string FullName,
    [Required, StringLength(200, MinimumLength = 2)] string CompanyName,
    [Required, EmailAddress, StringLength(254)] string Email,
    [Required, StringLength(30, MinimumLength = 7)] string Phone,
    [StringLength(150)] string? City,
    [Required, StringLength(4000, MinimumLength = 10)] string Message,
    [Required] bool ConsentGiven,
    string? Website);

/// <summary>RFQ submission (requirements §10 rfq_form). Same honeypot rule.</summary>
public record RfqRequest(
    [Required, StringLength(150, MinimumLength = 2)] string FullName,
    [Required, StringLength(200, MinimumLength = 2)] string CompanyName,
    [Required, EmailAddress, StringLength(254)] string Email,
    [Required, StringLength(30, MinimumLength = 7)] string Phone,
    [Required, StringLength(100)] string ProductType,
    [StringLength(200)] string? MaterialGrade,
    [Required, StringLength(100)] string Quantity,
    [StringLength(300)] string? DeliveryLocation,
    [Required, StringLength(8000, MinimumLength = 10)] string RequirementDetails,
    [Required] bool ConsentGiven,
    string? Website)
{
    public static readonly IReadOnlyList<string> AllowedProductTypes =
    [
        "Grey Iron Casting", "Ductile Iron Casting", "Machined Casting",
        "Custom / OEM Casting", "Not Sure",
    ];
}

public record SubmissionAccepted(Guid? Id, string Message);
