import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiDelete } from "../../api/client";
import { Loading } from "../../components/ui";
import { formatDate } from "../shared";
import {
  Building2, CheckCircle2, Search, RefreshCw, ChevronLeft, ChevronRight,
  X, Download, Filter, Mail, Phone, Eye, ClipboardList, FileText, ShoppingCart, Receipt,
  Trash2, AlertTriangle, ShieldCheck, MapPin, Globe,
  Calendar, Check, Copy, ExternalLink,
} from "lucide-react";
import "./erpListView.css";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Company {
  id: string;
  name: string;
  industry: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  city: string | null;
  state: string | null;
  gstNumber: string | null;
  companyLogoUrl: string | null;
  verificationStatus: string;
  isActive: boolean;
  createdAtUtc: string;
  addressLine1: string | null;
  website: string | null;
  panNumber: string | null;
  cinNumber: string | null;
  msmeNumber: string | null;
}

interface Filters {
  search: string;
  status: string;
  state: string;
  sort: string;
}

const EMPTY_FILTERS: Filters = { search: "", status: "All", state: "All", sort: "Recently Registered" };
const PAGE_SIZES = [10, 20, 50, 100];
const SORTS = ["Recently Registered", "Company Name (A-Z)"];

/* ------------------------------------------------------------------ */
/*  Deterministic Avatar Palettes                                      */
/* ------------------------------------------------------------------ */

const AVATAR_PALETTES = [
  { bg: "rgba(59,130,246,0.15)", fg: "#3B82F6", border: "rgba(59,130,246,0.3)" },
  { bg: "rgba(168,85,247,0.15)", fg: "#A855F7", border: "rgba(168,85,247,0.3)" },
  { bg: "rgba(20,184,166,0.15)", fg: "#14B8A6", border: "rgba(20,184,166,0.3)" },
  { bg: "rgba(249,115,22,0.15)", fg: "#F97316", border: "rgba(249,115,22,0.3)" },
  { bg: "rgba(236,72,153,0.15)", fg: "#EC4899", border: "rgba(236,72,153,0.3)" },
  { bg: "rgba(34,197,94,0.15)", fg: "#22C55E", border: "rgba(34,197,94,0.3)" },
];

function getAvatarStyle(identifier: string) {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";
}

/* ------------------------------------------------------------------ */
/*  Delete Company Modal                                               */
/* ------------------------------------------------------------------ */

