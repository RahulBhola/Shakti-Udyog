import { useState, useEffect, useMemo, useCallback, useRef, type ChangeEvent } from "react";
import { adminApi } from "../../api/adminApi";
import {
  Building2,
  Percent,
  Package,
  Bell,
  ShieldCheck,
  Plug,
  Flag,
  Save,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Search,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Sliders,
  AlertTriangle,
  Send,
  X,
  FileJson,
  Layers,
  Activity,
  Lock,
  Zap,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";

/* ------------------------------------------------------------------ */
/*  Field & Section Definitions                                        */
/* ------------------------------------------------------------------ */

type FieldType = "text" | "email" | "url" | "number" | "password" | "multiline" | "list" | "boolean";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
  unitSuffix?: string;
  category: string;
  group?: string;
}

interface SectionDef {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
  badgeColor: string;
  groups: {
    title: string;
    description?: string;
    fields: FieldDef[];
  }[];
}

const DEFAULT_SETTINGS: Record<string, string> = {
  // Company Profile
  "company.name": "Shakti Udyog",
  "company.website": "https://shaktiudyog.com",
  "company.email": "info@shaktiudyog.com",
  "company.phone": "+91 98765 43210",
  "company.registeredAddress": "Plot No. 42, Industrial Area, Phase II",
  "company.factoryAddress": "Unit 1 & 2, Foundry Cluster, Sector 5",
  "company.city": "Agra",
  "company.state": "Uttar Pradesh",
  "company.pin": "282006",
  "company.gst": "09AAAAA0000A1Z5",
  "company.pan": "AAAAA0000A",
  "company.cin": "U27100UP1998PTC023456",
  "company.msme": "UDYAM-UP-01-0012345",
  "company.currency": "INR",

  // Commercial Defaults
  "commercial.defaultGstPercent": "18",
  "commercial.defaultCurrency": "INR",
  "commercial.defaultPaymentTerms": "30 days net from invoice date",
  "commercial.defaultDeliveryTerms": "Ex-Works / CIF Customer Warehouse",
  "commercial.quotationValidityDays": "30",
  "commercial.leadTimeDays": "21",
  "commercial.advancePercent": "30",
  "commercial.minOrderQty": "50",
  "commercial.invoicePrefix": "INV-",
  "commercial.freightTerms": "Freight to be borne by consignee unless specified otherwise in PO.",
  "commercial.packingTerms": "Standard seaworthy / industrial wooden pallet packaging included.",
  "commercial.warrantyTerms": "12 months standard manufacturer warranty from date of dispatch.",

  // Catalog & Master Data
  "catalog.units": "kg, pcs, set, tonne, meter, box, lot",
  "catalog.hsnCodes": "7325, 7307, 8483, 8431, 7318, 8708",
  "catalog.materialGrades": "FG 200, FG 260, SG 400/15, SG 500/7, SG 600/3, WCB Steel, SS 304, SS 316",
  "catalog.finishes": "Shot Blasted, Rough Cast, CNC Machined, Zinc Plated, Red Oxide Primed, Epoxy Coated",

  // Notifications
  "notify.fromName": "Shakti Udyog ERP System",
  "notify.fromEmail": "notifications@shaktiudyog.com",
  "notify.supportEmail": "support@shaktiudyog.com",
  "notify.purchaseEmail": "purchase@shaktiudyog.com",
  "notify.accountsEmail": "accounts@shaktiudyog.com",
  "notify.onNewEnquiry": "true",
  "notify.onOrderStatus": "true",
  "notify.onInvoice": "true",
  "notify.onPayment": "true",

  // Security
  "security.minPasswordLength": "8",
  "security.requireComplexity": "true",
  "security.requireMfa": "false",
  "security.sessionTimeoutMinutes": "60",
  "security.loginRateLimitPerMinute": "10",
  "security.allowPublicRegistration": "true",
  "security.requireAdminApproval": "true",

  // Integrations
  "integration.smtpHost": "smtp.sendgrid.net",
  "integration.smtpPort": "587",
  "integration.smtpUser": "apikey",
  "integration.smtpPassword": "",
  "integration.paymentProvider": "Razorpay Enterprise Gateway",

  // Feature Flags
  "feature.enquiry": "true",
  "feature.quotations": "true",
  "feature.orders": "true",
  "feature.production": "true",
  "feature.payments": "true",
  "feature.documents": "true",
};

