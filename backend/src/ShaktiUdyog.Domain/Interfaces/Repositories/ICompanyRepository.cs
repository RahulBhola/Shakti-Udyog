using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Domain.Interfaces.Repositories;

/// <summary>
/// Domain repository interface for Corporate profiles, addresses, contact persons, and verification documents.
/// </summary>
public interface ICompanyRepository : IRepository<Company>
{
    Task<Company?> GetWithFullProfileAsync(Guid companyId, CancellationToken ct = default);
    Task<IReadOnlyList<Company>> GetApprovedCompaniesAsync(CancellationToken ct = default);
    Task<IReadOnlyList<Company>> GetPendingApprovalCompaniesAsync(CancellationToken ct = default);
}
