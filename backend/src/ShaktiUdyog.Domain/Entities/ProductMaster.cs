namespace ShaktiUdyog.Domain.Entities;

/// <summary>ERP Product Master — the authoritative source for products used across RFQs, Quotations, Orders, Manufacturing, Inventory, and Invoices.</summary>
public class ProductMaster
{
    public Guid Id { get; set; }

    // ── Basic Information ────────────────────────────────────────────────
    public required string ProductCode { get; set; }
    public required string ProductName { get; set; }
    public string? Description { get; set; }
    public Guid? CategoryId { get; set; }
    public Category? Category { get; set; }
    public string? CastingType { get; set; }
    public string? Unit { get; set; }

    // ── Material ─────────────────────────────────────────────────────────
    public string? Material { get; set; }
    public string? MaterialGrade { get; set; }
    public decimal? Weight { get; set; }
    public string? Tolerance { get; set; }
    public string? Density { get; set; }
    public string? Hardness { get; set; }
    public string? HeatTreatment { get; set; }
    public string? SurfaceFinish { get; set; }

    // ── Dimensions ───────────────────────────────────────────────────────
    public decimal? Length { get; set; }
    public decimal? Width { get; set; }
    public decimal? Height { get; set; }
    public decimal? Diameter { get; set; }
    public string? DrawingNumber { get; set; }
    public string? Revision { get; set; }

    // ── Manufacturing ────────────────────────────────────────────────────
    public string? PatternNumber { get; set; }
    public bool CoreRequired { get; set; }
    public bool MachineRequired { get; set; }
    public bool InspectionRequired { get; set; }
    public bool MachiningRequired { get; set; }
    public int? CycleTimeMinutes { get; set; }

    // ── Pricing ──────────────────────────────────────────────────────────
    public decimal? StandardCost { get; set; }
    public decimal? SellingPrice { get; set; }
    public decimal? GstPercent { get; set; }
    public string? HsnCode { get; set; }
    public string? Currency { get; set; }

    // ── Status & Tracking ────────────────────────────────────────────────
    public string Status { get; set; } = "Draft";
    public bool IsArchived { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public ApplicationUser? CreatedByUser { get; set; }
    public Guid? UpdatedByUserId { get; set; }
    public ApplicationUser? UpdatedByUser { get; set; }
    public byte[] RowVersion { get; set; } = [];

    // ── Navigation ───────────────────────────────────────────────────────
    public List<ProductMasterAttachment> Attachments { get; set; } = [];
}

public class ProductMasterAttachment
{
    public Guid Id { get; set; }
    public Guid ProductMasterId { get; set; }
    public ProductMaster ProductMaster { get; set; } = null!;
    public required string FileName { get; set; }
    public required string ContentType { get; set; }
    public long SizeBytes { get; set; }
    public required string StorageKey { get; set; }
    public string? Description { get; set; }
    public Guid? UploadedByUserId { get; set; }
    public DateTimeOffset UploadedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}