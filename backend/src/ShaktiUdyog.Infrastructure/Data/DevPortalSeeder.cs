using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Infrastructure.Data;

/// <summary>
/// DEVELOPMENT ONLY: seeds a clearly-labelled demo customer company, customer
/// user, and sample portal records (RFQ → quotation → order → invoice →
/// documents → notifications) so every customer-portal screen is explorable
/// before the staff portals exist. All values are fictitious demo data.
/// Idempotent: skipped when the demo company already exists. Requires
/// DevCustomer:Password in configuration; skipped otherwise.
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

        if (await db.Companies.AnyAsync(c => c.Name == CompanyName))
        {
            return;
        }

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = CompanyName,
            AddressLine1 = "[Demo address line]",
            City = "Ludhiana",
            State = "Punjab",
            PostalCode = "141001",
            Country = "India",
            GstNumber = "[demo]",
            DeliveryAddresses = "[Demo delivery address 1]\n[Demo delivery address 2]",
        };
        db.Companies.Add(company);

        // Customer user
        var user = new ApplicationUser
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

        db.UserCompanies.Add(new UserCompany
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            CompanyId = company.Id,
            IsApproved = true,
            ApprovedAtUtc = DateTimeOffset.UtcNow,
        });

        var now = DateTimeOffset.UtcNow;

        // RFQ (quoted) → quotation (issued)
        var rfq = new Rfq
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            SubmittedByUserId = user.Id,
            FullName = user.FullName!,
            CompanyName = company.Name,
            Email = user.Email!,
            Phone = user.PhoneNumber!,
            ProductType = "Ductile Iron Casting",
            MaterialGrade = "[Demo grade]",
            Quantity = "1000 pcs",
            DeliveryLocation = "Ludhiana",
            RequirementDetails = "[Demo] Pump housing casting per drawing PH-102 rev B.",
            ConsentGiven = true,
            Status = RfqStatuses.Quoted,
            CreatedAtUtc = now.AddDays(-20),
        };
        db.Rfqs.Add(rfq);

        var quotation = new Quotation
        {
            Id = Guid.NewGuid(),
            QuotationNumber = "QT-DEMO-0001",
            RfqId = rfq.Id,
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

        // A second RFQ still under review
        db.Rfqs.Add(new Rfq
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            SubmittedByUserId = user.Id,
            FullName = user.FullName!,
            CompanyName = company.Name,
            Email = user.Email!,
            Phone = user.PhoneNumber!,
            ProductType = "Grey Iron Casting",
            Quantity = "250 pcs",
            RequirementDetails = "[Demo] Machine base casting, sample drawing to follow.",
            ConsentGiven = true,
            Status = RfqStatuses.UnderReview,
            CreatedAtUtc = now.AddDays(-4),
        });

        // Order in production with milestones (one internal-only milestone to
        // prove the visibility filter) and a shipment placeholder
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "SO-DEMO-0001",
            CompanyId = company.Id,
            PurchaseOrderReference = "[Demo PO-4521]",
            Status = OrderStatuses.Production,
            PlacedAtUtc = now.AddDays(-30),
            PromisedDispatchDateUtc = now.AddDays(14),
            DeliveryAddress = "[Demo delivery address 1]",
            LastUpdatedAtUtc = now.AddDays(-2),
            Items =
            [
                new OrderItem
                {
                    Id = Guid.NewGuid(),
                    PartNumber = "PH-102",
                    Description = "[Demo] Pump housing, ductile iron",
                    MaterialGrade = "[Demo grade]",
                    DrawingRevision = "B",
                    QuantityOrdered = 1000,
                    QuantityProduced = 420,
                    QuantityDispatched = 0,
                },
                new OrderItem
                {
                    Id = Guid.NewGuid(),
                    PartNumber = "PH-COVER-01",
                    Description = "[Demo] Pump cover, ductile iron",
                    MaterialGrade = "[Demo grade]",
                    DrawingRevision = "A",
                    QuantityOrdered = 1000,
                    QuantityProduced = 380,
                    QuantityDispatched = 0,
                },
            ],
            Milestones =
            [
                new OrderMilestone
                {
                    Id = Guid.NewGuid(), StatusCode = OrderStatuses.Confirmed,
                    CustomerMessage = "[Demo] Order confirmed and planned.",
                    OccurredAtUtc = now.AddDays(-30),
                },
                new OrderMilestone
                {
                    Id = Guid.NewGuid(), StatusCode = OrderStatuses.PatternDevelopment,
                    CustomerMessage = "[Demo] Pattern adapted for revision B.",
                    OccurredAtUtc = now.AddDays(-24),
                },
                new OrderMilestone
                {
                    Id = Guid.NewGuid(), StatusCode = OrderStatuses.Production,
                    CustomerMessage = "[Demo] First moulding lot poured.",
                    OccurredAtUtc = now.AddDays(-10),
                },
                new OrderMilestone
                {
                    Id = Guid.NewGuid(), StatusCode = OrderStatuses.Production,
                    CustomerMessage = null,
                    InternalNote = "[Demo internal-only note: must never appear in the customer portal]",
                    IsCustomerVisible = false,
                    OccurredAtUtc = now.AddDays(-2),
                },
            ],
            Shipments =
            [
                new Shipment
                {
                    Id = Guid.NewGuid(),
                    Transporter = "[Demo Transport Co]",
                    TrackingNumber = "[Pending dispatch]",
                    EstimatedArrivalUtc = now.AddDays(20),
                },
            ],
        };
        db.Orders.Add(order);

        // A delivered order for history
        var delivered = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = "SO-DEMO-0000",
            CompanyId = company.Id,
            Status = OrderStatuses.Delivered,
            PlacedAtUtc = now.AddDays(-90),
            PromisedDispatchDateUtc = now.AddDays(-50),
            DeliveryAddress = "[Demo delivery address 1]",
            LastUpdatedAtUtc = now.AddDays(-45),
            Items =
            [
                new OrderItem
                {
                    Id = Guid.NewGuid(), PartNumber = "GB-77",
                    Description = "[Demo] Gearbox bracket, grey iron",
                    QuantityOrdered = 500, QuantityProduced = 500, QuantityDispatched = 500,
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
        db.Orders.Add(delivered);

        // Invoices: one partially paid (open), one paid (history)
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
        db.Invoices.Add(invoice);
        db.Invoices.Add(new Invoice
        {
            Id = Guid.NewGuid(),
            InvoiceNumber = "INV-DEMO-0001",
            CompanyId = company.Id,
            OrderId = delivered.Id,
            IssueDateUtc = now.AddDays(-60),
            DueDateUtc = now.AddDays(-30),
            Subtotal = 95000m,
            Tax = 17100m,
            Total = 112100m,
            AmountPaid = 112100m,
            BalanceDue = 0m,
            Status = InvoiceStatuses.Paid,
        });

        // A verified payment against the paid invoice's history
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

        // Customer-visible documents (metadata only — no binaries in seed)
        foreach (var (title, category) in new[]
        {
            ("[Demo] Inspection report — SO-DEMO-0000", DocumentCategories.InspectionReport),
            ("[Demo] Packing list — SO-DEMO-0000", DocumentCategories.PackingList),
            ("[Demo] Delivery challan — SO-DEMO-0000", DocumentCategories.DeliveryChallan),
        })
        {
            db.Documents.Add(new Document
            {
                Id = Guid.NewGuid(),
                CompanyId = company.Id,
                OrderId = delivered.Id,
                Title = title,
                Category = category,
                FileName = title.Replace("[Demo] ", "").Replace(" ", "-").ToLowerInvariant() + ".pdf",
                ContentType = "application/pdf",
                SizeBytes = 0,
                StorageKey = $"demo-{Guid.NewGuid():N}.pdf",
                IsCustomerVisible = true,
            });
        }
        // One internal-only document to prove visibility filtering
        db.Documents.Add(new Document
        {
            Id = Guid.NewGuid(),
            CompanyId = company.Id,
            OrderId = order.Id,
            Title = "[Demo internal] Process sheet — must never be visible to customers",
            Category = DocumentCategories.InspectionReport,
            FileName = "internal-process-sheet.pdf",
            ContentType = "application/pdf",
            SizeBytes = 0,
            StorageKey = $"demo-{Guid.NewGuid():N}.pdf",
            IsCustomerVisible = false,
        });

        // Notifications
        foreach (var (type, title, link, daysAgo, read) in new[]
        {
            (NotificationTypes.Quotation, "[Demo] Quotation QT-DEMO-0001 issued", "/customer/quotations", 12, true),
            (NotificationTypes.Order, "[Demo] SO-DEMO-0001 moved to In Production", "/customer/orders", 10, false),
            (NotificationTypes.Invoice, "[Demo] Invoice INV-DEMO-0002 issued", "/customer/invoices", 8, false),
        })
        {
            db.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Type = type,
                Title = title,
                LinkPath = link,
                IsRead = read,
                CreatedAtUtc = now.AddDays(-daysAgo),
            });
        }

        await db.SaveChangesAsync();
        logger.LogWarning("Seeded DEVELOPMENT demo customer '{Email}' with demo portal data. Do not use in production.", CustomerEmail);
    }
}
