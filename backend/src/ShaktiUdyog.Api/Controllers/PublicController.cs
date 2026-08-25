using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ShaktiUdyog.Api.Contracts.Public;
using ShaktiUdyog.Api.Services;

namespace ShaktiUdyog.Api.Controllers;

/// <summary>
/// Public, unauthenticated website API (requirements §15 public_api).
/// Thin controller: catalogue reads come from IPublicContentService, form
/// submissions go through IPublicSubmissionService (validation + honeypot).
/// </summary>
[ApiController]
[Route("api/v1/public")]
public class PublicController(
    IPublicContentService content,
    IPublicSubmissionService submissions) : ControllerBase
{
    [HttpGet("products")]
    [ProducesResponseType<IReadOnlyList<PublicProductItemDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProducts() => Ok(await content.GetPublicProductsAsync());

    [HttpGet("products/{id:guid}")]
    [ProducesResponseType<PublicProductItemDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProductById(Guid id)
    {
        var product = await content.GetPublicProductByIdAsync(id);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpGet("products/{id:guid}/image")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProductImage(Guid id)
    {
        var result = await content.GetPublicProductImageAsync(id);
        if (result is null) return NotFound();
        return File(result.Value.Stream, result.Value.ContentType, result.Value.FileName);
    }

    [HttpGet("products/{productId:guid}/attachments/{attachmentId:guid}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadProductAttachment(Guid productId, Guid attachmentId)
    {
        var result = await content.GetPublicProductAttachmentAsync(productId, attachmentId);
        if (result is null) return NotFound();
        return File(result.Value.Stream, result.Value.ContentType, result.Value.FileName);
    }

    [HttpGet("products/{slug}")]
    [ProducesResponseType<PublicProductItemDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProduct(string slug)
    {
        var product = await content.GetPublicProductBySlugOrIdAsync(slug);
        if (product is not null) return Ok(product);

        var legacy = content.GetProduct(slug);
        return legacy is null ? NotFound() : Ok(legacy);
    }

    [HttpGet("resources")]
    [ProducesResponseType<IReadOnlyList<ResourceDto>>(StatusCodes.Status200OK)]
    public IActionResult GetResources() => Ok(content.GetResources());

    [HttpGet("resources/{slug}")]
    [ProducesResponseType<ResourceDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetResource(string slug)
    {
        var resource = content.GetResource(slug);
        return resource is null ? NotFound() : Ok(resource);
    }

    [HttpPost("contact-requests")]
    [EnableRateLimiting("public")]
    [ProducesResponseType<SubmissionAccepted>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitContactRequest(ContactRequestDto request)
    {
        if (!request.ConsentGiven)
        {
            ModelState.AddModelError(nameof(request.ConsentGiven), "Consent is required to process the contact request.");
            return ValidationProblem(ModelState);
        }

        return Ok(await submissions.SubmitContactRequestAsync(request, ClientIp));
    }

    [HttpPost("enquiries")]
    [EnableRateLimiting("public")]
    [ProducesResponseType<SubmissionAccepted>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitEnquiry(EnquiryRequest request)
    {
        if (!request.ConsentGiven)
        {
            ModelState.AddModelError(nameof(request.ConsentGiven), "Consent is required to process the quotation request.");
            return ValidationProblem(ModelState);
        }

        if (!EnquiryRequest.AllowedProductTypes.Contains(request.ProductType))
        {
            ModelState.AddModelError(nameof(request.ProductType), "Unknown requirement type.");
            return ValidationProblem(ModelState);
        }

        return Ok(await submissions.SubmitEnquiryAsync(request, ClientIp));
    }

    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();
}
