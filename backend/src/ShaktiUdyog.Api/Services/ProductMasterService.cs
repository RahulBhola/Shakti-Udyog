using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Api.Contracts.ProductMaster;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;
using ShaktiUdyog.Infrastructure.Storage;

namespace ShaktiUdyog.Api.Services;

public interface IProductMasterService
{
    Task<PagedResult<ProductMasterListItemDto>> GetProductsAsync(ProductMasterQueryParams query);
    Task<ProductMasterDetailDto?> GetProductAsync(Guid id);
    Task<ProductMasterStatsDto> GetStatsAsync();
    Task<ProductMasterUsageDto> GetUsageAsync(Guid id);
    Task<ProductMasterDetailDto> CreateProductAsync(CreateProductMasterRequest request, Guid userId, string? ip);
    Task<ProductMasterDetailDto?> UpdateProductAsync(Guid id, UpdateProductMasterRequest request, Guid userId, string? ip);
    Task<bool> ArchiveProductAsync(Guid id, Guid userId, string? ip);
    Task<ProductMasterDetailDto> DuplicateProductAsync(Guid id, Guid userId, string? ip);
    Task<ProductMasterAttachmentDto> UploadAttachmentAsync(Guid id, IFormFile file, string? description, Guid userId, string? ip);
    Task<Stream?> DownloadAttachmentAsync(Guid productId, Guid attachmentId);
}

