import { useCallback, useEffect, useMemo, useState, type ReactNode, type CSSProperties } from "react";
import { apiGet } from "../../api/client";
import { Loading } from "../../components/ui";
import {
  Activity, Zap, Users, Calendar, Clock, Search, RefreshCw, ChevronLeft, ChevronRight,
  X, MoreVertical, Eye, Download, Filter,
} from "lucide-react";
import "./erpListView.css";

/* ------------------------------------------------------------------ */
/*  Types & helpers                                                    */
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
}

const MODULES = ["Enquiry", "Quotation", "Orders", "Production", "Invoice", "Payment", "Products", "Companies", "Users", "Settings"];
const ACTION_TYPES = ["Created", "Updated", "Approved", "Rejected", "Generated", "Deleted", "Moved", "Received"];
const PAGE_SIZES = [10, 20, 50];

// Technical/auth activities that should never be shown as "business activity".
const isExcluded = (a: string): boolean =>
  a.startsWith("auth.") || a.startsWith("token") || a.startsWith("jwt") || a.includes("refresh")
  || a.startsWith("middleware") || a.startsWith("api.") || a.startsWith("worker")
  || a.startsWith("login") || a.startsWith("password") || a.startsWith("role.") || a.startsWith("permission");

const MODULE_MAP: Record<string, string> = {
  enquiry: "Enquiry", quotation: "Quotation", order: "Orders", invoice: "Invoice", payment: "Payment",
  product: "Products", company: "Companies", user: "Users", setting: "Settings", category: "Products", production: "Production",
};

function moduleOf(item: AuditItem): string {
  if (item.entityType) {
    const key = item.entityType.toLowerCase();
    return MODULE_MAP[key] ?? item.entityType;
  }
  const prefix = item.action.split(".")[0]?.toLowerCase() ?? "";
  return MODULE_MAP[prefix] ?? prefix;
}

function actionLabel(item: AuditItem): { label: string; tone: string } {
  const verb = item.action.split(".").pop() ?? item.action;
  const v = verb.toLowerCase();
  if (v === "created" || v === "received" || v === "paid") return { label: `Created ${item.entityType ?? ""}`.trim() || "Created", tone: "green" };
  if (v === "approved" || v === "accepted" || v === "verified") return { label: `Approved ${item.entityType ?? ""}`.trim(), tone: "blue" };
  if (v === "generated" || v === "issued") return { label: `Generated ${item.entityType ?? ""}`.trim(), tone: "purple" };
  if (v === "updated" || v === "modified" || v === "changed" || v === "moved") return { label: `Updated ${item.entityType ?? ""}`.trim(), tone: "orange" };
  if (v === "rejected" || v === "deleted" || v === "cancelled" || v === "declined") return { label: `Rejected ${item.entityType ?? ""}`.trim(), tone: "red" };
  return { label: item.action, tone: "gray" };
}

function moduleTone(module: string): string {
  switch (module) {
    case "Enquiry": case "Companies": return "blue";
    case "Quotation": case "Products": return "purple";
    case "Orders": case "Production": return "orange";
    case "Invoice": return "red";
    case "Payment": return "green";
    case "Users": case "Settings": return "teal";
    default: return "gray";
  }
}

function roleLabel(role: string | undefined): string {
  switch (role) {
    case "Admin": return "Administrator";
    case "Engineer": return "Engineer";
    case "Customer": return "Customer";
    default: return "User";
  }
}

function initials(name: string | undefined): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";
}

function detailSentence(item: AuditItem): string {
  const t = item.entityType ?? "Record";
  if (item.entityId) return `${t} ${item.entityId}`;
  return t;
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  };
}

