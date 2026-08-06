using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface ICustomerCompanyService
{
    Task<CompanyDetailDto?> GetCompanyAsync(CustomerContext ctx);
    Task<bool> UpdateCompanyAsync(CustomerContext ctx, UpdateCompanyRequest request, string? ip);
    Task<bool> SubmitVerificationAsync(CustomerContext ctx, string? ip);
}

public class CustomerCompanyService(
    AppDbContext db,
    IAuditWriter audit) : ICustomerCompanyService
{
    public async Task<CompanyDetailDto?> GetCompanyAsync(CustomerContext ctx)
    {
        var companyId = ctx.CompanyIds[0];
        var company = await db.Companies
            .Where(c => c.Id == companyId)
            .Select(c => new CompanyDetailDto(
                c.Id, c.Name,
                c.LegalBusinessName, c.BusinessType, c.Industry,
                c.Website, c.CompanyEmail, c.CompanyPhone,
                c.PurchaseEmail, c.AccountsEmail,
                c.AddressLine1, c.FactoryAddress,
                c.City, c.State, c.Country,
                c.PinCode ?? c.PostalCode,
                c.GstNumber, c.PANNumber, c.CINNumber, c.MSMENumber,
                c.PreferredCurrency, c.PreferredPaymentMethod,
                c.PreferredCommunication, c.PreferredLanguage,
                c.CompanyLogoUrl,
                c.VerificationStatus ?? "Pending",
                c.VerificationSubmittedOn, c.VerifiedOn,
                !string.IsNullOrEmpty(c.GstNumber),
                !string.IsNullOrEmpty(c.CompanyEmail),
                !string.IsNullOrEmpty(c.CompanyPhone)))
            .SingleOrDefaultAsync();
        return company;
    }

    public async Task<bool> UpdateCompanyAsync(CustomerContext ctx, UpdateCompanyRequest request, string? ip)
    {
        var companyId = ctx.CompanyIds[0];
        var company = await db.Companies.SingleOrDefaultAsync(c => c.Id == companyId);
        if (company is null) return false;

        if (request.LegalBusinessName is not null) company.LegalBusinessName = request.LegalBusinessName.Trim();
        if (request.BusinessType is not null) company.BusinessType = request.BusinessType;
        if (request.Industry is not null) company.Industry = request.Industry;
        if (request.Website is not null) company.Website = request.Website.Trim();
        if (request.CompanyEmail is not null) company.CompanyEmail = request.CompanyEmail.Trim();
        if (request.CompanyPhone is not null) company.CompanyPhone = request.CompanyPhone.Trim();
        if (request.PurchaseEmail is not null) company.PurchaseEmail = request.PurchaseEmail.Trim();
        if (request.AccountsEmail is not null) company.AccountsEmail = request.AccountsEmail.Trim();
        if (request.RegisteredAddress is not null) company.AddressLine1 = request.RegisteredAddress.Trim();
        if (request.FactoryAddress is not null) company.FactoryAddress = request.FactoryAddress.Trim();
        if (request.City is not null) company.City = request.City.Trim();
        if (request.State is not null) company.State = request.State.Trim();
        if (request.Country is not null) company.Country = request.Country.Trim();
        if (request.PinCode is not null) { company.PinCode = request.PinCode.Trim(); company.PostalCode = request.PinCode.Trim(); }
        if (request.GstNumber is not null) company.GstNumber = request.GstNumber.Trim().ToUpperInvariant();
        if (request.PanNumber is not null) company.PANNumber = request.PanNumber.Trim().ToUpperInvariant();
        if (request.CinNumber is not null) company.CINNumber = request.CinNumber.Trim().ToUpperInvariant();
        if (request.MsmeNumber is not null) company.MSMENumber = request.MsmeNumber.Trim().ToUpperInvariant();
        if (request.PreferredCurrency is not null) company.PreferredCurrency = request.PreferredCurrency;
        if (request.PreferredPaymentMethod is not null) company.PreferredPaymentMethod = request.PreferredPaymentMethod;
        if (request.PreferredCommunication is not null) company.PreferredCommunication = request.PreferredCommunication;
        if (request.PreferredLanguage is not null) company.PreferredLanguage = request.PreferredLanguage;

        company.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.company.updated", ctx.UserId, "Company", companyId.ToString(), ip);
        return true;
    }

    public async Task<bool> SubmitVerificationAsync(CustomerContext ctx, string? ip)
    {
        var companyId = ctx.CompanyIds[0];
        var company = await db.Companies.SingleOrDefaultAsync(c => c.Id == companyId);
        if (company is null) return false;

        company.VerificationStatus = Domain.Constants.VerificationStatuses.Submitted;
        company.VerificationSubmittedOn = DateTimeOffset.UtcNow;
        company.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.verification.submitted", ctx.UserId, "Company", companyId.ToString(), ip);
        return true;
    }
}
