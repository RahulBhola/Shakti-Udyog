using Microsoft.AspNetCore.Http;

namespace ShaktiUdyog.Api.Contracts.ProductMaster;

// ── List Item ──────────────────────────────────────────────────────────

public record ProductMasterListItemDto(
    Guid Id,
    string ProductCode,
    string ProductName,
    string? CategoryName,
    string? CastingType,
    string? Material,
    string? MaterialGrade,
    decimal? Weight,
    string Status,
    int AttachmentCount,
    int UsedInCount,
    Guid? FirstAttachmentId,
    string? FirstAttachmentContentType,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc);

// ── Detail ─────────────────────────────────────────────────────────────

public record ProductMasterDetailDto(
    Guid Id,
    string ProductCode,
    string ProductName,
    string? Description,
    Guid? CategoryId,
    string? CategoryName,
    string? CastingType,
    string? Unit,
    string? Material,
    string? MaterialGrade,
    decimal? Weight,
    string? Tolerance,
    string? Density,
    string? Hardness,
    string? HeatTreatment,
    string? SurfaceFinish,
    decimal? Length,
    decimal? Width,
    decimal? Height,
    decimal? Diameter,
    string? DrawingNumber,
    string? Revision,
    string? PatternNumber,
    bool CoreRequired,
    bool MachineRequired,
    bool InspectionRequired,
    bool MachiningRequired,
    int? CycleTimeMinutes,
    decimal? StandardCost,
    decimal? SellingPrice,
    decimal? GstPercent,
    string? HsnCode,
    string? Currency,
    string Status,
    bool IsArchived,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc,
    Guid? CreatedByUserId,
    Guid? UpdatedByUserId,
    IReadOnlyList<ProductMasterAttachmentDto> Attachments,
    ProductMasterUsageDto Usage);

// ── Attachment ─────────────────────────────────────────────────────────

public record ProductMasterAttachmentDto(
    Guid Id,
    string FileName,
    string ContentType,
    long SizeBytes,
    string? Description,
    Guid? UploadedByUserId,
    DateTimeOffset UploadedAtUtc);

// ── Stats (KPI cards) ─────────────────────────────────────────────────

public record ProductMasterStatsDto(
    int TotalProducts,
    int ActiveProducts,
    int DraftProducts,
    int CategoryCount,
    int LowUsageProducts);

// ── Usage (related records) ───────────────────────────────────────────

public record ProductMasterUsageDto(
    int RfqCount,
    int QuotationCount,
    int OrderCount);

// ── Create Request ─────────────────────────────────────────────────────

public record CreateProductMasterRequest(
    string ProductCode,
    string ProductName,
    string? Description,
    Guid? CategoryId,
    string? CastingType,
    string? Unit,
    string? Material,
    string? MaterialGrade,
    decimal? Weight,
    string? Tolerance,
    string? Density,
    string? Hardness,
    string? HeatTreatment,
    string? SurfaceFinish,
    decimal? Length,
    decimal? Width,
    decimal? Height,
    decimal? Diameter,
    string? DrawingNumber,
    string? Revision,
    string? PatternNumber,
    bool CoreRequired,
    bool MachineRequired,
    bool InspectionRequired,
    bool MachiningRequired,
    int? CycleTimeMinutes,
    decimal? StandardCost,
    decimal? SellingPrice,
    decimal? GstPercent,
    string? HsnCode,
    string? Currency,
    string Status);

// ── Update Request ─────────────────────────────────────────────────────

public record UpdateProductMasterRequest(
    string? ProductCode,
    string? ProductName,
    string? Description,
    Guid? CategoryId,
    string? CastingType,
    string? Unit,
    string? Material,
    string? MaterialGrade,
    decimal? Weight,
    string? Tolerance,
    string? Density,
    string? Hardness,
    string? HeatTreatment,
    string? SurfaceFinish,
    decimal? Length,
    decimal? Width,
    decimal? Height,
    decimal? Diameter,
    string? DrawingNumber,
    string? Revision,
    string? PatternNumber,
    bool? CoreRequired,
    bool? MachineRequired,
    bool? InspectionRequired,
    bool? MachiningRequired,
    int? CycleTimeMinutes,
    decimal? StandardCost,
    decimal? SellingPrice,
    decimal? GstPercent,
    string? HsnCode,
    string? Currency,
    string? Status);

// ── List query params ─────────────────────────────────────────────────

public record ProductMasterQueryParams(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    Guid? CategoryId = null,
    string? Status = null,
    string? CastingType = null);