interface Filters { search: string; module: string; action: string; user: string; from: string; to: string; }
const EMPTY: Filters = { search: "", module: "All", action: "All", user: "All", from: "", to: "" };

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminAuditLogsPage() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [userMap, setUserMap] = useState<Record<string, UserInfo>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [viewing, setViewing] = useState<AuditItem | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiGet<any>(`/api/v1/admin/audit-logs?page=1&pageSize=200`),
      apiGet<any[]>(`/api/v1/admin/users`).catch(() => [] as any[]),
    ]).then(([logs, users]) => {
      const raw: AuditItem[] = (logs?.items ?? []).filter((a: any) => !isExcluded(a.action ?? ""));
      setItems(raw);
      const map: Record<string, UserInfo> = {};
      for (const u of users) {
        map[String(u.id)] = { name: u.fullName ?? u.email, role: u.role ?? "User" };
      }
      setUserMap(map);
    }).catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => { if (!openMenu) return; const onDown = () => setOpenMenu(null); document.addEventListener("mousedown", onDown); return () => document.removeEventListener("mousedown", onDown); }, [openMenu]);
  useEffect(() => { setPage(1); }, [applied, pageSize]);

  const userOptions = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) { const u = it.userId ? userMap[it.userId] : null; if (u) set.add(u.name); }
    return Array.from(set).sort();
  }, [items, userMap]);

  const filtered = useMemo(() => {
    const q = applied.search.trim().toLowerCase();
    const result = items.filter((it) => {
      const user = it.userId ? userMap[it.userId] : null;
      const module = moduleOf(it);
      const action = actionLabel(it).label.toLowerCase();
      const detail = detailSentence(it).toLowerCase();
      if (q && !(module.toLowerCase().includes(q) || action.includes(q) || detail.includes(q) || (it.action ?? "").toLowerCase().includes(q))) return false;
      if (applied.module !== "All" && module !== applied.module) return false;
      if (applied.action !== "All" && !action.includes(applied.action.toLowerCase())) return false;
      if (applied.user !== "All" && (user?.name ?? "") !== applied.user) return false;
      const t = new Date(it.occurredAtUtc).getTime();
      if (applied.from && t < new Date(applied.from).getTime()) return false;
      if (applied.to) { const end = new Date(applied.to); end.setHours(23, 59, 59, 999); if (t > end.getTime()) return false; }
      return true;
    });
    return result;
  }, [items, applied, userMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const kpis = useMemo(() => {
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
    const today = items.filter((i) => startOfDay(new Date(i.occurredAtUtc)) === startOfDay(now)).length;
    const week = items.filter((i) => new Date(i.occurredAtUtc).getTime() >= startOfWeek.getTime()).length;
    const activeUsers = new Set(items.map((i) => i.userId).filter(Boolean)).size;
    const last = items.length ? new Date(items[0].occurredAtUtc) : null;
    return {
      total: items.length, today, activeUsers, week,
      lastUpdated: last ? `${last.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} ${last.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "—",
      weekLabel: `${new Date(startOfWeek).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
    };
  }, [items]);

  const hasFilters = applied.search !== "" || applied.module !== "All" || applied.action !== "All" || applied.user !== "All" || applied.from !== "" || applied.to !== "";
  const clearFilters = () => { setDraft(EMPTY); setApplied(EMPTY); setPage(1); };

  const exportCsv = () => {
    if (!filtered.length) return;
    const header = ["Time", "User", "Role", "Action", "Module", "Details", "IP Address"];
    const rows = filtered.map((i) => {
      const u = i.userId ? userMap[i.userId] : null;
      return [new Date(i.occurredAtUtc).toLocaleString(), u?.name ?? "—", u ? roleLabel(u.role) : "—", actionLabel(i).label, moduleOf(i), detailSentence(i), i.ipAddress ?? "—"];
    });
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "activity-log.csv"; a.click(); URL.revokeObjectURL(a.href);
  };

  const kpiCards = [
    { label: "Total Activities", value: kpis.total, hint: "All recorded activities", icon: Activity, color: "var(--kpi-blue)", bg: "var(--kpi-blue-bg)", glow: "rgba(59,130,246,0.25)" },
    { label: "Today's Activities", value: kpis.today, hint: "Performed today", icon: Zap, color: "var(--kpi-green)", bg: "var(--kpi-green-bg)", glow: "rgba(34,197,94,0.22)" },
    { label: "Active Users", value: kpis.activeUsers, hint: "Users performed actions", icon: Users, color: "var(--kpi-purple)", bg: "var(--kpi-purple-bg)", glow: "rgba(167,139,250,0.22)" },
    { label: "This Week", value: kpis.week, hint: kpis.weekLabel, icon: Calendar, color: "var(--kpi-orange)", bg: "var(--kpi-orange-bg)", glow: "rgba(249,115,22,0.22)" },
    { label: "Last Updated", value: kpis.lastUpdated, hint: "Latest activity", icon: Clock, color: "var(--kpi-teal)", bg: "var(--kpi-teal-bg)", glow: "rgba(20,184,166,0.22)" },
  ];

  const renderRow = (it: AuditItem) => {
    const dt = formatDateTime(it.occurredAtUtc);
    const user = it.userId ? userMap[it.userId] : null;
    const action = actionLabel(it);
    const module = moduleOf(it);
    return (
      <tr key={it.id}>
        <td>
          <div className="inv-date">{dt.date}</div>
          <div className="inv-time">{dt.time}</div>
        </td>
        <td>
          <div className="inv-customer">
            <span className="inv-avatar">{initials(user?.name)}</span>
            <div>
              <div className="inv-customer__name">{user?.name ?? "System"}</div>
              <div className="inv-customer__contact">{user ? roleLabel(user.role) : "System event"}</div>
            </div>
          </div>
        </td>
        <td><span className={`inv-badge inv-badge--${action.tone}`}>{action.label}</span></td>
        <td><span className={`inv-badge inv-badge--${moduleTone(module)}`}>{module}</span></td>
        <td><div className="inv-sub" style={{ marginTop: 0 }}>{detailSentence(it)}</div></td>
        <td><div className="inv-date">{it.ipAddress ?? "—"}</div></td>
        <td>
          <div className="inv-actions" onClick={(e) => e.stopPropagation()}>
            <div className="inv-menu-wrap" onMouseDown={(e) => e.stopPropagation()}>
              <button className="inv-icon-btn" title="More" aria-label="More actions"
                aria-expanded={openMenu === it.id}
                onClick={() => setOpenMenu((m) => (m === it.id ? null : it.id))}>
                <MoreVertical size={16} />
              </button>
              {openMenu === it.id && (
                <div className="inv-menu">
                  <button className="inv-menu__item" onClick={() => { setOpenMenu(null); setViewing(it); }}>
                    <Eye size={15} /> View Details
                  </button>
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="inv-page">
      {/* Header */}
      <div className="inv-header">
        <div>
          <h1 className="inv-header__title">Activity Log</h1>
          <p className="inv-header__subtitle">Track all important business activities performed across the system.</p>
        </div>
        <div className="inv-header__actions">
          <button className="inv-btn" onClick={exportCsv} title="Export visible activities to CSV">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="inv-kpi-grid">
        {kpiCards.map((k) => (
          <div key={k.label} className="inv-kpi"
            style={{ "--inv-kpi-color": k.color, "--inv-kpi-bg": k.bg, "--inv-kpi-glow": k.glow } as CSSProperties}>
            <span className="inv-kpi__icon"><k.icon size={20} /></span>
            <span className="inv-kpi__value">{k.value}</span>
            <span className="inv-kpi__label">{k.label}</span>
            <span className="inv-kpi__hint">{k.hint}</span>
          </div>
        ))}
      </div>

      {/* Search & filter bar */}
      <div className="inv-filterbar">
        <div className="inv-field" style={{ flex: "1 1 200px" }}>
          <label className="inv-field__label">Search</label>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input className="inv-input" style={{ paddingLeft: 32 }} type="search" value={draft.search}
              placeholder="Search activities..." aria-label="Search activities"
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))} />
          </div>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Date Range</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input type="date" className="inv-input" value={draft.from} onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))} aria-label="From date" />
            <input type="date" className="inv-input" value={draft.to} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} aria-label="To date" />
          </div>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Module</label>
          <select className="inv-select" value={draft.module} onChange={(e) => setDraft((d) => ({ ...d, module: e.target.value }))}>
            <option value="All">All Modules</option>
            {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Action</label>
          <select className="inv-select" value={draft.action} onChange={(e) => setDraft((d) => ({ ...d, action: e.target.value }))}>
            <option value="All">All Actions</option>
            {ACTION_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">User</label>
          <select className="inv-select" value={draft.user} onChange={(e) => setDraft((d) => ({ ...d, user: e.target.value }))}>
            <option value="All">All Users</option>
            {userOptions.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <button className="inv-btn" title="Reset filters" onClick={clearFilters}>
          <X size={14} /> Reset
        </button>
        <button className="inv-btn inv-btn--primary" onClick={() => { setApplied(draft); setPage(1); }}>
          <Filter size={15} /> Filter
        </button>
        <button className="inv-btn inv-btn--icon" title="Refresh" aria-label="Refresh" onClick={load}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Loading / error / empty */}
      {error && <div className="inv-status" style={{ color: "var(--color-danger)" }}>{error}</div>}
      {!error && loading && <div className="inv-status"><Loading label="Loading activities" /></div>}
      {!error && !loading && filtered.length === 0 && (
        <div className="inv-status"><div>{hasFilters ? "No activities match the current filters." : "No business activities recorded yet."}</div></div>
      )}

      {/* Table */}
      {!error && !loading && paged.length > 0 && (
        <div className="inv-table-wrap">
          <div className="inv-scroll">
            <table className="inv-table">
              <colgroup>
                <col style={{ width: "14%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "24%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: 70 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Details</th>
                  <th>IP Address</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((it) => renderRow(it))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="inv-pagination">
        <span className="inv-pagination__info">
          {`Showing ${filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length} activities`}
        </span>

        <div className="inv-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <label className="inv-field__label" style={{ margin: 0 }}>Rows</label>
          <select className="inv-select" style={{ width: "auto", padding: "7px 34px 7px 10px" }}
            value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <button className="inv-page-btn" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
          .reduce<ReactNode[]>((acc, n, idx, arr) => {
            if (idx > 0 && n - arr[idx - 1] > 1) acc.push(<span key={`e${n}`} style={{ color: "var(--text-muted)", padding: "0 2px" }}>…</span>);
            acc.push(
              <button key={n} className={`inv-page-btn ${n === safePage ? "inv-page-btn--active" : ""}`}
                onClick={() => setPage(n)}>{n}</button>,
            );
            return acc;
          }, [])}

        <button className="inv-page-btn" disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* View details modal */}
      {viewing && (
        <div className="inv-modal-backdrop" onClick={() => setViewing(null)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Activity details">
            <div className="inv-modal__head">
              <span className="inv-modal__title">Activity Details</span>
              <button className="inv-icon-btn" onClick={() => setViewing(null)} aria-label="Close"><X size={16} /></button>
            </div>
            <div className="inv-modal__body">
              {[
                ["Time", new Date(viewing.occurredAtUtc).toLocaleString()],
                ["User", (viewing.userId ? userMap[viewing.userId]?.name : null) ?? "System"],
                ["Role", viewing.userId ? roleLabel(userMap[viewing.userId]?.role) : "—"],
                ["Action", viewing.action],
                ["Module", moduleOf(viewing)],
                ["Details", detailSentence(viewing)],
                ["IP Address", viewing.ipAddress ?? "—"],
                ["User Agent", viewing.userAgent ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="inv-modal__row">
                  <span className="inv-modal__row-label">{k}</span>
                  <span className="inv-modal__row-value">{v}</span>
                </div>
              ))}
            </div>
            <div className="inv-modal__foot">
              <button className="inv-btn" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