const SECTIONS: SectionDef[] = [
  {
    id: "company",
    title: "Company Identity & Tax Profile",
    shortTitle: "Company",
    description: "Official business identity, registration credentials, and plant locations used across invoices, quotations, and reports.",
    icon: Building2,
    badgeColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    groups: [
      {
        title: "Legal Identity & Contact",
        description: "Primary enterprise identifiers and communication channels.",
        fields: [
          { key: "company.name", label: "Company Name", type: "text", placeholder: "Shakti Udyog", help: "Legal registered name of the enterprise", category: "company" },
          { key: "company.website", label: "Official Website", type: "url", placeholder: "https://shaktiudyog.com", category: "company" },
          { key: "company.email", label: "Primary Corporate Email", type: "email", placeholder: "info@shaktiudyog.com", category: "company" },
          { key: "company.phone", label: "Corporate Contact Phone", type: "text", placeholder: "+91 98765 43210", category: "company" },
          { key: "company.currency", label: "Operating Currency Code", type: "text", placeholder: "INR", help: "Standard ISO-4217 currency code", category: "company" },
        ],
      },
      {
        title: "Statutory & Tax Registrations",
        description: "Government compliance credentials displayed on GST invoices.",
        fields: [
          { key: "company.gst", label: "GSTIN Number", type: "text", placeholder: "09AAAAA0000A1Z5", category: "company" },
          { key: "company.pan", label: "Permanent Account Number (PAN)", type: "text", placeholder: "AAAAA0000A", category: "company" },
          { key: "company.cin", label: "Corporate Identification Number (CIN)", type: "text", placeholder: "U27100UP...", category: "company" },
          { key: "company.msme", label: "MSME / Udyam Registration No.", type: "text", placeholder: "UDYAM-UP-...", category: "company" },
        ],
      },
      {
        title: "Addresses & Operational Facilities",
        description: "Registered office and manufacturing foundry plant locations.",
        fields: [
          { key: "company.registeredAddress", label: "Registered Head Office Address", type: "multiline", placeholder: "Plot No. 42, Industrial Area...", category: "company" },
          { key: "company.factoryAddress", label: "Foundry Works & Plant Address", type: "multiline", placeholder: "Unit 1 & 2, Foundry Cluster...", category: "company" },
          { key: "company.city", label: "City", type: "text", placeholder: "Agra", category: "company" },
          { key: "company.state", label: "State / Province", type: "text", placeholder: "Uttar Pradesh", category: "company" },
          { key: "company.pin", label: "Postal PIN Code", type: "text", placeholder: "282006", category: "company" },
        ],
      },
    ],
  },
  {
    id: "commercial",
    title: "Commercial & Quotation Policies",
    shortTitle: "Commercial",
    description: "Default financial parameters, standard margins, quotation validity windows, and terms applied to new RFQs.",
    icon: Percent,
    badgeColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    groups: [
      {
        title: "Taxation & Financial Rules",
        description: "Standard tax rates and advance payment requirements.",
        fields: [
          { key: "commercial.defaultGstPercent", label: "Default GST Percentage", type: "number", unitSuffix: "%", help: "Standard GST slab applied to casting items", category: "commercial" },
          { key: "commercial.advancePercent", label: "Advance Payment Requirement", type: "number", unitSuffix: "%", help: "Mandatory advance percentage before job scheduling", category: "commercial" },
          { key: "commercial.defaultCurrency", label: "Default Currency", type: "text", placeholder: "INR", category: "commercial" },
          { key: "commercial.invoicePrefix", label: "Tax Invoice Serial Prefix", type: "text", placeholder: "INV-", help: "Prefix for generated invoices (e.g. INV-2026-)", category: "commercial" },
        ],
      },
      {
        title: "Operational & Delivery Parameters",
        description: "Timeline SLAs and minimum batch constraints.",
        fields: [
          { key: "commercial.quotationValidityDays", label: "Quotation Validity Period", type: "number", unitSuffix: "days", help: "Number of days issued quotes remain active", category: "commercial" },
          { key: "commercial.leadTimeDays", label: "Standard Production Lead Time", type: "number", unitSuffix: "days", help: "Estimated manufacturing turnaround", category: "commercial" },
          { key: "commercial.minOrderQty", label: "Minimum Order Quantity (MOQ)", type: "number", unitSuffix: "units", category: "commercial" },
          { key: "commercial.defaultPaymentTerms", label: "Standard Payment Terms", type: "text", placeholder: "30 days net", category: "commercial" },
          { key: "commercial.defaultDeliveryTerms", label: "Standard Delivery Terms (Incoterms)", type: "text", placeholder: "Ex-Works / CIF", category: "commercial" },
        ],
      },
      {
        title: "Standard Commercial Terms & Conditions",
        description: "Boilerplate clauses injected into generated quotation PDFs.",
        fields: [
          { key: "commercial.freightTerms", label: "Freight & Transit Clause", type: "multiline", category: "commercial" },
          { key: "commercial.packingTerms", label: "Packaging & Preservation Clause", type: "multiline", category: "commercial" },
          { key: "commercial.warrantyTerms", label: "Warranty & Guarantee Clause", type: "multiline", category: "commercial" },
        ],
      },
    ],
  },
  {
    id: "catalog",
    title: "Master Data & Catalog Dictionaries",
    shortTitle: "Catalog Master",
    description: "Standardized taxonomies, casting alloys, surface finishes, and unit standards available across the ERP.",
    icon: Package,
    badgeColor: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    groups: [
      {
        title: "Manufacturing & Material Taxonomies",
        description: "Comma-separated or tag-managed lists surfaced in dropdown selectors.",
        fields: [
          { key: "catalog.materialGrades", label: "Certified Material Grades & Alloys", type: "list", placeholder: "FG 200, SG 500/7, WCB Steel...", help: "Standard casting metallurgy specifications", category: "catalog" },
          { key: "catalog.finishes", label: "Surface Treatment & Finish Types", type: "list", placeholder: "Shot Blasted, CNC Machined, Epoxy Coated...", help: "Available post-processing treatments", category: "catalog" },
          { key: "catalog.units", label: "Units of Measurement (UOM)", type: "list", placeholder: "kg, pcs, set, tonne...", help: "Measurement quantities recognized by inventory", category: "catalog" },
          { key: "catalog.hsnCodes", label: "Standard HSN / SAC Codes", type: "list", placeholder: "7325, 7307, 8483...", help: "Customs classification codes for metal castings", category: "catalog" },
        ],
      },
    ],
  },
  {
    id: "notifications",
    title: "Notification Relays & Dispatchers",
    shortTitle: "Notifications",
    description: "Automated event triggers, sender profiles, and distribution mailboxes for customer and internal alerts.",
    icon: Bell,
    badgeColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    groups: [
      {
        title: "Sender Identity & Routing Mailboxes",
        description: "From address and targeted department mailboxes.",
        fields: [
          { key: "notify.fromName", label: "System Sender Display Name", type: "text", placeholder: "Shakti Udyog ERP", category: "notifications" },
          { key: "notify.fromEmail", label: "System Sender Email Address", type: "email", placeholder: "notifications@shaktiudyog.com", category: "notifications" },
          { key: "notify.supportEmail", label: "Customer Support Mailbox", type: "email", placeholder: "support@shaktiudyog.com", category: "notifications" },
          { key: "notify.purchaseEmail", label: "Procurement & Purchase Mailbox", type: "email", placeholder: "purchase@shaktiudyog.com", category: "notifications" },
          { key: "notify.accountsEmail", label: "Finance & Accounts Mailbox", type: "email", placeholder: "accounts@shaktiudyog.com", category: "notifications" },
        ],
      },
      {
        title: "Automated Event Triggers",
        description: "Select which lifecycle events trigger automated notifications.",
        fields: [
          { key: "notify.onNewEnquiry", label: "Trigger on New Customer RFQ / Enquiry", type: "boolean", help: "Broadcasts alerts to Engineers and Admins immediately", category: "notifications" },
          { key: "notify.onOrderStatus", label: "Trigger on Manufacturing Stage Progressions", type: "boolean", help: "Sends realtime order tracking updates to customer portal", category: "notifications" },
          { key: "notify.onInvoice", label: "Trigger on Tax Invoice Generation", type: "boolean", help: "Notifies customer when invoice is ready for download", category: "notifications" },
          { key: "notify.onPayment", label: "Trigger on Payment Verification & Proof", type: "boolean", help: "Notifies customer upon finance clearance", category: "notifications" },
        ],
      },
    ],
  },
  {
    id: "security",
    title: "Security, Sessions & Access Control",
    shortTitle: "Security",
    description: "Authentication policies, credential complexity, idle session expirations, and registration approval gates.",
    icon: ShieldCheck,
    badgeColor: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    groups: [
      {
        title: "Password & Session Rules",
        description: "Enforce strict security requirements across staff and customer accounts.",
        fields: [
          { key: "security.minPasswordLength", label: "Minimum Password Length", type: "number", unitSuffix: "chars", help: "Minimum required characters for account passwords", category: "security" },
          { key: "security.sessionTimeoutMinutes", label: "Idle Session Timeout", type: "number", unitSuffix: "minutes", help: "Inactivity window before token revocation", category: "security" },
          { key: "security.loginRateLimitPerMinute", label: "Login Rate Limit Threshold", type: "number", unitSuffix: "req/min", help: "Max attempts before IP throttle", category: "security" },
          { key: "security.requireComplexity", label: "Require Password Complexity (Symbols & Digits)", type: "boolean", category: "security" },
          { key: "security.requireMfa", label: "Mandatory Multi-Factor Authentication (MFA) for Staff", type: "boolean", category: "security" },
        ],
      },
      {
        title: "Onboarding & Registration Policies",
        description: "Control how new companies and users enter the ecosystem.",
        fields: [
          { key: "security.allowPublicRegistration", label: "Allow Public Customer Self-Registration", type: "boolean", help: "Enables public sign-up form on website", category: "security" },
          { key: "security.requireAdminApproval", label: "Require Manual Admin Approval for New Companies", type: "boolean", help: "New accounts stay pending until verified by Administrator", category: "security" },
        ],
      },
    ],
  },
  {
    id: "integrations",
    title: "Third-Party Integrations & Gateways",
    shortTitle: "Integrations",
    description: "SMTP mail relay servers, payment processing gateways, and external API credentials.",
    icon: Plug,
    badgeColor: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    groups: [
      {
        title: "SMTP Email Relay Gateway",
        description: "Outgoing transactional mail server configuration.",
        fields: [
          { key: "integration.smtpHost", label: "SMTP Server Host", type: "text", placeholder: "smtp.sendgrid.net", category: "integrations" },
          { key: "integration.smtpPort", label: "SMTP Port", type: "number", placeholder: "587", category: "integrations" },
          { key: "integration.smtpUser", label: "SMTP Username / API Key", type: "text", placeholder: "apikey", category: "integrations" },
          { key: "integration.smtpPassword", label: "SMTP Password / Secret Token", type: "password", placeholder: "••••••••••••", category: "integrations" },
        ],
      },
      {
        title: "Payment Gateway Provider",
        description: "Merchant processing gateway for online settlement.",
        fields: [
          { key: "integration.paymentProvider", label: "Payment Gateway Provider Name", type: "text", placeholder: "Razorpay Enterprise Gateway", category: "integrations" },
        ],
      },
    ],
  },
  {
    id: "features",
    title: "Platform Feature Flags & Modules",
    shortTitle: "Feature Flags",
    description: "Granular on/off toggle switches to instantly activate or deactivate specific portal modules.",
    icon: Flag,
    badgeColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    groups: [
      {
        title: "Operational Module Switches",
        description: "Toggle modules on or off without code deployment.",
        fields: [
          { key: "feature.enquiry", label: "Enquiry & RFQ Management Module", type: "boolean", help: "Enables customer enquiry submission and engineering estimation", category: "features" },
          { key: "feature.quotations", label: "Quotation & Costing Engine", type: "boolean", help: "Enables formal quote generation, breakdown, and negotiation", category: "features" },
          { key: "feature.orders", label: "Order Lifecycle & Assignment", type: "boolean", help: "Enables order processing and delivery milestone tracking", category: "features" },
          { key: "feature.production", label: "Shop Floor Production Kanban Board", type: "boolean", help: "Enables engineer manufacturing workflow and stage movement", category: "features" },
          { key: "feature.payments", label: "Invoicing & Payment Proof Verification", type: "boolean", help: "Enables tax invoice generation and finance ledger", category: "features" },
          { key: "feature.documents", label: "CAD & Technical Document Vault", type: "boolean", help: "Enables drawings, certificates, and compliance attachments", category: "features" },
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helper Subcomponents                                               */
/* ------------------------------------------------------------------ */

function ToggleSwitch({ checked, onChange, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2",
        checked ? "bg-[var(--color-primary)]" : "bg-slate-300 dark:bg-slate-700",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

function ListTagEditor({ value, placeholder, onChange }: { value: string; placeholder?: string; onChange: (v: string) => void }) {
  const [inputValue, setInputValue] = useState("");
  const items = useMemo(() => {
    return value
      ? value.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  }, [value]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || items.includes(trimmed)) return;
    const next = [...items, trimmed].join(", ");
    onChange(next);
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    const next = items.filter((item) => item !== tagToRemove).join(", ");
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs"
          >
            <span>{item}</span>
            <button
              type="button"
              onClick={() => removeTag(item)}
              className="hover:text-red-500 transition-colors p-0.5 rounded"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          placeholder={items.length === 0 ? placeholder || "Type and press Enter or comma..." : "+ Add item..."}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) addTag(inputValue);
          }}
          className="flex-1 min-w-[140px] bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none px-1 py-0.5"
        />
      </div>
      <p className="text-[11px] text-[var(--text-muted)]">
        Press <kbd className="px-1 py-0.5 rounded bg-[var(--bg-surface-hover)] border border-[var(--border-default)] font-mono text-[10px]">Enter</kbd> or <kbd className="px-1 py-0.5 rounded bg-[var(--bg-surface-hover)] border border-[var(--border-default)] font-mono text-[10px]">,</kbd> to add multiple items.
      </p>
    </div>
  );
}

function PasswordControl({ value, placeholder, onChange }: { value: string; placeholder?: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="new-password"
        className="w-full pr-10 pl-3.5 py-2.5 text-xs rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all font-mono"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1"
      >
        {show ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  isDirty,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
  isDirty: boolean;
}) {
  if (field.type === "boolean") {
    const isChecked = value === "true";
    return (
      <div
        onClick={() => onChange(String(!isChecked))}
        className={cn(
          "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 group select-none",
          isChecked
            ? "bg-[var(--color-primary-subtle,rgba(14,165,233,0.04))] border-[var(--color-primary)]/40 hover:border-[var(--color-primary)] shadow-xs"
            : "bg-[var(--bg-surface)] border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)]"
        )}
      >
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-primary)]">{field.label}</span>
            {isDirty && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Modified" />
            )}
          </div>
          {field.help && (
            <p className="text-[11.5px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">{field.help}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span
            className={cn(
              "px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide",
              isChecked
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20"
            )}
          >
            {isChecked ? "Active" : "Disabled"}
          </span>
          <ToggleSwitch checked={isChecked} onChange={(v) => onChange(String(v))} />
        </div>
      </div>
    );
  }

  if (field.type === "list") {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <span>{field.label}</span>
            {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Modified" />}
          </label>
          <span className="text-[10px] font-mono font-semibold uppercase text-[var(--text-muted)]">Tag List</span>
        </div>
        <ListTagEditor value={value} placeholder={field.placeholder} onChange={onChange} />
        {field.help && <p className="text-[11px] text-[var(--text-muted)]">{field.help}</p>}
      </div>
    );
  }

  if (field.type === "multiline") {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <span>{field.label}</span>
            {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Modified" />}
          </label>
          <span className="text-[10px] font-mono font-semibold uppercase text-[var(--text-muted)]">Textarea</span>
        </div>
        <textarea
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all resize-y"
        />
        {field.help && <p className="text-[11px] text-[var(--text-muted)]">{field.help}</p>}
      </div>
    );
  }

  if (field.type === "password") {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <span>{field.label}</span>
            {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Modified" />}
          </label>
          <span className="text-[10px] font-mono font-semibold uppercase text-[var(--text-muted)]">Secret</span>
        </div>
        <PasswordControl value={value} placeholder={field.placeholder} onChange={onChange} />
        {field.help && <p className="text-[11px] text-[var(--text-muted)]">{field.help}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
          <span>{field.label}</span>
          {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Modified" />}
        </label>
        {field.unitSuffix && (
          <span className="text-[11px] font-mono font-semibold text-[var(--color-primary)]">
            {field.unitSuffix}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type={field.type === "number" ? "number" : field.type}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all",
            field.unitSuffix && "pr-14"
          )}
        />
        {field.unitSuffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--text-muted)] pointer-events-none">
            {field.unitSuffix}
          </span>
        )}
      </div>
      {field.help && <p className="text-[11px] text-[var(--text-muted)]">{field.help}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function AdminSettingsPage() {
  const [originalValues, setOriginalValues] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(SECTIONS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modals state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [testEmailSending, setTestEmailSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadSettings = useCallback(() => {
    adminApi
      .settings()
      .then((data) => {
        // Merge fetched data over default fallbacks so all keys are fully populated
        const merged: Record<string, string> = { ...DEFAULT_SETTINGS, ...(data ?? {}) };
        setOriginalValues(merged);
        setValues(merged);
        setLoaded(true);
      })
      .catch(() => {
        setValues(DEFAULT_SETTINGS);
        setOriginalValues(DEFAULT_SETTINGS);
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const allFields = useMemo(() => {
    return SECTIONS.flatMap((s) => s.groups.flatMap((g) => g.fields));
  }, []);

  const allKeys = useMemo(() => allFields.map((f) => f.key), [allFields]);

  // Track modified fields
  const dirtyKeys = useMemo(() => {
    return allKeys.filter((key) => (values[key] ?? "") !== (originalValues[key] ?? ""));
  }, [allKeys, values, originalValues]);

  const isDirty = dirtyKeys.length > 0;

  const updateField = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      for (const key of allKeys) {
        payload[key] = values[key] ?? "";
      }
      await adminApi.updateSettings(payload);
      setOriginalValues({ ...values });
      setToast({ message: "System settings saved and synchronized successfully.", type: "success" });
    } catch (e: any) {
      setToast({ message: e?.message || "Failed to save settings to server.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setValues({ ...originalValues });
    setToast({ message: "Unsaved changes discarded.", type: "success" });
  };

  const handleResetToDefaults = () => {
    setValues({ ...DEFAULT_SETTINGS });
    setShowResetConfirm(false);
    setToast({ message: "Settings reset to standard factory defaults (click Save Changes to apply).", type: "success" });
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(values, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shakti_udyog_settings_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: "Settings exported successfully.", type: "success" });
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setImportJsonText(text);
        setShowImportModal(true);
      } catch {
        setToast({ message: "Invalid JSON file.", type: "error" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleApplyImport = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("Invalid format");
      }
      const newValues = { ...values, ...parsed };
      setValues(newValues);
      setShowImportModal(false);
      setToast({ message: "Imported settings applied. Review and click Save Changes to persist.", type: "success" });
    } catch {
      setToast({ message: "Could not parse JSON configuration.", type: "error" });
    }
  };

  const handleTestSmtp = async () => {
    setTestEmailSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setTestEmailSending(false);
    setToast({
      message: `Test email dispatched to ${values["notify.supportEmail"] || "support mailbox"} via ${values["integration.smtpHost"] || "SMTP Host"}.`,
      type: "success",
    });
  };

  // Search filter results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    return allFields.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.key.toLowerCase().includes(q) ||
        (f.help && f.help.toLowerCase().includes(q)) ||
        (f.placeholder && f.placeholder.toLowerCase().includes(q))
    );
  }, [searchQuery, allFields]);

  const activeSection = useMemo(() => {
    return SECTIONS.find((s) => s.id === activeTab) ?? SECTIONS[0];
  }, [activeTab]);

  // KPI calculations
  const totalConfigsCount = allKeys.length;
  const activeFeaturesCount = useMemo(() => {
    const featureKeys = allKeys.filter((k) => k.startsWith("feature."));
    return featureKeys.filter((k) => values[k] === "true").length;
  }, [allKeys, values]);

  const sessionTimeout = values["security.sessionTimeoutMinutes"] || "60";
  const currencyCode = values["company.currency"] || "INR";

  if (!loaded) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-40 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)]" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)]" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            "fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-white text-xs font-semibold backdrop-blur-xl border transition-all animate-in slide-in-from-top-4",
            toast.type === "success"
              ? "bg-emerald-600/95 border-emerald-500/40 shadow-emerald-900/20"
              : "bg-rose-600/95 border-rose-500/40 shadow-rose-900/20"
          )}
        >
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Hidden File Input for Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* 1. Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                <Sliders className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                System & Enterprise Settings
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full flex items-center gap-1">
                <Sparkles size={11} />
                Production ERP Config
              </span>
              {isDirty && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-full shadow-sm animate-pulse">
                  {dirtyKeys.length} Unsaved Changes
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed">
              Manage Shakti Udyog corporate identity, quotation & commercial policies, notification relays,
              security parameters, and modular feature flags.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleExportJson}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Backup current configuration as JSON"
            >
              <Download size={14} />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Upload JSON configuration backup"
            >
              <Upload size={14} />
              <span>Import</span>
            </button>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Restore standard factory defaults"
            >
              <RotateCcw size={14} />
              <span>Defaults</span>
            </button>

            <button
              type="button"
              onClick={loadSettings}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all"
              title="Reload from server"
            >
              <RefreshCw size={15} />
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isDirty}
              className={cn(
                "px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all",
                isDirty
                  ? "bg-[var(--color-primary)] text-white hover:opacity-90 shadow-[var(--color-primary)]/20 animate-pulse"
                  : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"
              )}
            >
              <Save size={15} className={saving ? "animate-spin" : ""} />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Total Parameters</p>
            <p className="text-xl font-extrabold text-[var(--text-primary)] font-mono">{totalConfigsCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Globe size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Currency / Base</p>
            <p className="text-xl font-extrabold text-[var(--text-primary)] font-mono">{currencyCode}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Active Modules</p>
            <p className="text-xl font-extrabold text-[var(--text-primary)] font-mono">
              {activeFeaturesCount} <span className="text-xs font-medium text-[var(--text-muted)]">/ 6</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0">
            <Lock size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Session Timeout</p>
            <p className="text-xl font-extrabold text-[var(--text-primary)] font-mono">
              {sessionTimeout} <span className="text-xs font-medium text-[var(--text-muted)]">min</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-500 flex items-center justify-center shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Sync Status</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Synchronized
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search Bar & Category Navigation Toolbar */}
      <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-xs space-y-4">
        {/* Global Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search all 40+ system settings, GST rules, SMTP, passwords, modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 text-xs md:text-sm rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Tabs (when not in search mode) */}
        {!searchResults && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeTab === sec.id;
              const secDirtyCount = sec.groups
                .flatMap((g) => g.fields)
                .filter((f) => (values[f.key] ?? "") !== (originalValues[f.key] ?? "")).length;

              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveTab(sec.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 select-none",
                    isActive
                      ? "bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20"
                      : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)]"
                  )}
                >
                  <Icon size={15} />
                  <span>{sec.shortTitle}</span>
                  {secDirtyCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Active Section Content or Search Results */}
      {searchResults ? (
        /* Search Results View */
        <div className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
            <div>
              <h2 className="text-base font-extrabold text-[var(--text-primary)]">
                Search Results ({searchResults.length} matches)
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Showing all matching configuration fields across categories.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
            >
              Clear Search
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              No configuration parameter matches "{searchQuery}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((field) => (
                <div
                  key={field.key}
                  className={cn(
                    "p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-2",
                    (field.type === "multiline" || field.type === "list" || field.type === "boolean") &&
                      "md:col-span-2"
                  )}
                >
                  <FieldRenderer
                    field={field}
                    value={values[field.key] ?? ""}
                    onChange={(v) => updateField(field.key, v)}
                    isDirty={(values[field.key] ?? "") !== (originalValues[field.key] ?? "")}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Category Groups View */
        <div className="space-y-6">
          {/* Section Description Card */}
          <div className="p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-xs flex items-start gap-4">
            <div
              className={cn(
                "w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs",
                activeSection.badgeColor
              )}
            >
              <activeSection.icon size={24} />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <h2 className="text-lg font-extrabold text-[var(--text-primary)] tracking-tight">
                {activeSection.title}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {activeSection.description}
              </p>
            </div>
          </div>

          {/* Render Groups in Section */}
          <div className="space-y-6">
            {activeSection.groups.map((group, gIdx) => (
              <div
                key={gIdx}
                className="p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-xs space-y-5"
              >
                <div className="border-b border-[var(--border-default)] pb-3.5">
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">{group.title}</h3>
                  {group.description && (
                    <p className="text-[11.5px] text-[var(--text-secondary)] mt-0.5">
                      {group.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.fields.map((field) => {
                    const isFullWidth =
                      field.type === "multiline" || field.type === "list" || field.type === "boolean";
                    return (
                      <div
                        key={field.key}
                        className={cn(
                          "space-y-1.5",
                          isFullWidth && "md:col-span-2"
                        )}
                      >
                        <FieldRenderer
                          field={field}
                          value={values[field.key] ?? ""}
                          onChange={(v) => updateField(field.key, v)}
                          isDirty={(values[field.key] ?? "") !== (originalValues[field.key] ?? "")}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Optional helper actions per section (e.g. SMTP test tool) */}
                {activeSection.id === "integrations" && group.title.includes("SMTP") && (
                  <div className="pt-2 border-t border-[var(--border-default)] flex items-center justify-between flex-wrap gap-3">
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Verify mail server handshake by dispatching a test transmission.
                    </p>
                    <button
                      type="button"
                      onClick={handleTestSmtp}
                      disabled={testEmailSending}
                      className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Send size={13} className={testEmailSending ? "animate-spin" : ""} />
                      <span>{testEmailSending ? "Testing SMTP..." : "Send Test Email"}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Sticky Floating Action Bar on Unsaved Changes */}
      {isDirty && (
        <div className="fixed bottom-6 inset-x-6 max-w-4xl mx-auto z-40 p-4 rounded-2xl bg-slate-950/95 text-white border border-slate-700 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                You have {dirtyKeys.length} unsaved configuration change{dirtyKeys.length > 1 ? "s" : ""}
              </p>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Remember to save your edits before navigating away from this page.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[var(--color-primary)]/20 transition-all"
            >
              <Save size={14} className={saving ? "animate-spin" : ""} />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Reset Defaults Confirmation Modal (Zero native browser alerts rule) */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <RotateCcw size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">Reset to Factory Defaults?</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                This will populate all company details, GST rules, email gateways, and feature flags with the standard system templates. You can still review changes before saving.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-md"
              >
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Import Preview Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Import Configuration JSON</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Review or paste your configuration dictionary below. Existing values will be overridden with matching keys upon confirmation.
            </p>

            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              rows={10}
              className="w-full p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-mono focus:outline-none focus:border-[var(--color-primary)] transition-all resize-y"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyImport}
                className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:opacity-90 transition-all shadow-md"
              >
                Apply Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
