using ShaktiUdyog.Domain.Entities;

namespace ShaktiUdyog.Infrastructure.Storage;

public interface IInvoicePdfService
{
    Task<Stream> GeneratePlaceholderAsync(Invoice invoice, CancellationToken ct = default);
}

public class PlaceholderInvoicePdfService : IInvoicePdfService
{
    public Task<Stream> GeneratePlaceholderAsync(Invoice invoice, CancellationToken ct = default)
    {
        var content = $"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 44>>stream\nBT /F1 24 Tf 100 700 Td (INVOICE {invoice.InvoiceNumber}) Tj ET\nendstream\nendobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000266 00000 n \n0000000362 00000 n \ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n423\n%%EOF\n";
        return Task.FromResult<Stream>(new MemoryStream(System.Text.Encoding.ASCII.GetBytes(content)));
    }
}