public class ProductMasterService(
    AppDbContext db,
    IAuditWriter audit,
    IFileStorageService storage) : IProductMasterService
{
    public async Task<PagedResult<ProductMasterListItemDto>> GetProductsAsync(ProductMasterQueryParams query)
    {
        var showArchived = string.Equals(query.Status, "Archived", StringComparison.OrdinalIgnoreCase);

        var q = db.ProductMasters
            .IgnoreQueryFilters()
            .Where(p => showArchived ? p.IsArchived : !p.IsArchived)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            q = q.Where(p =>
                p.ProductName.Contains(term) ||
                p.ProductCode.Contains(term) ||
                (p.Material != null && p.Material.Contains(term)) ||
                (p.MaterialGrade != null && p.MaterialGrade.Contains(term)));
        }

        if (query.CategoryId.HasValue)
            q = q.Where(p => p.CategoryId == query.CategoryId);

        if (!string.IsNullOrWhiteSpace(query.Status))
            q = q.Where(p => p.Status == query.Status);

        if (!string.IsNullOrWhiteSpace(query.CastingType))
            q = q.Where(p => p.CastingType == query.CastingType);

        var total = await q.CountAsync();

        var items = await q
            .OrderByDescending(p => p.UpdatedAtUtc ?? p.CreatedAtUtc)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(p => new ProductMasterListItemDto(
                p.Id,
                p.ProductCode,
                p.ProductName,
                p.Category != null ? p.Category.Name : null,
                p.CastingType,
                p.Material,
                p.MaterialGrade,
                p.Weight,
                p.Status,
                p.Attachments.Count,
                0, // UsedInCount — placeholder, computed separately if needed
                p.Attachments.OrderBy(a => a.UploadedAtUtc).Select(a => (Guid?)a.Id).FirstOrDefault(),
                p.Attachments.OrderBy(a => a.UploadedAtUtc).Select(a => a.ContentType).FirstOrDefault(),
                p.CreatedAtUtc,
                p.UpdatedAtUtc))
            .ToListAsync();

        return new PagedResult<ProductMasterListItemDto>(items, query.Page, query.PageSize, total);
    }

    public async Task<ProductMasterDetailDto?> GetProductAsync(Guid id)
    {
        var p = await db.ProductMasters
            .IgnoreQueryFilters()
            .Include(pm => pm.Category)
            .Include(pm => pm.Attachments)
            .SingleOrDefaultAsync(pm => pm.Id == id);

        if (p is null) return null;

        var usage = await GetUsageAsync(id);

        return MapToDetail(p, usage);
    }

    public async Task<ProductMasterStatsDto> GetStatsAsync()
    {
        var total = await db.ProductMasters.IgnoreQueryFilters().CountAsync();
        var active = await db.ProductMasters.IgnoreQueryFilters().CountAsync(p => p.Status == "Active" && !p.IsArchived);
        var draft = await db.ProductMasters.IgnoreQueryFilters().CountAsync(p => p.Status == "Draft" && !p.IsArchived);
        var categoryCount = await db.ProductMasters.IgnoreQueryFilters()
            .Where(p => p.CategoryId != null && !p.IsArchived)
            .Select(p => p.CategoryId)
            .Distinct()
            .CountAsync();

        // Low usage: products referenced in < 2 RFQs, Quotations, or Orders combined
        // Simplified: count products with attachment count = 0 as "low usage"
        var lowUsage = await db.ProductMasters.IgnoreQueryFilters()
            .Where(p => !p.IsArchived && p.Attachments.Count == 0)
            .CountAsync();

        return new ProductMasterStatsDto(total, active, draft, categoryCount, lowUsage);
    }

    public async Task<ProductMasterUsageDto> GetUsageAsync(Guid id)
    {
        // Count how many RFQs reference this product (via ProductType matching ProductName)
        var product = await db.ProductMasters.IgnoreQueryFilters()
            .Where(p => p.Id == id)
            .Select(p => p.ProductName)
            .FirstOrDefaultAsync();

        if (product is null) return new ProductMasterUsageDto(0, 0, 0);

        var rfqCount = await db.Rfqs.IgnoreQueryFilters()
            .CountAsync(r => r.ProductType.Contains(product));
        var quotationCount = await db.Quotations.IgnoreQueryFilters()
            .CountAsync(q => q.Rfq != null && q.Rfq.ProductType.Contains(product));
        var orderCount = await db.Orders.IgnoreQueryFilters()
            .CountAsync(o => o.Quotation != null && o.Quotation.Rfq != null && o.Quotation.Rfq.ProductType.Contains(product));

        return new ProductMasterUsageDto(rfqCount, quotationCount, orderCount);
    }

    public async Task<ProductMasterDetailDto> CreateProductAsync(CreateProductMasterRequest request, Guid userId, string? ip)
    {
        // Check for duplicate ProductCode
        var code = string.IsNullOrWhiteSpace(request.ProductCode)
            ? $"PRD-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}"
            : request.ProductCode;

        var exists = await db.ProductMasters.IgnoreQueryFilters()
            .AnyAsync(p => p.ProductCode == code);
        if (exists)
            throw new InvalidOperationException($"Product code '{code}' already exists. Please use a unique code.");

        var product = new ProductMaster
        {
            Id = Guid.NewGuid(),
            ProductCode = code,
            ProductName = request.ProductName,
            Description = request.Description,
            CategoryId = request.CategoryId,
            CastingType = request.CastingType,
            Unit = request.Unit,
            Material = request.Material,
            MaterialGrade = request.MaterialGrade,
            Weight = request.Weight,
            Tolerance = request.Tolerance,
            Density = request.Density,
            Hardness = request.Hardness,
            HeatTreatment = request.HeatTreatment,
            SurfaceFinish = request.SurfaceFinish,
            Length = request.Length,
            Width = request.Width,
            Height = request.Height,
            Diameter = request.Diameter,
            DrawingNumber = request.DrawingNumber,
            Revision = request.Revision,
            PatternNumber = request.PatternNumber,
            CoreRequired = request.CoreRequired,
            MachineRequired = request.MachineRequired,
            InspectionRequired = request.InspectionRequired,
            MachiningRequired = request.MachiningRequired,
            CycleTimeMinutes = request.CycleTimeMinutes,
            StandardCost = request.StandardCost,
            SellingPrice = request.SellingPrice,
            GstPercent = request.GstPercent,
            HsnCode = request.HsnCode,
            Currency = request.Currency,
            Status = string.IsNullOrWhiteSpace(request.Status) ? "Draft" : request.Status,
            CreatedByUserId = userId,
        };

        db.ProductMasters.Add(product);
        await db.SaveChangesAsync();
        await audit.WriteAsync("productmaster.created", userId, "ProductMaster", product.Id.ToString(), ip);

        return MapToDetail(product, new ProductMasterUsageDto(0, 0, 0));
    }

    public async Task<ProductMasterDetailDto?> UpdateProductAsync(Guid id, UpdateProductMasterRequest request, Guid userId, string? ip)
    {
        var p = await db.ProductMasters
            .IgnoreQueryFilters()
            .Include(pm => pm.Category)
            .Include(pm => pm.Attachments)
            .SingleOrDefaultAsync(pm => pm.Id == id);

        if (p is null) return null;

        if (request.ProductCode is not null) p.ProductCode = request.ProductCode;
        if (request.ProductName is not null) p.ProductName = request.ProductName;
        if (request.Description is not null) p.Description = request.Description;
        if (request.CategoryId is not null) p.CategoryId = request.CategoryId;
        if (request.CastingType is not null) p.CastingType = request.CastingType;
        if (request.Unit is not null) p.Unit = request.Unit;
        if (request.Material is not null) p.Material = request.Material;
        if (request.MaterialGrade is not null) p.MaterialGrade = request.MaterialGrade;
        if (request.Weight.HasValue) p.Weight = request.Weight;
        if (request.Tolerance is not null) p.Tolerance = request.Tolerance;
        if (request.Density is not null) p.Density = request.Density;
        if (request.Hardness is not null) p.Hardness = request.Hardness;
        if (request.HeatTreatment is not null) p.HeatTreatment = request.HeatTreatment;
        if (request.SurfaceFinish is not null) p.SurfaceFinish = request.SurfaceFinish;
        if (request.Length.HasValue) p.Length = request.Length;
        if (request.Width.HasValue) p.Width = request.Width;
        if (request.Height.HasValue) p.Height = request.Height;
        if (request.Diameter.HasValue) p.Diameter = request.Diameter;
        if (request.DrawingNumber is not null) p.DrawingNumber = request.DrawingNumber;
        if (request.Revision is not null) p.Revision = request.Revision;
        if (request.PatternNumber is not null) p.PatternNumber = request.PatternNumber;
        if (request.CoreRequired.HasValue) p.CoreRequired = request.CoreRequired.Value;
        if (request.MachineRequired.HasValue) p.MachineRequired = request.MachineRequired.Value;
        if (request.InspectionRequired.HasValue) p.InspectionRequired = request.InspectionRequired.Value;
        if (request.MachiningRequired.HasValue) p.MachiningRequired = request.MachiningRequired.Value;
        if (request.CycleTimeMinutes.HasValue) p.CycleTimeMinutes = request.CycleTimeMinutes;
        if (request.StandardCost.HasValue) p.StandardCost = request.StandardCost;
        if (request.SellingPrice.HasValue) p.SellingPrice = request.SellingPrice;
        if (request.GstPercent.HasValue) p.GstPercent = request.GstPercent;
        if (request.HsnCode is not null) p.HsnCode = request.HsnCode;
        if (request.Currency is not null) p.Currency = request.Currency;
        if (request.Status is not null) p.Status = request.Status;

        p.UpdatedAtUtc = DateTimeOffset.UtcNow;
        p.UpdatedByUserId = userId;

        await db.SaveChangesAsync();
        await audit.WriteAsync("productmaster.updated", userId, "ProductMaster", id.ToString(), ip);

        var usage = await GetUsageAsync(id);
        return MapToDetail(p, usage);
    }

    public async Task<bool> ArchiveProductAsync(Guid id, Guid userId, string? ip)
    {
        var p = await db.ProductMasters.IgnoreQueryFilters().SingleOrDefaultAsync(pm => pm.Id == id);
        if (p is null) return false;

        p.IsArchived = true;
        p.Status = "Archived";
        p.UpdatedAtUtc = DateTimeOffset.UtcNow;
        p.UpdatedByUserId = userId;

        await db.SaveChangesAsync();
        await audit.WriteAsync("productmaster.archived", userId, "ProductMaster", id.ToString(), ip);
        return true;
    }

    public async Task<ProductMasterDetailDto> DuplicateProductAsync(Guid id, Guid userId, string? ip)
    {
        var original = await db.ProductMasters
            .IgnoreQueryFilters()
            .Include(pm => pm.Category)
            .Include(pm => pm.Attachments)
            .AsNoTracking()
            .SingleAsync(pm => pm.Id == id);

        var duplicate = new ProductMaster
        {
            Id = Guid.NewGuid(),
            ProductCode = $"{original.ProductCode}-COPY",
            ProductName = $"{original.ProductName} (Copy)",
            Description = original.Description,
            CategoryId = original.CategoryId,
            CastingType = original.CastingType,
            Unit = original.Unit,
            Material = original.Material,
            MaterialGrade = original.MaterialGrade,
            Weight = original.Weight,
            Tolerance = original.Tolerance,
            Density = original.Density,
            Hardness = original.Hardness,
            HeatTreatment = original.HeatTreatment,
            SurfaceFinish = original.SurfaceFinish,
            Length = original.Length,
            Width = original.Width,
            Height = original.Height,
            Diameter = original.Diameter,
            DrawingNumber = original.DrawingNumber,
            Revision = original.Revision,
            PatternNumber = original.PatternNumber,
            CoreRequired = original.CoreRequired,
            MachineRequired = original.MachineRequired,
            InspectionRequired = original.InspectionRequired,
            MachiningRequired = original.MachiningRequired,
            CycleTimeMinutes = original.CycleTimeMinutes,
            StandardCost = original.StandardCost,
            SellingPrice = original.SellingPrice,
            GstPercent = original.GstPercent,
            HsnCode = original.HsnCode,
            Currency = original.Currency,
            Status = "Draft",
            CreatedByUserId = userId,
        };

        db.ProductMasters.Add(duplicate);
        await db.SaveChangesAsync();
        await audit.WriteAsync("productmaster.duplicated", userId, "ProductMaster", duplicate.Id.ToString(), ip);

        return MapToDetail(duplicate, new ProductMasterUsageDto(0, 0, 0));
    }

    public async Task<ProductMasterAttachmentDto> UploadAttachmentAsync(Guid id, IFormFile file, string? description, Guid userId, string? ip)
    {
        var product = await db.ProductMasters.IgnoreQueryFilters()
            .FirstOrDefaultAsync(pm => pm.Id == id)
            ?? throw new KeyNotFoundException("Product not found");

        using var stream = file.OpenReadStream();
        var stored = await storage.SaveAsync(stream, file.FileName, file.ContentType);

        var attachment = new ProductMasterAttachment
        {
            Id = Guid.NewGuid(),
            ProductMasterId = id,
            FileName = file.FileName,
            ContentType = file.ContentType,
            SizeBytes = stored.SizeBytes,
            StorageKey = stored.StorageKey,
            Description = description,
            UploadedByUserId = userId,
        };

        db.ProductMasterAttachments.Add(attachment);
        await db.SaveChangesAsync();
        await audit.WriteAsync("productmaster.attachment_uploaded", userId, "ProductMasterAttachment", attachment.Id.ToString(), ip);

        return new ProductMasterAttachmentDto(
            attachment.Id, attachment.FileName, attachment.ContentType,
            attachment.SizeBytes, attachment.Description,
            attachment.UploadedByUserId, attachment.UploadedAtUtc);
    }

    public async Task<Stream?> DownloadAttachmentAsync(Guid productId, Guid attachmentId)
    {
        var attachment = await db.ProductMasterAttachments
            .Where(a => a.Id == attachmentId && a.ProductMasterId == productId)
            .FirstOrDefaultAsync();

        if (attachment is null) return null;

        return await storage.OpenReadAsync(attachment.StorageKey);
    }

    // ── Private helpers ─────────────────────────────────────────────────

    private static ProductMasterDetailDto MapToDetail(ProductMaster p, ProductMasterUsageDto usage)
    {
        return new ProductMasterDetailDto(
            p.Id, p.ProductCode, p.ProductName, p.Description,
            p.CategoryId, p.Category?.Name,
            p.CastingType, p.Unit,
            p.Material, p.MaterialGrade, p.Weight,
            p.Tolerance, p.Density, p.Hardness, p.HeatTreatment, p.SurfaceFinish,
            p.Length, p.Width, p.Height, p.Diameter,
            p.DrawingNumber, p.Revision, p.PatternNumber,
            p.CoreRequired, p.MachineRequired, p.InspectionRequired, p.MachiningRequired,
            p.CycleTimeMinutes,
            p.StandardCost, p.SellingPrice, p.GstPercent, p.HsnCode, p.Currency,
            p.Status, p.IsArchived,
            p.CreatedAtUtc, p.UpdatedAtUtc,
            p.CreatedByUserId, p.UpdatedByUserId,
            p.Attachments.Select(a => new ProductMasterAttachmentDto(
                a.Id, a.FileName, a.ContentType, a.SizeBytes,
                a.Description, a.UploadedByUserId, a.UploadedAtUtc)).ToList(),
            usage);
    }
}