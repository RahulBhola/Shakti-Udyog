import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { engineerApi } from "../../api/engineerApi";
import { apiDownload } from "../../api/client";
import { tokenStorage } from "../../auth/tokenStorage";
import { config } from "../../config";
import { Loading } from "../../components/ui";
import { formatMoney } from "../shared";
import {
  ClipboardList, FileText, ShoppingCart, Factory, Cog, Truck, Receipt, Wallet, AlertTriangle,
  Package, Building2, UserCheck, FileSearch, TrendingUp, BarChart3, Calendar, Users, Search,
  Download, RefreshCw, Eye, X, CheckCircle2, ChevronRight,
  FileSpreadsheet, Loader2, Sparkles,
  type LucideIcon,
} from "lucide-react";
import "./erpListView.css";

/* ------------------------------------------------------------------ */
/*  Types & Report Definitions                                         */
/* ------------------------------------------------------------------ */

interface ReportDef {
  name: string;
  category: "Sales" | "Finance" | "Production" | "Customers" | "Inventory";
  description: string;
  formats: ("PDF" | "Excel" | "CSV")[];
  icon: LucideIcon;
  color: string;
  bg: string;
  key: string;
}

const CATEGORIES = ["All", "Sales", "Finance", "Production", "Customers", "Inventory"] as const;

