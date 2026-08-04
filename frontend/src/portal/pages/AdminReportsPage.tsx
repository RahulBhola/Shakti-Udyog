import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { adminApi } from "../../api/adminApi";
import { updaterApi } from "../../api/updaterApi";
import { apiDownload } from "../../api/client";
import { tokenStorage } from "../../auth/tokenStorage";
import { config } from "../../config";
import { Loading } from "../../components/ui";
import { formatMoney } from "../shared";
import {
  ClipboardList, FileText, ShoppingCart, Factory, Cog, Truck, Receipt, Wallet, AlertTriangle,
  Package, Building2, UserCheck, FileSearch, TrendingUp, BarChart3, Calendar, Users, Search,
  Download, Plus, RefreshCw, Eye, ChevronRight, X, type LucideIcon,
} from "lucide-react";
import "./erpListView.css";

/* ------------------------------------------------------------------ */
/*  Report metadata                                                    */
/* ------------------------------------------------------------------ */

interface ReportDef {
  name: string;
  category: "Sales" | "Finance" | "Production" | "Customers" | "Inventory";
  description: string;
  formats: string[];
  icon: LucideIcon;
  color: string;
  bg: string;
  /** Backend report key; undefined = not yet available for generation. */
  key?: string;
}

const CATEGORIES = ["All", "Sales", "Finance", "Production", "Customers", "Inventory"];
const DATE_RANGES = ["Last 7 Days", "30 Days", "90 Days", "Custom"];

function catStyle(cat: string): { color: string; bg: string } {
  switch (cat) {
    case "Sales": return { color: "var(--kpi-blue)", bg: "var(--kpi-blue-bg)" };
    case "Finance": return { color: "var(--kpi-green)", bg: "var(--kpi-green-bg)" };
    case "Production": return { color: "var(--kpi-orange)", bg: "var(--kpi-orange-bg)" };
    case "Customers": return { color: "var(--kpi-purple)", bg: "var(--kpi-purple-bg)" };
    default: return { color: "var(--kpi-teal)", bg: "var(--kpi-teal-bg)" };
  }
}

const REPORTS: ReportDef[] = [
  { name: "Customer Report", category: "Customers", description: "Registered customers, contacts, and account status.", formats: ["PDF", "Excel", "CSV"], icon: Users, ...catStyle("Customers"), key: "customer" },
  { name: "RFQ Report", category: "Sales", description: "All requests for quotation and their statuses.", formats: ["PDF", "Excel", "CSV"], icon: ClipboardList, ...catStyle("Sales"), key: "rfq" },
  { name: "Quotation Report", category: "Sales", description: "Quotations issued, accepted, and pending.", formats: ["PDF", "Excel", "CSV"], icon: FileText, ...catStyle("Sales"), key: "quotation" },
  { name: "Order Report", category: "Sales", description: "Confirmed orders and delivery milestones.", formats: ["PDF", "Excel", "CSV"], icon: ShoppingCart, ...catStyle("Sales"), key: "order" },
  { name: "Production Report", category: "Production", description: "Production jobs, stages, and output.", formats: ["PDF", "Excel", "CSV"], icon: Factory, ...catStyle("Production"), key: "production" },
  { name: "Manufacturing Report", category: "Production", description: "Manufacturing throughput and capacity.", formats: ["PDF", "Excel", "CSV"], icon: Cog, ...catStyle("Production"), key: "manufacturing" },
  { name: "Dispatch Report", category: "Production", description: "Shipments, dispatch dates, and deliveries.", formats: ["PDF", "Excel", "CSV"], icon: Truck, ...catStyle("Production"), key: "dispatch" },
  { name: "Invoice Report", category: "Finance", description: "Invoices generated and their totals.", formats: ["PDF", "Excel", "CSV"], icon: Receipt, ...catStyle("Finance"), key: "invoice" },
  { name: "Payment Report", category: "Finance", description: "Payments received and reconciliation.", formats: ["PDF", "Excel", "CSV"], icon: Wallet, ...catStyle("Finance"), key: "payment" },
  { name: "Outstanding Report", category: "Finance", description: "Outstanding balances and overdue invoices.", formats: ["PDF", "Excel", "CSV"], icon: AlertTriangle, ...catStyle("Finance"), key: "outstanding" },
  { name: "Product Report", category: "Inventory", description: "Product catalog, grades, and pricing.", formats: ["PDF", "Excel", "CSV"], icon: Package, ...catStyle("Inventory"), key: "product" },
  { name: "Company Report", category: "Customers", description: "Registered companies and approvals.", formats: ["PDF", "Excel", "CSV"], icon: Building2, ...catStyle("Customers"), key: "company" },
  { name: "User Activity Report", category: "Customers", description: "User actions and platform activity.", formats: ["PDF", "Excel", "CSV"], icon: UserCheck, ...catStyle("Customers"), key: "user-activity" },
  { name: "Audit Report", category: "Finance", description: "Business activity and audit trail.", formats: ["PDF", "Excel", "CSV"], icon: FileSearch, ...catStyle("Finance"), key: "audit" },
  { name: "Sales Performance Report", category: "Sales", description: "Sales performance across the funnel.", formats: ["PDF", "Excel", "CSV"], icon: TrendingUp, ...catStyle("Sales"), key: "sales-performance" },
  { name: "Revenue Analytics", category: "Finance", description: "Revenue trends and analytics.", formats: ["PDF", "Excel", "CSV"], icon: BarChart3, ...catStyle("Finance"), key: "revenue" },
  { name: "Profit Report", category: "Finance", description: "Profitability and margin analysis.", formats: ["PDF", "Excel", "CSV"], icon: TrendingUp, ...catStyle("Finance"), key: "profit" },
  { name: "Monthly Business Summary", category: "Sales", description: "Monthly business performance summary.", formats: ["PDF", "Excel", "CSV"], icon: Calendar, ...catStyle("Sales"), key: "monthly-summary" },
];

