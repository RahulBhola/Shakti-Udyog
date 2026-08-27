import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { customerApi, type SupportRequestItem, type OrderListItem } from "../../api/customerApi";
import { company } from "../../content/company";
import { formatDate } from "../shared";
import {
  LifeBuoy,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Clock3,
  HelpCircle,
  Plus,
  Minus,
  RefreshCw,
  Search,
  Tag,
  ShieldCheck,
  Send,
  X,
  FileText,
  Building2,
  Zap,
  ArrowRight,
} from "lucide-react";
import { cn } from "../../lib/utils";

/* ------------------------------------------------------------------ */
/*  Support Ticket Status Helpers                                     */
/* ------------------------------------------------------------------ */

function getTicketStatusMeta(status: string) {
  const s = (status || "open").toLowerCase();
  if (s.includes("resolve") || s.includes("close") || s.includes("done")) {
    return {
      label: "Resolved",
      bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-500",
      icon: CheckCircle2,
    };
  }
  if (s.includes("progress") || s.includes("review") || s.includes("investigat")) {
    return {
      label: "In Progress",
      bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      dot: "bg-amber-500 animate-pulse",
      icon: Clock3,
    };
  }
  return {
    label: "Open / Pending",
    bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dot: "bg-blue-500",
    icon: AlertCircle,
  };
}

/* ------------------------------------------------------------------ */
/*  Frequently Asked Questions (Foundry & Quality FAQ)                */
/* ------------------------------------------------------------------ */

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    category: "Metallurgy & Testing",
    question: "How do I request a Material Test Certificate (MTC) or Spectrometer Lab Report?",
    answer:
      "All production batches undergo 100% optical emission spectrometer and microstructure testing. Digital certified MTCs are automatically published to your Document Library once a heat lot passes QA. You can also raise a ticket linked to your Order Number for custom test coupons or NDT reports.",
  },
  {
    id: "faq-2",
    category: "Patterns & Tooling",
    question: "What format of CAD drawings and pattern tooling files do you accept?",
    answer:
      "We accept 3D STEP (.stp, .step), IGES (.igs), SolidWorks (.sldprt), as well as 2D PDF, DWG, and DXF files. Tooling allowances (shrinkage rate 1.0–1.2% for Grey Iron / Ductile Iron) and machining allowances are coordinated by our methods engineer before pattern production.",
  },
  {
    id: "faq-3",
    category: "Logistics & Dispatch",
    question: "How can I track my shipment dispatch and obtain transporter LR copies?",
    answer:
      "Upon factory gate dispatch, shipment records including Vehicle Number, Driver Contact, Transporter Name, and Consignment Note (LR) are updated live on your Order Detail page. E-Way bill copies are stored in your Document Vault.",
  },
  {
    id: "faq-4",
    category: "Commercial & Payment",
    question: "How do advance milestone payments and GST invoicing work?",
    answer:
      "Orders require payment terms agreed in the quotation (typically 30% advance for pattern development, balance on dispatch notice). Invoices with GST compliance, HSN codes (7325), and bank details are accessible directly in the Invoices & Billing section.",
  },
  {
    id: "faq-5",
    category: "Dimensional Tolerances",
    question: "What dimensional tolerance standard does Shakti Udyog adhere to?",
    answer:
      "Our sand castings and machined castings conform strictly to ISO 8062-3 (Grade DGC / CT8–CT10 for as-cast surfaces, and sub-millimeter tolerances on CNC/VMC machined features). Custom tolerance requirements can be specified in your drawing notes.",
  },
];

