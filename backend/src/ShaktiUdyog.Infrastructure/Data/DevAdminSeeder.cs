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

        await PurgeEnquiryAndQuotationDataAsync(dbContext, logger);
        await SeedCategoriesAsync(dbContext, logger);
        await SeedProductMastersAsync(dbContext, adminUser?.Id, logger);
        await SeedHistoricalDemoOperationsAsync(dbContext, logger);
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

        var existingProducts = await db.ProductMasters
            .IgnoreQueryFilters()
            .ToListAsync();

        var existingMap = existingProducts.ToDictionary(p => p.ProductCode, StringComparer.OrdinalIgnoreCase);
        var addedOrUpdated = 0;

        foreach (var item in seedItems)
        {
            catMap.TryGetValue(item.Category, out var catId);
            var targetCatId = catId != Guid.Empty ? catId : (Guid?)null;

            if (existingMap.TryGetValue(item.Code, out var existing))
            {
                existing.ProductName = item.Title;
                existing.CategoryId = targetCatId;
                existing.Material = item.Material;
                existing.MaterialGrade = item.Grade;
                existing.Weight = item.Weight;
                existing.ImageUrl = item.Image;
                existing.Application = item.Application;
                existing.Description = item.Specs;
                existing.Tolerance = item.Tolerances;
                existing.Hardness = item.Hardness;
                existing.TensileStrength = item.Tensile;
                existing.Status = "Active";
                existing.IsArchived = false;
                existing.CastingType = item.Material == "Ductile Iron" ? "Ductile Iron Casting" : "Sand Casting";
                existing.Unit = "Nos";
                existing.SellingPrice = item.Weight * 140m;
                existing.StandardCost = item.Weight * 95m;
                existing.GstPercent = 18m;
                existing.HsnCode = "7325";
                existing.Currency = "INR";
                if (existing.CreatedByUserId == null)
                {
                    existing.CreatedByUserId = adminUserId;
                }
                addedOrUpdated++;
            }
            else
            {
                var pm = new ProductMaster
                {
                    Id = Guid.NewGuid(),
                    ProductCode = item.Code,
                    ProductName = item.Title,
                    CategoryId = targetCatId,
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
                    IsArchived = false,
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
                addedOrUpdated++;
            }
        }

        if (addedOrUpdated > 0)
        {
            await db.SaveChangesAsync();
            logger.LogInformation("Seeded/Synchronized {Count} ERP product masters for development.", addedOrUpdated);
        }
    }

    public static async Task PurgeEnquiryAndQuotationDataAsync(AppDbContext db, ILogger logger)
    {
        try
        {
            // 1. Unlink any orders pointing to quotations
            var ordersWithQuotes = await db.Orders.Where(o => o.QuotationId != null).ToListAsync();
            if (ordersWithQuotes.Count > 0)
            {
                foreach (var o in ordersWithQuotes) o.QuotationId = null;
                await db.SaveChangesAsync();
            }

            // 2. Delete all Quotation child rows and Quotations
            var approvals = await db.QuotationApprovals.ToListAsync();
            if (approvals.Count > 0) db.QuotationApprovals.RemoveRange(approvals);

            var attachments = await db.QuotationAttachments.ToListAsync();
            if (attachments.Count > 0) db.QuotationAttachments.RemoveRange(attachments);

            var comments = await db.QuotationComments.ToListAsync();
            if (comments.Count > 0) db.QuotationComments.RemoveRange(comments);

            var items = await db.QuotationItems.ToListAsync();
            if (items.Count > 0) db.QuotationItems.RemoveRange(items);

            var revisions = await db.QuotationRevisions.ToListAsync();
            if (revisions.Count > 0) db.QuotationRevisions.RemoveRange(revisions);

            var histories = await db.QuotationStatusHistories.ToListAsync();
            if (histories.Count > 0) db.QuotationStatusHistories.RemoveRange(histories);

            var quotes = await db.Quotations.ToListAsync();
            if (quotes.Count > 0) db.Quotations.RemoveRange(quotes);

            // 3. Delete all Enquiry child rows and Enquiries
            var enqAssignments = await db.EnquiryAssignments.ToListAsync();
            if (enqAssignments.Count > 0) db.EnquiryAssignments.RemoveRange(enqAssignments);

            var enqComments = await db.EnquiryComments.ToListAsync();
            if (enqComments.Count > 0) db.EnquiryComments.RemoveRange(enqComments);

            var enqFiles = await db.EnquiryFiles.ToListAsync();
            if (enqFiles.Count > 0) db.EnquiryFiles.RemoveRange(enqFiles);

            var enqItems = await db.EnquiryItems.ToListAsync();
            if (enqItems.Count > 0) db.EnquiryItems.RemoveRange(enqItems);

            var enqHistories = await db.EnquiryStatusHistories.ToListAsync();
            if (enqHistories.Count > 0) db.EnquiryStatusHistories.RemoveRange(enqHistories);

            var enquiries = await db.Enquiries.ToListAsync();
            if (enquiries.Count > 0) db.Enquiries.RemoveRange(enquiries);

            await db.SaveChangesAsync();
            logger.LogInformation("Purged all enquiry and quotation data from database.");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not purge enquiry or quotation data during startup: {Message}", ex.Message);
        }
    }

    private static async Task SeedHistoricalDemoOperationsAsync(AppDbContext db, ILogger logger)
    {
        var existingOrderCount = await db.Orders.CountAsync();
        if (existingOrderCount >= 10) return;

        var company = await db.Companies.FirstOrDefaultAsync() ?? new Company
        {
            Id = Guid.NewGuid(),
            Name = "Ludhiana Heavy Engineering Ltd",
            AddressLine1 = "Phase VII Industrial Area",
            City = "Ludhiana",
            State = "Punjab",
            PostalCode = "141010",
            Country = "India",
            GstNumber = "03AABCL1234F1Z9",
            DeliveryAddresses = "Gate 2, Focal Point Industrial Area, Ludhiana",
        };

        if (!await db.Companies.AnyAsync(c => c.Id == company.Id))
        {
            db.Companies.Add(company);
            await db.SaveChangesAsync();
        }

        var products = await db.ProductMasters.ToListAsync();
        if (products.Count == 0) return;

        var stages = new[]
        {
            ManufacturingStages.PatternDevelopment,
            ManufacturingStages.Production,
            ManufacturingStages.QualityCheck,
            ManufacturingStages.Packed,
            ManufacturingStages.ReadyToDispatch,
            OrderStatuses.Delivered,
        };

        var now = DateTimeOffset.UtcNow;
        var random = new Random(42);

        for (var i = 11; i >= 0; i--)
        {
            var monthDate = now.AddMonths(-i);
            var monthStart = new DateTimeOffset(new DateTime(monthDate.Year, monthDate.Month, 1), TimeSpan.Zero);

            var prod = products[random.Next(products.Count)];
            var qty = random.Next(200, 1500);
            var rate = prod.SellingPrice ?? 450m;
            var subtotal = qty * rate;
            var tax = Math.Round(subtotal * 0.18m, 2);
            var total = subtotal + tax;

            var isPaid = i > 1;
            var orderStage = i <= 1 ? stages[random.Next(stages.Length - 2)] : stages[^1];
            var orderStatus = orderStage == OrderStatuses.Delivered ? OrderStatuses.Delivered : OrderStatuses.Production;

            var order = new Order
            {
                Id = Guid.NewGuid(),
                OrderNumber = $"ORD-{monthDate.Year}{monthDate.Month:D2}-{random.Next(1000, 9999)}",
                CompanyId = company.Id,
                QuotationId = null,
                PurchaseOrderReference = $"PO-{monthDate.Year}/{random.Next(100, 999)}",
                Status = orderStatus,
                ManufacturingStage = orderStage,
                PlacedAtUtc = monthStart.AddDays(random.Next(18, 25)),
                PromisedDispatchDateUtc = monthStart.AddDays(random.Next(35, 55)),
                DeliveryAddress = company.DeliveryAddresses,
                QuotationTotal = total,
                AdvancePercent = 30,
                AdvanceAmount = Math.Round(total * 0.3m, 2),
                AdvancePaid = true,
                AdvancePaidAtUtc = monthStart.AddDays(20),
                Items = new List<OrderItem>
                {
                    new OrderItem
                    {
                        Id = Guid.NewGuid(),
                        PartNumber = prod.ProductCode,
                        Description = prod.ProductName,
                        QuantityOrdered = qty,
                        QuantityProduced = isPaid ? qty : (qty / 2),
                        UnitRate = rate,
                    }
                }
            };
            db.Orders.Add(order);

            var amountPaid = isPaid ? total : Math.Round(total * 0.3m, 2);
            var invStatus = isPaid ? InvoiceStatuses.Paid : (i == 1 ? InvoiceStatuses.PartiallyPaid : InvoiceStatuses.Issued);

            var invoice = new Invoice
            {
                Id = Guid.NewGuid(),
                InvoiceNumber = $"INV-{monthDate.Year}{monthDate.Month:D2}-{random.Next(1000, 9999)}",
                CompanyId = company.Id,
                OrderId = order.Id,
                IssueDateUtc = monthStart.AddDays(random.Next(22, 28)),
                DueDateUtc = monthStart.AddDays(50),
                Subtotal = subtotal,
                Tax = tax,
                Total = total,
                AmountPaid = amountPaid,
                BalanceDue = total - amountPaid,
                Status = invStatus,
                Currency = "INR",
                CreatedAtUtc = monthStart.AddDays(22),
            };
            db.Invoices.Add(invoice);
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Seeded 12-month historical ERP operations demo data without enquiries or quotations.");
    }
}

