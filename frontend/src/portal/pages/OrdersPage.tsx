import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  MessageSquare,
  Package,
  Truck,
  Download,
  Search,
  RefreshCw,
  ChevronRight,
  ShoppingCart,
  ShieldCheck,
  Send,
  Loader2,
  ArrowUpRight,
  X,
} from "lucide-react";
import {
  customerApi,
  type OrderComment,
  type OrderDetail,
  type OrderListItem,
  type TimelineEntry,
} from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { formatDate } from "../shared";
import { apiDownload } from "../../api/client";
import { cn } from "../../lib/utils";

/* ── Status badge ─────────────────────────────────────────────── */
const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  confirmed: { bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  pattern_development: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  production: { bg: "bg-orange-500/10 border-orange-500/20", text: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
  quality_check: { bg: "bg-purple-500/10 border-purple-500/20", text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500" },
  packed: { bg: "bg-teal-500/10 border-teal-500/20", text: "text-teal-600 dark:text-teal-400", dot: "bg-teal-500" },
  ready_to_dispatch: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  dispatched: { bg: "bg-indigo-500/10 border-indigo-500/20", text: "text-indigo-600 dark:text-indigo-400", dot: "bg-indigo-500" },
  delivered: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  on_hold: { bg: "bg-yellow-500/10 border-yellow-500/20", text: "text-yellow-600 dark:text-yellow-400", dot: "bg-yellow-500" },
  cancelled: { bg: "bg-rose-500/10 border-rose-500/20", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
};

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const normKey = status.toLowerCase().replace(/\s+/g, "_");
  const c = statusConfig[normKey] ?? {
    bg: "bg-neutral-500/10 border-neutral-500/20",
    text: "text-neutral-600 dark:text-neutral-400",
    dot: "bg-neutral-400",
  };
  const display = label ?? status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border", c.bg, c.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot)} />
      <span>{display}</span>
    </span>
  );
}

/* ── Workflow stages ──────────────────────────────────────────── */
const WORKFLOW = [
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "pattern_development", label: "Pattern Dev", icon: FileText },
  { key: "production", label: "Melting & Casting", icon: Package },
  { key: "quality_check", label: "QA & Inspection", icon: Clock },
  { key: "packed", label: "Packing", icon: Package },
  { key: "ready_to_dispatch", label: "Ready to Dispatch", icon: Truck },
  { key: "dispatched", label: "In Transit", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];
const WORKFLOW_ORDER = Object.fromEntries(WORKFLOW.map((s, i) => [s.key, i]));

const trackingFlow = [
  "confirmed",
  "pattern_development",
  "production",
  "quality_check",
  "packed",
  "ready_to_dispatch",
  "dispatched",
  "delivered",
];

/* ── Section wrapper ──────────────────────────────────────────── */
function Section({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] overflow-hidden shadow-xs">
      <div className="px-6 py-4 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white m-0">{title}</h3>
        {actions}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ── Info field row ───────────────────────────────────────────── */
function Field({ label, value, icon: Icon }: { label: string; value: string | ReactNode; icon?: any }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon size={14} className="mt-0.5 text-neutral-400 shrink-0" />}
      <div className="min-w-0">
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">{label}</span>
        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 break-words mt-0.5 block">{value}</span>
      </div>
    </div>
  );
}

/* ── Info Card ────────────────────────────────────────────────── */
function InfoCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 flex items-center gap-3.5 shadow-xs">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs", color ?? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30")}>
        <Icon size={18} />
      </div>
      <div>
        <div className="text-xl font-extrabold text-neutral-900 dark:text-white tabular-nums leading-none">{value}</div>
        <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mt-1">{label}</div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/*  1. ORDER LIST PAGE (ADMIN ERP STYLED)                                    */
/* ========================================================================= */

