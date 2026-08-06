namespace ShaktiUdyog.Domain.Entities;

/// <summary>
/// Quality inspection records for a production job.
/// Tracks acceptance, rejection, rework, and various test results.
/// </summary>
public class ProductionQuality
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public ProductionJob Job { get; set; } = null!;
    public string InspectionStatus { get; set; } = "Pending";
    public int AcceptedQuantity { get; set; }
    public int RejectedQuantity { get; set; }
    public int ReworkQuantity { get; set; }
    public bool HardnessTest { get; set; }
    public bool ChemicalAnalysis { get; set; }
    public bool DimensionalInspection { get; set; }
    public bool VisualInspection { get; set; }
    public string? NdtResult { get; set; }
    public string? Inspector { get; set; }
    public DateTimeOffset? InspectionDateUtc { get; set; }
    public string? Remarks { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
