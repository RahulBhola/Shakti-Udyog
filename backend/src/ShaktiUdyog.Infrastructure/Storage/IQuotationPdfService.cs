using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Infrastructure.Storage;

/// <summary>
/// Placeholder abstraction for quotation PDF generation (Milestone 5 spec).
/// Returns a minimal placeholder file until a proper PDF module is implemented
/// in a later milestone.
/// </summary>
public interface IQuotationPdfService
{
    /// <summary>Generates a placeholder PDF for the given quotation.</summary>
    Task<Stream> GeneratePlaceholderAsync(Quotation quotation, CancellationToken ct = default);
}

/// <summary>
/// Placeholder implementation that returns a minimal valid PDF with the
/// quotation number. Not for production use.
/// </summary>
public class PlaceholderQuotationPdfService : IQuotationPdfService
{
    public Task<Stream> GeneratePlaceholderAsync(Quotation quotation, CancellationToken ct = default)
    {
        // Minimal valid PDF — just enough to be opened by a PDF reader.
        // Content: "QUOTATION [NUMBER]" placeholder text.
        var content = $"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 44>>stream\nBT /F1 24 Tf 100 700 Td (QUOTATION {quotation.QuotationNumber}) Tj ET\nendstream\nendobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000266 00000 n \n0000000362 00000 n \ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n423\n%%EOF\n";
        var stream = new MemoryStream(System.Text.Encoding.ASCII.GetBytes(content));
        return Task.FromResult<Stream>(stream);
    }
}