const POPULAR = ["Monthly Business Summary", "Sales Performance Report", "Outstanding Report", "Production Report", "Customer Report"];

interface Finance {
  outstandingAmount: number;
  collectedAmount: number;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminReportsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [dateRange, setDateRange] = useState("Last 7 Days");
  const [finance, setFinance] = useState<Finance | null>(null);
  const [counts, setCounts] = useState<{ rfqs: number; quotations: number; orders: number; invoices: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<{ name: string; content: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      updaterApi.rfqs(1, 1).then((r) => r.totalCount).catch(() => 0),
      updaterApi.quotations(1, 1).then((r) => r.totalCount).catch(() => 0),
      updaterApi.orders(1, 1).then((r) => r.totalCount).catch(() => 0),
      adminApi.invoices(1, 1).then((r) => r.totalCount).catch(() => 0),
      adminApi.financialDashboard().then(setFinance).catch(() => {}),
    ]).then(([rfqs, quotations, orders, invoices]) => {
      setCounts({ rfqs, quotations, orders, invoices });
    }).finally(() => setLoading(false));
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return REPORTS.filter((r) => {
      if (category !== "All" && r.category !== category) return false;
      if (q && !r.name.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, category]);

  const revenue = (finance?.collectedAmount ?? 0) + (finance?.outstandingAmount ?? 0);

  const kpis = [
    { label: "Total RFQs", value: counts?.rfqs ?? 0, display: (counts?.rfqs ?? 0).toLocaleString(), hint: "Requests received", icon: ClipboardList, color: "var(--kpi-blue)", bg: "var(--kpi-blue-bg)", glow: "rgba(59,130,246,0.25)" },
    { label: "Quotations Generated", value: counts?.quotations ?? 0, display: (counts?.quotations ?? 0).toLocaleString(), hint: "Quotations issued", icon: FileText, color: "var(--kpi-purple)", bg: "var(--kpi-purple-bg)", glow: "rgba(167,139,250,0.22)" },
    { label: "Orders Confirmed", value: counts?.orders ?? 0, display: (counts?.orders ?? 0).toLocaleString(), hint: "Confirmed orders", icon: ShoppingCart, color: "var(--kpi-orange)", bg: "var(--kpi-orange-bg)", glow: "rgba(249,115,22,0.22)" },
    { label: "Revenue", value: revenue, display: formatMoney(revenue), hint: "Collected + outstanding", icon: BarChart3, color: "var(--kpi-green)", bg: "var(--kpi-green-bg)", glow: "rgba(34,197,94,0.22)" },
    { label: "Invoices Generated", value: counts?.invoices ?? 0, display: (counts?.invoices ?? 0).toLocaleString(), hint: "Invoices created", icon: Receipt, color: "var(--color-danger)", bg: "rgba(239,68,68,0.10)", glow: "rgba(239,68,68,0.22)" },
    { label: "Pending Payments", value: finance?.outstandingAmount ?? 0, display: formatMoney(finance?.outstandingAmount), hint: "Outstanding balance", icon: Wallet, color: "var(--kpi-teal)", bg: "var(--kpi-teal-bg)", glow: "rgba(20,184,166,0.22)" },
  ];

  const downloadReport = (key: string, format: "csv" | "excel" | "pdf") => {
    const ext = format === "excel" ? "xls" : format;
    void apiDownload(`/api/v1/admin/reports/${key}?format=${format}`, `${key}-report.${ext}`).catch(() => {});
  };

  const previewReport = async (key: string, name: string) => {
    try {
      const token = tokenStorage.getAccessToken();
      const res = await fetch(`${config.apiBaseUrl}/api/v1/admin/reports/${key}?format=csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!res.ok) return;
      setPreview({ name, content: await res.text() });
    } catch { /* ignore */ }
  };

  return (
    <div className="inv-page">
      {/* Header */}
      <div className="inv-header">
        <div>
          <h1 className="inv-header__title">Reports</h1>
          <p className="inv-header__subtitle">Generate operational, financial and business reports with advanced filtering and exports.</p>
        </div>
      </div>

      {/* KPI cards */}
      {loading && !counts ? <div className="inv-status"><Loading label="Loading report summary" /></div> : (
        <div className="inv-kpi-grid">
          {kpis.map((k) => (
            <div key={k.label} className="inv-kpi"
              style={{ "--inv-kpi-color": k.color, "--inv-kpi-bg": k.bg, "--inv-kpi-glow": k.glow } as CSSProperties}>
              <span className="inv-kpi__icon"><k.icon size={20} /></span>
              <span className="inv-kpi__value">{k.display}</span>
              <span className="inv-kpi__label">{k.label}</span>
              <span className="inv-kpi__hint">{k.hint}</span>
            </div>
          ))}
        </div>
      )}

      {/* Search & filter bar */}
      <div className="inv-filterbar">
        <div className="inv-field" style={{ flex: "1 1 220px" }}>
          <label className="inv-field__label">Search</label>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input className="inv-input" style={{ paddingLeft: 32 }} type="search" value={search}
              placeholder="Search report..." aria-label="Search reports"
              onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Category</label>
          <select className="inv-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Date Range</label>
          <select className="inv-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            {DATE_RANGES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <button className="inv-btn inv-btn--primary" title="Filter applied to report grid">
          Generate
        </button>
        <button className="inv-btn inv-btn--icon" title="Refresh summary" aria-label="Refresh" onClick={load}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Popular reports */}
      <div>
        <h2 className="inv-header__title" style={{ fontSize: 18 }}>Popular Reports</h2>
        <div className="inv-popular">
          {POPULAR.map((p) => (
            <button key={p} className="inv-company__btn" onClick={() => setSearch(p)}>
              {p} <ChevronRight size={13} />
            </button>
          ))}
        </div>
      </div>

      {/* Report grid */}
      <div className="inv-report-grid">
        {filtered.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.name} className="inv-report-card">
              <div className="inv-report__head">
                <span className="inv-report__icon" style={{ color: r.color, background: r.bg }}><Icon size={20} /></span>
                <div>
                  <div className="inv-report__title">{r.name}</div>
                  <div className="inv-report__sub">{r.category}</div>
                </div>
              </div>
              <div className="inv-report__desc">{r.description}</div>
              <div className="inv-report__meta">
                {r.formats.map((f) => (
                  <button key={f} className={`inv-report__chip inv-report__chip--${f.toLowerCase()}`}
                    disabled={!r.key}
                    title={r.key ? `Download ${f}` : "Not available yet"}
                    onClick={() => r.key && downloadReport(r.key, f === "Excel" ? "excel" : f === "PDF" ? "pdf" : "csv")}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="inv-report__sub">{r.key ? "Ready to generate" : "Generation not available yet"}</div>
              <div className="inv-report__actions">
                <button className="inv-btn" disabled={!r.key} title={r.key ? "Preview report" : "Not available yet"}
                  onClick={() => r.key && void previewReport(r.key, r.name)}><Eye size={13} /> Preview</button>
                <button className="inv-btn" disabled={!r.key} title={r.key ? "Generate PDF" : "Not available yet"}
                  onClick={() => r.key && downloadReport(r.key, "pdf")}><Plus size={13} /> Generate</button>
                <button className="inv-btn" disabled={!r.key} title={r.key ? "Export as Excel" : "Not available yet"}
                  onClick={() => r.key && downloadReport(r.key, "excel")}><Download size={13} /> Export</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Report preview modal */}
      {preview && (
        <div className="inv-modal-backdrop" onClick={() => setPreview(null)}>
          <div className="inv-modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Report preview">
            <div className="inv-modal__head">
              <span className="inv-modal__title">{preview.name} — Preview</span>
              <button className="inv-icon-btn" onClick={() => setPreview(null)} aria-label="Close"><X size={16} /></button>
            </div>
            <div className="inv-modal__body" style={{ maxHeight: "60vh" }}>
              <pre style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "pre-wrap", margin: 0 }}>{preview.content}</pre>
            </div>
            <div className="inv-modal__foot">
              <button className="inv-btn" onClick={() => setPreview(null)}>Close</button>
              <button className="inv-btn inv-btn--primary" onClick={() => { const k = REPORTS.find((r) => r.name === preview.name)?.key; if (k) { downloadReport(k, "csv"); setPreview(null); } }}>
                <Download size={14} /> Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
