using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Infrastructure.Data;

/// <summary>
/// DEVELOPMENT ONLY: seeds demo admin, engineers, and customer accounts so authentication
/// and operations can be exercised in development. The password must be supplied via
/// configuration (DevAdmin:Password / DevCustomer:Password — user secrets or env var).
/// Never called outside Development.
/// </summary>
public static class DevAdminSeeder
{
    public const string Email = "lovebhola8283@gmail.com";

    public static async Task SeedAsync(
        UserManager<ApplicationUser> userManager,
        string? password,
        AppDbContext dbContext,
        ILogger logger)
    {
        if (string.IsNullOrEmpty(password))
        {
            logger.LogInformation("DevAdmin:Password not configured; skipping demo admin seeding.");
            return;
        }

        var adminUser = await userManager.FindByEmailAsync(Email);
        if (adminUser is null)
        {
            adminUser = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = Email,
                Email = Email,
                EmailConfirmed = true,
                FullName = "System Administrator",
                IsActive = true,
            };

            var created = await userManager.CreateAsync(adminUser, password);
            if (!created.Succeeded)
            {
                var errors = string.Join("; ", created.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to seed development admin: {errors}");
            }

            await userManager.AddToRoleAsync(adminUser, Roles.Admin);
            logger.LogWarning("Seeded DEVELOPMENT demo admin '{Email}'.", Email);
        }
        else
        {
            var resetToken = await userManager.GeneratePasswordResetTokenAsync(adminUser);
            await userManager.ResetPasswordAsync(adminUser, resetToken, password);
            if (!await userManager.IsInRoleAsync(adminUser, Roles.Admin))
            {
                await userManager.AddToRoleAsync(adminUser, Roles.Admin);
            }
        }

        // Seed Engineers (1 primary + multiple secondary engineers)
        var engineers = new[]
        {
            ("engineer@shaktiudyog.local", "Primary Staff Engineer"),
            ("engineer2@shaktiudyog.local", "Senior Foundry Engineer"),
            ("engineer3@shaktiudyog.local", "Quality Assurance Engineer")
        };

        foreach (var (engEmail, fullName) in engineers)
        {
            var engUser = await userManager.FindByEmailAsync(engEmail);
            if (engUser is null)
            {
                engUser = new ApplicationUser
                {
                    Id = Guid.NewGuid(),
                    UserName = engEmail,
                    Email = engEmail,
                    EmailConfirmed = true,
                    FullName = fullName,
                    IsActive = true,
                };

                var res = await userManager.CreateAsync(engUser, password);
                if (res.Succeeded)
                {
                    await userManager.AddToRoleAsync(engUser, Roles.Engineer);
                    logger.LogInformation("Seeded demo engineer '{Email}'.", engEmail);
                }
            }
            else
            {
                var token = await userManager.GeneratePasswordResetTokenAsync(engUser);
                await userManager.ResetPasswordAsync(engUser, token, password);
                if (!await userManager.IsInRoleAsync(engUser, Roles.Engineer))
                {
                    await userManager.AddToRoleAsync(engUser, Roles.Engineer);
                }
            }
        }

        await SeedCategoriesAsync(dbContext, logger);
        await SeedProductMastersAsync(dbContext, adminUser?.Id, logger);
    }