function catStyle(cat: string): { color: string; bg: string } {
  switch (cat) {
    case "Sales": return { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" };
    case "Finance": return { color: "#10B981", bg: "rgba(16,185,129,0.12)" };
    case "Production": return { color: "#F97316", bg: "rgba(249,115,22,0.12)" };
    case "Customers": return { color: "#A855F7", bg: "rgba(168,85,247,0.12)" };
    default: return { color: "#14B8A6", bg: "rgba(20,184,166,0.12)" };
  }
}

const REPORTS: ReportDef[] = [
  { name: "Customer Directory", category: "Customers", description: "Registered client companies, contact persons, tax registration, and verification status.", formats: ["PDF", "Excel", "CSV"], icon: Users, ...catStyle("Customers"), key: "customer" },
  { name: "Enquiry Pipeline Report", category: "Sales", description: "All incoming requests for quotation (RFQs), casting product types, materials, and stage statuses.", formats: ["PDF", "Excel", "CSV"], icon: ClipboardList, ...catStyle("Sales"), key: "enquiry" },
  { name: "Quotation Summary Report", category: "Sales", description: "Formal quotes issued, pricing totals, validity dates, accepted deals, and expired proposals.", formats: ["PDF", "Excel", "CSV"], icon: FileText, ...catStyle("Sales"), key: "quotation" },
  { name: "Sales Orders Report", category: "Sales", description: "Confirmed purchase orders, target delivery dates, milestone progress, and order quantities.", formats: ["PDF", "Excel", "CSV"], icon: ShoppingCart, ...catStyle("Sales"), key: "order" },
  { name: "Production & Shop Floor Jobs", category: "Production", description: "Active foundry batch jobs, casting patterns, metallurgical grades, and stage progression.", formats: ["PDF", "Excel", "CSV"], icon: Factory, ...catStyle("Production"), key: "production" },
  { name: "Manufacturing Throughput", category: "Production", description: "Molding, pouring, fettling, and machining capacity utilization across casting lines.", formats: ["PDF", "Excel", "CSV"], icon: Cog, ...catStyle("Production"), key: "manufacturing" },
  { name: "Logistics & Dispatch Report", category: "Production", description: "Completed shipments, freight transporter details, vehicle tracking numbers, and delivery status.", formats: ["PDF", "Excel", "CSV"], icon: Truck, ...catStyle("Production"), key: "dispatch" },
  { name: "Tax Invoices Register", category: "Finance", description: "Official GST tax invoices generated, taxable amounts, CGST/SGST/IGST, and payment statuses.", formats: ["PDF", "Excel", "CSV"], icon: Receipt, ...catStyle("Finance"), key: "invoice" },
  { name: "Payment Receipts & Collections", category: "Finance", description: "Bank transfers, RTGS/NEFT receipts, invoice payment reconciliations, and collection dates.", formats: ["PDF", "Excel", "CSV"], icon: Wallet, ...catStyle("Finance"), key: "payment" },
  { name: "Outstanding Balances & Aging", category: "Finance", description: "Overdue client balances, payment aging analysis, and pending credit settlements.", formats: ["PDF", "Excel", "CSV"], icon: AlertTriangle, ...catStyle("Finance"), key: "outstanding" },
  { name: "Product Catalog & Grades", category: "Inventory", description: "Master casting product catalog, material specifications (Grey, Ductile, SG Iron), and weight ranges.", formats: ["PDF", "Excel", "CSV"], icon: Package, ...catStyle("Inventory"), key: "product" },
  { name: "Company Account Registry", category: "Customers", description: "Verified customer organizations, GST numbers, registered locations, and contact details.", formats: ["PDF", "Excel", "CSV"], icon: Building2, ...catStyle("Customers"), key: "company" },
  { name: "User Platform Activity", category: "Customers", description: "User logins, permission grants, customer portal sessions, and audit timestamps.", formats: ["PDF", "Excel", "CSV"], icon: UserCheck, ...catStyle("Customers"), key: "user-activity" },
  { name: "Comprehensive Audit Trail", category: "Finance", description: "System audit logs, modification history, transaction logs, and administrative operations.", formats: ["PDF", "Excel", "CSV"], icon: FileSearch, ...catStyle("Finance"), key: "audit" },
  { name: "Sales Performance Funnel", category: "Sales", description: "Conversion metrics across enquiry-to-quote-to-order funnel and aggregate sales volume.", formats: ["PDF", "Excel", "CSV"], icon: TrendingUp, ...catStyle("Sales"), key: "sales-performance" },
  { name: "Monthly Revenue Analytics", category: "Finance", description: "Month-by-month revenue trends, invoice volumes, and collection trajectories.", formats: ["PDF", "Excel", "CSV"], icon: BarChart3, ...catStyle("Finance"), key: "revenue" },
  { name: "Profitability & Margin Summary", category: "Finance", description: "Total invoiced revenue, actual collected funds, and outstanding margins.", formats: ["PDF", "Excel", "CSV"], icon: TrendingUp, ...catStyle("Finance"), key: "profit" },
  { name: "Monthly Business Executive Summary", category: "Sales", description: "Consolidated high-level performance snapshot for leadership and stakeholder review.", formats: ["PDF", "Excel", "CSV"], icon: Calendar, ...catStyle("Sales"), key: "monthly-summary" },
];

const POPULAR_REPORTS = [
  "Monthly Business Executive Summary",
  "Sales Performance Funnel",
  "Outstanding Balances & Aging",
  "Production & Shop Floor Jobs",
  "Customer Directory",
];

interface FinanceSummary {
  outstandingAmount: number;
  collectedAmount: number;
}

interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

/* ------------------------------------------------------------------ */
/*  RFC-Compliant CSV Parser for Rich Table Previews                   */
/* ------------------------------------------------------------------ */

function parseCsv(text: string): ParsedCsv {
  const clean = text.replace(/^\uFEFF/, "").trim();
  if (!clean) return { headers: [], rows: [] };

  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) return { headers: [], rows: [] };
  return {
    headers: lines[0],
    rows: lines.slice(1),
  };
}

/* ------------------------------------------------------------------ */
/*  Interactive Live Report Preview Modal                              */
/* ------------------------------------------------------------------ */

