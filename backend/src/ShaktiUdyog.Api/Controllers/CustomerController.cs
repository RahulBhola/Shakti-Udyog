using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Exceptions;
using ShaktiUdyog.Infrastructure.Data;
using ShaktiUdyog.Infrastructure.Storage;

namespace ShaktiUdyog.Api.Controllers;

/// <summary>
/// Customer portal API (requirements §15 customer_api). Every action requires
/// the Customer role AND an approved company link resolved server-side; all
/// data is filtered by that company relationship. Record IDs supplied by the
/// browser are never trusted without the company check — cross-company IDs
/// return 404, indistinguishable from nonexistent records.
/// </summary>
[ApiController]
[Route("api/v1/customer")]
[Authorize(Policy = AuthPolicies.CustomerOnly)]
public class CustomerController(
    ICustomerContextService contextService,
    ICustomerService customerService,
    ICustomerProfileService profileService,
    ICustomerCompanyService companyService,
    ICustomerContactService contactService,
    ICustomerAddressService addressService,
    ICustomerDocumentService documentService,
    ICustomerSecurityService securityService,
    AppDbContext db,
    IFileStorageService storage) : ControllerBase
{
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();

    /// <summary>Resolves the caller's approved-company context or fails with 403.</summary>
    private async Task<(CustomerContext? Ctx, IActionResult? Failure)> RequireContextAsync()
    {
        var ctx = await contextService.GetCurrentAsync();
        if (ctx is null)
        {
            // Authenticated but no approved company yet (least-privilege default).
            return (null, StatusCode(StatusCodes.Status403Forbidden, new MessageResponse(
                "Your account has no approved company access yet. Please contact Shakti Udyog.")));
        }

        return (ctx, null);
    }

    // ---- Dashboard ----------------------------------------------------------

    [HttpGet("dashboard")]
    [ProducesResponseType<DashboardDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard()
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return Ok(await customerService.GetDashboardAsync(ctx!));
    }

    // ---- Enquirys ---------------------------------------------------------------

    [HttpGet("enquiries")]
    [ProducesResponseType<IReadOnlyList<EnquiryListItemDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEnquiries()
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return Ok(await customerService.GetEnquiriesAsync(ctx!));
    }

    [HttpGet("enquiries/{id:guid}")]
    [ProducesResponseType<EnquiryDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEnquiry(Guid id)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var enquiry = await customerService.GetEnquiryAsync(ctx!, id);
        return enquiry is null ? NotFound() : Ok(enquiry);
    }

    [HttpPost("enquiries")]
    [EnableRateLimiting("public")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateEnquiry(CreateEnquiryRequest request)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;

        if (!Contracts.Public.EnquiryRequest.AllowedProductTypes.Contains(request.ProductType))
        {
            ModelState.AddModelError(nameof(request.ProductType), "Unknown requirement type.");
            return ValidationProblem(ModelState);
        }

        var id = await customerService.CreateEnquiryAsync(ctx!, request, ClientIp);
        return CreatedAtAction(nameof(GetEnquiry), new { id }, new { id });
    }

    /// <summary>Update a draft Enquiry. Only draft Enquirys can be edited.</summary>
    [HttpPatch("enquiries/{id:guid}")]
    public async Task<IActionResult> UpdateEnquiry(Guid id, UpdateEnquiryRequest request)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var result = await customerService.UpdateDraftEnquiryAsync(ctx!, id, request, ClientIp);
        return result switch
        {
            null => NotFound(),
            false => Conflict(new MessageResponse("Only drafts can be edited.")),
            true => Ok(new MessageResponse("Enquiry updated.")),
        };
    }

    [HttpPost("enquiries/{id:guid}/submit")]
    public async Task<IActionResult> SubmitEnquiry(Guid id)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var result = await customerService.SubmitDraftEnquiryAsync(ctx!, id, ClientIp);
        return result switch
        {
            null => NotFound(),
            false => Conflict(new MessageResponse("Only drafts can be submitted.")),
            true => Ok(new MessageResponse("Enquiry submitted for review.")),
        };
    }

    /// <summary>Uploads a drawing/specification to the caller's own Enquiry (multipart).</summary>
    [HttpPost("enquiries/{id:guid}/files")]
    [EnableRateLimiting("public")]
    [RequestSizeLimit(11 * 1024 * 1024)]
    [ProducesResponseType<EnquiryFileDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadEnquiryFile(Guid id, IFormFile file)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;

        try
        {
            var result = await customerService.AttachEnquiryFileAsync(ctx!, id, file, ClientIp);
            return result is null ? NotFound() : Ok(result);
        }
        catch (FileValidationException ex)
        {
            return BadRequest(new MessageResponse(ex.Message));
        }
    }

    [HttpGet("enquiries/{id:guid}/files/{fileId:guid}")]
    public async Task<IActionResult> DownloadEnquiryFile(Guid id, Guid fileId)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var f = await db.EnquiryFiles.Where(x => x.Id == fileId && x.EnquiryId == id).FirstOrDefaultAsync();
        if (f is null) return NotFound();
        var stream = await storage.OpenReadAsync(f.StorageKey);
        if (stream is null) return NotFound();
        return File(stream, f.ContentType, f.FileName);
    }

    [HttpDelete("enquiries/{id:guid}/files/{fileId:guid}")]
    public async Task<IActionResult> DeleteEnquiryFile(Guid id, Guid fileId)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var f = await db.EnquiryFiles.Where(x => x.Id == fileId && x.EnquiryId == id).FirstOrDefaultAsync();
        if (f is null) return NotFound();
        db.EnquiryFiles.Remove(f);
        await db.SaveChangesAsync();
        return Ok(new MessageResponse("File deleted."));
    }

    // ---- Quotations ---------------------------------------------------------

    [HttpGet("quotations")]
    [ProducesResponseType<IReadOnlyList<QuotationListItemDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetQuotations()
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return Ok(await customerService.GetQuotationsAsync(ctx!));
    }

    [HttpGet("quotations/{id:guid}")]
    [ProducesResponseType<QuotationDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQuotation(Guid id)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var quotation = await customerService.GetQuotationAsync(ctx!, id);
        return quotation is null ? NotFound() : Ok(quotation);
    }

    /// <summary>Accept or decline a quotation with an optional recorded comment. Prices are immutable.</summary>
    [HttpPost("quotations/{id:guid}/response")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RespondToQuotation(Guid id, QuotationResponseRequest request)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;

        var result = await customerService.RespondToQuotationAsync(ctx!, id, request, ClientIp);
        return result switch
        {
            null => NotFound(),
            false => Conflict(new MessageResponse("This quotation can no longer be responded to (already answered or expired).")),
            true => Ok(new MessageResponse($"Quotation {request.Response}ed. Our team will follow up with you.")),
        };
    }

    // ---- Orders -------------------------------------------------------------

    [HttpGet("orders")]
    [ProducesResponseType<IReadOnlyList<OrderListItemDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrders()
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return Ok(await customerService.GetOrdersAsync(ctx!));
    }

    [HttpGet("orders/{id:guid}")]
    [ProducesResponseType<OrderDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrder(Guid id)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var order = await customerService.GetOrderAsync(ctx!, id);
        return order is null ? NotFound() : Ok(order);
    }

    /// <summary>Customer-visible tracking timeline; internal notes are never included.</summary>
    [HttpGet("orders/{id:guid}/timeline")]
    [ProducesResponseType<IReadOnlyList<TimelineEntryDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrderTimeline(Guid id)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var timeline = await customerService.GetOrderTimelineAsync(ctx!, id);
        return timeline is null ? NotFound() : Ok(timeline);
    }

    /// <summary>Customer-visible order conversation; internal staff notes excluded.</summary>
    [HttpGet("orders/{id:guid}/comments")]
    [ProducesResponseType<IReadOnlyList<OrderCommentResponseDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrderComments(Guid id)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var comments = await customerService.GetOrderCommentsAsync(ctx!, id);
        return comments is null ? NotFound() : Ok(comments);
    }

    [HttpPost("orders/{id:guid}/comments")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddOrderComment(Guid id, CustomerCommentRequest request)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var result = await customerService.AddOrderCommentAsync(ctx!, id, request.Message, ClientIp);
        return result is null ? NotFound() : Ok(new MessageResponse("Comment added."));
    }

    [HttpPost("orders/{id:guid}/pay-advance")]
    public async Task<IActionResult> PayAdvance(Guid id, [FromBody] AdvancePaymentRequest request)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var result = await customerService.SubmitAdvancePaymentAsync(ctx!, id, request, ClientIp);
        return result switch { null => NotFound(), false => BadRequest(new { message = "Cannot accept payment in current state." }), _ => Ok(new { message = "Payment proof submitted for verification." }) };
    }

    [HttpPost("orders/{id:guid}/support-requests")]
    [EnableRateLimiting("public")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateSupportRequest(Guid id, SupportRequestRequest request)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var supportId = await customerService.CreateSupportRequestAsync(ctx!, id, request, ClientIp);
        return supportId is null ? NotFound() : StatusCode(StatusCodes.Status201Created, new { id = supportId });
    }

    // ---- Invoices -----------------------------------------------------------

    [HttpGet("invoices")]
    [ProducesResponseType<IReadOnlyList<InvoiceListItemDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInvoices()
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return Ok(await customerService.GetInvoicesAsync(ctx!));
    }

    [HttpGet("invoices/{id:guid}")]
    [ProducesResponseType<InvoiceDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInvoice(Guid id)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var invoice = await customerService.GetInvoiceAsync(ctx!, id);
        return invoice is null ? NotFound() : Ok(invoice);
    }

    /// <summary>Downloads the invoice PDF through the protected-document pipeline.</summary>
    [HttpGet("invoices/{id:guid}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadInvoice(Guid id)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;

        var invoice = await customerService.GetInvoiceAsync(ctx!, id);
        if (invoice?.DocumentId is null)
        {
            return NotFound(new MessageResponse("No PDF is available for this invoice yet."));
        }

        var file = await customerService.OpenDocumentAsync(ctx!, invoice.DocumentId.Value, ClientIp);
        return file is null
            ? NotFound()
            : File(file.Value.Content, file.Value.ContentType, file.Value.FileName);
    }

    // ---- Payments -----------------------------------------------------------

    [HttpGet("payments")]
    [ProducesResponseType<IReadOnlyList<PaymentDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPayments()
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return Ok(await customerService.GetPaymentsAsync(ctx!));
    }

    [HttpGet("outstanding")]
    [ProducesResponseType<IReadOnlyList<PaymentDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOutstanding()
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return Ok(await customerService.GetOutstandingAsync(ctx!));
    }

    /// <summary>Submits offline payment proof (bank/NEFT/UPI reference + optional file).</summary>
    [HttpPost("payments/proof")]
    [EnableRateLimiting("public")]
    [RequestSizeLimit(11 * 1024 * 1024)]
    [ProducesResponseType<PaymentDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SubmitPaymentProof([FromForm] PaymentProofRequest request, IFormFile? proofFile)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;

        try
        {
            var payment = await customerService.SubmitPaymentProofAsync(ctx!, request, proofFile, ClientIp);
            return payment is null ? NotFound() : Ok(payment);
        }
        catch (FileValidationException ex)
        {
            return BadRequest(new MessageResponse(ex.Message));
        }
    }

    // ---- Documents ----------------------------------------------------------

    [HttpGet("documents")]
    [ProducesResponseType<IReadOnlyList<DocumentListItemDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDocuments([FromQuery] string? search, [FromQuery] string? category)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return Ok(await customerService.GetDocumentsAsync(ctx!, search, category));
    }

    /// <summary>Streams an approved document after server-side authorization. No direct paths.</summary>
    [HttpGet("documents/{id:guid}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadDocument(Guid id)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;

        var file = await customerService.OpenDocumentAsync(ctx!, id, ClientIp);
        return file is null
            ? NotFound()
            : File(file.Value.Content, file.Value.ContentType, file.Value.FileName);
    }

    /// <summary>Streams a document inline for browser previewing (PDF, images, etc.).</summary>
    [HttpGet("documents/{id:guid}/preview")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PreviewDocument(Guid id)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;

        var file = await customerService.OpenDocumentAsync(ctx!, id, ClientIp);
        if (file is null) return NotFound();

        Response.Headers.Append("Content-Disposition", $"inline; filename=\"{file.Value.FileName}\"");
        return File(file.Value.Content, file.Value.ContentType);
    }

    /// <summary>Allows customer to upload a technical drawing, PO, or reference file to their document vault.</summary>
    [HttpPost("documents/upload")]
    [RequestSizeLimit(25 * 1024 * 1024)]
    [ProducesResponseType<DocumentListItemDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadDocument(
        [FromForm] string title,
        [FromForm] string category,
        [FromForm] Guid? orderId,
        IFormFile file)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;

        if (file is null || file.Length == 0)
        {
            return BadRequest(new MessageResponse("Please select a valid file to upload."));
        }

        var result = await customerService.UploadDocumentAsync(ctx!, title, category, orderId, file, ClientIp);
        return result is null ? BadRequest(new MessageResponse("Upload failed.")) : Ok(result);
    }

    /// <summary>Deletes a customer-uploaded document.</summary>
    [HttpDelete("documents/{id:guid}")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDocument(Guid id)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;

        var success = await customerService.DeleteDocumentAsync(ctx!, id, ClientIp);
        return success ? Ok(new MessageResponse("Document removed successfully.")) : NotFound(new MessageResponse("Document not found or cannot be deleted."));
    }

    // ---- Notifications ------------------------------------------------------

    [HttpGet("notifications")]
    [ProducesResponseType<PagedResult<NotificationDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] bool? unreadOnly = null)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return Ok(await customerService.GetNotificationsAsync(ctx!, page, pageSize, unreadOnly));
    }

    [HttpPost("notifications/{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkNotificationRead(Guid id)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return await customerService.MarkNotificationReadAsync(ctx!, id) ? NoContent() : NotFound();
    }

    // ---- Profile ------------------------------------------------------------

    [HttpGet("profile")]
    [ProducesResponseType<ProfileDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProfile()
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var profile = await profileService.GetProfileAsync(ctx!);
        return profile is null ? NotFound() : Ok(profile);
    }

    [HttpPatch("profile")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var updated = await profileService.UpdateProfileAsync(ctx!, request, ClientIp);
        return updated ? Ok(new MessageResponse("Profile updated.")) : NotFound();
    }

    [HttpPost("profile/change-password")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;

        var (succeeded, error) = await profileService.ChangePasswordAsync(ctx!, request, ClientIp);
        return succeeded
            ? Ok(new MessageResponse("Password changed. Other sessions have been signed out."))
            : BadRequest(new MessageResponse(error ?? "Password change failed."));
    }

    // ---- Company ---------------------------------------------------------------

    [HttpGet("company")]
    [ProducesResponseType<CompanyDetailDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCompany()
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var company = await companyService.GetCompanyAsync(ctx!);
        return company is null ? NotFound() : Ok(company);
    }

    [HttpPut("company")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateCompany(UpdateCompanyRequest request)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var updated = await companyService.UpdateCompanyAsync(ctx!, request, ClientIp);
        return updated ? Ok(new MessageResponse("Company information updated.")) : NotFound();
    }

    [HttpPost("company/submit-verification")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> SubmitVerification()
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var submitted = await companyService.SubmitVerificationAsync(ctx!, ClientIp);
        return submitted ? Ok(new MessageResponse("Verification documents submitted for review.")) : NotFound();
    }

    // ---- Contact Persons -------------------------------------------------------

    [HttpGet("contacts")]
    [ProducesResponseType<IReadOnlyList<ContactPersonDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetContacts()
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return Ok(await contactService.GetContactsAsync(ctx!));
    }

    [HttpPost("contacts")]
    [ProducesResponseType<ContactPersonDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateContact(CreateContactPersonRequest request)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var contact = await contactService.CreateContactAsync(ctx!, request, ClientIp);
        return contact is null ? NotFound() : CreatedAtAction(nameof(GetContacts), new { id = contact.Id }, contact);
    }

    [HttpPut("contacts/{id:guid}")]
    [ProducesResponseType<ContactPersonDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateContact(Guid id, UpdateContactPersonRequest request)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var contact = await contactService.UpdateContactAsync(ctx!, id, request, ClientIp);
        return contact is null ? NotFound() : Ok(contact);
    }

    [HttpDelete("contacts/{id:guid}")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteContact(Guid id)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return await contactService.DeleteContactAsync(ctx!, id, ClientIp)
            ? Ok(new MessageResponse("Contact deleted."))
            : NotFound();
    }

    // ---- Addresses -------------------------------------------------------------

    [HttpGet("addresses")]
    [ProducesResponseType<IReadOnlyList<CompanyAddressDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAddresses()
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return Ok(await addressService.GetAddressesAsync(ctx!));
    }

    [HttpPost("addresses")]
    [ProducesResponseType<CompanyAddressDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAddress(CreateCompanyAddressRequest request)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var address = await addressService.CreateAddressAsync(ctx!, request, ClientIp);
        return address is null ? NotFound() : CreatedAtAction(nameof(GetAddresses), new { id = address.Id }, address);
    }

    [HttpPut("addresses/{id:guid}")]
    [ProducesResponseType<CompanyAddressDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAddress(Guid id, UpdateCompanyAddressRequest request)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var address = await addressService.UpdateAddressAsync(ctx!, id, request, ClientIp);
        return address is null ? NotFound() : Ok(address);
    }

    [HttpDelete("addresses/{id:guid}")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAddress(Guid id)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return await addressService.DeleteAddressAsync(ctx!, id, ClientIp)
            ? Ok(new MessageResponse("Address deleted."))
            : NotFound();
    }

    // ---- Company Documents -----------------------------------------------------

    [HttpGet("documents/company")]
    [ProducesResponseType<IReadOnlyList<CompanyDocumentDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCompanyDocuments()
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return Ok(await documentService.GetDocumentsAsync(ctx!));
    }

    [HttpPost("documents/company/upload")]
    [RequestSizeLimit(11 * 1024 * 1024)]
    [ProducesResponseType<UploadDocumentResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadCompanyDocument([FromForm] string documentType, IFormFile file)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        try
        {
            var result = await documentService.UploadDocumentAsync(ctx!, documentType, file, ClientIp);
            return result is null ? NotFound() : Ok(result);
        }
        catch (FileValidationException ex)
        {
            return BadRequest(new MessageResponse(ex.Message));
        }
    }

    [HttpGet("documents/company/{id:guid}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadCompanyDocument(Guid id)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var file = await documentService.DownloadDocumentAsync(ctx!, id, ClientIp);
        return file is null ? NotFound() : file;
    }

    [HttpDelete("documents/company/{id:guid}")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCompanyDocument(Guid id)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return await documentService.DeleteDocumentAsync(ctx!, id, ClientIp)
            ? Ok(new MessageResponse("Document deleted."))
            : NotFound();
    }

    // ---- Security --------------------------------------------------------------

    [HttpGet("security")]
    [ProducesResponseType<SecurityInfoDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSecurityInfo()
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return Ok(await securityService.GetSecurityInfoAsync(ctx!));
    }

    [HttpPost("security/change-password")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SecurityChangePassword(ChangePasswordRequest request)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var result = await securityService.ChangePasswordAsync(ctx!, request, ClientIp);
        return result
            ? Ok(new MessageResponse("Password changed. Other sessions have been signed out."))
            : BadRequest(new MessageResponse("Password change failed. Check current password."));
    }

    [HttpPost("security/enable-mfa")]
    [ProducesResponseType<MfaSetupResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> EnableMfa()
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return Ok(await securityService.SetupMfaAsync(ctx!, ClientIp));
    }

    [HttpPost("security/disable-mfa")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> DisableMfa()
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var disabled = await securityService.DisableMfaAsync(ctx!, ClientIp);
        return disabled ? Ok(new MessageResponse("MFA disabled.")) : NotFound();
    }
}

