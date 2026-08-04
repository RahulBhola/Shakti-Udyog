using ShaktiUdyog.Api.Contracts.Public;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface IPublicSubmissionService
{
    /// <summary>Persists a contact request; returns null Id for honeypot hits (fake success).</summary>
    Task<SubmissionAccepted> SubmitContactRequestAsync(ContactRequestDto request, string? ipAddress);

    Task<SubmissionAccepted> SubmitEnquiryAsync(EnquiryRequest request, string? ipAddress);
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
    private const string ContactRequestAccepted =
        "Thank you. Your contact request has been received. Our team will contact you shortly.";
    private const string EnquiryAccepted =
        "Your quotation request has been submitted. We will review the details and contact you.";

    public async Task<SubmissionAccepted> SubmitContactRequestAsync(ContactRequestDto request, string? ipAddress)
    {
        if (!string.IsNullOrEmpty(request.Website))
        {
            logger.LogInformation("Contact request honeypot triggered; submission discarded.");
            return new SubmissionAccepted(null, ContactRequestAccepted);
        }

        var contactRequest = new ContactRequest
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

        db.ContactRequests.Add(contactRequest);
        await db.SaveChangesAsync();
        await audit.WriteAsync("public.contact_request.received", null, "ContactRequest", contactRequest.Id.ToString(), ipAddress);
        logger.LogInformation("ContactRequest {ContactRequestId} received from company {Company}.", contactRequest.Id, contactRequest.CompanyName);

        return new SubmissionAccepted(contactRequest.Id, ContactRequestAccepted);
    }

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
            ProductType = request.ProductType,
            MaterialGrade = request.MaterialGrade?.Trim(),
            Quantity = request.Quantity.Trim(),
            DeliveryLocation = request.DeliveryLocation?.Trim(),
            RequirementDetails = request.RequirementDetails.Trim(),
            ConsentGiven = request.ConsentGiven,
            SubmittedByIp = ipAddress,
        };

        db.Enquiries.Add(enquiry);
        await db.SaveChangesAsync();
        await audit.WriteAsync("public.enquiry.received", null, "Enquiry", enquiry.Id.ToString(), ipAddress);
        logger.LogInformation("Enquiry {EnquiryId} received from company {Company}.", enquiry.Id, enquiry.CompanyName);

        return new SubmissionAccepted(enquiry.Id, EnquiryAccepted);
    }
}
