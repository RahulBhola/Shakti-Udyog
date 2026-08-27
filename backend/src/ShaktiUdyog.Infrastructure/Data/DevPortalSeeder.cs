using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ShaktiUdyog.Domain.Constants;
using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Infrastructure.Data;

/// <summary>
/// DEVELOPMENT ONLY: seeds a clearly-labelled demo customer company and customer
/// user so customer authentication can be exercised in development.
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

        // Seed initial technical & quality documents for customer vault
        var now = DateTimeOffset.UtcNow;
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
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Seeded DEVELOPMENT demo customer '{Email}'. Do not use in production.", CustomerEmail);
    }
}
