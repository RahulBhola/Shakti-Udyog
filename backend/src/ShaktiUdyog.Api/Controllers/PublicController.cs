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
    [ProducesResponseType<IReadOnlyList<ProductDto>>(StatusCodes.Status200OK)]
    public IActionResult GetProducts() => Ok(content.GetProducts());

    [HttpGet("products/{slug}")]
    [ProducesResponseType<ProductDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetProduct(string slug)
    {
        var product = content.GetProduct(slug);
        return product is null ? NotFound() : Ok(product);
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

    [HttpPost("enquiries")]
    [EnableRateLimiting("public")]
    [ProducesResponseType<SubmissionAccepted>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitEnquiry(EnquiryRequest request)
    {
        if (!request.ConsentGiven)
        {
            ModelState.AddModelError(nameof(request.ConsentGiven), "Consent is required to process the enquiry.");
            return ValidationProblem(ModelState);
        }

        return Ok(await submissions.SubmitEnquiryAsync(request, ClientIp));
    }

    [HttpPost("rfqs")]
    [EnableRateLimiting("public")]
    [ProducesResponseType<SubmissionAccepted>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitRfq(RfqRequest request)
    {
        if (!request.ConsentGiven)
        {
            ModelState.AddModelError(nameof(request.ConsentGiven), "Consent is required to process the quotation request.");
            return ValidationProblem(ModelState);
        }

        if (!RfqRequest.AllowedProductTypes.Contains(request.ProductType))
        {
            ModelState.AddModelError(nameof(request.ProductType), "Unknown requirement type.");
            return ValidationProblem(ModelState);
        }

        return Ok(await submissions.SubmitRfqAsync(request, ClientIp));
    }

    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();
}
