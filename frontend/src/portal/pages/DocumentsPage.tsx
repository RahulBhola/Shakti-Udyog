import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiDownload } from "../../api/client";
import { customerApi, type DocumentItem, type OrderListItem } from "../../api/customerApi";
import { formatBytes, formatDate } from "../shared";
import {
  FileText,
  Search,
  UploadCloud,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  LayoutGrid,
  List,
  CheckCircle2,
  XCircle,
  X,
  FileCode,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCheck,
  ShieldCheck,
  Building2,
  ShoppingCart,
  Copy,
  Check,
  AlertCircle,
  FilePlus,
  Tag,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";

/* ------------------------------------------------------------------ */
/*  Document Category Options & Helpers                               */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  "All",
  "Inspection Report",
  "Drawing",
  "Invoice",
  "Certificate",
  "Delivery Challan",
  "Specification",
  "Other",
] as const;

type CategoryFilter = typeof CATEGORIES[number];

function getCategoryTheme(cat: string) {
  const c = cat.toLowerCase();
  if (c.includes("inspection") || c.includes("report") || c.includes("lab") || c.includes("test")) {
    return {
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-500/30",
      icon: FileCheck,
      colorHex: "#F59E0B",
    };
  }
  if (c.includes("drawing") || c.includes("cad") || c.includes("spec") || c.includes("model")) {
    return {
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/30",
      icon: FileCode,
      colorHex: "#3B82F6",
    };
  }
  if (c.includes("invoice") || c.includes("bill") || c.includes("payment")) {
    return {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-500/30",
      icon: FileText,
      colorHex: "#10B981",
    };
  }
  if (c.includes("certificate") || c.includes("iso") || c.includes("msme") || c.includes("compliance")) {
    return {
      bg: "bg-purple-500/10 dark:bg-purple-500/20",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-500/30",
      icon: ShieldCheck,
      colorHex: "#A855F7",
    };
  }
  if (c.includes("challan") || c.includes("dispatch") || c.includes("packing")) {
    return {
      bg: "bg-cyan-500/10 dark:bg-cyan-500/20",
      text: "text-cyan-600 dark:text-cyan-400",
      border: "border-cyan-500/30",
      icon: ShoppingCart,
      colorHex: "#06B6D4",
    };
  }
  return {
    bg: "bg-neutral-500/10 dark:bg-neutral-500/20",
    text: "text-neutral-600 dark:text-neutral-400",
    border: "border-neutral-500/30",
    icon: FileText,
    colorHex: "#6B7280",
  };
}

