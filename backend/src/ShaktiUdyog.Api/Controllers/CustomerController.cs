using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Domain.Constants;
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
    ICustomerProfileService profileService) : ControllerBase
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

    // ---- RFQs ---------------------------------------------------------------

    [HttpGet("rfqs")]
    [ProducesResponseType<IReadOnlyList<RfqListItemDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRfqs()
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        return Ok(await customerService.GetRfqsAsync(ctx!));
    }

    [HttpGet("rfqs/{id:guid}")]
    [ProducesResponseType<RfqDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRfq(Guid id)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;
        var rfq = await customerService.GetRfqAsync(ctx!, id);
        return rfq is null ? NotFound() : Ok(rfq);
    }

    [HttpPost("rfqs")]
    [EnableRateLimiting("public")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateRfq(CreateRfqRequest request)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;

        if (!Contracts.Public.RfqRequest.AllowedProductTypes.Contains(request.ProductType))
        {
            ModelState.AddModelError(nameof(request.ProductType), "Unknown requirement type.");
            return ValidationProblem(ModelState);
        }

        var id = await customerService.CreateRfqAsync(ctx!, request, ClientIp);
        return CreatedAtAction(nameof(GetRfq), new { id }, new { id });
    }

    /// <summary>Uploads a drawing/specification to the caller's own RFQ (multipart).</summary>
    [HttpPost("rfqs/{id:guid}/files")]
    [EnableRateLimiting("public")]
    [RequestSizeLimit(11 * 1024 * 1024)]
    [ProducesResponseType<RfqFileDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadRfqFile(Guid id, IFormFile file)
    {
        var (ctx, failure) = await RequireContextAsync();
        if (failure is not null) return failure;

        try
        {
            var result = await customerService.AttachRfqFileAsync(ctx!, id, file, ClientIp);
            return result is null ? NotFound() : Ok(result);
        }
        catch (FileValidationException ex)
        {
            return BadRequest(new MessageResponse(ex.Message));
        }
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
}
