using System.Linq.Expressions;
using System.Text;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ShaktiUdyog.Domain.Entities;
using ShaktiUdyog.Infrastructure.Data;

namespace ShaktiUdyog.Api.Services;

/// <summary>Result of a generated report — file name, bytes, and MIME type.</summary>
public record ReportResult(string FileName, byte[] Content, string ContentType);

/// <summary>Structured report data used to build CSV, Excel, or PDF output.</summary>
public record ReportData(string Title, string[] Headers, IReadOnlyList<string[]> Rows);

public interface IReportService
{
    Task<ReportResult> GenerateAsync(string key, string format);
}

/// <summary>
/// Generates downloadable reports from live business data. Supports CSV, Excel
/// (CSV served with an .xls name), and PDF (via QuestPDF).
/// </summary>
public class ReportService(AppDbContext db) : IReportService
{
    static ReportService()
    {
        // QuestPDF community license (free for small organizations).
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<ReportResult> GenerateAsync(string key, string format)
    {
        var data = await BuildAsync(key);
        var f = format.ToLowerInvariant();

        if (f == "pdf")
            return new ReportResult($"{key}-report.pdf", BuildPdf(data), "application/pdf");

        var csv = BuildCsv(data);
        var isExcel = f == "excel";
        return new ReportResult(
            isExcel ? $"{key}-report.xls" : $"{key}-report.csv",
            Encoding.UTF8.GetBytes("﻿" + csv),
            isExcel ? "application/vnd.ms-excel" : "text/csv; charset=utf-8");
    }

    private async Task<ReportData> BuildAsync(string key) => key.ToLowerInvariant() switch
    {
        "invoice" => await InvoiceReportAsync(),
        "outstanding" => await OutstandingReportAsync(),
        "customer" => await CustomerReportAsync(),
        "company" => await CustomerReportAsync(),
        "enquiry" => await EnquiryReportAsync(),
        "quotation" => await QuotationReportAsync(),
        "order" => await OrderReportAsync(),
        "product" => await ProductReportAsync(),
        "payment" => await PaymentReportAsync(),
        "user-activity" => await ActivityReportAsync(),
        "audit" => await ActivityReportAsync(),
        "production" => await ProductionReportAsync(),
        "manufacturing" => await ProductionReportAsync(),
        "dispatch" => await DispatchReportAsync(),
        "sales-performance" => await SalesPerformanceReportAsync(),
        "revenue" => await RevenueReportAsync(),
        "profit" => await ProfitReportAsync(),
        "monthly-summary" => await MonthlySummaryReportAsync(),
        _ => throw new KeyNotFoundException($"Unknown report: {key}"),
    };

    // ---- Invoice ------------------------------------------------------------

    private async Task<ReportData> InvoiceReportAsync() => await InvoiceRowsAsync("Invoice Report", i => true);

    private async Task<ReportData> OutstandingReportAsync() =>
        await InvoiceRowsAsync("Outstanding Report", i => i.BalanceDue > 0);

    private async Task<ReportData> InvoiceRowsAsync(string title, Expression<Func<Invoice, bool>> filter)
    {
        var rows = await db.Invoices
            .Where(filter)
            .OrderByDescending(i => i.IssueDateUtc)
            .Select(i => new[] {
                i.InvoiceNumber,
                i.Order != null ? i.Order.OrderNumber : "",
                i.Company != null ? i.Company.Name : "",
                i.IssueDateUtc.ToString("yyyy-MM-dd"),
                i.DueDateUtc != null ? i.DueDateUtc.Value.ToString("yyyy-MM-dd") : "",
                i.Total.ToString("0.00"),
                i.AmountPaid.ToString("0.00"),
                i.BalanceDue.ToString("0.00"),
                i.Status,
            }).ToListAsync();
        return new ReportData(title, ["Invoice Number", "Order", "Company", "Issue Date", "Due Date", "Total", "Paid", "Balance", "Status"], rows);
    }

    // ---- Customer / Company -------------------------------------------------

    private async Task<ReportData> CustomerReportAsync()
    {
        var rows = await db.Companies
            .OrderByDescending(c => c.CreatedAtUtc)
            .Select(c => new[] {
                c.Name, c.GstNumber ?? "", c.City ?? "", c.State ?? "", c.Industry ?? "",
                c.CompanyEmail ?? "", c.CompanyPhone ?? "", c.VerificationStatus ?? "",
                c.IsActive ? "Active" : "Inactive", c.CreatedAtUtc.ToString("yyyy-MM-dd"),
            }).ToListAsync();
        return new ReportData("Customer Report", ["Company", "GST", "City", "State", "Industry", "Email", "Phone", "Status", "Active", "Registered"], rows);
    }

    // ---- Enquiry -----------------------------------------------------------------

    private async Task<ReportData> EnquiryReportAsync()
    {
        var rows = await db.Rfqs
            .OrderByDescending(r => r.CreatedAtUtc)
            .Select(r => new[] {
                r.CompanyName, r.FullName, r.Email, r.Phone, r.ProductType,
                r.MaterialGrade ?? "", r.Quantity, r.Status, r.CreatedAtUtc.ToString("yyyy-MM-dd"),
            }).ToListAsync();
        return new ReportData("RFQ Report", ["Company", "Contact", "Email", "Phone", "Product", "Grade", "Quantity", "Status", "Date"], rows);
    }

    // ---- Quotation -----------------------------------------------------------

    private async Task<ReportData> QuotationReportAsync()
    {
        var rows = await db.Quotations
            .OrderByDescending(q => q.CreatedAtUtc)
            .Select(q => new[] {
                q.QuotationNumber, q.Company != null ? q.Company.Name : "", q.Rfq.ProductType,
                q.Total.ToString("0.00"), q.Currency, q.Status,
                q.ValidUntilUtc != null ? q.ValidUntilUtc.Value.ToString("yyyy-MM-dd") : "",
                q.CreatedAtUtc.ToString("yyyy-MM-dd"),
            }).ToListAsync();
        return new ReportData("Quotation Report", ["Quotation", "Company", "Product", "Total", "Currency", "Status", "Valid Till", "Date"], rows);
    }

    // ---- Order ----------------------------------------------------------------

    private async Task<ReportData> OrderReportAsync()
    {
        var rows = await db.Orders
            .OrderByDescending(o => o.PlacedAtUtc)
            .Select(o => new[] {
                o.OrderNumber, o.Company != null ? o.Company.Name : "", o.Status,
                o.PlacedAtUtc.ToString("yyyy-MM-dd"),
                o.PromisedDispatchDateUtc != null ? o.PromisedDispatchDateUtc.Value.ToString("yyyy-MM-dd") : "",
                o.Items.Sum(i => i.QuantityOrdered).ToString(),
            }).ToListAsync();
        return new ReportData("Order Report", ["Order", "Company", "Status", "Placed", "Promised Dispatch", "Quantity"], rows);
    }

    // ---- Product ----------------------------------------------------------------

    private async Task<ReportData> ProductReportAsync()
    {
        var rows = await db.Products
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(p => new[] {
                p.Title, p.Slug, p.Category != null ? p.Category.Name : "",
                p.CommonGrades ?? "", p.CastingWeightRange ?? "",
                p.IsPublished ? "Published" : "Draft", p.CreatedAtUtc.ToString("yyyy-MM-dd"),
            }).ToListAsync();
        return new ReportData("Product Report", ["Product", "Slug", "Category", "Grades", "Weight Range", "Status", "Created"], rows);
    }

    // ---- Payment ----------------------------------------------------------------

    private async Task<ReportData> PaymentReportAsync()
    {
        var rows = await db.Payments
            .OrderByDescending(p => p.PaymentDateUtc)
            .Select(p => new[] {
                p.PaymentReference, p.Invoice != null ? p.Invoice.InvoiceNumber : "",
                p.Company != null ? p.Company.Name : "", p.Method, p.Amount.ToString("0.00"),
                p.PaymentDateUtc.ToString("yyyy-MM-dd"), p.Status,
            }).ToListAsync();
        return new ReportData("Payment Report", ["Reference", "Invoice", "Company", "Method", "Amount", "Date", "Status"], rows);
    }

    // ---- Activity / Audit ------------------------------------------------------

    private async Task<ReportData> ActivityReportAsync()
    {
        var exclusions = new[] { "auth.", "token", "jwt", "refresh", "middleware", "api.", "worker", "login", "password" };
        var rows = await db.AuditLogs
            .Where(a => !exclusions.Any(e => a.Action.StartsWith(e)))
            .OrderByDescending(a => a.OccurredAtUtc)
            .Take(2000)
            .Select(a => new[] {
                a.OccurredAtUtc.ToString("yyyy-MM-dd HH:mm"), a.UserId.HasValue ? a.UserId.Value.ToString() : "",
                a.Action, a.EntityType ?? "", a.EntityId ?? "", a.IpAddress ?? "",
            }).ToListAsync();
        return new ReportData("Activity Report", ["Time", "User", "Action", "Entity", "Entity ID", "IP Address"], rows);
    }

    // ---- Production ------------------------------------------------------------

    private async Task<ReportData> ProductionReportAsync()
    {
        var rows = await db.ProductionJobs
            .OrderByDescending(j => j.CreatedAtUtc)
            .Select(j => new[] {
                j.JobNumber, j.Company != null ? j.Company.Name : "", j.CastingName,
                j.PartNumber ?? "", j.MaterialGrade ?? "", j.Quantity.ToString(),
                j.CurrentStage, j.Priority, j.ProgressPercent.ToString(),
            }).ToListAsync();
        return new ReportData("Production Report", ["Job", "Company", "Casting", "Part No", "Grade", "Qty", "Stage", "Priority", "Progress %"], rows);
    }

    // ---- Dispatch ----------------------------------------------------------------

    private async Task<ReportData> DispatchReportAsync()
    {
        var rows = await db.Shipments
            .OrderByDescending(s => s.DispatchDateUtc)
            .Select(s => new[] {
                s.Order != null ? s.Order.OrderNumber : "",
                s.Transporter ?? "", s.TrackingNumber ?? "",
                s.DispatchDateUtc != null ? s.DispatchDateUtc.Value.ToString("yyyy-MM-dd") : "",
                s.EstimatedArrivalUtc != null ? s.EstimatedArrivalUtc.Value.ToString("yyyy-MM-dd") : "",
                s.DeliveredAtUtc != null ? "Delivered" : "In Transit",
            }).ToListAsync();
        return new ReportData("Dispatch Report", ["Order", "Transporter", "Tracking", "Dispatch Date", "ETA", "Status"], rows);
    }

    // ---- Sales performance / Revenue / Profit / Monthly --------------------------

    private async Task<ReportData> SalesPerformanceReportAsync()
    {
        var enquiries = await db.Enquiries.CountAsync();
        var quotations = await db.Quotations.CountAsync();
        var orders = await db.Orders.CountAsync();
        var invoices = await db.Invoices.CountAsync();
        var revenue = await db.Invoices.SumAsync(i => (decimal?)i.Total) ?? 0;
        return new ReportData("Sales Performance Report", ["Metric", "Value"], new[] {
            new[] { "Total Enquirys", enquiries.ToString() },
            new[] { "Quotations", quotations.ToString() },
            new[] { "Orders", orders.ToString() },
            new[] { "Invoices", invoices.ToString() },
            new[] { "Total Revenue", revenue.ToString("0.00") },
        });
    }

    private async Task<ReportData> RevenueReportAsync()
    {
        var rows = await db.Invoices
            .GroupBy(i => new { i.IssueDateUtc.Year, i.IssueDateUtc.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new[] {
                $"{g.Key.Year}-{g.Key.Month:D2}", g.Count().ToString(), g.Sum(i => i.Total).ToString("0.00"),
            }).ToListAsync();
        return new ReportData("Revenue Analytics", ["Month", "Invoices", "Revenue"], rows);
    }

    private async Task<ReportData> ProfitReportAsync()
    {
        var total = await db.Invoices.SumAsync(i => (decimal?)i.Total) ?? 0;
        var paid = await db.Invoices.SumAsync(i => (decimal?)i.AmountPaid) ?? 0;
        return new ReportData("Profit Report", ["Metric", "Value"], new[] {
            new[] { "Total Invoiced", total.ToString("0.00") },
            new[] { "Collected", paid.ToString("0.00") },
            new[] { "Outstanding", (total - paid).ToString("0.00") },
        });
    }

    private async Task<ReportData> MonthlySummaryReportAsync()
    {
        var now = DateTimeOffset.UtcNow;
        var start = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, now.Offset);
        var enquiries = await db.Enquiries.CountAsync(r => r.CreatedAtUtc >= start);
        var quotations = await db.Quotations.CountAsync(q => q.CreatedAtUtc >= start);
        var orders = await db.Orders.CountAsync(o => o.PlacedAtUtc >= start);
        var invoices = await db.Invoices.CountAsync(i => i.IssueDateUtc >= start);
        var revenue = await db.Invoices.Where(i => i.IssueDateUtc >= start).SumAsync(i => (decimal?)i.Total) ?? 0;
        return new ReportData("Monthly Business Summary", ["Metric", "Value"], new[] {
            new[] { "Enquirys (this month)", enquiries.ToString() },
            new[] { "Quotations (this month)", quotations.ToString() },
            new[] { "Orders (this month)", orders.ToString() },
            new[] { "Invoices (this month)", invoices.ToString() },
            new[] { "Revenue (this month)", revenue.ToString("0.00") },
        });
    }

    // ---- Output builders ---------------------------------------------------------

    private static string Escape(string? v) => $"\"{(v ?? "").Replace("\"", "\"\"")}\"";

    private static string BuildCsv(ReportData data)
    {
        var sb = new StringBuilder();
        sb.AppendLine(string.Join(",", data.Headers.Select(Escape)));
        foreach (var row in data.Rows) sb.AppendLine(string.Join(",", row.Select(Escape)));
        return sb.ToString();
    }

    private static byte[] BuildPdf(ReportData data)
    {
        return QuestPDF.Fluent.Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(24);
                page.DefaultTextStyle(x => x.FontSize(8));
                page.Header().PaddingBottom(12).Text(data.Title).FontSize(16).Bold();
                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        foreach (var _ in data.Headers) cols.RelativeColumn();
                    });
                    table.Header(header =>
                    {
                        foreach (var h in data.Headers)
                            header.Cell().Padding(4).Background("#2563EB").Text(h).FontColor("#FFFFFF").Bold();
                    });
                    foreach (var row in data.Rows)
                    {
                        foreach (var cell in row)
                            table.Cell().Border(0.5f).BorderColor("#E2E8F0").Padding(4).Text(cell);
                    }
                });
                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Generated ").FontSize(8).FontColor("#64748B");
                    x.CurrentPageNumber().FontSize(8).FontColor("#64748B");
                });
            });
        }).GeneratePdf();
    }
}
