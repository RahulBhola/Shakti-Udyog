using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Public;
using ShaktiUdyog.Infrastructure.Data;
using ShaktiUdyog.Infrastructure.Storage;

namespace ShaktiUdyog.Api.Services;

public interface IPublicContentService
{
    Task<IReadOnlyList<PublicProductItemDto>> GetPublicProductsAsync();
    Task<PublicProductItemDto?> GetPublicProductByIdAsync(Guid id);
    Task<PublicProductItemDto?> GetPublicProductBySlugOrIdAsync(string slugOrId);
    Task<(Stream Stream, string ContentType, string FileName)?> GetPublicProductImageAsync(Guid id);
    Task<(Stream Stream, string ContentType, string FileName)?> GetPublicProductAttachmentAsync(Guid productId, Guid attachmentId);
    IReadOnlyList<ProductDto> GetProducts();
    ProductDto? GetProduct(string slug);
    IReadOnlyList<ResourceDto> GetResources();
    ResourceDto? GetResource(string slug);
}

public class PublicContentService(
    AppDbContext db,
    IFileStorageService storage) : IPublicContentService
{
    private static readonly IReadOnlyList<ProductDto> Products =
    [
        new(
            "grey-iron-castings",
            "Grey Iron Castings",
            "Reliable, vibration-damping castings for machine bases, housings, pumps, valves, and general engineering applications.",
            [
                "Grey iron castings offer excellent castability, machinability, wear resistance, and vibration damping.",
                "They are commonly selected for stable, cost-effective industrial components.",
            ],
            [
                "Machine bases", "Gear housings", "Pump bodies", "Valve bodies",
                "Flywheels", "Covers", "Brackets", "Bearing housings", "General engineering parts",
            ],
            "[Grades to be confirmed — e.g. IS 210 / EN 1561 / ASTM equivalent]",
            "[Weight range to be confirmed]",
            "[Finish options to be confirmed — as-cast / shot blasted / machined / painted]"),
        new(
            "ductile-iron-castings",
            "Ductile Iron (SG Iron) Castings",
            "High-strength, tough, and durable castings for automotive, agricultural, infrastructure, and heavy-duty equipment.",
            [
                "Ductile iron combines the casting versatility of iron with improved strength, ductility, and impact resistance.",
                "It suits components exposed to higher loads, pressure, or repeated service cycles.",
            ],
            [
                "Hubs", "Carriers", "Manifolds", "Axle components", "Agricultural parts",
                "Pipe fittings", "Valve components", "Gearbox housings", "Construction equipment parts",
            ],
            "[Grades to be confirmed — e.g. IS 1865 / EN 1563 / ASTM equivalent]",
            "[Weight range to be confirmed]",
            "[Finish options to be confirmed — as-cast / shot blasted / machined / painted]"),
        new(
            "custom-castings",
            "Custom / OEM Castings",
            "Drawings-to-castings support for customer-specific geometries, grades, and production requirements.",
            [
                "Bring us a 2D drawing, 3D model, physical sample, or performance requirement.",
                "We can help assess the casting route, material grade, pattern requirement, machining allowance, and inspection plan for your component.",
                "Request with your enquiry: drawing revision, material specification, annual quantity, target weight, critical dimensions, machining details, testing requirement, and delivery location.",
            ],
            ["Customer-specific OEM components based on drawings and specifications"],
            "As per customer specification",
            "As per customer specification",
            "As agreed at quotation"),
        new(
            "machining-finishing",
            "Machining & Finishing",
            "Optional machining, drilling, tapping, surface preparation, painting, and packing for production-ready parts.",
            [
                "Where agreed, castings are machined and finished to supply components ready for assembly.",
                "Value-added services include pattern development, fettling, shot blasting, surface preparation, and protective packing with dispatch coordination.",
            ],
            ["Machined ready-to-assemble components", "Drilled and tapped castings", "Painted and packed parts"],
            "[Machining capability to be confirmed]",
            "As per casting family",
            "[Finish options to be confirmed]"),
    ];

    private static readonly IReadOnlyList<ResourceDto> Resources =
    [
        new(
            "how-to-prepare-a-casting-enquiry",
            "How to Prepare a Casting Enquiry",
            "A checklist of information that helps us quote accurately and faster.",
            [
                "To provide an accurate quotation, please share:",
                "1. Part drawing, 3D model, or physical sample",
                "2. Material grade and applicable standard",
                "3. Target casting weight and critical dimensions",
                "4. Quantity per order and annual requirement",
                "5. Machining and surface-finish requirement",
                "6. Inspection, testing, and documentation requirement",
                "7. Required delivery date and delivery location",
            ]),
        new(
            "grey-iron-vs-ductile-iron",
            "Grey Iron vs. Ductile Iron",
            "A practical comparison of properties, applications, and selection considerations.",
            [
                "[Placeholder article — full comparison content to be authored.]",
                "Grey iron offers excellent castability, machinability, and vibration damping, suiting stable components such as machine bases and housings.",
                "Ductile iron adds strength, ductility, and impact resistance for higher-load components such as hubs, carriers, and valve parts.",
                "Share your application details with our team for grade selection guidance.",
            ]),
        new(
            "casting-drawing-checklist",
            "Casting Drawing Checklist",
            "Key drawing, tolerance, machining, and inspection details to include before production.",
            [
                "[Placeholder article — full checklist content to be authored.]",
                "Include the drawing revision, material specification, general and critical tolerances, machining allowances, and inspection requirements on every casting drawing.",
            ]),
    ];

    public async Task<IReadOnlyList<PublicProductItemDto>> GetPublicProductsAsync()
    {
        try
        {
            var activeProducts = await db.ProductMasters
                .IgnoreQueryFilters()
                .Where(p => p.Status == "Active" && !p.IsArchived && (p.Category == null || p.Category.IsVisible))
                .Include(p => p.Category)
                .Include(p => p.Attachments)
                .OrderBy(p => p.Category != null ? p.Category.DisplayOrder : 99)
                .ThenBy(p => p.ProductName)
                .ToListAsync();

            if (activeProducts.Count > 0)
            {
                return activeProducts.Select(MapToPublicDto).ToList();
            }
        }
        catch
        {
            // Fall through to fallback catalog
        }

        return
        [
            new PublicProductItemDto(
                Guid.Parse("11111111-1111-1111-1111-111111111111"),
                "PRD-SEW-01",
                "TA 1 Industrial Sewing Machine Bracket",
                "Precision Mechanism",
                "Ductile Iron",
                "SG 500/7",
                "0.65 kg",
                "/images/Sewing_machine_parts/Cast Iron TA 1 Bracket Industrial Sewing Machine Part.png",
                "Industrial garment and footwear lockstitch machinery",
                "Precision CNC machined kinematic bracket with micron bore alignment",
                "±0.015 mm",
                "170–230 HBW",
                "500 MPa min",
                "120 × 85 × 45 mm"),
            new PublicProductItemDto(
                Guid.Parse("22222222-2222-2222-2222-222222222222"),
                "PRD-HOS-01",
                "Continental Sizzler Platter Standard",
                "Commercial Hospitality",
                "Grey Iron",
                "FG 200",
                "2.4 kg",
                "/images/Sizzler Plate/Continental Sizzler Plate.png",
                "Commercial restaurant sizzler and steak service",
                "Thermal shock resistant pre-seasoned heat retention platter",
                "±0.5 mm",
                "160–210 HBW",
                "200 MPa min",
                "280 × 160 × 25 mm")
        ];
    }

    public async Task<PublicProductItemDto?> GetPublicProductByIdAsync(Guid id)
    {
        try
        {
            var p = await db.ProductMasters
                .IgnoreQueryFilters()
                .Include(pm => pm.Category)
                .Include(pm => pm.Attachments)
                .FirstOrDefaultAsync(pm => pm.Id == id && pm.Status == "Active" && !pm.IsArchived && (pm.Category == null || pm.Category.IsVisible));

            if (p is not null)
            {
                return MapToPublicDto(p);
            }
        }
        catch
        {
            // Fallback
        }

        return null;
    }

    public async Task<PublicProductItemDto?> GetPublicProductBySlugOrIdAsync(string slugOrId)
    {
        try
        {
            if (Guid.TryParse(slugOrId, out var id))
            {
                return await GetPublicProductByIdAsync(id);
            }

            var clean = slugOrId.Trim().ToLowerInvariant();
            var p = await db.ProductMasters
                .IgnoreQueryFilters()
                .Include(pm => pm.Category)
                .Include(pm => pm.Attachments)
                .FirstOrDefaultAsync(pm =>
                    pm.Status == "Active" && !pm.IsArchived &&
                    (pm.Category == null || pm.Category.IsVisible) &&
                    (pm.ProductCode.ToLower() == clean ||
                     pm.ProductName.ToLower().Replace(" ", "-") == clean ||
                     pm.ProductName.ToLower() == clean.Replace("-", " ")));

            if (p is not null)
            {
                return MapToPublicDto(p);
            }
        }
        catch
        {
            // Fallback
        }

        return null;
    }

    public async Task<(Stream Stream, string ContentType, string FileName)?> GetPublicProductImageAsync(Guid id)
    {
        var attachment = await db.ProductMasterAttachments
            .Where(a => a.ProductMasterId == id && a.ContentType.StartsWith("image/"))
            .OrderBy(a => a.UploadedAtUtc)
            .FirstOrDefaultAsync();

        if (attachment is null) return null;

        var stream = await storage.OpenReadAsync(attachment.StorageKey);
        if (stream is null) return null;

        return (stream, attachment.ContentType, attachment.FileName);
    }

    public async Task<(Stream Stream, string ContentType, string FileName)?> GetPublicProductAttachmentAsync(Guid productId, Guid attachmentId)
    {
        var attachment = await db.ProductMasterAttachments
            .Where(a => a.ProductMasterId == productId && a.Id == attachmentId)
            .FirstOrDefaultAsync();

        if (attachment is null) return null;

        var stream = await storage.OpenReadAsync(attachment.StorageKey);
        if (stream is null) return null;

        return (stream, attachment.ContentType, attachment.FileName);
    }

    public IReadOnlyList<ProductDto> GetProducts() => Products;

    public ProductDto? GetProduct(string slug) =>
        Products.FirstOrDefault(p => string.Equals(p.Slug, slug, StringComparison.OrdinalIgnoreCase));

    public IReadOnlyList<ResourceDto> GetResources() => Resources;

    public ResourceDto? GetResource(string slug) =>
        Resources.FirstOrDefault(r => string.Equals(r.Slug, slug, StringComparison.OrdinalIgnoreCase));

    private static PublicProductItemDto MapToPublicDto(ShaktiUdyog.Domain.Entities.ProductMaster p)
    {
        var firstImageAttachment = p.Attachments
            .Where(a => a.ContentType.StartsWith("image/"))
            .OrderBy(a => a.UploadedAtUtc)
            .FirstOrDefault();

        var imageUrl = !string.IsNullOrWhiteSpace(p.ImageUrl)
            ? p.ImageUrl
            : firstImageAttachment != null
                ? $"/api/v1/public/products/{p.Id}/image"
                : null;

        var dims = (p.Length.HasValue || p.Width.HasValue || p.Height.HasValue || p.Diameter.HasValue)
            ? p.Diameter.HasValue
                ? $"Ø{p.Diameter} × {p.Length ?? p.Height ?? 0} mm"
                : $"{p.Length ?? 0} × {p.Width ?? 0} × {p.Height ?? 0} mm"
            : null;

        var attachments = p.Attachments
            .OrderBy(a => a.UploadedAtUtc)
            .Select(a => new PublicProductAttachmentDto(
                a.Id,
                a.FileName,
                a.ContentType,
                a.SizeBytes,
                a.Description,
                $"/api/v1/public/products/{p.Id}/attachments/{a.Id}/download"))
            .ToList();

        return new PublicProductItemDto(
            p.Id,
            p.ProductCode,
            p.ProductName,
            p.Category?.Name ?? "General Castings",
            p.Material ?? "Grey Iron",
            p.MaterialGrade ?? "FG 200",
            p.Weight.HasValue ? $"{p.Weight.Value} kg" : "—",
            imageUrl,
            p.Application ?? p.Description ?? "Industrial and machinery applications",
            p.Description ?? "High precision engineered casting component",
            p.Tolerance ?? "±0.05 mm",
            p.Hardness ?? "180–220 HBW",
            p.TensileStrength ?? "200 MPa min",
            dims,
            LightImage: p.LightImageUrl,
            CastingType: p.CastingType,
            Unit: p.Unit,
            HeatTreatment: p.HeatTreatment,
            SurfaceFinish: p.SurfaceFinish,
            Density: p.Density,
            Length: p.Length,
            Width: p.Width,
            Height: p.Height,
            Diameter: p.Diameter,
            DrawingNumber: p.DrawingNumber,
            Revision: p.Revision,
            PatternNumber: p.PatternNumber,
            CoreRequired: p.CoreRequired,
            MachineRequired: p.MachineRequired,
            InspectionRequired: p.InspectionRequired,
            MachiningRequired: p.MachiningRequired,
            CycleTimeMinutes: p.CycleTimeMinutes,
            StandardCost: p.StandardCost,
            SellingPrice: p.SellingPrice,
            GstPercent: p.GstPercent,
            HsnCode: p.HsnCode,
            Currency: p.Currency ?? "INR",
            DetailedDescription: p.Description,
            Attachments: attachments);
    }
}
