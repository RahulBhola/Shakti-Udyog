using ShaktiUdyog.Api.Contracts.Customer;

namespace ShaktiUdyog.Api.Contracts.Updater;

// ---- RFQs -------------------------------------------------------------------

public record UpdaterRfqListItemDto(
    Guid Id, string ProductType, string? CompanyName, string Quantity,
    string Status, bool IsDraft, Guid? AssignedToUserId, string? AssignedToName, int FileCount,
    DateTimeOffset CreatedAtUtc, string Priority,
    Guid? FirstFileId, string? FirstFileContentType);

public record UpdaterRfqDetailDto(
    Guid Id, Guid CompanyId, string FullName, string CompanyName, string Email, string Phone,
    string ProductType, string? MaterialGrade, string Quantity,
    string? DeliveryLocation, string RequirementDetails, string Status, bool IsDraft,
    string? SubmittedByIp, DateTimeOffset CreatedAtUtc,
    IReadOnlyList<UpdaterRfqFileDto> Files,
    IReadOnlyList<RfqTimelineEntryDto> StatusHistory,
    IReadOnlyList<RfqCommentDto> Comments,
    Guid? AssignedToUserId, string? AssignedToName, string Priority,
    string? PartName, string? PartNumber, string? Industry, string? Application,
    string? MaterialStandard, decimal? ApproxWeight,
    string? MachiningRequired, string? PatternAvailability,
    string? PrototypeQuantity, string? ProductionQuantity, string? AnnualRequirement,
    DateTimeOffset? ExpectedDeliveryDate, string? PreferredDeliveryTerms,
    string? AdditionalRequirements, string? Remarks,
    bool HasDraftQuotation, Guid? DraftQuotationId);

public record EngineerWorkloadDto(
    Guid Id, string FullName, string Email, int ActiveRfqCount);

/// <summary>Engineer's own employee detail (self-service profile).</summary>
public record UpdaterMeDto(
    Guid Id, string? FullName, string? Email, string? PhoneNumber,
    string Role, DateTimeOffset? LastLoginAtUtc);

public record UpdaterRfqFileDto(
    Guid Id, string FileName, string ContentType, long SizeBytes,
    string StorageKey, Guid? UploadedByUserId, DateTimeOffset UploadedAtUtc);

public record RfqCommentDto(
    Guid Id, Guid AuthorUserId, string AuthorRole, bool IsCustomerVisible,
    string Message, DateTimeOffset CreatedAtUtc);