/* ------------------------------------------------------------------ */
/*  Main Support Page Component                                        */
/* ------------------------------------------------------------------ */

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportRequestItem[] | null>(null);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Open" | "In Progress" | "Resolved">("All");
  const [faqCategory, setFaqCategory] = useState<string>("All");
  const [expandedFaq, setExpandedFaq] = useState<string | null>("faq-1");

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewingTicket, setViewingTicket] = useState<SupportRequestItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [ticketList, orderList] = await Promise.all([
        customerApi.supportRequests().catch(() => [] as SupportRequestItem[]),
        customerApi.orders().catch(() => [] as OrderListItem[]),
      ]);
      setTickets(ticketList);
      setOrders(orderList);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load support center.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Compute ticket metrics
  const metrics = useMemo(() => {
    if (!tickets) return { total: 0, open: 0, inProgress: 0, resolved: 0 };
    let open = 0;
    let inProgress = 0;
    let resolved = 0;

    tickets.forEach((t) => {
      const s = (t.status || "").toLowerCase();
      if (s.includes("resolve") || s.includes("close")) resolved++;
      else if (s.includes("progress") || s.includes("review")) inProgress++;
      else open++;
    });

    return { total: tickets.length, open, inProgress, resolved };
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((t) => {
      if (statusFilter !== "All") {
        const s = (t.status || "").toLowerCase();
        if (statusFilter === "Resolved" && !s.includes("resolve") && !s.includes("close")) return false;
        if (statusFilter === "In Progress" && !s.includes("progress") && !s.includes("review")) return false;
        if (statusFilter === "Open" && (s.includes("resolve") || s.includes("close") || s.includes("progress"))) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchSub = t.subject?.toLowerCase().includes(q);
        const matchMsg = t.message?.toLowerCase().includes(q);
        const matchOrder = t.orderNumber?.toLowerCase().includes(q);
        if (!matchSub && !matchMsg && !matchOrder) return false;
      }

      return true;
    });
  }, [tickets, statusFilter, searchQuery]);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return FAQS.filter((f) => {
      if (faqCategory !== "All" && f.category !== faqCategory) return false;
      return true;
    });
  }, [faqCategory]);

  return (
    <div className="space-y-7 pb-20 animate-in fade-in duration-200">
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
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight m-0 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 inline-flex items-center justify-center">
                <LifeBuoy size={20} />
              </span>
              Customer Support & Technical Helpdesk
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Engineers Online
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 m-0">
            Direct metallurgical support, order dispatch status, test certificate inquiries, and technical query management.
          </p>
        </div>

        {/* Header Action Buttons — Clean Horizontal Alignment */}
        <div className="flex items-center gap-2 shrink-0 self-start lg:self-center flex-nowrap">
          <button
            type="button"
            onClick={() => void loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer shrink-0"
            title="Refresh tickets"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-blue-600" : ""} />
          </button>

          <a
            href={company.contact.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl font-bold text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all shadow-xs no-underline whitespace-nowrap shrink-0"
          >
            <MessageSquare size={14} />
            <span>WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm shadow-blue-500/20 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus size={15} />
            <span>Create Support Ticket</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. KPI METRICS CARDS (ADMIN ERP DESIGN SYSTEM GRADIENTS)           */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Total Inquiries */}
        <div className="p-4 rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs hover:shadow-md hover:shadow-blue-500/5 hover:border-blue-500/40 transition-all flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <LifeBuoy size={19} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80">Total Inquiries</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {metrics.total}
            </div>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="p-4 rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs hover:shadow-md hover:shadow-blue-500/5 hover:border-blue-500/40 transition-all flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <AlertCircle size={19} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80">Open Tickets</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {metrics.open}
            </div>
          </div>
        </div>

        {/* Under Review */}
        <div className="p-4 rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs hover:shadow-md hover:shadow-blue-500/5 hover:border-blue-500/40 transition-all flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <Clock3 size={19} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80">Under Review</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {metrics.inProgress}
            </div>
          </div>
        </div>

        {/* Resolved Queries */}
        <div className="p-4 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs hover:shadow-md hover:shadow-emerald-500/5 hover:border-emerald-500/40 transition-all flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 size={19} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/80">Resolved Queries</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {metrics.resolved}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. MULTI-CHANNEL CONTACT HUB (THEMED GLASS CARDS)                 */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Direct Phone Hotline */}
        <div className="p-5 rounded-2xl border border-blue-500/20 dark:border-white/10 bg-gradient-to-b from-blue-500/[0.06] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-500/40 hover:shadow-md transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-xs">
                <Phone size={16} />
              </span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Direct Line
              </span>
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white m-0">
              Foundry Technical Hotline
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0 leading-relaxed">
              Speak directly with our engineering and methods team.
            </p>
          </div>
          <div className="pt-2.5 border-t border-neutral-100 dark:border-white/5 space-y-2">
            <div className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
              {company.contact.phone}
            </div>
            <a
              href={company.contact.phoneHref}
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:border-blue-500/50 text-xs font-bold transition-all no-underline"
            >
              <Phone size={13} />
              <span>Call Hotline</span>
            </a>
          </div>
        </div>

        {/* WhatsApp Priority Desk */}
        <div className="p-5 rounded-2xl border border-emerald-500/20 dark:border-white/10 bg-gradient-to-b from-emerald-500/[0.06] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-500/40 hover:shadow-md transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xs">
                <MessageSquare size={16} />
              </span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Instant Chat
              </span>
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white m-0">
              WhatsApp Priority Desk
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0 leading-relaxed">
              Send drawing snippets, dispatch photos, and quick questions.
            </p>
          </div>
          <div className="pt-2.5 border-t border-neutral-100 dark:border-white/5 space-y-2">
            <div className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
              {company.contact.whatsapp}
            </div>
            <a
              href={company.contact.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 no-underline"
            >
              <MessageSquare size={13} />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* QA & Commercial Desk */}
        <div className="p-5 rounded-2xl border border-blue-500/20 dark:border-white/10 bg-gradient-to-b from-blue-500/[0.06] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-500/40 hover:shadow-md transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-xs">
                <Mail size={16} />
              </span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Email Desk
              </span>
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white m-0">
              QA & Commercial Desk
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0 leading-relaxed">
              For formal purchase orders, vendor audits, and contracts.
            </p>
          </div>
          <div className="pt-2.5 border-t border-neutral-100 dark:border-white/5 space-y-2">
            <div className="text-xs font-mono font-bold text-neutral-900 dark:text-white truncate">
              {company.contact.email}
            </div>
            <a
              href={`mailto:${company.contact.email}`}
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:border-blue-500/50 text-xs font-bold transition-all no-underline"
            >
              <Mail size={13} />
              <span>Send Email</span>
            </a>
          </div>
        </div>

        {/* Works & Operating Hours */}
        <div className="p-5 rounded-2xl border border-purple-500/20 dark:border-white/10 bg-gradient-to-b from-purple-500/[0.06] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-500/40 hover:shadow-md transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-xs">
                <Building2 size={16} />
              </span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Foundry Plant
              </span>
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white m-0">
              Manufacturing Unit
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0 leading-relaxed">
              GT Road, Focal Point, Ludhiana, Punjab (ISO 9001:2015 Plant).
            </p>
          </div>
          <div className="pt-2.5 border-t border-neutral-100 dark:border-white/5 space-y-2">
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
              <Clock size={12} className="text-purple-500" />
              <span>{company.contact.businessHours}</span>
            </div>
            <Link
              to="/customer/orders"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 hover:border-purple-500/50 text-xs font-bold transition-all no-underline"
            >
              <Zap size={13} />
              <span>View Active Orders</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. SUPPORT TICKETS FEED                                           */}
      {/* ================================================================= */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white m-0 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              <span>Your Support & Engineering Tickets</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
              {filteredTickets.length} {filteredTickets.length === 1 ? "Ticket" : "Tickets"}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0">
            Track open technical queries, drawing approvals, metallurgy MTC reviews, and dispatch tickets.
          </p>
        </div>

        {/* Dedicated Full-Width Filter & Search Toolbar (Below Title) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs">
          {/* Ticket Filter Pills on the Left */}
          <div className="flex items-center flex-wrap gap-1.5">
            {(["All", "Open", "In Progress", "Resolved"] as const).map((st) => {
              const all = tickets ?? [];
              const count =
                st === "All"
                  ? all.length
                  : all.filter((t) => (st === "In Progress" ? t.status === "In Progress" || t.status === "InProgress" : t.status === st)).length;

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                    statusFilter === st
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-neutral-50 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/10"
                  )}
                >
                  <span>{st}</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-md text-[10px] font-extrabold",
                      statusFilter === st
                        ? "bg-white/20 text-white"
                        : "bg-neutral-200/80 dark:bg-white/10 text-neutral-700 dark:text-neutral-300"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input on the Right */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject or order #..."
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#121520] text-neutral-800 dark:text-white placeholder-neutral-400 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-0.5 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => void loadData()}
              className="px-3 py-1 rounded-xl bg-rose-600 text-white font-bold text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tickets Container */}
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <RefreshCw size={28} className="mx-auto animate-spin text-blue-600" />
            <p className="text-xs text-neutral-500">Loading support inquiries...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 sm:p-10 rounded-2xl border border-dashed border-neutral-300 dark:border-white/15 bg-white/50 dark:bg-[#0f121a]/50 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center justify-center mx-auto">
              <LifeBuoy size={24} />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white m-0">
                {searchQuery || statusFilter !== "All" ? "No Matching Tickets" : "No Support Tickets Raised"}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0">
                {searchQuery || statusFilter !== "All"
                  ? "Try resetting your filter or searching with different keywords."
                  : "Need assistance with a drawing tolerance, quotation breakdown, or sample batch? Our methods team is ready."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              <Plus size={14} />
              <span>Raise Support Ticket</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredTickets.map((t) => {
              const statusMeta = getTicketStatusMeta(t.status);

              return (
                <div
                  key={t.id}
                  onClick={() => setViewingTicket(t)}
                  className="group p-4.5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] hover:border-blue-500/40 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border shadow-xs",
                          statusMeta.bg
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", statusMeta.dot)} />
                        <span>{statusMeta.label}</span>
                      </span>

                      {t.orderNumber ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 font-mono">
                          <Tag size={10} /> Order #{t.orderNumber}
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutral-400 font-medium">General Inquiry</span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1 m-0">
                      {t.subject}
                    </h3>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 m-0 leading-relaxed">
                      {t.message}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                    <span>Opened {formatDate(t.createdAtUtc)}</span>
                    <span className="text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      <span>View Thread</span>
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 5. FOUNDRY FAQ ACCORDION HUB (MATCHES RESOURCES FAQ UI)          */}
      {/* ================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs space-y-6">
        <div className="space-y-4 pb-4 border-b border-neutral-200/80 dark:border-white/10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-[11px] font-bold tracking-wider uppercase bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-sky-400 border border-blue-200 dark:border-blue-500/20">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white m-0">
              Frequently Asked Technical Questions
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 m-0 max-w-2xl leading-relaxed">
              Instant answers on pattern methods, casting tolerances, metallurgy standards, and dispatches.
            </p>
          </div>

          {/* FAQ Category Filter Pills */}
          <div className="flex items-center flex-wrap gap-2 pt-1">
            {[
              { key: "All", label: "All Topics" },
              { key: "Metallurgy & Testing", label: "Metallurgy & Testing" },
              { key: "Patterns & Tooling", label: "Patterns & Tooling" },
              { key: "Logistics & Dispatch", label: "Logistics & Dispatch" },
              { key: "Commercial & Payment", label: "Commercial & Billing" },
            ].map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setFaqCategory(cat.key)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer",
                  faqCategory === cat.key
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-neutral-50 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/10"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Expandable FAQs Accordion Rows */}
        <div className="divide-y divide-neutral-200/80 dark:divide-white/10">
          {filteredFaqs.map((faq) => {
            const isOpen = expandedFaq === faq.id;
            return (
              <div key={faq.id} className="py-4 sm:py-5 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                  className="w-full flex items-center justify-between text-left gap-4 group cursor-pointer focus:outline-none"
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors",
                        isOpen
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 group-hover:text-blue-600 dark:group-hover:text-sky-400"
                      )}
                    >
                      ?
                    </div>

                    <h3
                      className={cn(
                        "text-sm sm:text-base font-bold tracking-tight transition-colors m-0",
                        isOpen
                          ? "text-blue-600 dark:text-sky-400"
                          : "text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-400"
                      )}
                    >
                      {faq.question}
                    </h3>
                  </div>

                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all",
                      isOpen
                        ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                        : "border-neutral-300 dark:border-white/15 text-neutral-600 dark:text-neutral-400 group-hover:border-blue-600 group-hover:text-blue-600 dark:group-hover:border-blue-400 dark:group-hover:text-sky-400"
                    )}
                  >
                    {isOpen ? <Minus size={15} /> : <Plus size={15} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="pl-11 sm:pl-12 pr-4 pt-3.5 pb-1 animate-in fade-in duration-200">
                    <p className="text-xs sm:text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 m-0">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 6. CREATE SUPPORT TICKET MODAL                                    */}
      {/* ================================================================= */}
      {createModalOpen && (
        <CreateTicketModal
          orders={orders}
          onClose={() => setCreateModalOpen(false)}
          onCreated={(newTicket) => {
            setTickets((prev) => (prev ? [newTicket, ...prev] : [newTicket]));
            showToast("Support ticket created successfully! Our team will respond shortly.", "success");
            setCreateModalOpen(false);
          }}
        />
      )}

      {/* ================================================================= */}
      {/* 7. VIEW TICKET DETAILS MODAL                                      */}
      {/* ================================================================= */}
      {viewingTicket && (
        <TicketDetailsModal
          ticket={viewingTicket}
          onClose={() => setViewingTicket(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CREATE TICKET MODAL COMPONENT                                      */
/* ------------------------------------------------------------------ */

function CreateTicketModal({
  orders,
  onClose,
  onCreated,
}: {
  orders: OrderListItem[];
  onClose: () => void;
  onCreated: (ticket: SupportRequestItem) => void;
}) {
  const [category, setCategory] = useState("Quality & Metallurgy");
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError("Please provide both a subject and message.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const selectedOrder = orders.find((o) => o.id === orderId);
      const res = await customerApi.createSupportRequest({
        category,
        orderId: orderId || undefined,
        subject: subject.trim(),
        message: message.trim(),
      });

      const newTicket: SupportRequestItem = {
        id: res.id || crypto.randomUUID(),
        orderId: orderId || null,
        orderNumber: selectedOrder ? selectedOrder.orderNumber : null,
        subject: `[${category}] ${subject.trim()}`,
        message: message.trim(),
        status: "Open",
        createdAtUtc: new Date().toISOString(),
      };

      onCreated(newTicket);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create support ticket.";
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
              <LifeBuoy size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-neutral-900 dark:text-white m-0">
                Raise a Support Request
              </h3>
              <p className="text-xs text-neutral-400 m-0">
                Assigned to dedicated foundry metallurgists & dispatch leads
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
                <option value="Quality & Metallurgy">Quality & Metallurgy (MTC/Lab)</option>
                <option value="Logistics & Dispatch">Logistics, Dispatch & Delivery</option>
                <option value="Drawing & Pattern">Drawing, Tooling & CAD Specs</option>
                <option value="Commercial / Invoice">Invoice, Advance & Commercial</option>
                <option value="General Inquiry">General Query / Account Help</option>
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
                <option value="">None (General Inquiry)</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Request for Spectrometer Lab Report for Batch #220"
              required
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-blue-500"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Detailed Description *
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please provide full details, part numbers, or specific questions so our team can assist promptly..."
              required
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
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
              disabled={busy || !subject.trim() || !message.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              <Send size={14} className={busy ? "animate-spin" : ""} />
              <span>{busy ? "Submitting..." : "Submit Ticket"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TICKET DETAILS MODAL                                              */
/* ------------------------------------------------------------------ */

function TicketDetailsModal({
  ticket,
  onClose,
}: {
  ticket: SupportRequestItem;
  onClose: () => void;
}) {
  const statusMeta = getTicketStatusMeta(ticket.status);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border",
                statusMeta.bg
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", statusMeta.dot)} />
              <span>{statusMeta.label}</span>
            </span>
            {ticket.orderNumber && (
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                Order #{ticket.orderNumber}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-bold text-neutral-900 dark:text-white m-0">
            {ticket.subject}
          </h3>
          <div className="text-[11px] text-neutral-400 font-mono">
            Raised on {formatDate(ticket.createdAtUtc)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/10 text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
          {ticket.message}
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
            <ShieldCheck size={14} /> Assigned to Technical QA Desk
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
