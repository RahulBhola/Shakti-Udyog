using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Infrastructure.Data;

/// <summary>
/// DEVELOPMENT ONLY: seeds a clearly-labelled demo customer company and customer
/// user along with essential demo portal records (enquiry, quotation, order, invoice,
/// documents) so customer and admin portals can be fully exercised and tested in development.
/// Idempotent: safe to run on every startup without deleting or duplicating customer data.
/// </summary>
public static class DevPortalSeeder
{
    public const string CustomerEmail = "customer@demo.local";
    private const string CompanyName = "Demo Engineering Works [demo data]";

    public static async Task SeedAsync(
        AppDbContext db,
        UserManager<ApplicationUser> userManager,
        string? customerPassword,
        ILogger logger)
    {
        if (string.IsNullOrEmpty(customerPassword))
        {
            logger.LogInformation("DevCustomer:Password not configured; skipping demo portal seeding.");
            return;
        }

        var company = await db.Companies.FirstOrDefaultAsync(c => c.Name == CompanyName);
        if (company == null)
        {
            company = new Company
            {
                Id = Guid.NewGuid(),
                Name = CompanyName,
                LegalBusinessName = CompanyName,
                AddressLine1 = "[Demo address line]",
                City = "Ludhiana",
                State = "Punjab",
                PostalCode = "141001",
                Country = "India",
                GstNumber = "[demo]",
                DeliveryAddresses = "[Demo delivery address 1]\n[Demo delivery address 2]",
            };
            db.Companies.Add(company);
            await db.SaveChangesAsync();
        }

        // Customer user
        var user = await userManager.FindByEmailAsync(CustomerEmail);
        if (user == null)
        {
            user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = CustomerEmail,
                Email = CustomerEmail,
                EmailConfirmed = true,
                FullName = "Demo Customer [placeholder]",
                PhoneNumber = "+91 0000000000",
                IsActive = true,
            };
            var created = await userManager.CreateAsync(user, customerPassword);
            if (!created.Succeeded)
            {
                throw new InvalidOperationException(
                    "Failed to seed demo customer: " + string.Join("; ", created.Errors.Select(e => e.Description)));
            }
            await userManager.AddToRoleAsync(user, Roles.Customer);
        }

