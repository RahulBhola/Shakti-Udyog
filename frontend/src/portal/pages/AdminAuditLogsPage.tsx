import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { apiGet } from "../../api/client";
import { Loading } from "../../components/ui";
import {
  Activity, Zap, Users, Calendar, Search, RefreshCw, ChevronLeft, ChevronRight,
  X, Eye, Download, Filter, FileSearch, Wrench, Building2,
  CheckCircle2, XCircle, PlusCircle, Edit3, Trash2, ArrowRightCircle, Cpu, Copy, Check,
  Layers, Package, Receipt, CreditCard, Tag, Settings as SettingsIcon, ChevronDown, ChevronUp, AlertTriangle,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import "./erpListView.css";

/* ------------------------------------------------------------------ */
/*  Types & Constants                                                 */
/* ------------------------------------------------------------------ */

interface AuditItem {
  id: number;
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAtUtc: string;
}

interface UserInfo {
  name: string;
  role: string;
  email?: string;
}

const MODULES = ["All", "Enquiry", "Quote", "Orders", "Production", "Invoice", "Payment", "Products", "Companies", "Users", "Settings"] as const;
const ACTION_TYPES = ["All", "Created", "Updated", "Approved", "Rejected", "Deleted", "Moved", "Generated"];
const PAGE_SIZES = [10, 20, 50, 100];

// Exclude noise/auth internal events
const isExcluded = (a: string): boolean =>
  a.startsWith("auth.") || a.startsWith("token") || a.startsWith("jwt") || a.includes("refresh")
  || a.startsWith("middleware") || a.startsWith("api.") || a.startsWith("worker")
  || a.startsWith("login") || a.startsWith("password") || a.startsWith("role.") || a.startsWith("permission");

const MODULE_MAP: Record<string, string> = {
  enquiry: "Enquiry",
  contactrequest: "Enquiry",
  quotation: "Quote",
  quote: "Quote",
  order: "Orders",
  orders: "Orders",
  invoice: "Invoice",
  payment: "Payment",
  product: "Products",
  productmaster: "Products",
  company: "Companies",
  user: "Users",
  setting: "Settings",
  category: "Products",
  production: "Production",
};

function moduleOf(item: AuditItem): string {
  if (item.entityType) {
    const key = item.entityType.toLowerCase();
    return MODULE_MAP[key] ?? item.entityType;
  }
  const prefix = item.action.split(".")[0]?.toLowerCase() ?? "";
  return (MODULE_MAP[prefix] ?? prefix) || "System";
}

function moduleIcon(module: string): LucideIcon {
  switch (module) {
    case "Enquiry": return FileSearch;
    case "Quote": return Layers;
    case "Orders": return Package;
    case "Production": return Wrench;
    case "Invoice": return Receipt;
    case "Payment": return CreditCard;
    case "Products": return Tag;
    case "Companies": return Building2;
    case "Users": return Users;
    case "Settings": return SettingsIcon;
    default: return Activity;
  }
}

function moduleColor(module: string): { bg: string; text: string; border: string } {
  switch (module) {
    case "Enquiry": return { bg: "bg-blue-500/10 dark:bg-blue-500/20", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" };
    case "Quote": return { bg: "bg-purple-500/10 dark:bg-purple-500/20", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20" };
    case "Orders": case "Production": return { bg: "bg-orange-500/10 dark:bg-orange-500/20", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/20" };
    case "Invoice": return { bg: "bg-red-500/10 dark:bg-red-500/20", text: "text-red-600 dark:text-red-400", border: "border-red-500/20" };
    case "Payment": return { bg: "bg-emerald-500/10 dark:bg-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" };
    case "Companies": return { bg: "bg-indigo-500/10 dark:bg-indigo-500/20", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/20" };
    case "Users": case "Settings": return { bg: "bg-teal-500/10 dark:bg-teal-500/20", text: "text-teal-600 dark:text-teal-400", border: "border-teal-500/20" };
    default: return { bg: "bg-neutral-500/10 dark:bg-neutral-500/20", text: "text-neutral-600 dark:text-neutral-400", border: "border-neutral-500/20" };
  }
}

function parseAction(item: AuditItem): { label: string; icon: LucideIcon; bg: string; text: string; border: string } {
  const raw = item.action.split(".").pop() ?? item.action;
  const v = raw.toLowerCase();

  if (v.includes("created") || v.includes("received") || v.includes("added")) {
    return { label: `Created ${item.entityType ?? ""}`.trim() || "Created", icon: PlusCircle, bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" };
  }
  if (v.includes("approved") || v.includes("accepted") || v.includes("verified")) {
    return { label: `Approved ${item.entityType ?? ""}`.trim(), icon: CheckCircle2, bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" };
  }
  if (v.includes("rejected") || v.includes("declined") || v.includes("cancelled")) {
    return { label: `Rejected ${item.entityType ?? ""}`.trim(), icon: XCircle, bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", border: "border-red-500/20" };
  }
  if (v.includes("deleted") || v.includes("removed")) {
    return { label: `Deleted ${item.entityType ?? ""}`.trim(), icon: Trash2, bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", border: "border-red-500/20" };
  }
  if (v.includes("updated") || v.includes("modified") || v.includes("edited")) {
    return { label: `Updated ${item.entityType ?? ""}`.trim(), icon: Edit3, bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20" };
  }
  if (v.includes("moved") || v.includes("stage") || v.includes("status")) {
    return { label: `Moved ${item.entityType ?? ""}`.trim(), icon: ArrowRightCircle, bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20" };
  }
  return { label: item.action, icon: Activity, bg: "bg-neutral-100 dark:bg-white/5", text: "text-neutral-700 dark:text-neutral-300", border: "border-neutral-200/60 dark:border-white/10" };
}

const AVATAR_PALETTES = [
  { bg: "rgba(59,130,246,0.15)", fg: "#3B82F6", border: "rgba(59,130,246,0.3)" },
  { bg: "rgba(16,185,129,0.15)", fg: "#10B981", border: "rgba(16,185,129,0.3)" },
  { bg: "rgba(249,115,22,0.15)", fg: "#F97316", border: "rgba(249,115,22,0.3)" },
  { bg: "rgba(168,85,247,0.15)", fg: "#A855F7", border: "rgba(168,85,247,0.3)" },
  { bg: "rgba(236,72,153,0.15)", fg: "#EC4899", border: "rgba(236,72,153,0.3)" },
];

function getAvatarStyle(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const idx = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[idx];
}

function initials(name: string | undefined): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  };
}

function getEntityLink(entityType?: string | null, entityId?: string | null): { label: string; url: string } | null {
  if (!entityId) return null;
  const t = (entityType || "").toLowerCase();
  if (t === "order") return { label: "Open Order Details", url: `/admin/orders/${entityId}` };
  if (t === "enquiry") return { label: "Open Enquiry Specs", url: `/admin/enquiries/${entityId}` };
  if (t === "quotation" || t === "quote") return { label: "Open Quotation", url: `/admin/quotations/${entityId}` };
  if (t === "invoice") return { label: "Open Deal & Invoice", url: `/admin/deals/${entityId}?invoice=${entityId}` };
  if (t === "user") return { label: "Manage Users", url: `/admin/users` };
  if (t === "company") return { label: "Manage Companies", url: `/admin/companies` };
  if (t === "product") return { label: "Manage Products", url: `/admin/products` };
  return null;
}

function formatJsonPayload(str: string | null): string {
  if (!str) return "";
  try {
    const parsed = JSON.parse(str);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return str;
  }
}

function AuditEventDrawer({
  item,
  userInfo,
  onClose,
}: {
  item: AuditItem;
  userInfo: UserInfo | null;
  onClose: () => void;
}) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const actionMeta = parseAction(item);
  const module = moduleOf(item);
  const ModIcon = moduleIcon(module);
  const modColors = moduleColor(module);
  const dt = formatDateTime(item.occurredAtUtc);
  const entityLink = getEntityLink(item.entityType, item.entityId);

  const copyEntityId = () => {
    if (!item.entityId) return;
    navigator.clipboard.writeText(item.entityId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyFullPayload = () => {
    const payload = item.newValues || item.oldValues || item.action;
    navigator.clipboard.writeText(payload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return createPortal(
    <>
      {/* ── Clear, non-smearing backdrop overlay attached to document.body ── */}
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/60 z-[9998] animate-in fade-in duration-150 cursor-pointer"
        onClick={onClose}
        title="Click to dismiss drawer"
      />

      <div
        className="fixed inset-y-0 right-0 z-[9999] w-full max-w-xl bg-white dark:bg-[#0c0f17] border-l border-neutral-200 dark:border-white/10 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-250"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#0f121a] shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${actionMeta.bg} ${actionMeta.text} ${actionMeta.border}`}>
              <actionMeta.icon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-neutral-900 dark:text-white m-0">
                  {actionMeta.label}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
                  #{item.id}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0 mt-0.5 font-medium">
                {dt.date} at {dt.time}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Drawer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Actor Profile Card */}
          <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/[0.02] p-4 space-y-3 shadow-xs">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
              Triggered By (Actor)
            </div>
            <div className="flex items-center gap-3.5">
              {userInfo ? (
                <>
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm border shadow-xs shrink-0"
                    style={{ ...getAvatarStyle(userInfo.name) }}
                  >
                    {initials(userInfo.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm text-neutral-900 dark:text-white truncate">
                      {userInfo.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-neutral-500 font-mono font-bold">
                        {userInfo.role === "Admin" ? "Administrator" : userInfo.role}
                      </span>
                      {item.ipAddress && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-200/70 dark:bg-white/10 text-neutral-700 dark:text-neutral-300">
                          IP: {item.ipAddress}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-500/15 text-blue-500 border border-blue-500/30 shrink-0">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-neutral-900 dark:text-white">
                      System Automated Engine
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5 font-medium">
                      Background event / automated transaction trigger
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Module & Entity Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#121520] shadow-xs">
              <div className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-wider">Module</div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${modColors.bg} ${modColors.text} ${modColors.border}`}>
                  <ModIcon size={13} />
                  <span>{module}</span>
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#121520] shadow-xs">
              <div className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-wider">Entity Type</div>
              <div className="font-mono font-bold text-sm text-neutral-900 dark:text-white mt-2">
                {item.entityType || "General System"}
              </div>
            </div>
          </div>

          {/* Entity GUID with 1-Click Copy & Direct Page Link */}
          {item.entityId && (
            <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#121520] shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-wider">
                  Target Entity ID & Quick Navigation
                </div>
                {entityLink && (
                  <Link
                    to={entityLink.url}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-xs no-underline"
                  >
                    <ExternalLink size={12} />
                    <span>{entityLink.label}</span>
                  </Link>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-neutral-50 dark:bg-black/30 border border-neutral-200/70 dark:border-white/5">
                <div className="font-mono font-bold text-xs text-neutral-900 dark:text-neutral-100 select-all break-all">
                  {item.entityId}
                </div>
                <button
                  type="button"
                  onClick={copyEntityId}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0c0f17] hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-colors shrink-0 cursor-pointer shadow-xs"
                >
                  {copiedId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>{copiedId ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Detailed Changes / Payload Inspection */}
          <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#121520] p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">
                Event Payload & Changes
              </div>
              {(item.newValues || item.oldValues) && (
                <button
                  type="button"
                  onClick={copyFullPayload}
                  className="text-xs text-neutral-500 hover:text-orange-500 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedPayload ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>{copiedPayload ? "Copied Payload" : "Copy JSON"}</span>
                </button>
              )}
            </div>

            {item.newValues && (
              <div>
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>New State / Recorded Payload:</span>
                </div>
                <pre className="p-3.5 rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-200/70 dark:border-white/5 text-xs font-mono text-neutral-800 dark:text-neutral-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {formatJsonPayload(item.newValues)}
                </pre>
              </div>
            )}

            {item.oldValues && (
              <div>
                <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Previous State:</span>
                </div>
                <pre className="p-3.5 rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-200/70 dark:border-white/5 text-xs font-mono text-neutral-800 dark:text-neutral-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {formatJsonPayload(item.oldValues)}
                </pre>
              </div>
            )}

            {!item.newValues && !item.oldValues && (
              <p className="text-xs text-neutral-400 italic m-0">
                Action recorded as atomic operation: {item.action}
              </p>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-[#0f121a] flex items-center justify-between">
          <span className="text-xs text-neutral-400 font-mono">
            {item.ipAddress ? `IP: ${item.ipAddress}` : "System event"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-200/80 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-bold hover:bg-neutral-300 dark:hover:bg-white/20 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ------------------------------------------------------------------ */
/*  Main Activity Trail & Audit Logs Page Component                    */
/* ------------------------------------------------------------------ */

export default function AdminAuditLogsPage() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [userMap, setUserMap] = useState<Record<string, UserInfo>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("All");
  const [actionFilter, setActionFilter] = useState<string>("All");
  const [userFilter, setUserFilter] = useState<string>("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination & Drawer
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewing, setViewing] = useState<AuditItem | null>(null);

  const load = useCallback((isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    Promise.all([
      apiGet<any>(`/api/v1/admin/audit-logs?page=1&pageSize=500`),
      apiGet<any[]>(`/api/v1/admin/users`).catch(() => [] as any[]),
    ])
      .then(([logs, users]) => {
        const raw: AuditItem[] = (logs?.items ?? []).filter((a: any) => !isExcluded(a.action ?? ""));
        setItems(raw);
        const map: Record<string, UserInfo> = {};
        for (const u of users) {
          map[String(u.id)] = { name: u.fullName ?? u.email, role: u.role ?? "User", email: u.email };
        }
        setUserMap(map);
        if (isManual) {
          setFeedbackNotice("Audit log stream refreshed successfully.");
          setTimeout(() => setFeedbackNotice(null), 2500);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => {
        setLoading(false);
        if (isManual) setRefreshing(false);
      });
  }, []);

  useEffect(() => { void load(false); }, [load]);

  const userOptions = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) {
      const u = it.userId ? userMap[it.userId] : null;
      if (u) set.add(u.name);
    }
    return Array.from(set).sort();
  }, [items, userMap]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      const user = it.userId ? userMap[it.userId] : null;
      const mod = moduleOf(it);
      const action = parseAction(it).label.toLowerCase();

      if (q) {
        const matchSearch =
          mod.toLowerCase().includes(q)
          || action.includes(q)
          || (it.action ?? "").toLowerCase().includes(q)
          || (it.entityId ?? "").toLowerCase().includes(q)
          || (user?.name ?? "").toLowerCase().includes(q)
          || (it.ipAddress ?? "").toLowerCase().includes(q);
        if (!matchSearch) return false;
      }

      if (moduleFilter !== "All" && mod !== moduleFilter) return false;
      if (actionFilter !== "All" && !action.includes(actionFilter.toLowerCase())) return false;
      if (userFilter !== "All" && (user?.name ?? "") !== userFilter) return false;

      const t = new Date(it.occurredAtUtc).getTime();
      if (fromDate && t < new Date(fromDate).getTime()) return false;
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (t > end.getTime()) return false;
      }

      return true;
    });
  }, [items, search, moduleFilter, actionFilter, userFilter, fromDate, toDate, userMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const kpis = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const todayCount = items.filter((i) => new Date(i.occurredAtUtc).getTime() >= startOfDay).length;
    const weekCount = items.filter((i) => new Date(i.occurredAtUtc).getTime() >= startOfWeek.getTime()).length;
    const uniqueActors = new Set(items.map((i) => i.userId).filter(Boolean)).size;

    return {
      total: items.length,
      today: todayCount,
      actors: uniqueActors,
      week: weekCount,
      systemEvents: items.filter((i) => !i.userId).length,
    };
  }, [items]);

  const exportCsv = () => {
    if (!filtered.length) return;
    const header = ["Timestamp (UTC)", "Actor", "Role", "Action", "Module", "Entity Type", "Entity ID", "IP Address"];
    const rows = filtered.map((i) => {
      const u = i.userId ? userMap[i.userId] : null;
      return [
        i.occurredAtUtc,
        u?.name ?? "System",
        u?.role ?? "System Engine",
        parseAction(i).label,
        moduleOf(i),
        i.entityType ?? "",
        i.entityId ?? "",
        i.ipAddress ?? "—",
      ];
    });
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const clearFilters = () => {
    setSearch("");
    setModuleFilter("All");
    setActionFilter("All");
    setUserFilter("All");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const hasActiveFilters = search || moduleFilter !== "All" || actionFilter !== "All" || userFilter !== "All" || fromDate || toDate;

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* 1. HERO HEADER                                                    */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shadow-sm">
            <FileSearch size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
                Activity Trail & Audit Logs
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200/70 dark:border-white/10">
                {kpis.total} Total Records
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
              Immutable operational audit trail of system events, engineer quotes, order status transitions, and client interactions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer"
            title="Export filtered logs to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer disabled:opacity-60"
            title="Refresh Audit Logs"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin text-orange-500" : ""} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Toast Notice */}
      {feedbackNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. KPI METRICS CARDS (Glow Formula)                               */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Activities */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(59,130,246,0.18),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Activity size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight">
            {kpis.total}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Total Activities</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Recorded operations</div>
        </div>

        {/* Today's Events */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(16,185,129,0.18),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Zap size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight">
            {kpis.today}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Today's Events</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Logged past 24h</div>
        </div>

        {/* Active Actors */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(168,85,247,0.18),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Users size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight">
            {kpis.actors}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Active Actors</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Staff & clients active</div>
        </div>

        {/* This Week */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(249,115,22,0.18),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <Calendar size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight">
            {kpis.week}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">This Week</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Past 7 days volume</div>
        </div>

        {/* System Triggers */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(20,184,166,0.18),transparent)] before:pointer-events-none col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
            <Cpu size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight">
            {kpis.systemEvents}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">System Engine</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Automated web triggers</div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. TOOLBAR & SEGMENTED MODULE TABS (Wrapped, No Scrollbars)        */}
      {/* ================================================================= */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 shadow-xs space-y-3">
        {/* Top Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Real-time Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search logs by action, actor, entity ID, or IP..."
              className="w-full pl-10 pr-8 h-10 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-orange-500 shadow-xs"
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

          {/* Toggle Advanced Filters */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`inline-flex items-center gap-1.5 px-3.5 h-10 rounded-xl text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
              showAdvancedFilters || hasActiveFilters
                ? "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                : "border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5"
            }`}
          >
            <Filter size={13} />
            <span>Filter Options</span>
            {showAdvancedFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Segmented Module Filter Chips - Flex Wrapped (100% visible on screen, no scrollbar) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-100 dark:border-white/5">
          {MODULES.map((m) => {
            const isCurrent = moduleFilter === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => { setModuleFilter(m); setPage(1); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5"
                }`}
              >
                <span>{m === "All" ? "All Logs" : m}</span>
              </button>
            );
          })}
        </div>

        {/* Collapsible Advanced Filters */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-neutral-100 dark:border-white/5 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-in fade-in">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">Action Type</label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-orange-500"
              >
                {ACTION_TYPES.map((a) => (
                  <option key={a} value={a}>{a === "All" ? "All Actions" : a}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">Specific Actor</label>
              <select
                value={userFilter}
                onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-orange-500"
              >
                <option value="All">All Actors</option>
                {userOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">To Date</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-orange-500"
                />
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    title="Reset filters"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 4. MODERN HIGH-END AUDIT LOG TABLE (Fluid Responsive)             */}
      {/* ================================================================= */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="py-24 text-center"><Loading label="Streaming audit records..." /></div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center text-neutral-400 space-y-2">
            <FileSearch size={44} className="mx-auto opacity-30" />
            <p className="text-sm font-medium text-neutral-500">No activity records match your current filters.</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-[var(--color-primary)] hover:underline font-bold cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/80 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10">
                  <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 w-36">
                    Timestamp
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Actor / User
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Action
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Module
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Entity Details
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    IP Address
                  </th>
                  <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 text-right">
                    Inspect
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.04]">
                {paged.map((it) => {
                  const dt = formatDateTime(it.occurredAtUtc);
                  const user = it.userId ? userMap[it.userId] : null;
                  const actionMeta = parseAction(it);
                  const module = moduleOf(it);
                  const modColors = moduleColor(module);
                  const ModIcon = moduleIcon(module);

                  const isSelected = viewing?.id === it.id;
                  return (
                    <tr
                      key={it.id}
                      onClick={() => setViewing(it)}
                      className={`group transition-all cursor-pointer ${
                        isSelected
                          ? "bg-orange-500/10 dark:bg-orange-500/15 ring-1 ring-inset ring-orange-500/30"
                          : "hover:bg-orange-500/[0.03] dark:hover:bg-white/[0.02]"
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-5 align-middle">
                        <div className="font-extrabold text-xs text-neutral-900 dark:text-white">
                          {dt.date}
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                          {dt.time}
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-3">
                          {user ? (
                            <>
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs border shadow-xs shrink-0"
                                style={{ ...getAvatarStyle(user.name) }}
                              >
                                {initials(user.name)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-neutral-900 dark:text-white truncate max-w-[170px]">
                                  {user.name}
                                </div>
                                <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                                  {user.role === "Admin" ? "Administrator" : user.role}
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
                                <Cpu size={14} />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-neutral-900 dark:text-white">
                                  System Engine
                                </div>
                                <div className="text-[10px] text-neutral-400">
                                  Automated trigger
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold border ${actionMeta.bg} ${actionMeta.text} ${actionMeta.border}`}>
                          <actionMeta.icon size={12} />
                          <span>{actionMeta.label}</span>
                        </span>
                      </td>

                      {/* Module */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${modColors.bg} ${modColors.text} ${modColors.border}`}>
                          <ModIcon size={12} />
                          <span>{module}</span>
                        </span>
                      </td>

                      {/* Entity Details */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="text-xs text-neutral-700 dark:text-neutral-300 font-medium truncate max-w-[240px]">
                          {it.entityType ? (
                            <span>{it.entityType} <span className="font-mono text-neutral-400 text-[11px]">{it.entityId ? `${it.entityId.slice(0, 12)}...` : ""}</span></span>
                          ) : (
                            <span className="text-neutral-400 italic">—</span>
                          )}
                        </div>
                      </td>

                      {/* IP Address */}
                      <td className="py-3.5 px-4 align-middle">
                        {it.ipAddress ? (
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-200/70 dark:border-white/5 text-neutral-600 dark:text-neutral-400">
                            {it.ipAddress}
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-xs italic">—</span>
                        )}
                      </td>

                      {/* Inspect Action */}
                      <td className="py-3.5 px-5 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setViewing(it)}
                          className="w-8 h-8 rounded-lg inline-flex items-center justify-center border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 hover:shadow-xs transition-all cursor-pointer"
                          title="Inspect Event Payload"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ================================================================= */}
        {/* 5. PAGINATION FOOTER                                              */}
        {/* ================================================================= */}
        <div className="p-4 bg-neutral-50/60 dark:bg-white/[0.01] border-t border-neutral-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-3">
            <span>
              Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length} activities
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-800 dark:text-white font-bold outline-none cursor-pointer"
              >
                {PAGE_SIZES.map((sz) => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft size={14} />
            </button>

            <span className="px-3 font-bold text-neutral-800 dark:text-neutral-200">
              Page {safePage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Next Page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 6. SLIDE-OUT RHS AUDIT EVENT DETAILS DRAWER                       */}
      {/* ================================================================= */}
      {viewing && (
        <AuditEventDrawer
          item={viewing}
          userInfo={viewing.userId ? userMap[viewing.userId] ?? null : null}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
