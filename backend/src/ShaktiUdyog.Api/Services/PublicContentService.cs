using ShaktiUdyog.Api.Contracts.Public;

namespace ShaktiUdyog.Api.Services;

public interface IPublicContentService
{
    IReadOnlyList<ProductDto> GetProducts();
    ProductDto? GetProduct(string slug);
    IReadOnlyList<ResourceDto> GetResources();
    ResourceDto? GetResource(string slug);
}

/// <summary>
/// Static public catalogue transcribed from docs/shakti-udyog-requirements.md
/// §5 and §9. Grades, weight ranges, and finishes are unverified there and
/// stay as clearly labelled placeholders — do not invent values. Editable
/// content management arrives with the Data Updater portal.
/// </summary>
public class PublicContentService : IPublicContentService
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
            "how-to-prepare-a-casting-rfq",
            "How to Prepare a Casting RFQ",
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

    public IReadOnlyList<ProductDto> GetProducts() => Products;

    public ProductDto? GetProduct(string slug) =>
        Products.FirstOrDefault(p => string.Equals(p.Slug, slug, StringComparison.OrdinalIgnoreCase));

    public IReadOnlyList<ResourceDto> GetResources() => Resources;

    public ResourceDto? GetResource(string slug) =>
        Resources.FirstOrDefault(r => string.Equals(r.Slug, slug, StringComparison.OrdinalIgnoreCase));
}
