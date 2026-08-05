using ShaktiUdyog.Api.Contracts.Customer;

namespace ShaktiUdyog.Api.Contracts.Engineer;

// ---- Enquirys -------------------------------------------------------------------

public record EngineerEnquiryListItemDto(
    Guid Id, string ProductType, string? CompanyName, string Quantity,
    string Status, bool IsDraft, Guid? AssignedToUserId, int FileCount,
    DateTimeOffset CreatedAtUtc, string Priority,
    Guid? FirstFileId, string? FirstFileContentType);

public record EngineerEnquiryDetailDto(
    Guid Id, Guid CompanyId, string FullName, string CompanyName, string Email, string Phone,
    string ProductType, string? MaterialGrade, string Quantity,
    string? DeliveryLocation, string RequirementDetails, string Status, bool IsDraft,
    string? SubmittedByIp, DateTimeOffset CreatedAtUtc,
    IReadOnlyList<EngineerEnquiryFileDto> Files,
    IReadOnlyList<EnquiryTimelineEntryDto> StatusHistory,
    IReadOnlyList<EnquiryCommentDto> Comments,
    Guid? AssignedToUserId, string Priority,
    string? PartName, string? PartNumber, string? Industry, string? Application,
    string? MaterialStandard, decimal? ApproxWeight,
    string? MachiningRequired, string? PatternAvailability,
    string? PrototypeQuantity, string? ProductionQuantity, string? AnnualRequirement,
    DateTimeOffset? ExpectedDeliveryDate, string? PreferredDeliveryTerms,
    string? AdditionalRequirements, string? Remarks,
    bool HasDraftQuotation, Guid? DraftQuotationId);

public record EngineerEnquiryFileDto(
    Guid Id, string FileName, string ContentType, long SizeBytes,
    string StorageKey, Guid? UploadedByUserId, DateTimeOffset UploadedAtUtc);

public record EnquiryCommentDto(
    Guid Id, Guid AuthorUserId, string AuthorRole, bool IsCustomerVisible,
    string Message, DateTimeOffset CreatedAtUtc);
