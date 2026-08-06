using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface IAdminContentService
{
    // Products
    Task<List<Product>> GetAllProductsAsync();
    Task<Product?> GetProductAsync(Guid id);
    Task<Product> CreateProductAsync(CreateProductRequest request, Guid userId, string? ip);
    Task<bool> UpdateProductAsync(Guid id, UpdateProductRequest request, Guid userId, string? ip);
    Task<bool> DeleteProductAsync(Guid id);

    // Categories
    Task<List<Category>> GetAllCategoriesAsync();
    Task<Category> CreateCategoryAsync(string name, string? slug, string? description, Guid? parentId);
    Task<bool> UpdateCategoryAsync(Guid id, string name, string? description, int displayOrder, bool isVisible);

    // Industries
    Task<List<Industry>> GetAllIndustriesAsync();
    Task<Industry> CreateIndustryAsync(string name, string? description, string? exampleComponents);
    Task<bool> UpdateIndustryAsync(Guid id, string name, string? description, bool isActive);

    // Resources
    Task<List<Resource>> GetAllResourcesAsync();
    Task<Resource> CreateResourceAsync(string title, string slug, string summary, string? body, string? category);
    Task<bool> UpdateResourceAsync(Guid id, string title, string summary, string? body, bool isPublished);

    // FAQs
    Task<List<Faq>> GetAllFaqsAsync();
    Task<Faq> CreateFaqAsync(string question, string answer, string? category);
    Task<bool> UpdateFaqAsync(Guid id, string question, string answer, bool isPublished);

    // Gallery
    Task<List<GalleryItem>> GetAllGalleryItemsAsync();
    Task<GalleryItem> CreateGalleryItemAsync(string fileName, string contentType, long sizeBytes, string storageKey, string? caption, string? altText, string? album);
    Task<bool> DeleteGalleryItemAsync(Guid id);
}

public record CreateProductRequest(string Title, string Slug, string Summary, string? Description, Guid? CategoryId, bool IsPublished);
public record UpdateProductRequest(string? Title, string? Slug, string? Summary, string? Description, Guid? CategoryId, bool? IsPublished, string? CommonGrades, string? CastingWeightRange, string? AvailableFinish);

public class AdminContentService(AppDbContext db, IAuditWriter audit) : IAdminContentService
{
    // ---- Products ----------------------------------------------------------

    public async Task<List<Product>> GetAllProductsAsync() =>
        await db.Products.OrderBy(p => p.SortOrder).ThenBy(p => p.Title).ToListAsync();

    public async Task<Product?> GetProductAsync(Guid id) =>
        await db.Products.Include(p => p.Media).Include(p => p.Category).SingleOrDefaultAsync(p => p.Id == id);

