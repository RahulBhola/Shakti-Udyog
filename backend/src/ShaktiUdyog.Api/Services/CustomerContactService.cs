using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

public interface ICustomerContactService
{
    Task<IReadOnlyList<ContactPersonDto>> GetContactsAsync(CustomerContext ctx);
    Task<ContactPersonDto?> CreateContactAsync(CustomerContext ctx, CreateContactPersonRequest request, string? ip);
    Task<ContactPersonDto?> UpdateContactAsync(CustomerContext ctx, Guid contactId, UpdateContactPersonRequest request, string? ip);
    Task<bool> DeleteContactAsync(CustomerContext ctx, Guid contactId, string? ip);
}

public class CustomerContactService(
    AppDbContext db,
    IAuditWriter audit) : ICustomerContactService
{
    public async Task<IReadOnlyList<ContactPersonDto>> GetContactsAsync(CustomerContext ctx)
    {
        var companyId = ctx.CompanyIds[0];
        return await db.ContactPersons
            .Where(cp => cp.CompanyId == companyId)
            .OrderByDescending(cp => cp.IsPrimary)
            .ThenBy(cp => cp.CreatedAtUtc)
            .Select(cp => new ContactPersonDto(
                cp.Id, cp.FullName, cp.Designation, cp.Department,
                cp.Email, cp.Phone, cp.IsPrimary, cp.CreatedAtUtc))
            .ToListAsync();
    }

    public async Task<ContactPersonDto?> CreateContactAsync(CustomerContext ctx, CreateContactPersonRequest request, string? ip)
    {
        var companyId = ctx.CompanyIds[0];
        var company = await db.Companies.SingleOrDefaultAsync(c => c.Id == companyId);
        if (company is null) return null;

        if (request.IsPrimary)
        {
            // Unset any existing primary contact
            await db.ContactPersons
                .Where(cp => cp.CompanyId == companyId && cp.IsPrimary)
                .ExecuteUpdateAsync(setters => setters.SetProperty(cp => cp.IsPrimary, false));
        }

        var contact = new ContactPerson
        {
            CompanyId = companyId,
            FullName = request.FullName.Trim(),
            Designation = request.Designation.Trim(),
            Department = request.Department?.Trim(),
            Email = request.Email.Trim(),
            Phone = request.Phone.Trim(),
            IsPrimary = request.IsPrimary
        };

        db.ContactPersons.Add(contact);
        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.contact.created", ctx.UserId, "ContactPerson", contact.Id.ToString(), ip);

        return new ContactPersonDto(
            contact.Id, contact.FullName, contact.Designation, contact.Department,
            contact.Email, contact.Phone, contact.IsPrimary, contact.CreatedAtUtc);
    }

    public async Task<ContactPersonDto?> UpdateContactAsync(CustomerContext ctx, Guid contactId, UpdateContactPersonRequest request, string? ip)
    {
        var companyId = ctx.CompanyIds[0];
        var contact = await db.ContactPersons
            .SingleOrDefaultAsync(cp => cp.Id == contactId && cp.CompanyId == companyId);
        if (contact is null) return null;

        if (request.FullName is not null) contact.FullName = request.FullName.Trim();
        if (request.Designation is not null) contact.Designation = request.Designation.Trim();
        if (request.Department is not null) contact.Department = request.Department.Trim();
        if (request.Email is not null) contact.Email = request.Email.Trim();
        if (request.Phone is not null) contact.Phone = request.Phone.Trim();

        if (request.IsPrimary == true)
        {
            await db.ContactPersons
                .Where(cp => cp.CompanyId == companyId && cp.IsPrimary && cp.Id != contactId)
                .ExecuteUpdateAsync(setters => setters.SetProperty(cp => cp.IsPrimary, false));
            contact.IsPrimary = true;
        }
        else if (request.IsPrimary == false)
        {
            contact.IsPrimary = false;
        }

        contact.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.contact.updated", ctx.UserId, "ContactPerson", contactId.ToString(), ip);

        return new ContactPersonDto(
            contact.Id, contact.FullName, contact.Designation, contact.Department,
            contact.Email, contact.Phone, contact.IsPrimary, contact.CreatedAtUtc);
    }

    public async Task<bool> DeleteContactAsync(CustomerContext ctx, Guid contactId, string? ip)
    {
        var companyId = ctx.CompanyIds[0];
        var contact = await db.ContactPersons
            .SingleOrDefaultAsync(cp => cp.Id == contactId && cp.CompanyId == companyId);
        if (contact is null) return false;

        db.ContactPersons.Remove(contact);
        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.contact.deleted", ctx.UserId, "ContactPerson", contactId.ToString(), ip);
        return true;
    }
}
