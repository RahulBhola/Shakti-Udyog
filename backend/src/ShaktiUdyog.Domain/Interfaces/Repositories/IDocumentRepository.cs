using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Domain.Interfaces.Repositories;

/// <summary>
/// Domain repository interface for Document Folders, Versions, and MTC/Inspection vault.
/// </summary>
public interface IDocumentRepository : IRepository<Document>
{
    Task<IReadOnlyList<Document>> GetCustomerVisibleDocumentsAsync(IEnumerable<Guid> companyIds, string? category = null, CancellationToken ct = default);
    Task<Document?> GetWithVersionsAsync(Guid documentId, CancellationToken ct = default);
}