        var userCompany = await db.UserCompanies.FirstOrDefaultAsync(uc => uc.UserId == user.Id && uc.CompanyId == company.Id);
        if (userCompany == null)
        {
            db.UserCompanies.Add(new UserCompany
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                CompanyId = company.Id,
                IsApproved = true,
                ApprovedAtUtc = DateTimeOffset.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        var now = DateTimeOffset.UtcNow;

        // Seed initial technical & quality documents for customer vault if not present
        if (!await db.Documents.AnyAsync(d => d.CompanyId == company.Id))
        {
            db.Documents.AddRange(
                new Document
                {
                    Id = Guid.NewGuid(),
                    CompanyId = company.Id,
                    Title = "ISO 9001:2015 Quality Management Certificate",
                    Category = "Certificate",
                    FileName = "ISO_9001_2015_Certificate_ShaktiUdyog.pdf",
                    ContentType = "application/pdf",
                    SizeBytes = 1845000,
                    StorageKey = "seed/iso_9001_cert.pdf",
                    IsCustomerVisible = true,
                    CreatedAtUtc = now.AddDays(-30),
                },
                new Document
                {
                    Id = Guid.NewGuid(),
                    CompanyId = company.Id,
                    Title = "Foundry Metallurgy & Material Grade Specification (IS 210 FG 260)",
                    Category = "Drawing",
                    FileName = "Material_Spec_IS210_FG260_GreyIron.pdf",
                    ContentType = "application/pdf",
                    SizeBytes = 2450000,
                    StorageKey = "seed/material_spec_fg260.pdf",
                    IsCustomerVisible = true,
                    CreatedAtUtc = now.AddDays(-20),
                },
                new Document
                {
                    Id = Guid.NewGuid(),
                    CompanyId = company.Id,
                    Title = "Spectrometric Chemical Analysis & Tensile Inspection Report",
                    Category = "Inspection Report",
                    FileName = "Lab_Inspection_Report_Batch_SU884.pdf",
                    ContentType = "application/pdf",
                    SizeBytes = 980000,
                    StorageKey = "seed/lab_report_884.pdf",
                    IsCustomerVisible = true,
                    CreatedAtUtc = now.AddDays(-5),
                },
                new Document
                {
                    Id = Guid.NewGuid(),
                    CompanyId = company.Id,
                    Title = "Standard Casting Dimensional Tolerance Guide (ISO 8062-3 DGC)",
                    Category = "Drawing",
                    FileName = "Casting_Dimensional_Tolerances_ISO8062.pdf",
                    ContentType = "application/pdf",
                    SizeBytes = 3120000,
                    StorageKey = "seed/tolerances_guide.pdf",
                    IsCustomerVisible = true,
                    CreatedAtUtc = now.AddDays(-2),
                }
            );
            await db.SaveChangesAsync();
        }

        // Seed or update demo enquiry & quotation
        var quotation = await db.Quotations.FirstOrDefaultAsync(q => q.QuotationNumber == "QT-DEMO-0001");
        if (quotation == null)
        {
            var enquiry = new Enquiry
            {
                Id = Guid.NewGuid(),
                CompanyId = company.Id,
                SubmittedByUserId = user.Id,
                FullName = user.FullName ?? "Demo Customer",
                CompanyName = company.Name,
                Email = user.Email ?? CustomerEmail,
                Phone = user.PhoneNumber ?? "+91 0000000000",
                ProductType = "Ductile Iron Casting",
                MaterialGrade = "SG 500/7",
                Quantity = "1000 pcs",
                DeliveryLocation = "Ludhiana",
                RequirementDetails = "[Demo] Pump housing casting per drawing PH-102 rev B.",
                ConsentGiven = true,
                Status = EnquiryStatuses.Quoted,
                CreatedAtUtc = now.AddDays(-20),
            };
            db.Enquiries.Add(enquiry);

            quotation = new Quotation
            {
                Id = Guid.NewGuid(),
                QuotationNumber = "QT-DEMO-0001",
                EnquiryId = enquiry.Id,
                CompanyId = company.Id,
                Subtotal = 485000m,
                Total = 485000m,
                ValidUntilUtc = now.AddDays(15),
                PaymentTerms = "[Demo] 50% advance, 50% before dispatch",
                DeliveryTerms = "[Demo] Ex-works Ludhiana, 6 weeks",
                Status = QuotationStatuses.Issued,
                CreatedAtUtc = now.AddDays(-12),
            };
            db.Quotations.Add(quotation);

            db.Enquiries.Add(new Enquiry
            {
                Id = Guid.NewGuid(),
                CompanyId = company.Id,
                SubmittedByUserId = user.Id,
                FullName = user.FullName ?? "Demo Customer",
                CompanyName = company.Name,
                Email = user.Email ?? CustomerEmail,
                Phone = user.PhoneNumber ?? "+91 0000000000",
                ProductType = "Grey Iron Casting",
                MaterialGrade = "FG 220",
                Quantity = "250 pcs",
                RequirementDetails = "[Demo] Machine base casting, sample drawing to follow.",
                ConsentGiven = true,
                Status = EnquiryStatuses.UnderReview,
                CreatedAtUtc = now.AddDays(-4),
            });

            await db.SaveChangesAsync();
        }
        else
        {
            if (quotation.Status != QuotationStatuses.Issued)
            {
                quotation.Status = QuotationStatuses.Issued;
                await db.SaveChangesAsync();
            }
        }

        // Seed or update demo orders
        var order = await db.Orders.Include(o => o.Milestones).FirstOrDefaultAsync(o => o.OrderNumber == "SO-DEMO-0001");
        if (order == null)
        {
            order = new Order
            {
                Id = Guid.NewGuid(),
                OrderNumber = "SO-DEMO-0001",
                QuotationId = quotation?.Id,
                QuotationTotal = quotation?.Total ?? 1475000m,
                PaymentTerms = quotation?.PaymentTerms ?? "30% Advance, 70% Before Dispatch",
                AdvancePercent = 30,
                AdvanceAmount = 442500m,
                AdvancePaid = true,
                CompanyId = company.Id,
                PurchaseOrderReference = "[Demo PO-4521]",
                Status = OrderStatuses.Production,
                PlacedAtUtc = now.AddDays(-10),
                PromisedDispatchDateUtc = now.AddDays(20),
                DeliveryAddress = "[Demo delivery address 1]",
                LastUpdatedAtUtc = now.AddDays(-2),
                Items =
                [
                    new OrderItem
                    {
                        Id = Guid.NewGuid(),
                        PartNumber = "PH-102",
                        Description = "[Demo] Pump housing casting, ductile iron",
                        QuantityOrdered = 1000,
                        QuantityProduced = 350,
                        QuantityDispatched = 0,
                        UnitRate = 1250m,
                    },
                ],
                Milestones =
                [
                    new OrderMilestone
                    {
                        Id = Guid.NewGuid(),
                        StatusCode = OrderStatuses.Confirmed,
                        CustomerMessage = "Order confirmed and production planned.",
                        OccurredAtUtc = now.AddDays(-10),
                    },
                    new OrderMilestone
                    {
                        Id = Guid.NewGuid(),
                        StatusCode = OrderStatuses.PatternDevelopment,
                        CustomerMessage = "Pattern tooling approved; match plate ready.",
                        OccurredAtUtc = now.AddDays(-6),
                    },
                    new OrderMilestone
                    {
                        Id = Guid.NewGuid(),
                        StatusCode = OrderStatuses.Production,
                        CustomerMessage = "Moulding and melting underway in induction furnace #2.",
                        OccurredAtUtc = now.AddDays(-2),
                    },
                    new OrderMilestone
                    {
                        Id = Guid.NewGuid(),
                        StatusCode = OrderStatuses.Production,
                        CustomerMessage = "Shop-floor observation",
                        InternalNote = "Internal-only note to verify customer visibility filtering",
                        IsCustomerVisible = false,
                        OccurredAtUtc = now.AddDays(-1),
                    }
                ],
                Shipments =
                [
                    new Shipment
                    {
                        Id = Guid.NewGuid(),
                        Transporter = "[Demo Transport Co]",
                        TrackingNumber = "LR-DEMO-9912",
                        DispatchDateUtc = null,
                        EstimatedArrivalUtc = now.AddDays(22),
                    },
                ],
            };
            db.Orders.Add(order);
            await db.SaveChangesAsync();
        }
        else
        {
            if (order.Status != OrderStatuses.Production)
            {
                order.Status = OrderStatuses.Production;
            }
            if (order.CompanyId != company.Id)
            {
                order.CompanyId = company.Id;
            }
            if (order.QuotationTotal == null && quotation != null)
            {
                order.QuotationTotal = quotation.Total;
                order.QuotationId = quotation.Id;
                order.PaymentTerms = quotation.PaymentTerms;
            }
            // Clean up any placeholder customer messages that had the word "Internal" in CustomerMessage
            foreach (var m in order.Milestones)
            {
                if (m.CustomerMessage != null && m.CustomerMessage.Contains("Internal", StringComparison.OrdinalIgnoreCase))
                {
                    m.CustomerMessage = "Shop-floor observation";
                }
            }
            await db.SaveChangesAsync();
        }

        var deliveredOrder = await db.Orders.FirstOrDefaultAsync(o => o.OrderNumber == "SO-DEMO-0000");
        if (deliveredOrder == null)
        {
            deliveredOrder = new Order
            {
                Id = Guid.NewGuid(),
                OrderNumber = "SO-DEMO-0000",
                CompanyId = company.Id,
                PurchaseOrderReference = "[Demo PO-4100]",
                QuotationTotal = 850000m,
                PaymentTerms = "30% Advance, 70% Before Dispatch",
                AdvancePercent = 30,
                AdvanceAmount = 255000m,
                AdvancePaid = true,
                Status = OrderStatuses.Delivered,
                PlacedAtUtc = now.AddDays(-90),
                PromisedDispatchDateUtc = now.AddDays(-50),
                DeliveryAddress = "[Demo delivery address 1]",
                LastUpdatedAtUtc = now.AddDays(-45),
                Items =
                [
                    new OrderItem
                    {
                        Id = Guid.NewGuid(),
                        PartNumber = "GB-77",
                        Description = "[Demo] Gearbox bracket, grey iron",
                        QuantityOrdered = 500,
                        QuantityProduced = 500,
                        QuantityDispatched = 500,
                        UnitRate = 1440m,
                    },
                ],
                Milestones = OrderStatuses.Progression.Select((code, i) => new OrderMilestone
                {
                    Id = Guid.NewGuid(),
                    StatusCode = code,
                    CustomerMessage = "[Demo] " + code.Replace('_', ' '),
                    OccurredAtUtc = now.AddDays(-90 + i * 5),
                }).ToList(),
                Shipments =
                [
                    new Shipment
                    {
                        Id = Guid.NewGuid(),
                        Transporter = "[Demo Transport Co]",
                        TrackingNumber = "LR-DEMO-8841",
                        DispatchDateUtc = now.AddDays(-50),
                        EstimatedArrivalUtc = now.AddDays(-47),
                        DeliveredAtUtc = now.AddDays(-46),
                    },
                ],
            };
            db.Orders.Add(deliveredOrder);
            await db.SaveChangesAsync();
        }

        // Seed demo invoices if missing
        if (!await db.Invoices.AnyAsync(i => i.CompanyId == company.Id))
        {
            var invoice = new Invoice
            {
                Id = Guid.NewGuid(),
                InvoiceNumber = "INV-DEMO-0002",
                CompanyId = company.Id,
                OrderId = order.Id,
                IssueDateUtc = now.AddDays(-8),
                DueDateUtc = now.AddDays(22),
                Subtotal = 242500m,
                Tax = 43650m,
                Total = 286150m,
                AmountPaid = 143075m,
                BalanceDue = 143075m,
                Status = InvoiceStatuses.PartiallyPaid,
            };
            invoice.Items.Add(new InvoiceItem
            {
                Id = Guid.NewGuid(),
                Description = "Grey Iron Casting body — [demo]",
                HsnSacCode = "7325",
                Quantity = 500,
                Unit = "pcs",
                UnitPrice = 485m,
                TaxPercent = 18m,
                LineTotal = 242500m,
            });
            db.Invoices.Add(invoice);

            db.Invoices.Add(new Invoice
            {
                Id = Guid.NewGuid(),
                InvoiceNumber = "INV-DEMO-0001",
                CompanyId = company.Id,
                OrderId = deliveredOrder.Id,
                IssueDateUtc = now.AddDays(-60),
                DueDateUtc = now.AddDays(-30),
                Subtotal = 95000m,
                Tax = 17100m,
                Total = 112100m,
                AmountPaid = 112100m,
                BalanceDue = 0m,
                Status = InvoiceStatuses.Paid,
            });

            db.Payments.Add(new Payment
            {
                Id = Guid.NewGuid(),
                CompanyId = company.Id,
                InvoiceId = invoice.Id,
                PaymentReference = "[Demo NEFT-REF-2210]",
                Method = "NEFT",
                Amount = 143075m,
                PaymentDateUtc = now.AddDays(-5),
                Status = PaymentStatuses.Verified,
                SubmittedByUserId = user.Id,
            });

            await db.SaveChangesAsync();
        }

        // Seed notifications if missing
        if (!await db.Notifications.AnyAsync(n => n.UserId == user.Id))
        {
            db.Notifications.AddRange(
                new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Type = NotificationTypes.Quotation,
                    Title = "[Demo] Quotation QT-DEMO-0001 issued",
                    LinkPath = "/customer/quotations",
                    IsRead = true,
                    CreatedAtUtc = now.AddDays(-12),
                },
                new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Type = NotificationTypes.Order,
                    Title = "[Demo] SO-DEMO-0001 moved to In Production",
                    LinkPath = "/customer/orders",
                    IsRead = false,
                    CreatedAtUtc = now.AddDays(-10),
                },
                new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Type = NotificationTypes.Invoice,
                    Title = "[Demo] Invoice INV-DEMO-0002 issued",
                    LinkPath = "/customer/invoices",
                    IsRead = false,
                    CreatedAtUtc = now.AddDays(-8),
                }
            );
            await db.SaveChangesAsync();
        }

        if (!await db.SupportRequests.AnyAsync(sr => sr.CompanyId == company.Id))
        {
            var firstOrder = await db.Orders.FirstOrDefaultAsync(o => o.CompanyId == company.Id);
            db.SupportRequests.AddRange(
                new SupportRequest
                {
                    Id = Guid.NewGuid(),
                    CompanyId = company.Id,
                    OrderId = firstOrder?.Id,
                    RaisedByUserId = user.Id,
                    Subject = "[Quality & Metallurgy] Request for Raw Material Spectro Test Certificate (Batch #401)",
                    Message = "Hi Team, kindly provide the certified chemical spectrometer test certificate and microstructure report for the latest lot of CI cast housings.",
                    Status = "In Progress",
                    CreatedAtUtc = now.AddDays(-3),
                },
                new SupportRequest
                {
                    Id = Guid.NewGuid(),
                    CompanyId = company.Id,
                    OrderId = firstOrder?.Id,
                    RaisedByUserId = user.Id,
                    Subject = "[Logistics & Dispatch] Advance Shipment Notice & E-Way Bill Copy",
                    Message = "Please share the transporter LR copy and vehicle driver contact number once the consignment is dispatched from Ludhiana foundry unit.",
                    Status = "Resolved",
                    CreatedAtUtc = now.AddDays(-8),
                }
            );
            await db.SaveChangesAsync();
        }

        logger.LogInformation("Seeded DEVELOPMENT demo customer '{Email}' portal records.", CustomerEmail);
    }
}