function ReportPreviewModal({
  report,
  rawContent,
  onClose,
  onDownload,
}: {
  report: ReportDef;
  rawContent: string;
  onClose: () => void;
  onDownload: (key: string, format: "pdf" | "excel" | "csv") => void;
}) {
  const [search, setSearch] = useState("");
  const parsed = useMemo(() => parseCsv(rawContent), [rawContent]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parsed.rows;
    return parsed.rows.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(q))
    );
  }, [parsed.rows, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={onClose}>
      <div
        className="w-full max-w-5xl bg-white dark:bg-[#121520] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between bg-neutral-50/70 dark:bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: report.bg, color: report.color }}>
              <report.icon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-neutral-900 dark:text-white m-0">
                  {report.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-200/70 dark:bg-white/10 text-neutral-700 dark:text-neutral-300">
                  {parsed.rows.length} Records
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0 mt-0.5">
                Live ERP database preview • Generated on {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-56 hidden sm:block">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search in preview..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#161a26] text-neutral-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Table Content */}
        <div className="flex-1 overflow-auto p-6">
          {parsed.rows.length === 0 ? (
            <div className="py-20 text-center text-neutral-400">
              <FileSpreadsheet size={40} className="mx-auto opacity-30 mb-2" />
              <p className="text-sm font-medium">No records found for this report.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200/80 dark:border-white/10 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-100/80 dark:bg-white/[0.04] border-b border-neutral-200 dark:border-white/10">
                    <th className="py-2.5 px-3.5 text-[10px] font-extrabold uppercase tracking-wider text-neutral-500 w-12 text-center">
                      #
                    </th>
                    {parsed.headers.map((h, i) => (
                      <th key={i} className="py-2.5 px-3.5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.04]">
                  {filteredRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-neutral-50/80 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3.5 text-neutral-400 font-mono text-[11px] text-center">
                        {rIdx + 1}
                      </td>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="py-2.5 px-3.5 text-neutral-800 dark:text-neutral-200 font-medium whitespace-nowrap">
                          {cell || <span className="text-neutral-400/50 italic">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer with Direct Export Controls */}
        <div className="px-6 py-4 bg-neutral-50/70 dark:bg-[#0f121a] border-t border-neutral-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Showing {filteredRows.length} of {parsed.rows.length} records
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onDownload(report.key, "pdf")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download size={13} />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={() => onDownload(report.key, "excel")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <FileSpreadsheet size={13} />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={() => onDownload(report.key, "csv")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#161a26] text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download size={13} />
              <span>Download CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-200/80 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-bold hover:bg-neutral-300 dark:hover:bg-white/20 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Reports & BI Page Component                                   */
/* ------------------------------------------------------------------ */

export default function AdminReportsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [counts, setCounts] = useState<{ enquiries: number; quotations: number; orders: number; invoices: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // In-flight downloading state by reportKey
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  // Preview state
  const [previewReportDef, setPreviewReportDef] = useState<ReportDef | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoadingKey, setPreviewLoadingKey] = useState<string | null>(null);

  const load = useCallback((isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    Promise.all([
      engineerApi.enquiries(1, 1).then((r) => r.totalCount).catch(() => 0),
      engineerApi.quotations(1, 1).then((r) => r.totalCount).catch(() => 0),
      engineerApi.orders(1, 1).then((r) => r.totalCount).catch(() => 0),
      adminApi.invoices(1, 1).then((r) => r.totalCount).catch(() => 0),
      adminApi.financialDashboard().then(setFinance).catch(() => {}),
    ]).then(([enquiries, quotations, orders, invoices]) => {
      setCounts({ enquiries, quotations, orders, invoices });
      if (isManual) {
        setFeedbackNotice("Report metrics and data refreshed successfully.");
        setTimeout(() => setFeedbackNotice(null), 2500);
      }
    }).finally(() => {
      setLoading(false);
      if (isManual) setRefreshing(false);
    });
  }, []);

  useEffect(() => { void load(false); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return REPORTS.filter((r) => {
      if (category !== "All" && r.category !== category) return false;
      if (q && !r.name.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, category]);

  const revenue = (finance?.collectedAmount ?? 0) + (finance?.outstandingAmount ?? 0);

  // Download Handler with visual feedback
  const handleDownload = async (key: string, format: "pdf" | "excel" | "csv") => {
    setDownloadingKey(`${key}-${format}`);
    try {
      const ext = format === "excel" ? "xls" : format;
      await apiDownload(`/api/v1/admin/reports/${key}?format=${format}`, `${key}-report.${ext}`);
      setFeedbackNotice(`Report generated and downloaded (${format.toUpperCase()}).`);
      setTimeout(() => setFeedbackNotice(null), 3000);
    } catch {
      window.alert("Failed to download report. Please try again.");
    } finally {
      setDownloadingKey(null);
    }
  };

  // Preview Handler with loading state
  const handlePreview = async (report: ReportDef) => {
    setPreviewLoadingKey(report.key);
    try {
      const token = tokenStorage.getAccessToken();
      const res = await fetch(`${config.apiBaseUrl}/api/v1/admin/reports/${report.key}?format=csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load report data");
      const text = await res.text();
      setPreviewReportDef(report);
      setPreviewContent(text);
    } catch (e: any) {
      window.alert(e instanceof Error ? e.message : "Failed to load report preview.");
    } finally {
      setPreviewLoadingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* 1. HERO HEADER                                                    */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shadow-sm">
            <BarChart3 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
                Reports & Business Intelligence
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200/70 dark:border-white/10">
                18 Available Reports
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
              Generate, preview, and export high-resolution PDF documents, Excel spreadsheets, and CSV files across sales, finance, and manufacturing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer disabled:opacity-60"
            title="Refresh Report Data"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin text-orange-500" : ""} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {feedbackNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. KPI METRICS CARDS (6 Metrics)                                  */}
      {/* ================================================================= */}
      {loading && !counts ? (
        <div className="py-8 text-center"><Loading label="Loading business metrics summary..." /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Enquiries */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(59,130,246,0.18),transparent)] before:pointer-events-none">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <ClipboardList size={18} />
            </div>
            <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight">
              {(counts?.enquiries ?? 0).toLocaleString()}
            </div>
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Enquiries</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Total RFQs</div>
          </div>

          {/* Quotes */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(168,85,247,0.18),transparent)] before:pointer-events-none">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div className="text-2xl sm:text-[26px] font-extrabold text-purple-600 dark:text-purple-400 mt-3 leading-tight tracking-tight">
              {(counts?.quotations ?? 0).toLocaleString()}
            </div>
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Quotes</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Issued Quotes</div>
          </div>

          {/* Orders */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(249,115,22,0.18),transparent)] before:pointer-events-none">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <ShoppingCart size={18} />
            </div>
            <div className="text-2xl sm:text-[26px] font-extrabold text-orange-600 dark:text-orange-400 mt-3 leading-tight tracking-tight">
              {(counts?.orders ?? 0).toLocaleString()}
            </div>
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Orders</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Confirmed</div>
          </div>

          {/* Invoices */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(20,184,166,0.18),transparent)] before:pointer-events-none">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
              <Receipt size={18} />
            </div>
            <div className="text-2xl sm:text-[26px] font-extrabold text-teal-600 dark:text-teal-400 mt-3 leading-tight tracking-tight">
              {(counts?.invoices ?? 0).toLocaleString()}
            </div>
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Invoices</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Generated</div>
          </div>

          {/* Revenue */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(16,185,129,0.18),transparent)] before:pointer-events-none">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <div className="text-2xl sm:text-[26px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-3 leading-tight tracking-tight">
              {formatMoney(revenue)}
            </div>
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Revenue</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Total Billed</div>
          </div>

          {/* Outstanding */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(249,115,22,0.18),transparent)] before:pointer-events-none">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Wallet size={18} />
            </div>
            <div className="text-2xl sm:text-[26px] font-extrabold text-amber-600 dark:text-amber-400 mt-3 leading-tight tracking-tight">
              {formatMoney(finance?.outstandingAmount)}
            </div>
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Outstanding</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Pending Credit</div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 3. TOOLBAR & SEGMENTED CATEGORY TABS                              */}
      {/* ================================================================= */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Real-time Search Input */}
          <div className="relative w-full lg:w-96">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports by title, keyword, or domain..."
              className="w-full pl-10 pr-4 h-10 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-orange-500 shadow-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Segmented Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {CATEGORIES.map((cat) => {
              const isCurrent = category === cat;
              const count = cat === "All" ? REPORTS.length : REPORTS.filter((r) => r.category === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    isCurrent ? "bg-white/20 text-white" : "bg-neutral-200/70 dark:bg-white/10 text-neutral-500 dark:text-neutral-400"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Popular Reports Quick-Pill Recommendations */}
        <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-neutral-400 flex items-center gap-1">
            <Sparkles size={12} className="text-amber-500" /> Popular Reports:
          </span>
          {POPULAR_REPORTS.map((pop) => (
            <button
              key={pop}
              type="button"
              onClick={() => {
                setCategory("All");
                setSearch(pop);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-neutral-100 dark:bg-white/5 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-white/10 transition-colors cursor-pointer"
            >
              <span>{pop}</span>
              <ChevronRight size={11} className="opacity-50" />
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. MODERN 3-COLUMN REPORT CARDS GRID                              */}
      {/* ================================================================= */}
      {filtered.length === 0 ? (
        <div className="py-24 text-center text-neutral-400 space-y-2 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a]">
          <BarChart3 size={44} className="mx-auto opacity-30" />
          <p className="text-sm font-medium text-neutral-500">No reports match your current search.</p>
          <button
            type="button"
            onClick={() => { setSearch(""); setCategory("All"); }}
            className="text-xs text-[var(--color-primary)] hover:underline font-bold cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => {
            const Icon = r.icon;
            const isPreviewLoading = previewLoadingKey === r.key;
            const isPdfDownloading = downloadingKey === `${r.key}-pdf`;
            const isExcelDownloading = downloadingKey === `${r.key}-excel`;

            return (
              <div
                key={r.key}
                className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-5 shadow-xs flex flex-col justify-between hover:border-orange-500/30 transition-all group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0" style={{ background: r.bg, color: r.color }}>
                      <Icon size={20} />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border border-neutral-200/60 dark:border-white/5">
                      {r.category}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="mt-3.5">
                    <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white m-0 group-hover:text-[var(--color-primary)] transition-colors">
                      {r.name}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed m-0">
                      {r.description}
                    </p>
                  </div>

                  {/* Available Export Formats */}
                  <div className="flex items-center gap-1.5 mt-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mr-1">Formats:</span>
                    <button
                      type="button"
                      onClick={() => handleDownload(r.key, "pdf")}
                      className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors cursor-pointer"
                      title="Download PDF"
                    >
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(r.key, "excel")}
                      className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors cursor-pointer"
                      title="Export Excel"
                    >
                      Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(r.key, "csv")}
                      className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors cursor-pointer"
                      title="Download CSV"
                    >
                      CSV
                    </button>
                  </div>
                </div>

                {/* Card CTA Action Footer */}
                <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-white/5 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={isPreviewLoading}
                    onClick={() => handlePreview(r)}
                    className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-60"
                    title="Live Data Preview"
                  >
                    {isPreviewLoading ? <Loader2 size={13} className="animate-spin text-blue-500" /> : <Eye size={13} />}
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    disabled={isPdfDownloading}
                    onClick={() => handleDownload(r.key, "pdf")}
                    className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-60"
                    title="Generate High-Res PDF"
                  >
                    {isPdfDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    <span>PDF</span>
                  </button>

                  <button
                    type="button"
                    disabled={isExcelDownloading}
                    onClick={() => handleDownload(r.key, "excel")}
                    className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-60"
                    title="Export Excel Worksheet"
                  >
                    {isExcelDownloading ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
                    <span>Excel</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================= */}
      {/* 5. INTERACTIVE LIVE DATA PREVIEW MODAL                            */}
      {/* ================================================================= */}
      {previewReportDef && previewContent && (
        <ReportPreviewModal
          report={previewReportDef}
          rawContent={previewContent}
          onClose={() => {
            setPreviewReportDef(null);
            setPreviewContent(null);
          }}
          onDownload={(key, format) => void handleDownload(key, format)}
        />
      )}
    </div>
  );
}
