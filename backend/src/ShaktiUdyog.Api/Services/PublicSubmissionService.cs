using ShaktiUdyog.Api.Contracts.Public;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface IPublicSubmissionService
{
    /// <summary>Persists an enquiry; returns null Id for honeypot hits (fake success).</summary>
    Task<SubmissionAccepted> SubmitEnquiryAsync(EnquiryRequest request, string? ipAddress);

    Task<SubmissionAccepted> SubmitRfqAsync(RfqRequest request, string? ipAddress);
}

/// <summary>
/// Validated public form submissions. No email sending, no file storage, no
/// workflow — those arrive in Milestone 4. Logs never include personal
/// contact details (only the record id and company name).
/// </summary>
public class PublicSubmissionService(
    AppDbContext db,
    IAuditWriter audit,
    ILogger<PublicSubmissionService> logger) : IPublicSubmissionService
{
    private const string EnquiryAccepted =
        "Thank you. Your enquiry has been received. Our team will contact you shortly.";
    private const string RfqAccepted =
        "Your quotation request has been submitted. We will review the details and contact you.";

    public async Task<SubmissionAccepted> SubmitEnquiryAsync(EnquiryRequest request, string? ipAddress)
    {
        if (!string.IsNullOrEmpty(request.Website))
        {
            logger.LogInformation("Enquiry honeypot triggered; submission discarded.");
            return new SubmissionAccepted(null, EnquiryAccepted);
        }

        var enquiry = new Enquiry
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            CompanyName = request.CompanyName.Trim(),
            Email = request.Email.Trim(),
            Phone = request.Phone.Trim(),
            City = request.City?.Trim(),
            Message = request.Message.Trim(),
            ConsentGiven = request.ConsentGiven,
            SubmittedByIp = ipAddress,
        };

        db.Enquiries.Add(enquiry);
        await db.SaveChangesAsync();
        await audit.WriteAsync("public.enquiry.received", null, "Enquiry", enquiry.Id.ToString(), ipAddress);
        logger.LogInformation("Enquiry {EnquiryId} received from company {Company}.", enquiry.Id, enquiry.CompanyName);

        return new SubmissionAccepted(enquiry.Id, EnquiryAccepted);
    }

    public async Task<SubmissionAccepted> SubmitRfqAsync(RfqRequest request, string? ipAddress)
    {
        if (!string.IsNullOrEmpty(request.Website))
        {
            logger.LogInformation("RFQ honeypot triggered; submission discarded.");
            return new SubmissionAccepted(null, RfqAccepted);
        }

        var rfq = new Rfq
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            CompanyName = request.CompanyName.Trim(),
            Email = request.Email.Trim(),
            Phone = request.Phone.Trim(),
            ProductType = request.ProductType,
            MaterialGrade = request.MaterialGrade?.Trim(),
            Quantity = request.Quantity.Trim(),
            DeliveryLocation = request.DeliveryLocation?.Trim(),
            RequirementDetails = request.RequirementDetails.Trim(),
            ConsentGiven = request.ConsentGiven,
            SubmittedByIp = ipAddress,
        };

        db.Rfqs.Add(rfq);
        await db.SaveChangesAsync();
        await audit.WriteAsync("public.rfq.received", null, "Rfq", rfq.Id.ToString(), ipAddress);
        logger.LogInformation("RFQ {RfqId} received from company {Company}.", rfq.Id, rfq.CompanyName);

        return new SubmissionAccepted(rfq.Id, RfqAccepted);
    }
}