export function OrderListPage() {
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const loadOrders = () => {
    setLoading(true);
    setError(null);
    customerApi
      .orders()
      .then(setOrders)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = (orders || []).filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (o.productType && o.productType.toLowerCase().includes(search.toLowerCase())) ||
      (o.companyName && o.companyName.toLowerCase().includes(search.toLowerCase())) ||
      o.statusLabel.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "All") return true;
    if (statusFilter === "Production")
      return ["confirmed", "pattern_development", "production", "quality_check", "packed"].includes(
        o.statusLabel.toLowerCase().replace(/\s+/g, "_")
      );
    if (statusFilter === "Dispatched")
      return ["ready_to_dispatch", "dispatched"].includes(
        o.statusLabel.toLowerCase().replace(/\s+/g, "_")
      );
    if (statusFilter === "Delivered")
      return o.statusLabel.toLowerCase().includes("delivered");
    return o.statusLabel.toLowerCase() === statusFilter.toLowerCase();
  });

  const totalOrders = orders?.length || 0;
  const inProductionCount = (orders || []).filter((o) =>
    ["confirmed", "pattern_development", "production", "quality_check", "packed"].includes(
      o.statusLabel.toLowerCase().replace(/\s+/g, "_")
    )
  ).length;
  const inTransitCount = (orders || []).filter((o) =>
    ["ready_to_dispatch", "dispatched"].includes(o.statusLabel.toLowerCase().replace(/\s+/g, "_"))
  ).length;
  const deliveredCount = (orders || []).filter((o) =>
    o.statusLabel.toLowerCase().includes("delivered")
  ).length;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. HERO HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShoppingCart size={18} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white m-0">
              My Orders & Manufacturing Tracking
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 m-0">
            Monitor real-time foundry casting progression, spectrometer metallurgical inspection, and logistics dispatch status.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-bold bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 shadow-xs cursor-pointer transition-all"
          >
            <RefreshCw size={13} className={cn(loading && "animate-spin text-blue-600")} />
            <span>Refresh</span>
          </button>

          <Link
            to="/customer/enquiries/new"
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 no-underline cursor-pointer transition-all"
          >
            <span>Request New Order / Enquiry</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI METRIC CARDS (ADMIN ERP DESIGN SYSTEM GRADIENTS) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Orders */}
        <div className="p-4 rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <ShoppingCart size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80">Total Orders</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {totalOrders}
            </div>
          </div>
        </div>

        {/* In Production */}
        <div className="p-4 rounded-2xl border border-amber-500/20 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <Package size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80">In Production</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {inProductionCount}
            </div>
          </div>
        </div>

        {/* Ready / In Transit */}
        <div className="p-4 rounded-2xl border border-purple-500/20 dark:border-purple-500/30 bg-gradient-to-br from-purple-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <Truck size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600/80 dark:text-purple-400/80">In Transit / Ready</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {inTransitCount}
            </div>
          </div>
        </div>

        {/* Delivered */}
        <div className="p-4 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/80">Delivered</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {deliveredCount}
            </div>
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR: SEARCH & STATUS FILTER TABS */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "All", label: "All Orders", count: totalOrders },
            { id: "Production", label: "In Foundry / Production", count: inProductionCount },
            { id: "Dispatched", label: "In Transit / Dispatched", count: inTransitCount },
            { id: "Delivered", label: "Delivered", count: deliveredCount },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border",
                statusFilter === tab.id
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-white dark:bg-[#121520] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                  statusFilter === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-neutral-100 dark:bg-white/10 text-neutral-500"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order # or PO ref..."
            className="w-full h-9 pl-9 pr-3.5 rounded-xl bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 4. LISTING / CARDS */}
      {error && <EmptyState title="Orders unavailable" text={error} />}

      {loading && !error && (
        <div className="py-12 flex justify-center">
          <Loading label="Fetching manufacturing orders & tracking timeline..." />
        </div>
      )}

      {!loading && !error && filteredOrders.length === 0 && (
        <div className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-10 text-center space-y-6 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto shadow-xs">
            <ShoppingCart size={32} />
          </div>

          <div className="max-w-lg mx-auto space-y-2">
            <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white m-0">
              {search || statusFilter !== "All" ? "No matching orders found" : "No active casting orders yet"}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed m-0">
              {search || statusFilter !== "All"
                ? "Try clearing your search query or switching your active status filter tab."
                : "Once your Enquiry is approved and confirmed, manufacturing batches and live stage tracking will appear right here."}
            </p>
          </div>

          {/* 8-Stage Manufacturing Overview Card */}
          <div className="max-w-2xl mx-auto p-5 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/5 text-left space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <ShieldCheck size={14} />
              <span>How Casting Manufacturing Works At Shakti Udyog</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#121520] border border-neutral-200/60 dark:border-white/5">
                <span className="font-bold text-neutral-900 dark:text-white block">1. Pattern Dev</span>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">CAD match-plate tooling</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#121520] border border-neutral-200/60 dark:border-white/5">
                <span className="font-bold text-neutral-900 dark:text-white block">2. Induction Melt</span>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">Spectrometer heat check</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#121520] border border-neutral-200/60 dark:border-white/5">
                <span className="font-bold text-neutral-900 dark:text-white block">3. CNC Machining</span>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">Precision tolerance finish</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#121520] border border-neutral-200/60 dark:border-white/5">
                <span className="font-bold text-neutral-900 dark:text-white block">4. 3.1 MTC & Dispatch</span>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">Full test certificate & LR</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/customer/enquiries/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 no-underline"
            >
              <span>Submit Enquiry to Start Order</span>
              <ArrowUpRight size={14} />
            </Link>

            <Link
              to="/customer/quotations"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all shadow-xs no-underline"
            >
              <span>View Open Quotations</span>
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && filteredOrders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((o) => {
            const normStatus = o.statusLabel.toLowerCase().replace(/\s+/g, "_");
            const stageIndex = WORKFLOW_ORDER[normStatus] ?? 0;
            const progressPercent = Math.round(((stageIndex + 1) / WORKFLOW.length) * 100);

            return (
              <div
                key={o.id}
                className="group relative rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] hover:border-blue-500/40 p-5 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3.5">
                  {/* Top Row: Order Number + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold font-mono text-neutral-900 dark:text-white px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
                      {o.orderNumber}
                    </span>
                    <StatusBadge status={normStatus} label={o.statusLabel} />
                  </div>

                  {/* Product Type / Description and Quantity */}
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {o.productType || "Casting Manufacturing Order"}
                    </h3>
                    <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-2">
                      <span>Total: {o.totalQuantity} pcs</span>
                      <span>•</span>
                      <span>Placed: {formatDate(o.placedAtUtc)}</span>
                    </div>
                  </div>

                  {/* 8-Stage Progress Bar */}
                  <div className="space-y-1.5 p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-neutral-600 dark:text-neutral-300">Stage: {o.statusLabel}</span>
                      <span className="font-extrabold text-blue-600 dark:text-blue-400">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    {o.promisedDispatchDateUtc && (
                      <div className="text-[10px] text-neutral-400 pt-1 flex items-center justify-between">
                        <span>Target Dispatch</span>
                        <span className="font-bold text-neutral-700 dark:text-neutral-300">{formatDate(o.promisedDispatchDateUtc)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Row */}
                <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between gap-2">
                  <Link
                    to={`/customer/orders/${o.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20 transition-all no-underline"
                  >
                    <span>View Order Details</span>
                    <ChevronRight size={13} />
                  </Link>

                  <Link
                    to={`/customer/orders/${o.id}/timeline`}
                    className="p-2 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 transition-colors"
                    title="Live Tracking Timeline"
                  >
                    <Clock size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ========================================================================= */
/*  2. ORDER TIMELINE PAGE                                                   */
/* ========================================================================= */

export function OrderTimelinePage() {
  const { id = "" } = useParams();
  const [timeline, setTimeline] = useState<TimelineEntry[] | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    customerApi.orderTimeline(id).then(setTimeline).catch(() => setMissing(true));
  }, [id]);

  if (missing) return <EmptyState title="Order not found" text="Could not retrieve timeline for the specified order." />;
  if (!timeline) return <Loading label="Loading live tracking timeline..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/customer/orders/${id}`}
            className="flex items-center justify-center w-8 h-8 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
          >
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-neutral-900 dark:text-white m-0">Order Manufacturing Timeline</h1>
            <p className="text-xs text-neutral-400 m-0 mt-0.5">Chronological audit trail of heats, machining & dispatches</p>
          </div>
        </div>

        <Link
          to={`/customer/orders/${id}`}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline no-underline"
        >
          ← Back to Order
        </Link>
      </div>

      <Section title="Stage-by-Stage Tracking Log">
        <OrderTrack timeline={timeline} />
      </Section>
    </div>
  );
}

function OrderTrack({ timeline }: { timeline: TimelineEntry[] }) {
  const reachedCodes = new Set(timeline.map((t) => t.statusCode));
  const currentIndex = Math.max(...trackingFlow.map((code, i) => (reachedCodes.has(code) ? i : -1)));

  return (
    <div className="space-y-6">
      {/* Visual Stages Progress Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {trackingFlow.map((code, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          const label = code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

          return (
            <div
              key={code}
              className={cn(
                "p-3 rounded-2xl border text-center space-y-1.5 transition-all",
                isCurrent
                  ? "bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs"
                  : isDone
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-neutral-50 dark:bg-white/[0.02] border-neutral-200/60 dark:border-white/5 text-neutral-400"
              )}
            >
              <div className="text-[10px] font-mono font-bold">{i + 1}</div>
              <div className="text-[11px] font-bold leading-tight line-clamp-1">{label}</div>
              <div className="text-[10px] font-bold">
                {isCurrent ? "● Active" : isDone ? "✓ Complete" : "Pending"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chronological Event Log */}
      <div className="pt-4 border-t border-neutral-100 dark:border-white/5 divide-y divide-neutral-100 dark:divide-white/5">
        {timeline.map((entry, idx) => (
          <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-4">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Clock size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                  {entry.statusLabel || entry.statusCode}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-neutral-100 dark:bg-white/5 text-neutral-500">
                  {entry.actorType}
                </span>
              </div>
              {entry.message && (
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 m-0">
                  {entry.message}
                </p>
              )}
              <div className="text-[11px] text-neutral-400 font-mono mt-1">
                {formatDate(entry.occurredAtUtc)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========================================================================= */
/*  3. ORDER DETAIL PAGE                                                     */
/* ========================================================================= */

export function OrderDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [comments, setComments] = useState<OrderComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [missing, setMissing] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    customerApi.order(id).then(setOrder).catch(() => setMissing(true));
    customerApi.orderComments(id).then(setComments).catch(() => {});
  }, [id]);

  async function postComment() {
    const message = newComment.trim();
    if (!message || postingComment) return;
    setPostingComment(true);
    try {
      await customerApi.addOrderComment(id, message);
      setNewComment("");
      customerApi.orderComments(id).then(setComments).catch(() => {});
    } catch {
      // silently reconcile
    } finally {
      setPostingComment(false);
    }
  }

  async function submitSupport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = (data.get("subject") as string).trim();
    const message = (data.get("message") as string).trim();
    if (subject.length < 3 || message.length < 10) return;

    setBusy(true);
    try {
      await customerApi.createSupportRequest(id, subject, message);
      setSupportMessage("Your support ticket has been raised successfully. Engineering desk will reply.");
      setSupportOpen(false);
    } catch {
      setSupportMessage("Could not raise ticket. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (missing) return <EmptyState title="Order not found" text="The requested manufacturing order could not be loaded." />;
  if (!order) return <Loading label="Loading manufacturing order..." />;

  const currentIndex = WORKFLOW_ORDER[order.status] ?? -1;

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/customer/orders")}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white m-0 truncate">
                {order.orderNumber}
              </h1>
              <StatusBadge status={order.status} label={order.statusLabel} />
            </div>
            {order.purchaseOrderReference && (
              <p className="text-xs text-neutral-400 m-0 mt-0.5">PO Ref: {order.purchaseOrderReference}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {order.quotationId && (
            <Link
              to={`/customer/quotations/${order.quotationId}`}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-50 dark:hover:bg-white/5 transition-all no-underline shadow-xs"
            >
              <FileText size={14} className="text-blue-600 dark:text-blue-400" />
              <span>View Quote</span>
            </Link>
          )}

          <Link
            to={`/customer/orders/${id}/timeline`}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all no-underline shadow-sm shadow-blue-500/20"
          >
            <Clock size={14} />
            <span>Full Timeline</span>
          </Link>
        </div>
      </div>

      {supportMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
          <span>{supportMessage}</span>
          <button type="button" onClick={() => setSupportMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── 8-Stage Visual Timeline ─────────────────────────────────── */}
      <div className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white m-0">Foundry Manufacturing Progress</h3>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">Stage {currentIndex + 1} of {WORKFLOW.length}</span>
        </div>

        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
          {WORKFLOW.map((stage, i) => {
            const Icon = stage.icon;
            const isCompleted = i < currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <div key={stage.key} className="flex items-center gap-0 flex-1 min-w-[75px]">
                <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-2xl flex items-center justify-center transition-all shadow-xs",
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-blue-600 text-white ring-4 ring-blue-500/20"
                        : "bg-neutral-100 dark:bg-white/5 text-neutral-400 border border-neutral-200 dark:border-white/10"
                    )}
                  >
                    <Icon size={16} />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold text-center leading-tight max-w-[80px]",
                      isCurrent
                        ? "text-blue-600 dark:text-blue-400"
                        : isCompleted
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-neutral-400"
                    )}
                  >
                    {stage.label}
                  </span>
                </div>
                {i < WORKFLOW.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-1 mt-[-20px]",
                      i < currentIndex ? "bg-emerald-400" : "bg-neutral-200 dark:bg-white/10"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        {order.statusDescription && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center m-0 pt-2 border-t border-neutral-100 dark:border-white/5">
            {order.statusDescription}
          </p>
        )}
      </div>

      {/* ── Summary KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <InfoCard icon={Calendar} label="Placed" value={formatDate(order.placedAtUtc)} />
        <InfoCard icon={Clock} label="Target Dispatch" value={formatDate(order.promisedDispatchDateUtc)} />
        <InfoCard icon={Clock} label="Last Updated" value={formatDate(order.lastUpdatedAtUtc)} />
        <InfoCard icon={Package} label="Line Items" value={String(order.items.length)} />
      </div>

      {/* ── Two-column layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Line items, Shipments, Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <Section title={`Manufactured Line Items (${order.items.length})`}>
            <div className="overflow-x-auto rounded-2xl border border-neutral-200/90 dark:border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200/90 dark:border-white/10">
                  <tr>
                    <th className="py-2.5 px-4 font-bold text-neutral-400">Part #</th>
                    <th className="py-2.5 px-3 font-bold text-neutral-400">Description</th>
                    <th className="py-2.5 px-3 font-bold text-neutral-400">Grade</th>
                    <th className="py-2.5 px-3 font-bold text-neutral-400 text-center">Ordered</th>
                    <th className="py-2.5 px-3 font-bold text-neutral-400 text-center">Produced</th>
                    <th className="py-2.5 px-4 font-bold text-neutral-400 text-right">Dispatched</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                  {order.items.map((item) => (
                    <tr key={item.partNumber} className="hover:bg-neutral-50 dark:hover:bg-white/[0.02]">
                      <td className="py-2.5 px-4 font-extrabold font-mono text-neutral-900 dark:text-white">{item.partNumber}</td>
                      <td className="py-2.5 px-3 font-bold text-neutral-800 dark:text-neutral-200">{item.description}</td>
                      <td className="py-2.5 px-3 font-mono text-neutral-500">{item.materialGrade ?? "—"}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-neutral-900 dark:text-white">{item.quantityOrdered} {item.unit}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{item.quantityProduced} {item.unit}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-blue-600 dark:text-blue-400">{item.quantityDispatched} {item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Shipments */}
          <Section title={`Consignments & Logistics (${order.shipments.length})`}>
            {order.shipments.length > 0 ? (
              <div className="space-y-3">
                {order.shipments.map((s) => (
                  <div key={s.id} className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/90 dark:border-white/10 space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <Field label="Transporter" value={s.transporter ?? "—"} icon={Truck} />
                      <Field label="LR / Docket No." value={s.trackingNumber ?? "—"} />
                      <Field label="Dispatch Date" value={formatDate(s.dispatchDateUtc)} icon={Calendar} />
                      <Field label="Est. Arrival" value={formatDate(s.estimatedArrivalUtc)} icon={Clock} />
                      <Field label="Delivered" value={formatDate(s.deliveredAtUtc)} icon={CheckCircle2} />
                      <Field label="POD Document" value={s.hasProofOfDelivery ? "Available in vault" : "Pending POD"} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-neutral-400">
                <Truck size={24} className="mx-auto text-neutral-300 dark:text-white/10 mb-1" />
                <p className="m-0">No dispatches logged yet for this order.</p>
              </div>
            )}
          </Section>

          {/* Documents */}
          <Section title={`Order Technical Vault & MTCs (${order.documents.length})`}>
            {order.documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {order.documents.map((d) => (
                  <div key={d.id} className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/90 dark:border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">{d.title || d.fileName}</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">{d.category} • {(d.sizeBytes / 1024).toFixed(1)} KB</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void apiDownload(customerApi.downloadDocument(d.id), d.title || d.fileName || "document")}
                      className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer shrink-0"
                      title="Download file"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-neutral-400">
                <FileText size={24} className="mx-auto text-neutral-300 dark:text-white/10 mb-1" />
                <p className="m-0">No technical documents attached to this order yet.</p>
              </div>
            )}
          </Section>

          {/* Order Messages / Notes */}
          <Section title={`Foundry Production Notes & Communications (${comments.length})`}>
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-xs text-neutral-400 m-0 text-center py-2">
                  No notes logged yet. Post a message to communicate directly with our foundry production desk.
                </p>
              ) : (
                <div className="space-y-3">
                  {comments.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/90 dark:border-white/10 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {c.authorName} ({c.authorRole})
                        </span>
                        <span className="text-neutral-400 font-mono">{formatDate(c.createdAtUtc)}</span>
                      </div>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 m-0 whitespace-pre-wrap leading-relaxed">
                        {c.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Post a message to plant engineering desk..."
                  className="flex-1 h-9 px-3 rounded-xl bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void postComment();
                  }}
                />
                <button
                  type="button"
                  onClick={() => void postComment()}
                  disabled={postingComment || !newComment.trim()}
                  className="px-4 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {postingComment ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>Post</span>
                </button>
              </div>
            </div>
          </Section>
        </div>

        {/* Right Column (1 Col): Delivery info & Quick support */}
        <div className="space-y-6">
          {/* Delivery Info */}
          <Section title="Delivery Destination">
            <div className="space-y-3">
              <Field label="Delivery Address" value={order.deliveryAddress ?? "—"} icon={MapPin} />
              <Field label="Promised Dispatch" value={formatDate(order.promisedDispatchDateUtc)} icon={Calendar} />
              <Field label="PO Reference" value={order.purchaseOrderReference ?? "—"} icon={FileText} />
              <Field label="Last Status Update" value={formatDate(order.lastUpdatedAtUtc)} icon={Clock} />
            </div>
          </Section>

          {/* Quick Engineering Support */}
          <Section title="Need Metallurgical Support?">
            <div className="space-y-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0">
                Have questions regarding pattern alterations, heat chemistry, or expedited dispatch?
              </p>

              {!supportOpen ? (
                <button
                  type="button"
                  onClick={() => setSupportOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                  <MessageSquare size={14} />
                  <span>Raise Order Support Ticket</span>
                </button>
              ) : (
                <form onSubmit={submitSupport} className="space-y-2.5 p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Subject *</label>
                    <input
                      name="subject"
                      required
                      minLength={3}
                      placeholder="e.g. Inquire about casting heat report"
                      className="w-full h-8 px-2.5 rounded-lg bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Message *</label>
                    <textarea
                      name="message"
                      required
                      minLength={10}
                      rows={3}
                      placeholder="Provide details for plant engineering team..."
                      className="w-full p-2.5 rounded-lg bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={busy}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                    >
                      {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      <span>{busy ? "Submitting..." : "Send to Plant Desk"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSupportOpen(false)}
                      className="px-3 h-8 rounded-lg border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-600 dark:text-neutral-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

export default OrderListPage;
