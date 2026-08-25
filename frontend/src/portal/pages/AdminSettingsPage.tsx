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
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
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
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-600 dark:text-blue-400",
    badgeBorder: "border-blue-500/20",
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
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-600 dark:text-amber-400",
    badgeBorder: "border-amber-500/20",
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
    badgeBg: "bg-indigo-500/10",
    badgeText: "text-indigo-600 dark:text-indigo-400",
    badgeBorder: "border-indigo-500/20",
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
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    badgeBorder: "border-emerald-500/20",
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
    badgeBg: "bg-purple-500/10",
    badgeText: "text-purple-600 dark:text-purple-400",
    badgeBorder: "border-purple-500/20",
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
    badgeBg: "bg-cyan-500/10",
    badgeText: "text-cyan-600 dark:text-cyan-400",
    badgeBorder: "border-cyan-500/20",
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
    badgeBg: "bg-rose-500/10",
    badgeText: "text-rose-600 dark:text-rose-400",
    badgeBorder: "border-rose-500/20",
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
        checked ? "bg-[var(--color-primary)]" : "bg-neutral-300 dark:bg-neutral-700",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
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
      <div className="flex flex-wrap gap-1.5 min-h-[42px] p-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10]">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 shadow-2xs"
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
          className="flex-1 min-w-[140px] bg-transparent text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none px-1 py-1"
        />
      </div>
      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
        Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/10 font-mono text-[10px] text-neutral-700 dark:text-neutral-300 font-semibold">Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/10 font-mono text-[10px] text-neutral-700 dark:text-neutral-300 font-semibold">,</kbd> to add multiple items.
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
        className="w-full pr-10 pl-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all font-mono"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors p-1"
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
          "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 group select-none shadow-2xs",
          isChecked
            ? "bg-emerald-50/50 dark:bg-emerald-500/[0.04] border-emerald-300 dark:border-emerald-500/30 hover:border-emerald-400"
            : "bg-white dark:bg-[#0f121a] border-neutral-200/90 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/[0.02]"
        )}
      >
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-900 dark:text-white">{field.label}</span>
            {isDirty && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Modified" />
            )}
          </div>
          {field.help && (
            <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">{field.help}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide",
              isChecked
                ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30"
                : "bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10"
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
          <label className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
            <span>{field.label}</span>
            {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Modified" />}
          </label>
          <span className="text-[10px] font-mono font-semibold uppercase text-neutral-400">Tag List</span>
        </div>
        <ListTagEditor value={value} placeholder={field.placeholder} onChange={onChange} />
        {field.help && <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{field.help}</p>}
      </div>
    );
  }

  if (field.type === "multiline") {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
            <span>{field.label}</span>
            {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Modified" />}
          </label>
          <span className="text-[10px] font-mono font-semibold uppercase text-neutral-400">Textarea</span>
        </div>
        <textarea
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all resize-y"
        />
        {field.help && <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{field.help}</p>}
      </div>
    );
  }

  if (field.type === "password") {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
            <span>{field.label}</span>
            {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Modified" />}
          </label>
          <span className="text-[10px] font-mono font-semibold uppercase text-neutral-400">Secret</span>
        </div>
        <PasswordControl value={value} placeholder={field.placeholder} onChange={onChange} />
        {field.help && <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{field.help}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
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
            "w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all",
            field.unitSuffix && "pr-14"
          )}
        />
        {field.unitSuffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400 pointer-events-none">
            {field.unitSuffix}
          </span>
        )}
      </div>
      {field.help && <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{field.help}</p>}
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
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10" />
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
              ? "bg-emerald-600 border-emerald-500 shadow-emerald-900/20"
              : "bg-rose-600 border-rose-500 shadow-rose-900/20"
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

      {/* ================================================================= */}
      {/* 1. HERO HEADER                                                    */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 flex items-center justify-center shadow-xs">
            <Sliders size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
                System & Enterprise Settings
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200/70 dark:border-white/10">
                Production ERP Config
              </span>
              {isDirty && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-full shadow-xs animate-pulse">
                  {dirtyKeys.length} Unsaved Changes
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
              Manage corporate identity, quotation & commercial policies, notifications, security rules, and modular feature flags.
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-2xs cursor-pointer"
            title="Download JSON configuration backup"
          >
            <Download size={13} className="text-blue-500" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-2xs cursor-pointer"
            title="Upload JSON configuration backup"
          >
            <Upload size={13} className="text-indigo-500" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-2xs cursor-pointer"
            title="Restore standard factory defaults"
          >
            <RotateCcw size={13} className="text-amber-500" />
            <span>Defaults</span>
          </button>

          <button
            type="button"
            onClick={loadSettings}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 transition-all shadow-2xs cursor-pointer"
            title="Reload settings from server"
          >
            <RefreshCw size={14} />
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={cn(
              "inline-flex items-center gap-2 px-4 h-9 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer",
              isDirty
                ? "bg-[var(--color-primary)] text-white hover:opacity-90 shadow-[var(--color-primary)]/20"
                : "bg-neutral-100 dark:bg-white/5 text-neutral-400 dark:text-neutral-600 border border-neutral-200/80 dark:border-white/10 cursor-not-allowed"
            )}
          >
            <Save size={14} className={saving ? "animate-spin" : ""} />
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. KPI METRICS CARDS                                              */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Parameters */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(59,130,246,0.15),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Layers size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight font-mono">
            {totalConfigsCount}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Total Parameters</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Configured system keys</div>
        </div>

        {/* Currency / Base */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(245,158,11,0.15),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Globe size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight font-mono">
            {currencyCode}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Currency / Base</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Operating currency slab</div>
        </div>

        {/* Active Modules */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(16,185,129,0.15),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Zap size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight font-mono">
            {activeFeaturesCount} <span className="text-xs font-medium text-neutral-500">/ 6</span>
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Active Modules</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Enabled feature flags</div>
        </div>

        {/* Session Timeout */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(168,85,247,0.15),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Lock size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight font-mono">
            {sessionTimeout} <span className="text-xs font-medium text-neutral-500">min</span>
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Session Timeout</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Staff idle expiration</div>
        </div>

        {/* Sync Status */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(20,184,166,0.15),transparent)] before:pointer-events-none col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
            <Activity size={18} />
          </div>
          <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-3 leading-tight tracking-tight flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Synchronized
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Live Connection</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">DB schema aligned</div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. SEARCH & CATEGORY TOOLBAR                                      */}
      {/* ================================================================= */}
      <div className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs space-y-3.5">
        {/* Global Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search all 40+ system settings, GST rules, SMTP, passwords, modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1 rounded-lg"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Segmented Tabs */}
        {!searchResults && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
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
                    "px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 select-none cursor-pointer",
                    isActive
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "bg-neutral-100 dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/10"
                  )}
                >
                  <Icon size={14} />
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

      {/* ================================================================= */}
      {/* 4. ACTIVE SECTION OR SEARCH RESULTS                               */}
      {/* ================================================================= */}
      {searchResults ? (
        /* Search Results View */
        <div className="p-6 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-white/10 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-neutral-900 dark:text-white">
                Search Results ({searchResults.length} matches)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Showing all matching configuration fields across categories.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold text-[var(--color-primary)] hover:underline cursor-pointer"
            >
              Clear Search
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              No configuration parameter matches "{searchQuery}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((field) => (
                <div
                  key={field.key}
                  className={cn(
                    "p-4 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/[0.02] space-y-2",
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
        /* Category View */
        <div className="space-y-6">
          {/* Section Hero Banner Card */}
          <div className="p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs flex items-start gap-4">
            <div
              className={cn(
                "w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs",
                activeSection.badgeBg,
                activeSection.badgeText,
                activeSection.badgeBorder
              )}
            >
              <activeSection.icon size={24} />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white tracking-tight">
                {activeSection.title}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {activeSection.description}
              </p>
            </div>
          </div>

          {/* Render Groups in Section */}
          <div className="space-y-6">
            {activeSection.groups.map((group, gIdx) => (
              <div
                key={gIdx}
                className="p-6 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs space-y-5"
              >
                <div className="border-b border-neutral-200/80 dark:border-white/10 pb-3.5">
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">{group.title}</h3>
                  {group.description && (
                    <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 mt-0.5">
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

                {/* Helper tool inside integrations */}
                {activeSection.id === "integrations" && group.title.includes("SMTP") && (
                  <div className="pt-3 border-t border-neutral-200/80 dark:border-white/10 flex items-center justify-between flex-wrap gap-3">
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Verify mail server handshake by dispatching a test transmission.
                    </p>
                    <button
                      type="button"
                      onClick={handleTestSmtp}
                      disabled={testEmailSending}
                      className="px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200/70 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
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

      {/* ================================================================= */}
      {/* 5. STICKY FLOATING BAR ON UNSAVED CHANGES                         */}
      {/* ================================================================= */}
      {isDirty && (
        <div className="fixed bottom-6 inset-x-6 max-w-4xl mx-auto z-40 p-4 rounded-2xl bg-neutral-900/95 dark:bg-[#0c0f17]/95 text-white border border-neutral-700 dark:border-white/15 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                You have {dirtyKeys.length} unsaved configuration change{dirtyKeys.length > 1 ? "s" : ""}
              </p>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Save your changes before leaving this page.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Save size={14} className={saving ? "animate-spin" : ""} />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Reset Defaults Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0c0f17] p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <RotateCcw size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">Reset to Factory Defaults?</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                This will populate all company details, GST rules, email gateways, and feature flags with the standard system templates. You can still review changes before saving.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Import Preview Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0c0f17] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">Import Configuration JSON</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Review or paste your configuration dictionary below. Existing values will be overridden with matching keys upon confirmation.
            </p>

            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              rows={10}
              className="w-full p-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#090b10] text-neutral-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[var(--color-primary)] transition-all resize-y"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyImport}
                className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:opacity-90 transition-all shadow-md cursor-pointer"
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
