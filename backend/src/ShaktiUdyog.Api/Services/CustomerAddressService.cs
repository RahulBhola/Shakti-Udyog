using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface ICustomerAddressService
{
    Task<IReadOnlyList<CompanyAddressDto>> GetAddressesAsync(CustomerContext ctx);
    Task<CompanyAddressDto?> CreateAddressAsync(CustomerContext ctx, CreateCompanyAddressRequest request, string? ip);
    Task<CompanyAddressDto?> UpdateAddressAsync(CustomerContext ctx, Guid addressId, UpdateCompanyAddressRequest request, string? ip);
    Task<bool> DeleteAddressAsync(CustomerContext ctx, Guid addressId, string? ip);
}

public class CustomerAddressService(
    AppDbContext db,
    IAuditWriter audit) : ICustomerAddressService
{
    public async Task<IReadOnlyList<CompanyAddressDto>> GetAddressesAsync(CustomerContext ctx)
    {
        var companyId = ctx.CompanyIds[0];
        return await db.CompanyAddresses
            .Where(ca => ca.CompanyId == companyId)
            .OrderByDescending(ca => ca.IsPrimary)
            .ThenBy(ca => ca.CreatedAtUtc)
            .Select(ca => new CompanyAddressDto(
                ca.Id, ca.AddressType, ca.Address, ca.City,
                ca.State, ca.Country, ca.PinCode, ca.IsPrimary, ca.CreatedAtUtc))
            .ToListAsync();
    }

    public async Task<CompanyAddressDto?> CreateAddressAsync(CustomerContext ctx, CreateCompanyAddressRequest request, string? ip)
    {
        var companyId = ctx.CompanyIds[0];
        var company = await db.Companies.SingleOrDefaultAsync(c => c.Id == companyId);
        if (company is null) return null;

        if (request.IsPrimary)
        {
            await db.CompanyAddresses
                .Where(ca => ca.CompanyId == companyId && ca.IsPrimary)
                .ExecuteUpdateAsync(setters => setters.SetProperty(ca => ca.IsPrimary, false));
        }

        var address = new CompanyAddress
        {
            CompanyId = companyId,
            AddressType = request.AddressType,
            Address = request.Address.Trim(),
            City = request.City?.Trim(),
            State = request.State?.Trim(),
            Country = request.Country?.Trim(),
            PinCode = request.PinCode?.Trim(),
            IsPrimary = request.IsPrimary
        };

        db.CompanyAddresses.Add(address);
        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.address.created", ctx.UserId, "CompanyAddress", address.Id.ToString(), ip);

        return new CompanyAddressDto(
            address.Id, address.AddressType, address.Address, address.City,
            address.State, address.Country, address.PinCode, address.IsPrimary, address.CreatedAtUtc);
    }

    public async Task<CompanyAddressDto?> UpdateAddressAsync(CustomerContext ctx, Guid addressId, UpdateCompanyAddressRequest request, string? ip)
    {
        var companyId = ctx.CompanyIds[0];
        var address = await db.CompanyAddresses
            .SingleOrDefaultAsync(ca => ca.Id == addressId && ca.CompanyId == companyId);
        if (address is null) return null;

        if (request.AddressType is not null) address.AddressType = request.AddressType;
        if (request.Address is not null) address.Address = request.Address.Trim();
        if (request.City is not null) address.City = request.City.Trim();
        if (request.State is not null) address.State = request.State.Trim();
        if (request.Country is not null) address.Country = request.Country.Trim();
        if (request.PinCode is not null) address.PinCode = request.PinCode.Trim();

        if (request.IsPrimary == true)
        {
            await db.CompanyAddresses
                .Where(ca => ca.CompanyId == companyId && ca.IsPrimary && ca.Id != addressId)
                .ExecuteUpdateAsync(setters => setters.SetProperty(ca => ca.IsPrimary, false));
            address.IsPrimary = true;
        }
        else if (request.IsPrimary == false)
        {
            address.IsPrimary = false;
        }

        address.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.address.updated", ctx.UserId, "CompanyAddress", addressId.ToString(), ip);

        return new CompanyAddressDto(
            address.Id, address.AddressType, address.Address, address.City,
            address.State, address.Country, address.PinCode, address.IsPrimary, address.CreatedAtUtc);
    }

    public async Task<bool> DeleteAddressAsync(CustomerContext ctx, Guid addressId, string? ip)
    {
        var companyId = ctx.CompanyIds[0];
        var address = await db.CompanyAddresses
            .SingleOrDefaultAsync(ca => ca.Id == addressId && ca.CompanyId == companyId);
        if (address is null) return false;

        db.CompanyAddresses.Remove(address);
        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.address.deleted", ctx.UserId, "CompanyAddress", addressId.ToString(), ip);
        return true;
    }
}
