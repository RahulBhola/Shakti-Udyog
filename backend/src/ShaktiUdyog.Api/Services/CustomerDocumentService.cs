using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShaktiUdyog.Api.Contracts.Customer;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Auditing;
using ShaktiUdyog.Infrastructure.Data;
using ShaktiUdyog.Infrastructure.Storage;

namespace ShaktiUdyog.Api.Services;

public interface ICustomerDocumentService
{
    Task<IReadOnlyList<CompanyDocumentDto>> GetDocumentsAsync(CustomerContext ctx);
    Task<UploadDocumentResponse?> UploadDocumentAsync(CustomerContext ctx, string documentType, IFormFile file, string? ip);
    Task<FileStreamResult?> DownloadDocumentAsync(CustomerContext ctx, Guid documentId, string? ip);
    Task<bool> DeleteDocumentAsync(CustomerContext ctx, Guid documentId, string? ip);
}

public class CustomerDocumentService(
    AppDbContext db,
    IAuditWriter audit,
    IFileStorageService storage) : ICustomerDocumentService
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "image/jpeg", "image/png", "image/svg+xml",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    };

    public async Task<IReadOnlyList<CompanyDocumentDto>> GetDocumentsAsync(CustomerContext ctx)
    {
        var companyId = ctx.CompanyIds[0];
        return await db.CompanyDocuments
            .Where(cd => cd.CompanyId == companyId)
            .OrderByDescending(cd => cd.UploadedAtUtc)
            .Select(cd => new CompanyDocumentDto(
                cd.Id, cd.DocumentType, cd.FileName, cd.SizeBytes,
                cd.Status, cd.Remarks, cd.UploadedAtUtc))
            .ToListAsync();
    }

    public async Task<UploadDocumentResponse?> UploadDocumentAsync(CustomerContext ctx, string documentType, IFormFile file, string? ip)
    {
        var companyId = ctx.CompanyIds[0];
        var company = await db.Companies.SingleOrDefaultAsync(c => c.Id == companyId);
        if (company is null) return null;

        // Validate file
        if (file.Length == 0 || file.Length > 11 * 1024 * 1024)
            throw new FileValidationException("File must be between 1 byte and 11 MB.");
        if (!AllowedContentTypes.Contains(file.ContentType))
            throw new FileValidationException($"File type '{file.ContentType}' is not accepted. Upload PDF, images, or Office documents.");

        // Validate extension
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".svg", ".doc", ".docx", ".xls", ".xlsx" };
        if (!allowedExtensions.Contains(ext))
            throw new FileValidationException($"File extension '{ext}' is not supported.");

        using var stream = file.OpenReadStream();
        var storedFile = await storage.SaveAsync(stream, file.FileName, file.ContentType);
        // Sanitize filename: remove path separators, keep only the file name
        var fileName = Path.GetFileName(file.FileName);
        if (string.IsNullOrEmpty(fileName)) fileName = "document";

        var doc = new CompanyDocument
        {
            CompanyId = companyId,
            DocumentType = documentType,
            FileName = fileName,
            ContentType = file.ContentType,
            SizeBytes = storedFile.SizeBytes,
            StorageKey = storedFile.StorageKey,
            Status = "Pending",
            UploadedByUserId = ctx.UserId
        };

        db.CompanyDocuments.Add(doc);
        await db.SaveChangesAsync();
        await audit.WriteAsync("customer.document.uploaded", ctx.UserId, "CompanyDocument", doc.Id.ToString(), ip);

        return new UploadDocumentResponse(doc.Id, doc.DocumentType, doc.FileName, "Document uploaded successfully.");
    }

    public async Task<FileStreamResult?> DownloadDocumentAsync(CustomerContext ctx, Guid documentId, string? ip)
    {
        var companyId = ctx.CompanyIds[0];
        var doc = await db.CompanyDocuments
            .SingleOrDefaultAsync(cd => cd.Id == documentId && cd.CompanyId == companyId);
        if (doc is null) return null;

        var stream = await storage.OpenReadAsync(doc.StorageKey);
        if (stream is null) return null;

        await audit.WriteAsync("customer.document.downloaded", ctx.UserId, "CompanyDocument", documentId.ToString(), ip);
        return new FileStreamResult(stream, doc.ContentType ?? "application/octet-stream") { FileDownloadName = doc.FileName };
    }

    public async Task<bool> DeleteDocumentAsync(CustomerContext ctx, Guid documentId, string? ip)
    {
        var companyId = ctx.CompanyIds[0];
        var doc = await db.CompanyDocuments
            .SingleOrDefaultAsync(cd => cd.Id == documentId && cd.CompanyId == companyId);
        if (doc is null) return false;

        db.CompanyDocuments.Remove(doc);
        await db.SaveChangesAsync();

        // Try to delete from storage as well (best-effort)
        try { await storage.DeleteAsync(doc.StorageKey); } catch { /* ignore */ }

        await audit.WriteAsync("customer.document.deleted", ctx.UserId, "CompanyDocument", documentId.ToString(), ip);
        return true;
    }
}
