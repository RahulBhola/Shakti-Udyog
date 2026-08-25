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
/// Generates comprehensive, downloadable enterprise reports from live business data.
/// Delivers all available domain attributes across customers, orders, manufacturing,
/// finance, inventory, quotations, and security audit logs.
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
            Encoding.UTF8.GetBytes("\uFEFF" + csv),
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

    // ── 1. Tax Invoices & Outstanding Balances ──────────────────────────────

    private async Task<ReportData> InvoiceReportAsync() => await InvoiceRowsAsync("Tax Invoices Register", i => true);

    private async Task<ReportData> OutstandingReportAsync() =>
        await InvoiceRowsAsync("Outstanding Balances & Aging Report", i => i.BalanceDue > 0);

    private async Task<ReportData> InvoiceRowsAsync(string title, Expression<Func<Invoice, bool>> filter)
    {
        var invoices = await db.Invoices
            .Include(i => i.Order)
            .Include(i => i.Company)
            .Where(filter)
            .OrderByDescending(i => i.IssueDateUtc)
            .ToListAsync();

        var rows = invoices.Select(i => new[]
        {
            i.InvoiceNumber,
            i.Order != null ? i.Order.OrderNumber : "",
            i.Company != null ? i.Company.Name : "",
            i.Company != null ? (i.Company.GstNumber ?? "") : "",
            i.HsnSacCode ?? "7325",
            i.IssueDateUtc.ToString("yyyy-MM-dd"),
            i.DueDateUtc.HasValue ? i.DueDateUtc.Value.ToString("yyyy-MM-dd") : "",
            i.Currency,
            i.Subtotal.ToString("0.00"),
            i.Discount.ToString("0.00"),
            i.Tax.ToString("0.00"),
            i.Freight.ToString("0.00"),
            i.Packing.ToString("0.00"),
            i.OtherCharges.ToString("0.00"),
            i.Total.ToString("0.00"),
            i.AmountPaid.ToString("0.00"),
            i.BalanceDue.ToString("0.00"),
            i.Status,
            i.PaymentTerms ?? "",
            i.Notes ?? "",
        }).ToList();

        return new ReportData(title, [
            "Invoice Number", "Order Number", "Company Name", "Client GSTIN", "HSN/SAC", "Issue Date", "Due Date",
            "Currency", "Subtotal (₹)", "Discount (₹)", "GST / Tax (₹)", "Freight (₹)", "Packing (₹)", "Other Charges (₹)",
            "Grand Total (₹)", "Paid Amount (₹)", "Balance Due (₹)", "Payment Status", "Payment Terms", "Notes"
        ], rows);
    }

    // ── 2. Customer Directory & Company Account Registry ─────────────────────

    private async Task<ReportData> CustomerReportAsync()
    {
        var companies = await db.Companies
            .Include(c => c.ContactPersons)
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync();

        var userCompanies = await db.UserCompanies
            .Include(uc => uc.User)
            .ToListAsync();

        var enquiriesCount = await db.Enquiries.Where(e => e.CompanyId != null).GroupBy(e => e.CompanyId).ToDictionaryAsync(g => g.Key!.Value, g => g.Count());
        var quotesCount = await db.Quotations.GroupBy(q => q.CompanyId).ToDictionaryAsync(g => g.Key, g => g.Count());
        var ordersCount = await db.Orders.GroupBy(o => o.CompanyId).ToDictionaryAsync(g => g.Key, g => g.Count());

        var rows = companies.Select(c =>
        {
            var linkedUser = userCompanies.FirstOrDefault(uc => uc.CompanyId == c.Id)?.User;
            var primaryContact = c.ContactPersons.FirstOrDefault();
            var contactName = primaryContact?.Name ?? linkedUser?.FullName ?? "";
            var email = !string.IsNullOrWhiteSpace(c.CompanyEmail) ? c.CompanyEmail : (linkedUser?.Email ?? primaryContact?.Email ?? "");
            var phone = !string.IsNullOrWhiteSpace(c.CompanyPhone) ? c.CompanyPhone : (linkedUser?.PhoneNumber ?? primaryContact?.Phone ?? "");
            var pincode = c.PostalCode ?? c.PinCode ?? "";
            var enq = enquiriesCount.GetValueOrDefault(c.Id, 0);
            var qts = quotesCount.GetValueOrDefault(c.Id, 0);
            var ord = ordersCount.GetValueOrDefault(c.Id, 0);

            return new[]
            {
                c.Name,
                c.LegalBusinessName ?? c.Name,
                c.GstNumber ?? "",
                c.PANNumber ?? "",
                c.CINNumber ?? "",
                c.MSMENumber ?? "",
                c.Industry ?? c.BusinessType ?? "",
                contactName,
                email,
                phone,
                c.Website ?? "",
                c.AddressLine1 ?? "",
                c.City ?? "",
                c.State ?? "",
                pincode,
                c.Country ?? "India",
                c.VerificationStatus ?? "Pending",
                c.IsActive ? "Active" : "Deactivated",
                enq.ToString(),
                qts.ToString(),
                ord.ToString(),
                c.CreatedAtUtc.ToString("yyyy-MM-dd"),
            };
        }).ToList();

        return new ReportData("Customer Directory Report", [
            "Company Name", "Legal Name", "GSTIN", "PAN", "CIN / Reg No", "MSME No", "Industry",
            "Primary Contact", "Email", "Phone", "Website", "Registered Address", "City", "State", "Pincode", "Country",
            "Verification Status", "Account Status", "Enquiries Count", "Quotes Count", "Orders Count", "Registered Date"
        ], rows);
    }

    // ── 3. Client Enquiries Pipeline Report ──────────────────────────────────

    private async Task<ReportData> EnquiryReportAsync()
    {
        var enquiries = await db.Enquiries
            .Include(e => e.Company)
            .OrderByDescending(e => e.CreatedAtUtc)
            .ToListAsync();

        var rows = enquiries.Select(r => new[]
        {
            r.Id.ToString()[..8].ToUpperInvariant(),
            !string.IsNullOrWhiteSpace(r.CompanyName) ? r.CompanyName : (r.Company?.Name ?? ""),
            r.FullName,
            r.Email,
            r.Phone,
            r.Industry ?? "",
            r.ProductType,
            r.PartName ?? "",
            r.PartNumber ?? "",
            r.MaterialGrade ?? "",
            r.MaterialStandard ?? "",
            r.ApproxWeight.HasValue ? r.ApproxWeight.Value.ToString("0.00") : "",
            r.Quantity,
            r.PrototypeQuantity ?? "",
            r.ProductionQuantity ?? "",
            r.AnnualRequirement ?? "",
            r.DeliveryLocation ?? "",
            r.ExpectedDeliveryDate.HasValue ? r.ExpectedDeliveryDate.Value.ToString("yyyy-MM-dd") : "",
            r.PreferredDeliveryTerms ?? "",
            r.Priority,
            r.Status,
            r.RequirementDetails,
            r.CreatedAtUtc.ToString("yyyy-MM-dd HH:mm"),
        }).ToList();

        return new ReportData("Enquiry Pipeline Report", [
            "Enquiry ID", "Company Name", "Contact Person", "Email Address", "Phone Number", "Industry",
            "Product Type", "Part Name", "Part Number", "Material Grade", "Material Standard", "Approx Weight (kg)",
            "Quantity Required", "Prototype Qty", "Production Qty", "Annual Req", "Delivery Location",
            "Expected Delivery Date", "Delivery Terms", "Priority", "Enquiry Status", "Requirement Details", "Submitted Date"
        ], rows);
    }

    // ── 4. Commercial Quotations Summary Report ───────────────────────────────

    private async Task<ReportData> QuotationReportAsync()
    {
        var quotes = await db.Quotations
            .Include(q => q.Company)
            .Include(q => q.Enquiry)
            .OrderByDescending(q => q.CreatedAtUtc)
            .ToListAsync();

        var rows = quotes.Select(q => new[]
        {
            q.QuotationNumber,
            $"R{q.RevisionNumber}",
            q.Company != null ? q.Company.Name : (q.Enquiry != null ? q.Enquiry.CompanyName : ""),
            q.Company != null ? (q.Company.GstNumber ?? "") : "",
            q.Enquiry != null ? q.Enquiry.ProductType : "",
            q.Enquiry != null ? (q.Enquiry.MaterialGrade ?? "") : "",
            q.Enquiry != null ? q.Enquiry.Quantity : "",
            q.Currency,
            q.Subtotal.ToString("0.00"),
            q.Discount.ToString("0.00"),
            q.Tax.ToString("0.00"),
            q.Total.ToString("0.00"),
            q.Status,
            q.ValidUntilUtc.HasValue ? q.ValidUntilUtc.Value.ToString("yyyy-MM-dd") : "",
            q.DeliveryTime ?? "",
            q.DeliveryTerms ?? "",
            q.PaymentTerms ?? "",
            q.Freight ?? "",
            q.Warranty ?? "",
            q.CreatedAtUtc.ToString("yyyy-MM-dd"),
        }).ToList();

        return new ReportData("Quotation Summary Report", [
            "Quotation No", "Revision", "Company Name", "Client GSTIN", "Product Type", "Material Grade", "Quantity",
            "Currency", "Subtotal (₹)", "Discount (₹)", "GST / Tax (₹)", "Grand Total (₹)", "Quotation Status",
            "Valid Till", "Delivery Time", "Delivery Terms", "Payment Terms", "Freight Terms", "Warranty", "Issued Date"
        ], rows);
    }

    // ── 5. Sales Orders Report ────────────────────────────────────────────────

    private async Task<ReportData> OrderReportAsync()
    {
        var orders = await db.Orders
            .Include(o => o.Company)
            .Include(o => o.AssignedToUser)
            .Include(o => o.Items)
            .OrderByDescending(o => o.PlacedAtUtc)
            .ToListAsync();

        var rows = orders.Select(o => new[]
        {
            o.OrderNumber,
            o.PurchaseOrderReference ?? "",
            o.Company != null ? o.Company.Name : "",
            o.Company != null ? (o.Company.GstNumber ?? "") : "",
            o.PlacedAtUtc.ToString("yyyy-MM-dd"),
            o.PromisedDispatchDateUtc.HasValue ? o.PromisedDispatchDateUtc.Value.ToString("yyyy-MM-dd") : "",
            o.ManufacturingStage ?? "Stage 1",
            o.Status,
            o.Items.Sum(i => i.QuantityOrdered).ToString(),
            o.QuotationTotal.HasValue ? o.QuotationTotal.Value.ToString("0.00") : "0.00",
            $"{o.AdvancePercent}%",
            o.AdvanceAmount.HasValue ? o.AdvanceAmount.Value.ToString("0.00") : "0.00",
            o.AdvancePaid ? "Paid / Verified" : "Pending",
            o.AdvancePaymentRef ?? "",
            o.AssignedToUser != null ? (o.AssignedToUser.FullName ?? o.AssignedToUser.Email ?? "") : "",
            o.DeliveryAddress ?? (o.Company != null ? $"{o.Company.AddressLine1}, {o.Company.City}" : ""),
            o.LastUpdatedAtUtc.ToString("yyyy-MM-dd HH:mm"),
        }).ToList();

        return new ReportData("Sales Orders Report", [
            "Order Number", "PO Reference", "Company Name", "Client GSTIN", "Placed Date", "Promised Dispatch Date",
            "Manufacturing Stage", "Order Status", "Total Items Qty", "Quotation Total (₹)", "Advance %",
            "Advance Amount (₹)", "Advance Payment Status", "Advance Reference", "Assigned Engineer", "Delivery Address", "Last Updated"
        ], rows);
    }

    // ── 6. Master Product Catalog Report ──────────────────────────────────────

    private async Task<ReportData> ProductReportAsync()
    {
        var masters = await db.ProductMasters
            .Include(p => p.Category)
            .OrderBy(p => p.ProductCode)
            .ToListAsync();

        if (masters.Count > 0)
        {
            var rows = masters.Select(p => new[]
            {
                p.ProductCode,
                p.ProductName,
                p.Category != null ? p.Category.Name : "General",
                p.CastingType ?? "",
                p.Unit ?? "Nos",
                p.Material ?? "",
                p.MaterialGrade ?? "",
                p.Weight.HasValue ? p.Weight.Value.ToString("0.00") : "",
                p.Tolerance ?? "",
                p.Hardness ?? "",
                p.TensileStrength ?? "",
                p.HeatTreatment ?? "",
                p.SurfaceFinish ?? "",
                $"{p.Length?.ToString() ?? "—"} x {p.Width?.ToString() ?? "—"} x {p.Height?.ToString() ?? "—"}",
                p.DrawingNumber ?? "",
                p.PatternNumber ?? "",
                p.MachiningRequired ? "Yes" : "No",
                p.StandardCost.HasValue ? p.StandardCost.Value.ToString("0.00") : "0.00",
                p.SellingPrice.HasValue ? p.SellingPrice.Value.ToString("0.00") : "0.00",
                p.GstPercent.HasValue ? $"{p.GstPercent.Value}%" : "18%",
                p.HsnCode ?? "7325",
                p.Status,
                p.CreatedAtUtc.ToString("yyyy-MM-dd"),
            }).ToList();

            return new ReportData("Product Master Catalog Report", [
                "Product Code", "Product Name", "Category", "Casting Type", "Unit", "Material", "Material Grade",
                "Weight (kg)", "Tolerance", "Hardness", "Tensile Strength", "Heat Treatment", "Surface Finish",
                "Dimensions (L x W x H)", "Drawing No", "Pattern No", "Machining Req", "Standard Cost (₹)",
                "Selling Price (₹)", "GST %", "HSN Code", "Status", "Created Date"
            ], rows);
        }

        var webProducts = await db.Products
            .Include(p => p.Category)
            .OrderByDescending(p => p.CreatedAtUtc)
            .ToListAsync();

        var webRows = webProducts.Select(p => new[]
        {
            p.Title,
            p.Slug,
            p.Category != null ? p.Category.Name : "General",
            p.CommonGrades ?? "",
            p.CastingWeightRange ?? "",
            p.AvailableFinish ?? "",
            p.TypicalApplications ?? "",
            p.IsPublished ? "Published" : "Draft",
            p.CreatedAtUtc.ToString("yyyy-MM-dd"),
        }).ToList();

        return new ReportData("Product Catalogue Report", [
            "Product Title", "Slug / URL", "Category", "Material Grades", "Weight Range",
            "Available Finish", "Typical Applications", "Status", "Created Date"
        ], webRows);
    }

    // ── 7. Payment Receipts & Collections Report ───────────────────────────────

    private async Task<ReportData> PaymentReportAsync()
    {
        var payments = await db.Payments
            .Include(p => p.Company)
            .Include(p => p.Invoice)
                .ThenInclude(i => i.Order)
            .OrderByDescending(p => p.PaymentDateUtc)
            .ToListAsync();

        var rows = payments.Select(p => new[]
        {
            p.PaymentReference,
            p.Invoice != null ? p.Invoice.InvoiceNumber : "",
            p.Invoice?.Order != null ? p.Invoice.Order.OrderNumber : "",
            p.Company != null ? p.Company.Name : "",
            p.Company != null ? (p.Company.GstNumber ?? "") : "",
            p.Method,
            "INR",
            p.Amount.ToString("0.00"),
            p.PaymentDateUtc.ToString("yyyy-MM-dd"),
            p.Status,
            p.VerificationNote ?? "",
            p.CreatedAtUtc.ToString("yyyy-MM-dd HH:mm"),
        }).ToList();

        return new ReportData("Payment Receipts & Collections Report", [
            "Payment Reference", "Invoice Number", "Order Number", "Company Name", "Client GSTIN",
            "Payment Method", "Currency", "Amount (₹)", "Payment Date", "Payment Status", "Verification Note", "Submitted At"
        ], rows);
    }

    // ── 8. Comprehensive Audit Trail & Security Logs ──────────────────────────

    private async Task<ReportData> ActivityReportAsync()
    {
        var exclusions = new[] { "auth.", "token", "jwt", "refresh", "middleware", "api.", "worker", "login", "password" };
        var logs = await db.AuditLogs
            .Where(a => !exclusions.Any(e => a.Action.StartsWith(e)))
            .OrderByDescending(a => a.OccurredAtUtc)
            .Take(2000)
            .ToListAsync();

        var userIds = logs.Where(l => l.UserId.HasValue).Select(l => l.UserId!.Value).Distinct().ToList();
        var users = await db.Users.Where(u => userIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u);

        var rows = logs.Select(a =>
        {
            var user = a.UserId.HasValue && users.TryGetValue(a.UserId.Value, out var u) ? u : null;
            return new[]
            {
                a.OccurredAtUtc.ToString("yyyy-MM-dd HH:mm:ss"),
                user != null ? (user.FullName ?? user.Email ?? "User") : "System Engine",
                user?.Email ?? "",
                user?.Role ?? "Automated Trigger",
                a.Action,
                a.EntityType ?? "General",
                a.EntityId ?? "",
                a.IpAddress ?? "—",
                a.UserAgent ?? "—",
            };
        }).ToList();

        return new ReportData("Comprehensive Audit Trail Report", [
            "Timestamp (UTC)", "Actor / User Name", "User Email", "User Role", "Action Performed",
            "Module / Entity Type", "Target Entity ID", "IP Address", "User Agent"
        ], rows);
    }

    // ── 9. Production & Shop Floor Jobs ───────────────────────────────────────

    private async Task<ReportData> ProductionReportAsync()
    {
        var jobs = await db.ProductionJobs
            .Include(j => j.Company)
            .Include(j => j.Order)
            .OrderByDescending(j => j.CreatedAtUtc)
            .ToListAsync();

        var rows = jobs.Select(j => new[]
        {
            j.JobNumber,
            j.Order != null ? j.Order.OrderNumber : "",
            j.Company != null ? j.Company.Name : "",
            j.CastingName,
            j.PartNumber ?? "",
            j.DrawingNumber ?? "",
            j.PatternNumber ?? "",
            j.MaterialGrade ?? "",
            j.CastingWeight.HasValue ? j.CastingWeight.Value.ToString("0.00") : "",
            j.Quantity.ToString(),
            j.CurrentStage,
            j.Priority,
            $"{j.ProgressPercent}%",
            j.TargetDispatchDateUtc.HasValue ? j.TargetDispatchDateUtc.Value.ToString("yyyy-MM-dd") : "",
            j.EstimatedCompletionUtc.HasValue ? j.EstimatedCompletionUtc.Value.ToString("yyyy-MM-dd") : "",
            j.CurrentMachine ?? "",
            j.CurrentOperator ?? "",
            j.AssignedEngineer ?? "",
            j.Status,
            j.IsBlocked ? $"Blocked: {j.BlockReason}" : "Normal",
            j.CreatedAtUtc.ToString("yyyy-MM-dd"),
        }).ToList();

        return new ReportData("Production & Shop Floor Jobs Report", [
            "Job Number", "Order Number", "Company Name", "Casting Name", "Part Number", "Drawing No",
            "Pattern No", "Material Grade", "Unit Weight (kg)", "Batch Quantity", "Current Stage",
            "Priority", "Progress %", "Target Dispatch Date", "Estimated Completion", "Machine / Line",
            "Operator", "Assigned Engineer", "Job Status", "Block Status", "Job Created Date"
        ], rows);
    }

    // ── 10. Logistics & Outbound Dispatch Report ──────────────────────────────

    private async Task<ReportData> DispatchReportAsync()
    {
        var shipments = await db.Shipments
            .Include(s => s.Order)
                .ThenInclude(o => o.Company)
            .OrderByDescending(s => s.DispatchDateUtc)
            .ToListAsync();

        var rows = shipments.Select(s => new[]
        {
            s.Id.ToString()[..8].ToUpperInvariant(),
            s.Order != null ? s.Order.OrderNumber : "",
            s.Order?.Company != null ? s.Order.Company.Name : "",
            s.Transporter ?? "",
            s.TrackingNumber ?? "",
            s.VehicleNumber ?? "",
            s.PhoneNumber ?? "",
            s.DispatchDateUtc.HasValue ? s.DispatchDateUtc.Value.ToString("yyyy-MM-dd") : "",
            s.EstimatedArrivalUtc.HasValue ? s.EstimatedArrivalUtc.Value.ToString("yyyy-MM-dd") : "",
            s.DeliveredAtUtc.HasValue ? s.DeliveredAtUtc.Value.ToString("yyyy-MM-dd") : "",
            s.DeliveredAtUtc != null ? "Delivered" : (s.DispatchDateUtc != null ? "In Transit" : "Scheduled"),
            s.Order?.DeliveryAddress ?? "",
        }).ToList();

        return new ReportData("Logistics & Dispatch Report", [
            "Shipment ID", "Order Number", "Company Name", "Transporter Name", "Tracking / LR No",
            "Vehicle / Lorry No", "Transporter Contact", "Dispatch Date", "Estimated Arrival (ETA)",
            "Delivered Date", "Delivery Status", "Destination Address"
        ], rows);
    }

    // ── 11. Sales Performance Funnel ──────────────────────────────────────────

    private async Task<ReportData> SalesPerformanceReportAsync()
    {
        var totalEnquiries = await db.Enquiries.CountAsync();
        var totalQuotes = await db.Quotations.CountAsync();
        var totalOrders = await db.Orders.CountAsync();
        var totalInvoices = await db.Invoices.CountAsync();
        var totalPayments = await db.Payments.CountAsync();

        var quotationValue = await db.Quotations.SumAsync(q => (decimal?)q.Total) ?? 0;
        var orderValue = await db.Orders.SumAsync(o => (decimal?)o.QuotationTotal) ?? 0;
        var invoicedValue = await db.Invoices.SumAsync(i => (decimal?)i.Total) ?? 0;
        var collectedValue = await db.Payments.Where(p => p.Status == "Verified" || p.Status == "Completed" || p.Status == "Approved").SumAsync(p => (decimal?)p.Amount) ?? 0;

        var enquiryToQuoteRate = totalEnquiries > 0 ? (totalQuotes * 100.0 / totalEnquiries).ToString("0.1") + "%" : "0.0%";
        var quoteToOrderRate = totalQuotes > 0 ? (totalOrders * 100.0 / totalQuotes).ToString("0.1") + "%" : "0.0%";
        var orderToInvoiceRate = totalOrders > 0 ? (totalInvoices * 100.0 / totalOrders).ToString("0.1") + "%" : "0.0%";

        return new ReportData("Sales Performance Funnel Report", ["Funnel Stage / Metric", "Volume / Count", "Value (₹ INR)", "Conversion / Benchmark Rate"], new[]
        {
            new[] { "1. Client Enquiries (RFQs)", totalEnquiries.ToString(), "—", "100.0% Baseline" },
            new[] { "2. Commercial Quotations Issued", totalQuotes.ToString(), quotationValue.ToString("0.00"), $"{enquiryToQuoteRate} from Enquiries" },
            new[] { "3. Confirmed Sales Orders", totalOrders.ToString(), orderValue.ToString("0.00"), $"{quoteToOrderRate} from Quotations" },
            new[] { "4. GST Tax Invoices Generated", totalInvoices.ToString(), invoicedValue.ToString("0.00"), $"{orderToInvoiceRate} from Orders" },
            new[] { "5. Payment Collections Reconciled", totalPayments.ToString(), collectedValue.ToString("0.00"), invoicedValue > 0 ? $"{(collectedValue * 100.0m / invoicedValue):0.1}% Collection Rate" : "—" },
        });
    }

    // ── 12. Monthly Revenue Analytics ─────────────────────────────────────────

    private async Task<ReportData> RevenueReportAsync()
    {
        var invoices = await db.Invoices
            .OrderBy(i => i.IssueDateUtc)
            .ToListAsync();

        var grouped = invoices
            .GroupBy(i => new { i.IssueDateUtc.Year, i.IssueDateUtc.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g =>
            {
                var count = g.Count();
                var subtotal = g.Sum(i => i.Subtotal);
                var tax = g.Sum(i => i.Tax);
                var total = g.Sum(i => i.Total);
                var paid = g.Sum(i => i.AmountPaid);
                var balance = g.Sum(i => i.BalanceDue);

                return new[]
                {
                    $"{g.Key.Year}-{g.Key.Month:D2}",
                    count.ToString(),
                    subtotal.ToString("0.00"),
                    tax.ToString("0.00"),
                    total.ToString("0.00"),
                    paid.ToString("0.00"),
                    balance.ToString("0.00"),
                    total > 0 ? $"{(paid * 100.0m / total):0.1}%" : "0.0%",
                };
            }).ToList();

        return new ReportData("Monthly Revenue Analytics Report", [
            "Year-Month", "Invoices Count", "Subtotal (₹)", "GST / Tax (₹)", "Total Invoiced (₹)",
            "Total Collected (₹)", "Outstanding Balance (₹)", "Realization %"
        ], grouped);
    }

    // ── 13. Profitability & Margin Summary ────────────────────────────────────

    private async Task<ReportData> ProfitReportAsync()
    {
        var totalInvoiced = await db.Invoices.SumAsync(i => (decimal?)i.Total) ?? 0;
        var totalTax = await db.Invoices.SumAsync(i => (decimal?)i.Tax) ?? 0;
        var totalSubtotal = await db.Invoices.SumAsync(i => (decimal?)i.Subtotal) ?? 0;
        var totalCollected = await db.Invoices.SumAsync(i => (decimal?)i.AmountPaid) ?? 0;
        var totalOutstanding = await db.Invoices.SumAsync(i => (decimal?)i.BalanceDue) ?? 0;
        var totalDiscounts = await db.Invoices.SumAsync(i => (decimal?)i.Discount) ?? 0;

        return new ReportData("Profitability & Margin Summary Report", ["Financial Dimension", "Amount (₹ INR)", "Share % / Ratio", "Operational Notes"], new[]
        {
            new[] { "Gross Taxable Subtotal", totalSubtotal.ToString("0.00"), "100.0%", "Total manufacturing value billed" },
            new[] { "Total Discounts Given", totalDiscounts.ToString("0.00"), totalSubtotal > 0 ? $"{(totalDiscounts * 100.0m / totalSubtotal):0.1}%" : "0.0%", "Commercial discounts conceded" },
            new[] { "Statutory GST / Taxes", totalTax.ToString("0.00"), totalSubtotal > 0 ? $"{(totalTax * 100.0m / totalSubtotal):0.1}%" : "0.0%", "Pass-through statutory liabilities" },
            new[] { "Total Billed Turnover (Grand Total)", totalInvoiced.ToString("0.00"), "—", "Cumulative invoice revenue" },
            new[] { "Realized Collections (Paid)", totalCollected.ToString("0.00"), totalInvoiced > 0 ? $"{(totalCollected * 100.0m / totalInvoiced):0.1}%" : "0.0%", "Liquid collections deposited" },
            new[] { "Outstanding Receivables (Due)", totalOutstanding.ToString("0.00"), totalInvoiced > 0 ? $"{(totalOutstanding * 100.0m / totalInvoiced):0.1}%" : "0.0%", "Working capital in credit cycle" },
        });
    }

    // ── 14. Monthly Business Executive Summary ────────────────────────────────

    private async Task<ReportData> MonthlySummaryReportAsync()
    {
        var now = DateTimeOffset.UtcNow;
        var start = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, now.Offset);

        var mtdEnquiries = await db.Enquiries.CountAsync(r => r.CreatedAtUtc >= start);
        var mtdQuotations = await db.Quotations.CountAsync(q => q.CreatedAtUtc >= start);
        var mtdOrders = await db.Orders.CountAsync(o => o.PlacedAtUtc >= start);
        var mtdInvoices = await db.Invoices.CountAsync(i => i.IssueDateUtc >= start);
        var mtdJobs = await db.ProductionJobs.CountAsync(j => j.CreatedAtUtc >= start);
        var mtdShipments = await db.Shipments.CountAsync(s => s.DispatchDateUtc >= start);

        var mtdQuoteVal = await db.Quotations.Where(q => q.CreatedAtUtc >= start).SumAsync(q => (decimal?)q.Total) ?? 0;
        var mtdOrderVal = await db.Orders.Where(o => o.PlacedAtUtc >= start).SumAsync(o => (decimal?)o.QuotationTotal) ?? 0;
        var mtdRevenue = await db.Invoices.Where(i => i.IssueDateUtc >= start).SumAsync(i => (decimal?)i.Total) ?? 0;
        var mtdCollected = await db.Invoices.Where(i => i.IssueDateUtc >= start).SumAsync(i => (decimal?)i.AmountPaid) ?? 0;
        var mtdDue = await db.Invoices.Where(i => i.IssueDateUtc >= start).SumAsync(i => (decimal?)i.BalanceDue) ?? 0;

        return new ReportData($"Monthly Business Executive Summary ({now:MMMM yyyy})", ["Executive KPI / Functional Area", "MTD Count / Volume", "MTD Financial Value (₹)", "Operational Status"], new[]
        {
            new[] { "New Inbound Enquiries (RFQs)", mtdEnquiries.ToString(), "—", "Sales Pipeline Expansion" },
            new[] { "Commercial Quotations Issued", mtdQuotations.ToString(), mtdQuoteVal.ToString("0.00"), "Active Deals in Negotiation" },
            new[] { "Confirmed Purchase Orders", mtdOrders.ToString(), mtdOrderVal.ToString("0.00"), "Booked Production Demand" },
            new[] { "Shop Floor Jobs Initiated", mtdJobs.ToString(), "—", "Active Foundry Operations" },
            new[] { "Logistics Dispatches Completed", mtdShipments.ToString(), "—", "Outbound Fulfillment" },
            new[] { "GST Tax Invoices Generated", mtdInvoices.ToString(), mtdRevenue.ToString("0.00"), "Current Month Billed Turnover" },
            new[] { "Liquid Collections Realized", "—", mtdCollected.ToString("0.00"), "Cash Flow Inflows" },
            new[] { "Current Month Receivables Due", "—", mtdDue.ToString("0.00"), "Credit Cycle Tracking" },
        });
    }

    // ── Output Builders (CSV, PDF, Excel) ─────────────────────────────────────

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
                page.Size(PageSizes.A3.Landscape()); // A3 Landscape ensures wide column support
                page.Margin(20);
                page.DefaultTextStyle(x => x.FontSize(7));
                page.Header().PaddingBottom(10).Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text("SHAKTI UDYOG • ENTERPRISE ERP REPORT").FontSize(10).Bold().FontColor("#E06A26");
                        col.Item().Text(data.Title).FontSize(14).Bold().FontColor("#0F172A");
                    });
                    row.AutoItem().Text($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm UTC}").FontSize(8).FontColor("#64748B");
                });

                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        foreach (var _ in data.Headers) cols.RelativeColumn();
                    });
                    table.Header(header =>
                    {
                        foreach (var h in data.Headers)
                            header.Cell().Padding(4).Background("#0F172A").Text(h).FontColor("#FFFFFF").Bold().FontSize(7);
                    });
                    foreach (var row in data.Rows)
                    {
                        foreach (var cell in row)
                            table.Cell().Border(0.5f).BorderColor("#E2E8F0").Padding(3).Text(cell).FontSize(6.5f);
                    }
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Confidential • Shakti Udyog Management Report • Page ").FontSize(7).FontColor("#64748B");
                    x.CurrentPageNumber().FontSize(7).FontColor("#64748B");
                });
            });
        }).GeneratePdf();
    }
}
