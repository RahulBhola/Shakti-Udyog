using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShaktiUdyog.Api.Contracts.Auth;
using ShaktiUdyog.Api.Services;
using ShaktiUdyog.Domain.Constants;

namespace ShaktiUdyog.Api.Controllers;

[ApiController]
[Route("api/v1/admin")]
[Authorize(Policy = AuthPolicies.AdminOnly)]
public class AdminContentController(IAdminContentService service) : ControllerBase
{
    private string? ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString();
    private Guid UserId => Guid.Parse(HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);

    // ---- Products ----------------------------------------------------------
    [HttpGet("products")] public async Task<IActionResult> GetProducts() => Ok(await service.GetAllProductsAsync());
    [HttpGet("products/{id:guid}")] public async Task<IActionResult> GetProduct(Guid id) { var p = await service.GetProductAsync(id); return p is null ? NotFound() : Ok(p); }
    [HttpPost("products")] public async Task<IActionResult> CreateProduct(CreateProductRequest request) { var p = await service.CreateProductAsync(request, UserId, ClientIp); return CreatedAtAction(nameof(GetProduct), new { id = p.Id }, p); }
    [HttpPut("products/{id:guid}")] public async Task<IActionResult> UpdateProduct(Guid id, UpdateProductRequest request) => Ok(await service.UpdateProductAsync(id, request, UserId, ClientIp) ? new { message = "Product updated." } : NotFound());
    [HttpDelete("products/{id:guid}")] public async Task<IActionResult> DeleteProduct(Guid id) => Ok(await service.DeleteProductAsync(id) ? new { message = "Product deleted." } : NotFound());

    // ---- Categories --------------------------------------------------------
    [HttpGet("categories")] public async Task<IActionResult> GetCategories() => Ok(await service.GetAllCategoriesAsync());
    [HttpPost("categories")] public async Task<IActionResult> CreateCategory(CreateCategoryRequest request) { var c = await service.CreateCategoryAsync(request.Name, request.Slug, request.Description, request.ParentId); return CreatedAtAction(nameof(GetCategories), null, c); }
    [HttpPut("categories/{id:guid}")] public async Task<IActionResult> UpdateCategory(Guid id, UpdateCategoryRequest request) => Ok(await service.UpdateCategoryAsync(id, request.Name, request.Description, request.DisplayOrder, request.IsVisible) ? new { message = "Category updated." } : NotFound());

    // ---- Industries --------------------------------------------------------
    [HttpGet("industries")] public async Task<IActionResult> GetIndustries() => Ok(await service.GetAllIndustriesAsync());
    [HttpPost("industries")] public async Task<IActionResult> CreateIndustry(CreateIndustryRequest request) { var i = await service.CreateIndustryAsync(request.Name, request.Description, request.ExampleComponents); return CreatedAtAction(nameof(GetIndustries), null, i); }
    [HttpPut("industries/{id:guid}")] public async Task<IActionResult> UpdateIndustry(Guid id, UpdateIndustryRequest request) => Ok(await service.UpdateIndustryAsync(id, request.Name, request.Description, request.IsActive) ? new { message = "Industry updated." } : NotFound());

    // ---- Resources ---------------------------------------------------------
    [HttpGet("resources")] public async Task<IActionResult> GetResources() => Ok(await service.GetAllResourcesAsync());
    [HttpPost("resources")] public async Task<IActionResult> CreateResource(CreateResourceRequest request) { var r = await service.CreateResourceAsync(request.Title, request.Slug, request.Summary, request.Body, request.Category); return CreatedAtAction(nameof(GetResources), null, r); }
    [HttpPut("resources/{id:guid}")] public async Task<IActionResult> UpdateResource(Guid id, UpdateResourceRequest request) => Ok(await service.UpdateResourceAsync(id, request.Title, request.Summary, request.Body, request.IsPublished) ? new { message = "Resource updated." } : NotFound());

    // ---- FAQs ----------------------------------------------------------------
    [HttpGet("faqs")] public async Task<IActionResult> GetFaqs() => Ok(await service.GetAllFaqsAsync());
    [HttpPost("faqs")] public async Task<IActionResult> CreateFaq(CreateFaqRequest request) { var f = await service.CreateFaqAsync(request.Question, request.Answer, request.Category); return CreatedAtAction(nameof(GetFaqs), null, f); }
    [HttpPut("faqs/{id:guid}")] public async Task<IActionResult> UpdateFaq(Guid id, UpdateFaqRequest request) => Ok(await service.UpdateFaqAsync(id, request.Question, request.Answer, request.IsPublished) ? new { message = "FAQ updated." } : NotFound());

    // ---- Gallery -------------------------------------------------------------
    [HttpGet("gallery")] public async Task<IActionResult> GetGallery() => Ok(await service.GetAllGalleryItemsAsync());
    [HttpDelete("gallery/{id:guid}")] public async Task<IActionResult> DeleteGalleryItem(Guid id) => Ok(await service.DeleteGalleryItemAsync(id) ? new { message = "Item deleted." } : NotFound());
}

public record CreateCategoryRequest(string Name, string? Slug, string? Description, Guid? ParentId);
public record UpdateCategoryRequest(string Name, string? Description, int DisplayOrder, bool IsVisible);
public record CreateIndustryRequest(string Name, string? Description, string? ExampleComponents);
public record UpdateIndustryRequest(string Name, string? Description, bool IsActive);
public record CreateResourceRequest(string Title, string Slug, string Summary, string? Body, string? Category);
public record UpdateResourceRequest(string Title, string Summary, string? Body, bool IsPublished);
public record CreateFaqRequest(string Question, string Answer, string? Category);
public record UpdateFaqRequest(string Question, string Answer, bool IsPublished);