function getFileTypeDetails(fileName: string, contentType?: string | null) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const ct = (contentType || "").toLowerCase();

  if (ext === "pdf" || ct.includes("pdf")) {
    return { label: "PDF Document", ext: "PDF", color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30", icon: FileText };
  }
  if (["dwg", "dxf", "step", "stp", "iges", "igs"].includes(ext)) {
    return { label: "CAD / Technical Drawing", ext: ext.toUpperCase(), color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30", icon: FileCode };
  }
  if (["png", "jpg", "jpeg", "webp", "svg"].includes(ext) || ct.includes("image")) {
    return { label: "Image / Photo", ext: ext.toUpperCase(), color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30", icon: ImageIcon };
  }
  if (["xlsx", "xls", "csv"].includes(ext) || ct.includes("spreadsheet") || ct.includes("excel")) {
    return { label: "Spreadsheet Data", ext: ext.toUpperCase(), color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", icon: FileSpreadsheet };
  }
  if (["doc", "docx"].includes(ext)) {
    return { label: "Word Document", ext: ext.toUpperCase(), color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30", icon: FileText };
  }
  return { label: "Technical File", ext: ext ? ext.toUpperCase() : "FILE", color: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/30", icon: FileText };
}

/* ------------------------------------------------------------------ */
/*  Main Documents Page Component                                      */
/* ------------------------------------------------------------------ */

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[] | null>(null);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");
  const [selectedOrder, setSelectedOrder] = useState<string>("All");
  const [selectedFileType, setSelectedFileType] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title" | "size">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // UI state
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<DocumentItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadDocuments = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [docs, ords] = await Promise.all([
        customerApi.documents(),
        customerApi.orders().catch(() => [] as OrderListItem[]),
      ]);
      setDocuments(docs);
      setOrders(ords);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load document vault.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  // Filter and Sort documents
  const filteredAndSortedDocs = useMemo(() => {
    if (!documents) return [];

    return documents
      .filter((d) => {
        // Category Filter
        if (selectedCategory !== "All" && d.category !== selectedCategory) {
          return false;
        }

        // Order Filter
        if (selectedOrder !== "All" && d.orderNumber !== selectedOrder) {
          return false;
        }

        // File Type Filter
        if (selectedFileType !== "All") {
          const ext = d.fileName.split(".").pop()?.toLowerCase() || "";
          if (selectedFileType === "pdf" && ext !== "pdf") return false;
          if (selectedFileType === "cad" && !["dwg", "dxf", "step", "stp", "iges", "igs"].includes(ext)) return false;
          if (selectedFileType === "image" && !["png", "jpg", "jpeg", "webp", "svg"].includes(ext)) return false;
          if (selectedFileType === "spreadsheet" && !["xlsx", "xls", "csv"].includes(ext)) return false;
        }

        // Search Term (matches Title, File Name, Order Number, Category)
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchTitle = d.title?.toLowerCase().includes(q);
          const matchFile = d.fileName?.toLowerCase().includes(q);
          const matchOrder = d.orderNumber?.toLowerCase().includes(q);
          const matchCategory = d.category?.toLowerCase().includes(q);
          if (!matchTitle && !matchFile && !matchOrder && !matchCategory) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime();
        if (sortBy === "oldest") return new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime();
        if (sortBy === "title") return a.title.localeCompare(b.title);
        if (sortBy === "size") return b.sizeBytes - a.sizeBytes;
        return 0;
      });
  }, [documents, selectedCategory, selectedOrder, selectedFileType, search, sortBy]);

  // Metrics computation
  const metrics = useMemo(() => {
    if (!documents) {
      return { total: 0, reports: 0, drawings: 0, invoices: 0, totalBytes: 0 };
    }
    let reports = 0;
    let drawings = 0;
    let invoices = 0;
    let totalBytes = 0;

    documents.forEach((d) => {
      totalBytes += d.sizeBytes || 0;
      const c = d.category.toLowerCase();
      if (c.includes("inspection") || c.includes("report") || c.includes("test")) reports++;
      else if (c.includes("drawing") || c.includes("cad") || c.includes("spec")) drawings++;
      else if (c.includes("invoice") || c.includes("bill") || c.includes("challan")) invoices++;
    });

    return { total: documents.length, reports, drawings, invoices, totalBytes };
  }, [documents]);

  // Download Handler
  const handleDownload = async (doc: DocumentItem) => {
    try {
      showToast(`Starting download: ${doc.fileName}...`, "success");
      await apiDownload(customerApi.downloadDocument(doc.id), doc.fileName);
    } catch {
      showToast(`Could not download "${doc.title}". File may be restricted or undergoing backup.`, "error");
    }
  };

  // Copy Filename Handler
  const handleCopy = (doc: DocumentItem) => {
    navigator.clipboard.writeText(`${doc.title} (${doc.fileName})`);
    setCopiedId(doc.id);
    showToast("Document info copied to clipboard.", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!deleteConfirmDoc) return;
    setDeleteBusy(true);
    try {
      await customerApi.deleteDocument(deleteConfirmDoc.id);
      setDocuments((prev) => (prev ? prev.filter((d) => d.id !== deleteConfirmDoc.id) : []));
      showToast(`"${deleteConfirmDoc.title}" has been deleted.`, "success");
      setDeleteConfirmDoc(null);
    } catch {
      showToast("Could not delete this document. It may be locked by a production order.", "error");
    } finally {
      setDeleteBusy(false);
    }
  };

  const isFiltered = selectedCategory !== "All" || selectedOrder !== "All" || selectedFileType !== "All" || search.trim().length > 0;

  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedOrder("All");
    setSelectedFileType("All");
    setSearch("");
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            "fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-white text-xs font-semibold backdrop-blur-xl border transition-all animate-in slide-in-from-top-4",
            toast.type === "success"
              ? "bg-emerald-600 border-emerald-500 shadow-emerald-900/20"
              : "bg-rose-600 border-rose-500 shadow-rose-900/20"
          )}
        >
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors ml-2 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* 1. HERO HEADER                                                    */}
      {/* ================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight m-0 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 inline-flex items-center justify-center">
                <FileText size={20} />
              </span>
              Document Library & Technical Vault
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Verified QA Vault
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 m-0">
            Certified inspection certificates, CAD drawings, material test records, and commercial files for your company.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#121520] shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === "grid"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
              )}
              title="Grid card view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === "table"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
              )}
              title="Table list view"
            >
              <List size={15} />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => void loadDocuments(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer"
            title="Refresh document list"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-blue-600" : ""} />
          </button>

          {/* Upload Document Primary CTA */}
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <UploadCloud size={15} />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. KPI METRICS CARDS (ADMIN ERP DESIGN SYSTEM GRADIENTS)           */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Files */}
        <div className="p-4 rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs hover:shadow-md hover:shadow-blue-500/5 hover:border-blue-500/40 transition-all flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <FileText size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80">Total Files</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {metrics.total}
            </div>
          </div>
        </div>

        {/* QA & Reports */}
        <div className="p-4 rounded-2xl border border-amber-500/20 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs hover:shadow-md hover:shadow-amber-500/5 hover:border-amber-500/40 transition-all flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <FileCheck size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80">QA & Reports</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {metrics.reports}
            </div>
          </div>
        </div>

        {/* Drawings & CAD */}
        <div className="p-4 rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs hover:shadow-md hover:shadow-blue-500/5 hover:border-blue-500/40 transition-all flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <FileCode size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80">Drawings & CAD</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {metrics.drawings}
            </div>
          </div>
        </div>

        {/* Commercial & Tax */}
        <div className="p-4 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs hover:shadow-md hover:shadow-emerald-500/5 hover:border-emerald-500/40 transition-all flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/80">Commercial & Tax</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {metrics.invoices}
            </div>
          </div>
        </div>

        {/* Vault Storage */}
        <div className="p-4 rounded-2xl border border-purple-500/20 dark:border-purple-500/30 bg-gradient-to-br from-purple-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs hover:shadow-md hover:shadow-purple-500/5 hover:border-purple-500/40 transition-all flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600/80 dark:text-purple-400/80">Vault Storage</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {formatBytes(metrics.totalBytes)}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. CATEGORY PILL TABS & FILTER TOOLBAR                            */}
      {/* ================================================================= */}
      <div className="space-y-3">
        {/* Category Pill Tabs */}
        <div className="flex items-center flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === "All"
                ? documents?.length ?? 0
                : documents?.filter((d) => d.category === cat).length ?? 0;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer flex items-center gap-1.5",
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
                    : "bg-white dark:bg-[#121520] text-neutral-600 dark:text-neutral-400 border-neutral-200/90 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5"
                )}
              >
                <span>{cat === "All" ? "All Documents" : cat}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                    isSelected
                      ? "bg-white/25 text-white"
                      : "bg-neutral-100 dark:bg-white/10 text-neutral-500 dark:text-neutral-400"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-3.5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, file name, order #, or standard..."
              className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white placeholder-neutral-400 outline-none focus:border-blue-500 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-0.5 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* File Type Filter */}
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-blue-500 cursor-pointer font-medium"
            >
              <option value="All">All File Formats</option>
              <option value="pdf">PDF Documents</option>
              <option value="cad">CAD / 2D/3D Drawings</option>
              <option value="image">Inspection Images</option>
              <option value="spreadsheet">Data Spreadsheets</option>
            </select>

            {/* Linked Order Filter */}
            {orders.length > 0 && (
              <select
                value={selectedOrder}
                onChange={(e) => setSelectedOrder(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-blue-500 cursor-pointer font-medium max-w-[170px] truncate"
              >
                <option value="All">All Linked Orders</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.orderNumber}>
                    {o.orderNumber}
                  </option>
                ))}
              </select>
            )}

            {/* Sorting */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-blue-500 cursor-pointer font-medium"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Alphabetical (A–Z)</option>
              <option value="size">File Size (Largest)</option>
            </select>

            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. MAIN DOCUMENT CONTENT (GRID OR TABLE VIEW)                     */}
      {/* ================================================================= */}

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <RefreshCw size={32} className="mx-auto animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Accessing encrypted technical document vault...
          </p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-3">
          <AlertCircle size={36} className="mx-auto text-rose-500" />
          <h3 className="text-base font-bold text-rose-900 dark:text-rose-300 m-0">Documents Unavailable</h3>
          <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto m-0">{error}</p>
          <button
            type="button"
            onClick={() => void loadDocuments()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer mt-2"
          >
            <RefreshCw size={13} />
            <span>Try Again</span>
          </button>
        </div>
      ) : filteredAndSortedDocs.length === 0 ? (
        /* Empty State */
        <div className="p-12 sm:p-16 rounded-3xl border border-dashed border-neutral-300 dark:border-white/15 bg-white/50 dark:bg-[#0f121a]/50 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
            <FilePlus size={28} />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white m-0">
              {isFiltered ? "No Matching Documents Found" : "Your Document Vault is Ready"}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0">
              {isFiltered
                ? "No documents matched your active search or filters. Try adjusting your query or resetting all filters."
                : "Certified inspection reports, technical CAD drawings, mill test certificates, and tax invoices will automatically appear here for your orders."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {isFiltered ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <span>Clear All Filters</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-500/20"
              >
                <UploadCloud size={15} />
                <span>Upload Technical File</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedDocs.map((doc) => {
            const categoryMeta = getCategoryTheme(doc.category);
            const fileMeta = getFileTypeDetails(doc.fileName, doc.contentType);
            const CategoryIcon = categoryMeta.icon;

            return (
              <div
                key={doc.id}
                className="group relative rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] hover:border-blue-500/40 p-4.5 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header: Category Badge + File Type Chip */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border shadow-xs",
                        categoryMeta.bg,
                        categoryMeta.text,
                        categoryMeta.border
                      )}
                    >
                      <CategoryIcon size={12} />
                      <span>{doc.category}</span>
                    </span>

                    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border", fileMeta.color)}>
                      {fileMeta.ext}
                    </span>
                  </div>

                  {/* Document Title & File Name */}
                  <div>
                    <h3
                      onClick={() => setPreviewDoc(doc)}
                      className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 cursor-pointer m-0 leading-snug"
                      title={doc.title}
                    >
                      {doc.title}
                    </h3>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 font-mono truncate mt-1 m-0">
                      {doc.fileName}
                    </p>
                  </div>

                  {/* Order linkage & Metadata info */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 gap-2 flex-wrap">
                    {doc.orderNumber ? (
                      <Link
                        to="/customer/orders"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:underline no-underline"
                        title="Associated Order"
                      >
                        <Tag size={10} />
                        <span>Order #{doc.orderNumber}</span>
                      </Link>
                    ) : (
                      <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                        <Building2 size={11} /> Company Vault
                      </span>
                    )}

                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                      <span>{formatBytes(doc.sizeBytes)}</span>
                      <span>•</span>
                      <span>{formatDate(doc.createdAtUtc)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Eye size={13} />
                    <span>Preview</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(doc)}
                      className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
                      title="Copy document title"
                    >
                      {copiedId === doc.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDownload(doc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      title="Download file"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmDoc(doc)}
                      className="p-1.5 rounded-xl hover:bg-rose-500/10 text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* High-Density Modern ERP Table View */
        <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/80 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10">
                  <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Document & Title
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Category
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Linked Order
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Format & Size
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Uploaded On
                  </th>
                  <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.04]">
                {filteredAndSortedDocs.map((doc) => {
                  const categoryMeta = getCategoryTheme(doc.category);
                  const fileMeta = getFileTypeDetails(doc.fileName, doc.contentType);
                  const CategoryIcon = categoryMeta.icon;

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Document & Title */}
                      <td className="py-3.5 px-5 align-middle">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-xs border shrink-0",
                              categoryMeta.bg,
                              categoryMeta.text,
                              categoryMeta.border
                            )}
                          >
                            <CategoryIcon size={18} />
                          </div>
                          <div className="min-w-0">
                            <div
                              onClick={() => setPreviewDoc(doc)}
                              className="font-bold text-sm text-neutral-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer truncate max-w-sm"
                              title={doc.title}
                            >
                              {doc.title}
                            </div>
                            <div className="text-xs text-neutral-400 font-mono truncate mt-0.5">
                              {doc.fileName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 align-middle">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold border shadow-xs",
                            categoryMeta.bg,
                            categoryMeta.text,
                            categoryMeta.border
                          )}
                        >
                          <CategoryIcon size={12} />
                          <span>{doc.category}</span>
                        </span>
                      </td>

                      {/* Linked Order */}
                      <td className="py-3.5 px-4 align-middle">
                        {doc.orderNumber ? (
                          <Link
                            to="/customer/orders"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline no-underline"
                          >
                            <Tag size={11} />
                            <span>{doc.orderNumber}</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-neutral-400 font-medium">—</span>
                        )}
                      </td>

                      {/* Format & Size */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-2">
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", fileMeta.color)}>
                            {fileMeta.ext}
                          </span>
                          <span className="text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                            {formatBytes(doc.sizeBytes)}
                          </span>
                        </div>
                      </td>

                      {/* Upload Date */}
                      <td className="py-3.5 px-4 align-middle text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                        {formatDate(doc.createdAtUtc)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                            title="Preview document"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDownload(doc)}
                            className="p-1.5 rounded-lg hover:bg-blue-500/10 text-neutral-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Download document"
                          >
                            <Download size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmDoc(doc)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-neutral-500 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete document"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 5. INTERACTIVE DOCUMENT PREVIEW MODAL                             */}
      {/* ================================================================= */}
      {previewDoc && (
        <DocumentPreviewModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onDownload={() => void handleDownload(previewDoc)}
        />
      )}

      {/* ================================================================= */}
      {/* 6. UPLOAD DOCUMENT MODAL                                          */}
      {/* ================================================================= */}
      {uploadModalOpen && (
        <UploadDocumentModal
          orders={orders}
          onClose={() => setUploadModalOpen(false)}
          onUploaded={(newDoc) => {
            setDocuments((prev) => (prev ? [newDoc, ...prev] : [newDoc]));
            showToast(`Document "${newDoc.title}" uploaded to vault successfully!`, "success");
            setUploadModalOpen(false);
          }}
        />
      )}

      {/* ================================================================= */}
      {/* 7. CUSTOM GLASSMORPHIC DELETE CONFIRMATION MODAL                  */}
      {/* ================================================================= */}
      {deleteConfirmDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => !deleteBusy && setDeleteConfirmDoc(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white m-0">
                Remove Document from Vault?
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0">
                Are you sure you want to delete <strong className="text-neutral-900 dark:text-white font-mono">"{deleteConfirmDoc.title}"</strong>?
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5 text-xs text-neutral-500 space-y-1 font-mono">
              <div>File: {deleteConfirmDoc.fileName}</div>
              <div>Category: {deleteConfirmDoc.category}</div>
              <div>Size: {formatBytes(deleteConfirmDoc.sizeBytes)}</div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmDoc(null)}
                disabled={deleteBusy}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleteBusy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={13} />
                <span>{deleteBusy ? "Deleting..." : "Confirm Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DOCUMENT PREVIEW MODAL COMPONENT                                   */
/* ------------------------------------------------------------------ */

function DocumentPreviewModal({
  doc,
  onClose,
  onDownload,
}: {
  doc: DocumentItem;
  onClose: () => void;
  onDownload: () => void;
}) {
  const categoryMeta = getCategoryTheme(doc.category);
  const fileMeta = getFileTypeDetails(doc.fileName, doc.contentType);
  const previewUrl = customerApi.previewDocumentUrl(doc.id);
  const isPdf = doc.fileName.toLowerCase().endsWith(".pdf") || (doc.contentType && doc.contentType.includes("pdf"));
  const isImage = ["png", "jpg", "jpeg", "webp", "svg"].some((ext) => doc.fileName.toLowerCase().endsWith(`.${ext}`));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#0f121a] border border-neutral-200 dark:border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#121520] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold border shrink-0",
                categoryMeta.bg,
                categoryMeta.text,
                categoryMeta.border
              )}
            >
              <FileText size={16} />
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white truncate m-0">
                {doc.title}
              </h3>
              <p className="text-xs text-neutral-400 font-mono truncate m-0">
                {doc.fileName} • {formatBytes(doc.sizeBytes)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Modal Preview Body */}
        <div className="flex-1 overflow-y-auto bg-neutral-100 dark:bg-black/40 flex items-center justify-center min-h-[350px] p-4">
          {isPdf ? (
            <iframe
              src={previewUrl}
              title={doc.title}
              className="w-full h-[520px] rounded-2xl border border-neutral-200 dark:border-white/10 bg-white"
            />
          ) : isImage ? (
            <div className="max-h-[500px] flex items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-900">
              <img
                src={previewUrl}
                alt={doc.title}
                className="max-h-[500px] w-auto object-contain rounded-2xl"
              />
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-center space-y-3 max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center mx-auto">
                <FileCode size={26} />
              </div>
              <h4 className="text-base font-bold text-neutral-900 dark:text-white m-0">
                {fileMeta.label}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0">
                This format ({fileMeta.ext}) requires specialized software (e.g. AutoCAD, SolidWorks, Excel) for full interactive rendering. You can download the authenticated file directly.
              </p>
              <button
                type="button"
                onClick={onDownload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer mt-2"
              >
                <Download size={15} />
                <span>Download {doc.fileName}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Metadata Bar */}
        <div className="px-6 py-3 border-t border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#121520] flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 gap-4 flex-wrap shrink-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck size={14} /> Shakti Udyog Verified QA
            </span>
            {doc.orderNumber && (
              <span className="font-mono">Linked Order: #{doc.orderNumber}</span>
            )}
          </div>
          <div className="font-mono text-[11px]">
            Uploaded on {formatDate(doc.createdAtUtc)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  UPLOAD DOCUMENT MODAL COMPONENT                                    */
/* ------------------------------------------------------------------ */

function UploadDocumentModal({
  orders,
  onClose,
  onUploaded,
}: {
  orders: OrderListItem[];
  onClose: () => void;
  onUploaded: (doc: DocumentItem) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Drawing");
  const [orderId, setOrderId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      setFile(f);
      if (!title) {
        setTitle(f.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      if (!title) {
        setTitle(f.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a document title.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const result = await customerApi.uploadDocument({
        title: title.trim(),
        category: category.trim(),
        orderId: orderId || undefined,
        file,
      });
      onUploaded(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please check file format and size.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={() => !busy && onClose()}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <UploadCloud size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-neutral-900 dark:text-white m-0">
                Upload Technical Document
              </h3>
              <p className="text-xs text-neutral-400 m-0">
                Add drawings, specs, POs, or certificates to your company vault
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-8 h-8 rounded-xl border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drag & Drop File Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer",
              dragOver
                ? "border-blue-500 bg-blue-500/10"
                : file
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-neutral-200 dark:border-white/10 hover:border-blue-500/40 bg-neutral-50 dark:bg-white/[0.02]"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.dwg,.dxf,.step,.stp,.iges,.igs,.png,.jpg,.jpeg,.doc,.docx,.xlsx,.xls,.csv"
            />
            {file ? (
              <div className="space-y-1">
                <FileCheck size={28} className="mx-auto text-emerald-500" />
                <div className="text-xs font-bold text-neutral-900 dark:text-white font-mono truncate max-w-xs mx-auto">
                  {file.name}
                </div>
                <div className="text-[11px] text-neutral-400">{formatBytes(file.size)}</div>
              </div>
            ) : (
              <div className="space-y-1">
                <UploadCloud size={28} className="mx-auto text-blue-600 dark:text-blue-400" />
                <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Drag & drop file here, or <span className="text-blue-600 dark:text-blue-400 underline">browse</span>
                </div>
                <div className="text-[11px] text-neutral-400">
                  PDF, CAD (DWG, STEP), Photos, Docs up to 25 MB
                </div>
              </div>
            )}
          </div>

          {/* Document Title */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Document Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pump Impeller Casting Pattern 2D Drawing Rev B"
              required
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-blue-500"
            />
          </div>

          {/* Category & Order Link Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-900 dark:text-white outline-none focus:border-blue-500"
              >
                <option value="Drawing">Drawing & CAD Spec</option>
                <option value="Inspection Report">Inspection & QA Report</option>
                <option value="Certificate">Certificate & Compliance</option>
                <option value="Specification">Technical Specification</option>
                <option value="Invoice">Purchase Order / Commercial</option>
                <option value="Delivery Challan">Delivery Challan</option>
                <option value="Other">Other Technical File</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Link to Order (Optional)
              </label>
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-900 dark:text-white outline-none focus:border-blue-500"
              >
                <option value="">None (Company Vault)</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !file || !title.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              <UploadCloud size={14} className={busy ? "animate-spin" : ""} />
              <span>{busy ? "Uploading File..." : "Upload File"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
