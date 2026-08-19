using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Domain.Interfaces.Repositories;

/// <summary>Repository contract for internal product engineering masters, drawings, and pattern specs.</summary>
public interface IProductMasterRepository : IRepository<ProductMaster>
{
    Task<ProductMaster?> GetByProductCodeAsync(string productCode, CancellationToken ct = default);
    Task<ProductMaster?> GetByDrawingNumberAsync(string drawingNumber, CancellationToken ct = default);
    Task<ProductMaster?> GetByPatternNumberAsync(string patternNumber, CancellationToken ct = default);
    Task<ProductMaster?> GetWithAttachmentsAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<ProductMaster>> SearchAsync(string? query, string? materialGrade, CancellationToken ct = default);
}
