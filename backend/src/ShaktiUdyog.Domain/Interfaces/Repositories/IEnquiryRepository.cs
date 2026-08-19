using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Domain.Interfaces.Repositories;

/// <summary>
/// Domain repository interface for Customer Enquiries and file attachments.
/// </summary>
public interface IEnquiryRepository : IRepository<Enquiry>
{
    Task<Enquiry?> GetWithDetailsAsync(Guid enquiryId, CancellationToken ct = default);
    Task<IReadOnlyList<Enquiry>> GetByCompanyIdsAsync(IEnumerable<Guid> companyIds, CancellationToken ct = default);
    Task<IReadOnlyList<EnquiryStatusHistory>> GetStatusHistoryAsync(Guid enquiryId, CancellationToken ct = default);
}