function DeleteCompanyModal({
  company,
  onClose,
  onConfirm,
  loading,
}: {
  company: Company;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const [typed, setTyped] = useState("");
  const isMatch = typed.trim().toLowerCase() === "delete";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-[#121520] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between bg-red-500/5">
          <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle size={17} />
            </div>
            <h3 className="font-extrabold text-sm m-0">Delete Company Record</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">
            Are you sure you want to permanently delete company{" "}
            <strong className="text-neutral-900 dark:text-white">{company.name}</strong>?
          </p>

          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 leading-relaxed font-medium">
            <strong>Warning:</strong> If this company has no operational documents (orders/invoices), it will be removed permanently. Associated user mappings will be disconnected.
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
              To confirm, type <span className="text-red-500 font-mono font-bold">delete</span> below:
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 dark:border-white/10 bg-white dark:bg-[#161a26] text-neutral-900 dark:text-white outline-none focus:border-red-500"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type 'delete' to confirm"
              autoFocus
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-neutral-50 dark:bg-white/[0.02] border-t border-neutral-100 dark:border-white/10 flex items-center justify-end gap-2.5">
          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isMatch || loading}
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm shadow-red-500/20 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>{loading ? "Deleting..." : "Permanently Delete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide-out RHS Company Details Drawer                               */
/* ------------------------------------------------------------------ */

function CompanyDetailsDrawer({
  company,
  onClose,
  onDelete,
}: {
  company: Company;
  onClose: () => void;
  onDelete: (c: Company) => void;
}) {
  const navigate = useNavigate();
  const [copiedGst, setCopiedGst] = useState(false);
  const palette = getAvatarStyle(company.name);

  const copyGst = () => {
    if (!company.gstNumber) return;
    navigator.clipboard.writeText(company.gstNumber);
    setCopiedGst(true);
    setTimeout(() => setCopiedGst(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 animate-in fade-in duration-200" onClick={onClose} />
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-[#0c0f17] border-l border-neutral-200 dark:border-white/10 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#0f121a] shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm border shadow-xs shrink-0"
              style={{ background: palette.bg, color: palette.fg, borderColor: palette.border }}
            >
              {company.companyLogoUrl ? (
                <img src={company.companyLogoUrl} alt={company.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                initials(company.name)
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-neutral-900 dark:text-white m-0">
                {company.name}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0 mt-0.5">
                {company.industry || "Client Organization"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & GST Summary Banner */}
          <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/60 dark:bg-white/[0.02] flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Account Status</div>
              <div className="mt-1.5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                  company.isActive
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-300 dark:border-white/10"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${company.isActive ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"}`} />
                  <span>{company.isActive ? "Active Account" : "Inactive"}</span>
                </span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 text-right">GST Verification</div>
              <div className="mt-1.5">
                {company.gstNumber ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                    <ShieldCheck size={13} /> GST Registered
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-100 dark:bg-white/5 text-neutral-500">
                    GST Unregistered
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick ERP Jump Links */}
          <div className="space-y-2">
            <div className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">
              Operational Portals & Documents
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => { onClose(); navigate(`/admin/enquiries?company=${company.id}`); }}
                className="p-3 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#121520] hover:border-blue-500/40 text-left transition-all group cursor-pointer shadow-xs"
              >
                <ClipboardList size={16} className="text-blue-500 mb-1.5" />
                <div className="text-xs font-bold text-neutral-900 dark:text-white">Enquiries</div>
                <div className="text-[11px] text-neutral-400">Client Enquiries</div>
              </button>

              <button
                type="button"
                onClick={() => { onClose(); navigate(`/admin/quotations?company=${company.id}`); }}
                className="p-3 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#121520] hover:border-purple-500/40 text-left transition-all group cursor-pointer shadow-xs"
              >
                <FileText size={16} className="text-purple-500 mb-1.5" />
                <div className="text-xs font-bold text-neutral-900 dark:text-white">Quotes</div>
                <div className="text-[11px] text-neutral-400">Quotations</div>
              </button>

              <button
                type="button"
                onClick={() => { onClose(); navigate(`/admin/orders?company=${company.id}`); }}
                className="p-3 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#121520] hover:border-orange-500/40 text-left transition-all group cursor-pointer shadow-xs"
              >
                <ShoppingCart size={16} className="text-orange-500 mb-1.5" />
                <div className="text-xs font-bold text-neutral-900 dark:text-white">Orders</div>
                <div className="text-[11px] text-neutral-400">Client Orders</div>
              </button>

              <button
                type="button"
                onClick={() => { onClose(); navigate(`/admin/invoices?company=${company.id}`); }}
                className="p-3 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#121520] hover:border-emerald-500/40 text-left transition-all group cursor-pointer shadow-xs"
              >
                <Receipt size={16} className="text-emerald-500 mb-1.5" />
                <div className="text-xs font-bold text-neutral-900 dark:text-white">Invoices</div>
                <div className="text-[11px] text-neutral-400">Billing History</div>
              </button>
            </div>
          </div>

          {/* Legal & Taxation Specification */}
          <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#121520] p-4 space-y-3 shadow-xs">
            <div className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-100 dark:border-white/5">
              Tax & Legal Identifiers
            </div>

            <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-white/5">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-blue-500" /> GSTIN Number
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-900 dark:text-white font-mono">
                  {company.gstNumber || <span className="text-neutral-400/60 font-normal italic">GST Pending</span>}
                </span>
                {company.gstNumber && (
                  <button
                    type="button"
                    onClick={copyGst}
                    className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
                    title="Copy GST"
                  >
                    {copiedGst ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-white/5">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">PAN Number</span>
              <span className="text-xs font-bold text-neutral-900 dark:text-white font-mono">
                {company.panNumber || <span className="text-neutral-400/60 font-normal italic">Not provided</span>}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-white/5">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">CIN Number</span>
              <span className="text-xs font-bold text-neutral-900 dark:text-white font-mono">
                {company.cinNumber || <span className="text-neutral-400/60 font-normal italic">Not provided</span>}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">MSME / Udyam</span>
              <span className="text-xs font-bold text-neutral-900 dark:text-white font-mono">
                {company.msmeNumber || <span className="text-neutral-400/60 font-normal italic">Not provided</span>}
              </span>
            </div>
          </div>

          {/* Contact & Location Details */}
          <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#121520] p-4 space-y-3 shadow-xs">
            <div className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-100 dark:border-white/5">
              Contact & Address
            </div>

            <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-white/5">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Mail size={13} className="text-orange-500" /> Company Email
              </span>
              <span className="text-xs font-bold text-neutral-900 dark:text-white font-mono">
                {company.companyEmail || <span className="text-neutral-400/60 font-normal italic">Not provided</span>}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-white/5">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Phone size={13} className="text-blue-500" /> Phone Number
              </span>
              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                {company.companyPhone || <span className="text-neutral-400/60 font-normal italic">Not provided</span>}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-white/5">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <MapPin size={13} className="text-emerald-500" /> City & State
              </span>
              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                {[company.city, company.state].filter(Boolean).join(", ") || <span className="text-neutral-400/60 font-normal italic">Not set</span>}
              </span>
            </div>

            {company.addressLine1 && (
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-white/5">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Street Address</span>
                <span className="text-xs font-bold text-neutral-900 dark:text-white text-right max-w-[240px]">
                  {company.addressLine1}
                </span>
              </div>
            )}

            {company.website && (
              <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-white/5">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Globe size={13} className="text-purple-500" /> Website
                </span>
                <a
                  href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>{company.website}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}

            <div className="flex items-center justify-between py-2">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Calendar size={13} className="text-teal-500" /> Registered On
              </span>
              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                {formatDate(company.createdAtUtc)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-[#0f121a] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(company);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Delete Company</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Admin Companies Page                                          */
/* ------------------------------------------------------------------ */

export default function AdminCompaniesPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewing, setViewing] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const load = useCallback((isManual = false) => {
    if (isManual) setRefreshing(true);
    return apiGet<Company[]>("/api/v1/admin/companies")
      .then((data) => {
        setCompanies(data);
        if (isManual) {
          setFeedbackNotice("Company registry refreshed successfully.");
          setTimeout(() => setFeedbackNotice(null), 2500);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => {
        if (isManual) setRefreshing(false);
      });
  }, []);

  useEffect(() => { void load(false); }, [load]);

  const stateOptions = useMemo(() => {
    if (!companies) return [] as string[];
    return Array.from(new Set(companies.map((c) => c.state).filter((s): s is string => !!s))).sort();
  }, [companies]);

  const filtered = useMemo(() => {
    const list = companies ?? [];
    const q = filters.search.trim().toLowerCase();
    return list
      .filter((c) => {
        if (q) {
          const match = c.name.toLowerCase().includes(q)
            || (c.gstNumber ?? "").toLowerCase().includes(q)
            || (c.city ?? "").toLowerCase().includes(q)
            || (c.state ?? "").toLowerCase().includes(q)
            || (c.industry ?? "").toLowerCase().includes(q)
            || (c.companyEmail ?? "").toLowerCase().includes(q);
          if (!match) return false;
        }
        if (filters.status === "Active" && !c.isActive) return false;
        if (filters.status === "Inactive" && c.isActive) return false;
        if (filters.status === "WithGst" && !c.gstNumber) return false;
        if (filters.state !== "All" && (c.state ?? "") !== filters.state) return false;
        return true;
      })
      .sort((a, b) => {
        if (filters.sort === "Company Name (A-Z)") return a.name.localeCompare(b.name);
        return new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime();
      });
  }, [companies, filters]);

  const kpis = useMemo(() => {
    const list = companies ?? [];
    return {
      total: list.length,
      active: list.filter((c) => c.isActive).length,
      inactive: list.filter((c) => !c.isActive).length,
      withGst: list.filter((c) => Boolean(c.gstNumber)).length,
    };
  }, [companies]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleDeleteCompanyConfirm = async () => {
    if (!deletingCompany) return;
    setDeleteLoading(true);
    try {
      await apiDelete(`/api/v1/admin/companies/${deletingCompany.id}`);
      setFeedbackNotice(`Company "${deletingCompany.name}" deleted permanently.`);
      setTimeout(() => setFeedbackNotice(null), 3000);
      setDeletingCompany(null);
      if (viewing?.id === deletingCompany.id) setViewing(null);
      load(false);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Failed to delete company.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const exportCsv = () => {
    const list = companies ?? [];
    const rows = [
      ["Company Name", "GSTIN", "Industry", "Email", "Phone", "City", "State", "Status", "Registered At"],
      ...list.map((c) => [
        c.name,
        c.gstNumber ?? "",
        c.industry ?? "",
        c.companyEmail ?? "",
        c.companyPhone ?? "",
        c.city ?? "",
        c.state ?? "",
        c.isActive ? "Active" : "Inactive",
        c.createdAtUtc,
      ]),
    ];
    const csv = rows.map((r) => r.map((f) => `"${f.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `companies_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (error) return <div className="py-24 text-center text-red-500 font-semibold">{error}</div>;
  if (!companies) return <div className="py-24 text-center"><Loading label="Loading company registry..." /></div>;

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* 1. HERO HEADER                                                    */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shadow-sm">
            <Building2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
                Company Registry
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200/70 dark:border-white/10">
                {kpis.total} Total Organizations
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
              Manage client organizations, tax identifiers, billing addresses, and linked customer accounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer"
            title="Export companies to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer disabled:opacity-60"
            title="Refresh Companies"
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
      {/* 2. KPI METRICS CARDS                                              */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Total Companies */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(59,130,246,0.18),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Building2 size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight">
            {kpis.total}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Total Companies</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">All customer entities</div>
        </div>

        {/* Active Clients */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(16,185,129,0.18),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight">
            {kpis.active}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Active Clients</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Authorized for purchasing</div>
        </div>

        {/* GST Registered */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(168,85,247,0.18),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <ShieldCheck size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight">
            {kpis.withGst}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">GST Registered</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Valid tax identifiers</div>
        </div>

        {/* Inactive Accounts */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(249,115,22,0.18),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Building2 size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight">
            {kpis.inactive}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Inactive Accounts</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Suspended organizations</div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. TOOLBAR & SEGMENTED FILTER TABS                                 */}
      {/* ================================================================= */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Real-time Search Input */}
          <div className="relative w-full lg:w-96">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => {
                setFilters((f) => ({ ...f, search: e.target.value }));
                setPage(1);
              }}
              placeholder="Search by company name, GST, city, state..."
              className="w-full pl-10 pr-4 h-10 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-orange-500 shadow-xs"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, search: "" }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Segmented Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { label: "All Companies", status: "All", count: kpis.total },
              { label: "Active Clients", status: "Active", count: kpis.active },
              { label: "GST Verified", status: "WithGst", count: kpis.withGst },
              { label: "Inactive", status: "Inactive", count: kpis.inactive },
            ].map((tab) => {
              const isCurrent = filters.status === tab.status;

              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    setFilters((f) => ({ ...f, status: tab.status }));
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    isCurrent ? "bg-white/20 text-white" : "bg-neutral-200/70 dark:bg-white/10 text-neutral-500 dark:text-neutral-400"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                showAdvancedFilters || filters.state !== "All" || filters.sort !== "Recently Registered"
                  ? "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  : "border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
              }`}
            >
              <Filter size={13} />
              <span>Options</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Bar */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-neutral-100 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">State / Province</label>
              <select
                value={filters.state}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, state: e.target.value }));
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-orange-500"
              >
                <option value="All">All States</option>
                {stateOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">Sort Order</label>
              <div className="flex items-center gap-2">
                <select
                  value={filters.sort}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, sort: e.target.value }));
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-orange-500"
                >
                  {SORTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Reset all filters"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 4. MODERN HIGH-END TABLE                                           */}
      {/* ================================================================= */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-24 text-center text-neutral-400 space-y-2">
            <Building2 size={44} className="mx-auto opacity-30" />
            <p className="text-sm font-medium text-neutral-500">No companies match the current search or filters.</p>
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="text-xs text-[var(--color-primary)] hover:underline font-bold cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ minWidth: 1100 }}>
              <thead>
                <tr className="bg-neutral-50/80 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10">
                  <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Company & Entity
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    GSTIN / Tax ID
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Location
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Contact Details
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Registered On
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Status
                  </th>
                  <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.04]">
                {paged.map((c) => {
                  const palette = getAvatarStyle(c.name);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setViewing(c)}
                      className="hover:bg-neutral-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      {/* Company Name & Entity */}
                      <td className="py-3.5 px-5 align-middle">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm border shadow-xs shrink-0"
                            style={{ background: palette.bg, color: palette.fg, borderColor: palette.border }}
                          >
                            {c.companyLogoUrl ? (
                              <img src={c.companyLogoUrl} alt={c.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              initials(c.name)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                              {c.name}
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                              {c.industry || "Client Organization"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* GSTIN / Tax ID */}
                      <td className="py-3.5 px-4 align-middle">
                        {c.gstNumber ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <ShieldCheck size={12} className="text-blue-500" />
                            <span>{c.gstNumber}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400 font-normal italic">
                            GST Pending
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          <MapPin size={12} className="text-neutral-400 shrink-0" />
                          <span className="truncate max-w-[160px]">
                            {[c.city, c.state].filter(Boolean).join(", ") || <span className="font-normal text-neutral-400 italic">Not set</span>}
                          </span>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                            <Mail size={12} className="text-orange-500 shrink-0" />
                            <span className="font-mono truncate max-w-[180px]">{c.companyEmail || "Not provided"}</span>
                          </div>
                          {c.companyPhone && (
                            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                              <Phone size={11} className="text-neutral-400 shrink-0" />
                              <span>{c.companyPhone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          {formatDate(c.createdAtUtc)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                          c.isActive
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-300 dark:border-white/10"
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${c.isActive ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"}`} />
                          <span>{c.isActive ? "Active" : "Inactive"}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewing(c)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 hover:shadow-xs transition-all cursor-pointer"
                            title="View Company Details"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => navigate(`/admin/enquiries?company=${c.id}`)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-xs transition-all cursor-pointer"
                            title="View Enquiries"
                          >
                            <ClipboardList size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => navigate(`/admin/quotations?company=${c.id}`)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-purple-500/50 hover:text-purple-600 dark:hover:text-purple-400 hover:shadow-xs transition-all cursor-pointer"
                            title="View Quotes"
                          >
                            <FileText size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => navigate(`/admin/orders?company=${c.id}`)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 hover:shadow-xs transition-all cursor-pointer"
                            title="View Orders"
                          >
                            <ShoppingCart size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingCompany(c)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-neutral-400 hover:border-red-500/40 hover:text-red-500 hover:bg-red-500/5 hover:shadow-xs transition-all cursor-pointer"
                            title="Delete Company"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ================================================================= */}
        {/* PAGINATION FOOTER                                                 */}
        {/* ================================================================= */}
        <div className="p-4 bg-neutral-50/60 dark:bg-white/[0.01] border-t border-neutral-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-3">
            <span>
              Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length} organizations
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-neutral-400">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 text-xs rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
              .map((n, idx, arr) => (
                <div key={n} className="flex items-center">
                  {idx > 0 && n - arr[idx - 1] > 1 && (
                    <span className="px-1 text-neutral-400">...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      n === safePage
                        ? "bg-[var(--color-primary)] text-white shadow-xs"
                        : "border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5"
                    }`}
                  >
                    {n}
                  </button>
                </div>
              ))}

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 5. VIEW COMPANY RHS SLIDING DRAWER                                */}
      {/* ================================================================= */}
      {viewing && (
        <CompanyDetailsDrawer
          company={viewing}
          onClose={() => setViewing(null)}
          onDelete={(c) => {
            setViewing(null);
            setDeletingCompany(c);
          }}
        />
      )}

      {/* ================================================================= */}
      {/* 6. TYPE 'DELETE' CONFIRMATION MODAL                               */}
      {/* ================================================================= */}
      {deletingCompany && (
        <DeleteCompanyModal
          company={deletingCompany}
          onClose={() => setDeletingCompany(null)}
          onConfirm={() => void handleDeleteCompanyConfirm()}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