    private static async Task SeedCategoriesAsync(AppDbContext db, ILogger logger)
    {
        var existingCategories = await db.Categories.ToListAsync();
        var desiredCategories = new (string Name, string Slug, string Desc, int Order)[]
        {
            ("Precision Mechanism", "precision-mechanism", "Micron-tolerance kinematic brackets, cams, and links for industrial machines", 1),
            ("Commercial Hospitality", "commercial-hospitality", "Commercial heavy heat-retention sizzler platters and cookware", 2),
            ("Power Transmission", "power-transmission", "Dynamic balanced V-belt pulleys and heavy-duty hoist wheels", 3),
            ("Fluid & Pumps", "fluid-pumps", "High-pressure pump bodies, housings, and sealing plugs tested to 250+ bar", 4),
            ("Agricultural Machinery", "agricultural-machinery", "High fatigue strength tractor axle brackets and tillage parts", 5),
            ("Automotive & Powertrain", "automotive-powertrain", "Induction hardened shift levers and heavy truck transmission links", 6),
            ("Industrial Machinery", "industrial-machinery", "Vibrational damping base frames and CNC spindle pillow blocks", 7),
            ("Industrial & Structural", "industrial-structural", "Hillside washers and high-elongation railway safety handles", 8),
            ("Fasteners & Hardware", "fasteners-hardware", "Precision metric check nuts and slotted locking fasteners", 9),
        };

        var addedCount = 0;
        foreach (var (name, slug, desc, order) in desiredCategories)
        {
            if (!existingCategories.Any(c => string.Equals(c.Name, name, StringComparison.OrdinalIgnoreCase)))
            {
                db.Categories.Add(new Category
                {
                    Id = Guid.NewGuid(),
                    Name = name,
                    Slug = slug,
                    Description = desc,
                    DisplayOrder = order,
                    IsVisible = true,
                    CreatedAtUtc = DateTimeOffset.UtcNow,
                });
                addedCount++;
            }
        }

        if (addedCount > 0)
        {
            await db.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} new product categories.", addedCount);
        }
    }

    private static async Task SeedProductMastersAsync(AppDbContext db, Guid? adminUserId, ILogger logger)
    {
        var categories = await db.Categories.ToListAsync();
        var catMap = categories.ToDictionary(c => c.Name, c => c.Id, StringComparer.OrdinalIgnoreCase);

        var seedItems = new[]
        {
            new
            {
                Code = "PRD-SEW-01",
                Title = "TA 1 Industrial Sewing Machine Bracket",
                Category = "Precision Mechanism",
                Material = "Ductile Iron",
                Grade = "SG 500/7",
                Weight = 0.65m,
                Image = "/images/Sewing_machine_parts/Cast Iron TA 1 Bracket Industrial Sewing Machine Part.png",
                Application = "Industrial garment and footwear lockstitch machinery",
                Specs = "Precision CNC machined kinematic bracket with micron bore alignment",
                Tolerances = "±0.015 mm CMM verified",
                Hardness = "170–230 HBW",
                Tensile = "500 MPa min"
            },
            new
            {
                Code = "PRD-HOS-01",
                Title = "Continental Sizzler Platter Standard",
                Category = "Commercial Hospitality",
                Material = "Grey Iron",
                Grade = "FG 200",
                Weight = 2.4m,
                Image = "/images/Sizzler Plate/Continental Sizzler Plate.png",
                Application = "Commercial restaurant sizzler and steak service",
                Specs = "Thermal shock resistant pre-seasoned heat retention platter",
                Tolerances = "±0.5 mm surface profile",
                Hardness = "160–210 HBW",
                Tensile = "200 MPa min"
            },
            new
            {
                Code = "PRD-PWR-01",
                Title = "Precision Balanced V-Belt Pulley 1A",
                Category = "Power Transmission",
                Material = "Grey Iron",
                Grade = "FG 220",
                Weight = 3.8m,
                Image = "/images/V Belt Pulley/Cast Iron V Belt Pulley Set.png",
                Application = "Electric motor drives, air compressors, conveyors",
                Specs = "Dynamically balanced to ISO 1940 G6.3 up to 3,500 RPM",
                Tolerances = "±0.025 mm bore & groove",
                Hardness = "180–230 HBW",
                Tensile = "220 MPa min"
            },
            new
            {
                Code = "PRD-FLD-01",
                Title = "High-Pressure Collar Sealing Plug",
                Category = "Fluid & Pumps",
                Material = "Grey Iron",
                Grade = "FG 260",
                Weight = 1.1m,
                Image = "/images/Collar Plug/Cast Iron Collar Plug.png",
                Application = "High-pressure hydraulic manifolds & fluid lines",
                Specs = "Hydrostatically tested for 250+ bar continuous working pressure",
                Tolerances = "±0.02 mm thread pitch",
                Hardness = "190–240 HBW",
                Tensile = "260 MPa min"
            },
            new
            {
                Code = "PRD-AGR-01",
                Title = "Heavy Duty Tractor Axle Support",
                Category = "Agricultural Machinery",
                Material = "Ductile Iron",
                Grade = "SG 600/3",
                Weight = 8.5m,
                Image = "/images/cast_iron_casting/Cast Iron Tractor Part Casting.png",
                Application = "Agricultural tractors and heavy tillage implements",
                Specs = "High fatigue strength for continuous heavy field draft loads",
                Tolerances = "±0.03 mm mounting holes",
                Hardness = "190–270 HBW",
                Tensile = "600 MPa min"
            },
            new
            {
                Code = "PRD-AUT-01",
                Title = "Automotive Transmission Shift Lever",
                Category = "Automotive & Powertrain",
                Material = "Ductile Iron",
                Grade = "SG 700/2",
                Weight = 1.4m,
                Image = "/images/Gear Lever Parts/Cast Iron Car Gear Lever Part.png",
                Application = "Commercial vehicle manual and automated gearboxes",
                Specs = "Surface induction hardened against gear shifting torsional fatigue",
                Tolerances = "±0.02 mm pivot hole",
                Hardness = "220–300 HBW",
                Tensile = "700 MPa min"
            },
            new
            {
                Code = "PRD-PWR-02",
                Title = "Industrial Heavy Duty Pulley Wheel",
                Category = "Power Transmission",
                Material = "Grey Iron",
                Grade = "FG 260",
                Weight = 12.0m,
                Image = "/images/Pulley Wheel/6 Inch Cast Iron Pulley Wheel.png",
                Application = "Heavy overhead cranes, winches, elevator hoist drums",
                Specs = "Wear-resistant deep groove profile with low rope friction coefficient",
                Tolerances = "±0.03 mm radial runout",
                Hardness = "190–240 HBW",
                Tensile = "260 MPa min"
            },
            new
            {
                Code = "PRD-FLD-02",
                Title = "Hydraulic Rotary Barrel Pump Housing",
                Category = "Fluid & Pumps",
                Material = "Grey Iron",
                Grade = "FG 260",
                Weight = 5.6m,
                Image = "/images/cast_iron_casting/Cast Iron Rotary Barrel Pump Casting.png",
                Application = "Fuel transfer pumps, chemical drums, fluid dispensing",
                Specs = "100% hydrostatically tested for zero porosity under continuous pressure",
                Tolerances = "±0.02 mm internal bore",
                Hardness = "190–240 HBW",
                Tensile = "260 MPa min"
            },
            new
            {
                Code = "PRD-STR-01",
                Title = "Structural Hillside Washer Casting",
                Category = "Industrial & Structural",
                Material = "Grey Iron",
                Grade = "FG 220",
                Weight = 0.9m,
                Image = "/images/Hillside Washer/Cast Iron Hillside Washer.png",
                Application = "Pre-engineered steel buildings, diagonal cross-bracing rods",
                Specs = "High load distributing diagonal anchor washer for structural I-beams",
                Tolerances = "±0.4 mm cast profile",
                Hardness = "180–220 HBW",
                Tensile = "220 MPa min"
            },
            new
            {
                Code = "PRD-MAC-01",
                Title = "Button Machine Heavy Base Frame",
                Category = "Industrial Machinery",
                Material = "Grey Iron",
                Grade = "FG 200",
                Weight = 16.5m,
                Image = "/images/cast_iron_casting/Cast Iron Button Machine Casting.png",
                Application = "Automated fastener press machinery, high-speed textile stamping",
                Specs = "High vibrational damping base frame for industrial press automation",
                Tolerances = "±0.05 mm bed flatness",
                Hardness = "160–210 HBW",
                Tensile = "200 MPa min"
            },
            new
            {
                Code = "PRD-SEW-02",
                Title = "Forged Link Pivot Mechanism",
                Category = "Precision Mechanism",
                Material = "Ductile Iron",
                Grade = "SG 500/7",
                Weight = 0.85m,
                Image = "/images/Link Part/Iron Link Part 50g.png",
                Application = "Packaging machinery linkages, pick-and-place automation",
                Specs = "Precision ground bore with high tensile kinematic endurance",
                Tolerances = "±0.015 mm center distance",
                Hardness = "170–230 HBW",
                Tensile = "500 MPa min"
            },
            new
            {
                Code = "PRD-STR-02",
                Title = "Railway Passenger Door Safety Handle",
                Category = "Industrial & Structural",
                Material = "Ductile Iron",
                Grade = "SG 600/3",
                Weight = 1.75m,
                Image = "/images/cast_iron_casting/Cast Iron Train Door Handle Casting.png",
                Application = "Rail passenger coach doors, transit rolling stock",
                Specs = "High elongation impact-proof casting tested to railway safety norms",
                Tolerances = "±0.05 mm pivot pins",
                Hardness = "190–260 HBW",
                Tensile = "600 MPa min"
            },
            new
            {
                Code = "PRD-HOS-02",
                Title = "Commercial Sizzler Platter Round",
                Category = "Commercial Hospitality",
                Material = "Grey Iron",
                Grade = "FG 200",
                Weight = 1.9m,
                Image = "/images/Sizzler Plate/Continental Sizzler Plate 1.png",
                Application = "Restaurant hot-plate serving, cast iron culinary cookware",
                Specs = "Uniform wall thickness for even heat distribution and retention",
                Tolerances = "±0.5 mm cast surface",
                Hardness = "160–210 HBW",
                Tensile = "200 MPa min"
            },
            new
            {
                Code = "PRD-FST-01",
                Title = "Industrial Hex Check Nut Casting",
                Category = "Fasteners & Hardware",
                Material = "Grey Iron",
                Grade = "FG 220",
                Weight = 0.45m,
                Image = "/images/Cast Iron Nut/Cast Iron Door Closer Nut.png",
                Application = "Pneumatic door closers, heavy machinery shaft clamping",
                Specs = "High torque resistance with precision metric internal threading",
                Tolerances = "Class 6H thread fit",
                Hardness = "180–220 HBW",
                Tensile = "220 MPa min"
            },
            new
            {
                Code = "PRD-AUT-02",
                Title = "Commercial Truck Shift Control Link",
                Category = "Automotive & Powertrain",
                Material = "Ductile Iron",
                Grade = "SG 600/3",
                Weight = 2.1m,
                Image = "/images/Gear Lever Parts/Cast Iron Car Gear Lever Part 1.png",
                Application = "Heavy commercial truck transmission linkage assemblies",
                Specs = "Reinforced pivot fork with anti-backlash bushing seat",
                Tolerances = "±0.02 mm bushing bore",
                Hardness = "190–260 HBW",
                Tensile = "600 MPa min"
            },
            new
            {
                Code = "PRD-MAC-02",
                Title = "Precision Machine Tool Pillow Block",
                Category = "Industrial Machinery",
                Material = "Grey Iron",
                Grade = "FG 260",
                Weight = 9.4m,
                Image = "/images/Industrial Iron Casting.png",
                Application = "CNC machine spindle supports, heavy linear guide rails",
                Specs = "Stress-relieved casting ensuring zero thermal deformation under load",
                Tolerances = "±0.015 mm bearing seat",
                Hardness = "190–240 HBW",
                Tensile = "260 MPa min"
            },
            new
            {
                Code = "PRD-FST-02",
                Title = "Slotted Locking Nut Casting",
                Category = "Fasteners & Hardware",
                Material = "Grey Iron",
                Grade = "FG 220",
                Weight = 0.35m,
                Image = "/images/cast_iron_casting/Cast Iron Check Nut Casting.png",
                Application = "Heavy rotating equipment, wheel spindle vibration locks",
                Specs = "Positive cotter-pin safety locking slots with precision pitch",
                Tolerances = "Class 6H thread fit",
                Hardness = "180–220 HBW",
                Tensile = "220 MPa min"
            },
            new
            {
                Code = "PRD-SEW-03",
                Title = "Chal T1 Sewing Mechanism",
                Category = "Precision Mechanism",
                Material = "Grey Iron",
                Grade = "FG 220",
                Weight = 0.55m,
                Image = "/images/Sewing_machine_parts/Cast Iron Chal T1 Industrial Sewing Machine Part.png",
                Application = "High-speed industrial embroidery and lockstitch machinery",
                Specs = "Self-lubricating micro-porosity graphite structure for reduced friction",
                Tolerances = "±0.015 mm slide face",
                Hardness = "180–220 HBW",
                Tensile = "220 MPa min"
            },
            new
            {
                Code = "PRD-SEW-04",
                Title = "SV Came Sewing Cam",
                Category = "Precision Mechanism",
                Material = "Ductile Iron",
                Grade = "SG 500/7",
                Weight = 0.38m,
                Image = "/images/Sewing_machine_parts/Cast Iron SV Came Industrial Sewing Machine Part.png",
                Application = "Mechanical timing cams for automated textile equipment",
                Specs = "Precision profiled eccentric lobes ground to micron accuracy",
                Tolerances = "±0.010 mm cam lobe",
                Hardness = "170–230 HBW",
                Tensile = "500 MPa min"
            },
            new
            {
                Code = "PRD-PWR-03",
                Title = "Dual Groove V-Belt Pulley",
                Category = "Power Transmission",
                Material = "Grey Iron",
                Grade = "FG 260",
                Weight = 5.2m,
                Image = "/images/V Belt Pulley/Cast Iron V Belt Pulley Set 1.png",
                Application = "Heavy dual-belt drive assemblies, industrial blowers, gensets",
                Specs = "Dual matched groove geometry ensuring equal tension load sharing",
                Tolerances = "±0.025 mm dual groove runout",
                Hardness = "190–240 HBW",
                Tensile = "260 MPa min"
            }
        };

        var existingCodes = await db.ProductMasters
            .IgnoreQueryFilters()
            .Select(p => p.ProductCode)
            .ToListAsync();

        var existingCodeSet = new HashSet<string>(existingCodes, StringComparer.OrdinalIgnoreCase);
        var addedProducts = 0;

        foreach (var item in seedItems)
        {
            if (existingCodeSet.Contains(item.Code))
                continue;

            catMap.TryGetValue(item.Category, out var catId);

            var pm = new ProductMaster
            {
                Id = Guid.NewGuid(),
                ProductCode = item.Code,
                ProductName = item.Title,
                CategoryId = catId != Guid.Empty ? catId : null,
                Material = item.Material,
                MaterialGrade = item.Grade,
                Weight = item.Weight,
                ImageUrl = item.Image,
                Application = item.Application,
                Description = item.Specs,
                Tolerance = item.Tolerances,
                Hardness = item.Hardness,
                TensileStrength = item.Tensile,
                Status = "Active",
                CastingType = item.Material == "Ductile Iron" ? "Ductile Iron Casting" : "Sand Casting",
                Unit = "Nos",
                SellingPrice = item.Weight * 140m,
                StandardCost = item.Weight * 95m,
                GstPercent = 18m,
                HsnCode = "7325",
                Currency = "INR",
                CreatedByUserId = adminUserId,
                CreatedAtUtc = DateTimeOffset.UtcNow,
            };

            db.ProductMasters.Add(pm);
            addedProducts++;
        }

        if (addedProducts > 0)
        {
            await db.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} initial ERP product masters for development.", addedProducts);
        }
    }
}