    public async Task<Product> CreateProductAsync(CreateProductRequest request, Guid userId, string? ip)
    {
        var product = new Product
        {
            Id = Guid.NewGuid(), Title = request.Title, Slug = request.Slug,
            Summary = request.Summary, Description = request.Description,
            CategoryId = request.CategoryId, IsPublished = request.IsPublished,
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.product.created", userId, "Product", product.Id.ToString(), ip);
        return product;
    }

    public async Task<bool> UpdateProductAsync(Guid id, UpdateProductRequest request, Guid userId, string? ip)
    {
        var p = await db.Products.FindAsync(id);
        if (p is null) return false;
        if (request.Title is not null) p.Title = request.Title;
        if (request.Slug is not null) p.Slug = request.Slug;
        if (request.Summary is not null) p.Summary = request.Summary;
        if (request.Description is not null) p.Description = request.Description;
        if (request.CategoryId is not null) p.CategoryId = request.CategoryId;
        if (request.IsPublished.HasValue) p.IsPublished = request.IsPublished.Value;
        if (request.CommonGrades is not null) p.CommonGrades = request.CommonGrades;
        if (request.CastingWeightRange is not null) p.CastingWeightRange = request.CastingWeightRange;
        if (request.AvailableFinish is not null) p.AvailableFinish = request.AvailableFinish;
        p.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        await audit.WriteAsync("admin.product.updated", userId, "Product", id.ToString(), ip);
        return true;
    }

    public async Task<bool> DeleteProductAsync(Guid id)
    {
        var p = await db.Products.FindAsync(id);
        if (p is null) return false;
        db.Products.Remove(p);
        await db.SaveChangesAsync();
        return true;
    }

    // ---- Categories --------------------------------------------------------

    public async Task<List<Category>> GetAllCategoriesAsync() =>
        await db.Categories.OrderBy(c => c.DisplayOrder).ThenBy(c => c.Name).ToListAsync();

    public async Task<Category> CreateCategoryAsync(string name, string? slug, string? description, Guid? parentId)
    {
        var cat = new Category { Id = Guid.NewGuid(), Name = name, Slug = slug, Description = description, ParentId = parentId };
        db.Categories.Add(cat);
        await db.SaveChangesAsync();
        return cat;
    }

    public async Task<bool> UpdateCategoryAsync(Guid id, string name, string? description, int displayOrder, bool isVisible)
    {
        var c = await db.Categories.FindAsync(id);
        if (c is null) return false;
        c.Name = name; c.Description = description; c.DisplayOrder = displayOrder; c.IsVisible = isVisible;
        await db.SaveChangesAsync();
        return true;
    }

    // ---- Industries --------------------------------------------------------

    public async Task<List<Industry>> GetAllIndustriesAsync() =>
        await db.Industries.OrderBy(i => i.DisplayOrder).ThenBy(i => i.Name).ToListAsync();

    public async Task<Industry> CreateIndustryAsync(string name, string? description, string? exampleComponents)
    {
        var ind = new Industry { Id = Guid.NewGuid(), Name = name, Description = description, ExampleComponents = exampleComponents };
        db.Industries.Add(ind);
        await db.SaveChangesAsync();
        return ind;
    }

    public async Task<bool> UpdateIndustryAsync(Guid id, string name, string? description, bool isActive)
    {
        var i = await db.Industries.FindAsync(id);
        if (i is null) return false;
        i.Name = name; i.Description = description; i.IsActive = isActive;
        await db.SaveChangesAsync();
        return true;
    }

    // ---- Resources --------------------------------------------------------

    public async Task<List<Resource>> GetAllResourcesAsync() =>
        await db.Resources.OrderByDescending(r => r.CreatedAtUtc).ToListAsync();

    public async Task<Resource> CreateResourceAsync(string title, string slug, string summary, string? body, string? category)
    {
        var r = new Resource { Id = Guid.NewGuid(), Title = title, Slug = slug, Summary = summary, Body = body, Category = category };
        db.Resources.Add(r);
        await db.SaveChangesAsync();
        return r;
    }

    public async Task<bool> UpdateResourceAsync(Guid id, string title, string summary, string? body, bool isPublished)
    {
        var r = await db.Resources.FindAsync(id);
        if (r is null) return false;
        r.Title = title; r.Summary = summary; r.Body = body; r.IsPublished = isPublished; r.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }

    // ---- FAQs -------------------------------------------------------------

    public async Task<List<Faq>> GetAllFaqsAsync() =>
        await db.Faqs.OrderBy(f => f.DisplayOrder).ThenBy(f => f.Category).ToListAsync();

    public async Task<Faq> CreateFaqAsync(string question, string answer, string? category)
    {
        var f = new Faq { Id = Guid.NewGuid(), Question = question, Answer = answer, Category = category };
        db.Faqs.Add(f);
        await db.SaveChangesAsync();
        return f;
    }

    public async Task<bool> UpdateFaqAsync(Guid id, string question, string answer, bool isPublished)
    {
        var f = await db.Faqs.FindAsync(id);
        if (f is null) return false;
        f.Question = question; f.Answer = answer; f.IsPublished = isPublished;
        await db.SaveChangesAsync();
        return true;
    }

    // ---- Gallery ----------------------------------------------------------

    public async Task<List<GalleryItem>> GetAllGalleryItemsAsync() =>
        await db.GalleryItems.OrderBy(g => g.SortOrder).ThenByDescending(g => g.CreatedAtUtc).ToListAsync();

    public async Task<GalleryItem> CreateGalleryItemAsync(string fileName, string contentType, long sizeBytes, string storageKey, string? caption, string? altText, string? album)
    {
        var g = new GalleryItem { Id = Guid.NewGuid(), FileName = fileName, ContentType = contentType, SizeBytes = sizeBytes, StorageKey = storageKey, Caption = caption, AltText = altText, Album = album };
        db.GalleryItems.Add(g);
        await db.SaveChangesAsync();
        return g;
    }

    public async Task<bool> DeleteGalleryItemAsync(Guid id)
    {
        var g = await db.GalleryItems.FindAsync(id);
        if (g is null) return false;
        db.GalleryItems.Remove(g);
        await db.SaveChangesAsync();
        return true;
    }
}
