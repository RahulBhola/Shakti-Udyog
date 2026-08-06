using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using ShaktiUdyog.Api.Contracts.ProductMaster;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Controllers;

[ApiController]
[Route("api/v1/admin/product-master")]
[Authorize]
public class ProductMasterController(IProductMasterService service, AppDbContext db) : ControllerBase
{
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();
    private Guid UserId => Guid.Parse(HttpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);

    /// <summary>List products with pagination, search, and filters.</summary>
    [HttpGet]
    public async Task<IActionResult> GetProducts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? castingType = null)
    {
        var query = new ProductMasterQueryParams(page, pageSize, search, categoryId, status, castingType);
        return Ok(await service.GetProductsAsync(query));
    }

    /// <summary>Get full product detail.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProduct(Guid id)
    {
        var result = await service.GetProductAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Get product usage counts (RFQs, Quotations, Orders).</summary>
    [HttpGet("{id:guid}/usage")]
    public async Task<IActionResult> GetUsage(Guid id)
    {
        return Ok(await service.GetUsageAsync(id));
    }

    /// <summary>Get KPI statistics for the dashboard.</summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        return Ok(await service.GetStatsAsync());
    }

    /// <summary>Create a new product.</summary>
    [HttpPost]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductMasterRequest request)
    {
        try
        {
            var result = await service.CreateProductAsync(request, UserId, ClientIp);
            return CreatedAtAction(nameof(GetProduct), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Update an existing product (partial update).</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] UpdateProductMasterRequest request)
    {
        var result = await service.UpdateProductAsync(id, request, UserId, ClientIp);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Archive (soft-delete) a product.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> ArchiveProduct(Guid id)
    {
        return await service.ArchiveProductAsync(id, UserId, ClientIp) ? Ok(new { message = "Product archived." }) : NotFound();
    }

    /// <summary>Duplicate a product (creates a copy with "(Copy)" suffix in Draft status).</summary>
    [HttpPost("{id:guid}/duplicate")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> DuplicateProduct(Guid id)
    {
        var result = await service.DuplicateProductAsync(id, UserId, ClientIp);
        return CreatedAtAction(nameof(GetProduct), new { id = result.Id }, result);
    }

    /// <summary>Upload an attachment (drawing, image, PDF, etc.).</summary>
    [HttpPost("{id:guid}/attachments")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> UploadAttachment(Guid id, IFormFile file, [FromForm] string? description)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "File is required." });

        try
        {
            var result = await service.UploadAttachmentAsync(id, file, description, UserId, ClientIp);
            return CreatedAtAction(nameof(GetProduct), new { id }, result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Product not found." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Download an attachment.</summary>
    [HttpGet("{id:guid}/attachments/{attachmentId:guid}/download")]
    public async Task<IActionResult> DownloadAttachment(Guid id, Guid attachmentId)
    {
        var stream = await service.DownloadAttachmentAsync(id, attachmentId);
        if (stream is null) return NotFound();

        // Look up the attachment for filename
        // Look up content type for correct rendering (inline for images in <img> tags)
        var contentType = await db.ProductMasterAttachments
            .Where(a => a.Id == attachmentId && a.ProductMasterId == id)
            .Select(a => a.ContentType)
            .FirstOrDefaultAsync() ?? "application/octet-stream";

        return File(stream, contentType);
    }
}