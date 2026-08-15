import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { adminApi } from "../../api/adminApi";
import {
  Building2, Percent, Package, Bell, ShieldCheck, Plug, Flag,
  Save, CheckCircle2, XCircle, RefreshCw, Eye, EyeOff,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Design tokens (matches the customer Profile page)                  */
/* ------------------------------------------------------------------ */

const colors = {
  bg: "transparent",
  card: "var(--bg-card)",
  primary: "var(--color-primary)",
  primaryHover: "var(--color-primary-hover)",
  primaryLight: "rgba(59, 130, 246, 0.15)",
  success: "var(--color-success)",
  danger: "var(--color-danger)",
  text: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  textMuted: "var(--text-muted)",
  border: "var(--border-default)",
  borderLight: "var(--border-input, var(--border-default))",
};

const cardStyle: CSSProperties = {
  background: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: 16,
  padding: 24,
  boxShadow: "var(--shadow-sm)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: `1px solid ${colors.borderLight}`,
  borderRadius: 10,
  fontSize: 14,
  color: colors.text,
  background: "var(--bg-input, var(--bg-surface))",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  fontFamily: "inherit",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: colors.text,
  marginBottom: 6,
};

const btnPrimary: CSSProperties = {
  background: colors.primary,
  color: "#ffffff",
  border: "none",
  borderRadius: 10,
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.15s ease",
};

const btnSecondary: CSSProperties = {
  background: "var(--bg-surface)",
  color: colors.text,
  border: `1px solid ${colors.border}`,
  borderRadius: 10,
  padding: "9px 16px",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const helpStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: 12,
  color: colors.textMuted,
};

/* ------------------------------------------------------------------ */
/*  Field / section config                                             */
/* ------------------------------------------------------------------ */

type FieldType = "text" | "email" | "url" | "number" | "password" | "multiline" | "list" | "boolean";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
}

interface SectionDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  fields: FieldDef[];
}

const SECTIONS: SectionDef[] = [
  {
    id: "company", title: "Company Profile", description: "Shakti Udyog business identity used across invoices, quotations and the public site.",
    icon: Building2,
    fields: [
      { key: "company.name", label: "Company Name", type: "text", placeholder: "Shakti Udyog", help: "Legal or trade name" },
      { key: "company.website", label: "Website", type: "url", placeholder: "https://..." },
      { key: "company.email", label: "Company Email", type: "email", placeholder: "info@shaktiudyog.com" },
      { key: "company.phone", label: "Company Phone", type: "text", placeholder: "+91 ..." },
      { key: "company.registeredAddress", label: "Registered Address", type: "multiline" },
      { key: "company.factoryAddress", label: "Factory Address", type: "multiline" },
      { key: "company.city", label: "City", type: "text" },
      { key: "company.state", label: "State", type: "text" },
      { key: "company.pin", label: "PIN Code", type: "text" },
      { key: "company.gst", label: "GST Number", type: "text" },
      { key: "company.pan", label: "PAN", type: "text" },
      { key: "company.cin", label: "CIN", type: "text" },
      { key: "company.msme", label: "MSME Number", type: "text" },
      { key: "company.currency", label: "Preferred Currency", type: "text", placeholder: "INR" },
    ],
  },
  {
    id: "commercial", title: "Commercial Defaults", description: "Defaults applied to new quotations, orders and invoices.",
    icon: Percent,
    fields: [
      { key: "commercial.defaultGstPercent", label: "Default GST %", type: "number" },
      { key: "commercial.defaultCurrency", label: "Default Currency", type: "text", placeholder: "INR" },
      { key: "commercial.defaultPaymentTerms", label: "Payment Terms", type: "text", placeholder: "30 days net" },
      { key: "commercial.defaultDeliveryTerms", label: "Delivery Terms", type: "text", placeholder: "EXW / CIF / FOB" },
      { key: "commercial.quotationValidityDays", label: "Quote Validity (days)", type: "number" },
      { key: "commercial.leadTimeDays", label: "Default Lead Time (days)", type: "number" },
      { key: "commercial.advancePercent", label: "Advance Payment %", type: "number" },
      { key: "commercial.minOrderQty", label: "Minimum Order Qty", type: "number" },
      { key: "commercial.invoicePrefix", label: "Invoice Prefix", type: "text", placeholder: "INV-" },
      { key: "commercial.freightTerms", label: "Freight Terms", type: "text" },
      { key: "commercial.packingTerms", label: "Packing Terms", type: "text" },
      { key: "commercial.warrantyTerms", label: "Warranty Terms", type: "text" },
    ],
  },
  {
    id: "catalog", title: "Catalog & Master Data", description: "Reusable lists surfaced in forms (comma-separated).",
    icon: Package,
    fields: [
      { key: "catalog.units", label: "Units of Measure", type: "list", placeholder: "kg, pcs, set, tonne", help: "Comma-separated values" },
      { key: "catalog.hsnCodes", label: "HSN / SAC Codes", type: "list", placeholder: "7325, 7307, ..." },
      { key: "catalog.materialGrades", label: "Material Grades", type: "list", placeholder: "FG 200, SG 500/7, ..." },
      { key: "catalog.finishes", label: "Casting Finishes", type: "list", placeholder: "Rough, Machined, Painted" },
    ],
  },
  {
    id: "notifications", title: "Notifications", description: "Sender identity and which events trigger emails.",
    icon: Bell,
    fields: [
      { key: "notify.fromName", label: "From Name", type: "text", placeholder: "Shakti Udyog" },
      { key: "notify.fromEmail", label: "From Email", type: "email" },
      { key: "notify.supportEmail", label: "Support Email", type: "email" },
      { key: "notify.purchaseEmail", label: "Purchase Email", type: "email" },
      { key: "notify.accountsEmail", label: "Accounts Email", type: "email" },
      { key: "notify.onNewEnquiry", label: "Email on New Enquiry", type: "boolean" },
      { key: "notify.onOrderStatus", label: "Email on Order Status Change", type: "boolean" },
      { key: "notify.onInvoice", label: "Email on Invoice Created", type: "boolean" },
      { key: "notify.onPayment", label: "Email on Payment Received", type: "boolean" },
    ],
  },
  {
    id: "security", title: "Security & Authentication", description: "Password, session and registration policies.",
    icon: ShieldCheck,
    fields: [
      { key: "security.minPasswordLength", label: "Min Password Length", type: "number" },
      { key: "security.requireComplexity", label: "Require Password Complexity", type: "boolean" },
      { key: "security.requireMfa", label: "Require MFA for Staff", type: "boolean" },
      { key: "security.sessionTimeoutMinutes", label: "Session Timeout (minutes)", type: "number" },
      { key: "security.loginRateLimitPerMinute", label: "Login Rate Limit (per minute)", type: "number" },
      { key: "security.allowPublicRegistration", label: "Allow Public Registration", type: "boolean" },
      { key: "security.requireAdminApproval", label: "Admin Approval for New Customers", type: "boolean" },
    ],
  },
  {
    id: "integrations", title: "Integrations", description: "Credentials for third-party services.",
    icon: Plug,
    fields: [
      { key: "integration.smtpHost", label: "SMTP Host", type: "text" },
      { key: "integration.smtpPort", label: "SMTP Port", type: "number" },
      { key: "integration.smtpUser", label: "SMTP Username", type: "text" },
      { key: "integration.smtpPassword", label: "SMTP Password", type: "password" },
      { key: "integration.paymentProvider", label: "Payment Provider", type: "text" },
    ],
  },
  {
    id: "features", title: "Feature Flags", description: "Enable or disable platform modules.",
    icon: Flag,
    fields: [
      { key: "feature.enquiry", label: "Enquiry Module", type: "boolean" },
      { key: "feature.quotations", label: "Quotes", type: "boolean" },
      { key: "feature.orders", label: "Orders", type: "boolean" },
      { key: "feature.production", label: "Production Board", type: "boolean" },
      { key: "feature.payments", label: "Payments", type: "boolean" },
      { key: "feature.documents", label: "Documents", type: "boolean" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */

function Skeleton({ width = "100%", height = 20 }: { width?: string | number; height?: number }) {
  return <div style={{ width, height, background: colors.borderLight, borderRadius: 6, animation: "pulse 2s infinite" }} />;
}

function MessageToast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  const Icon = type === "success" ? CheckCircle2 : XCircle;
  return (
    <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, background: type === "success" ? colors.success : colors.danger, color: "#fff", padding: "14px 20px", borderRadius: 12, fontSize: 14, fontWeight: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 10, maxWidth: 400 }}>
      <Icon size={16} />
      <span>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, display: "flex", marginLeft: 6 }}><XCircle size={16} /></button>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 999, padding: 0, cursor: "pointer", border: "none",
        background: checked ? colors.primary : colors.border,
        position: "relative", transition: "background 0.2s ease", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: "50%",
        background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.2)", transition: "left 0.2s ease",
      }} />
    </button>
  );
}

function PasswordInput({ value, placeholder, onChange }: { value: string; placeholder?: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="new-password"
        style={{ ...inputStyle, paddingRight: 40 }}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: colors.textSecondary, padding: 4, display: "flex" }}
      >
        {show ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
    </div>
  );
}

function FieldControl({ field, value, onChange }: { field: FieldDef; value: string; onChange: (value: string) => void }) {
  if (field.type === "boolean") {
    const checked = value === "true";
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 13, color: colors.textSecondary, fontWeight: 500 }}>{checked ? "Enabled" : "Disabled"}</span>
        <Toggle checked={checked} onChange={(v) => onChange(String(v))} />
      </div>
    );
  }

  if (field.type === "multiline") {
    return (
      <textarea
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, minHeight: 72, resize: "vertical" as const }}
      />
    );
  }

  if (field.type === "password") {
    return <PasswordInput value={value} placeholder={field.placeholder} onChange={onChange} />;
  }

  return (
    <input
      type={field.type === "number" ? "number" : field.type}
      value={value}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<string>(SECTIONS[0].id);

  const load = useCallback(() => {
    setLoadError(false);
    adminApi.settings()
      .then((data) => { setValues(data ?? {}); setLoaded(true); })
      .catch(() => { setLoadError(true); setLoaded(true); });
  }, []);
  useEffect(load, [load]);

  const allKeys = useMemo(() => SECTIONS.flatMap((s) => s.fields.map((f) => f.key)), []);
  const activeSection = SECTIONS.find((s) => s.id === activeTab) ?? SECTIONS[0];

  const update = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      for (const key of allKeys) payload[key] = values[key] ?? "";
      await adminApi.updateSettings(payload);
      setToast({ message: "Settings saved successfully.", type: "success" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Could not save settings.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  /* ---- Loading / error states ---- */

  if (!loaded) {
    return (
      <div style={{ background: colors.bg, minHeight: "100vh", padding: "24px 32px", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ display: "grid", gap: 24 }}>
          <Skeleton height={32} width={200} />
          <Skeleton height={16} width={400} />
          <div style={{ display: "flex", gap: 8 }}>{SECTIONS.map(s => <Skeleton key={s.id} width={130} height={36} />)}</div>
          <div style={{ ...cardStyle, height: 300 }} />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ background: colors.bg, minHeight: "100vh", padding: 32, fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ ...cardStyle, textAlign: "center" as const, padding: 48, maxWidth: 480, margin: "0 auto" }}>
          <p style={{ color: colors.danger, fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>Failed to load settings</p>
          <p style={{ color: colors.textSecondary, fontSize: 14, margin: "0 0 20px" }}>The settings could not be loaded. Please try again.</p>
          <button onClick={load} style={btnPrimary}>Try Again</button>
        </div>
      </div>
    );
  }

  /* ---- Main render ---- */

  return (
    <div style={{ background: colors.bg, minHeight: "100vh", padding: "24px 32px", fontFamily: "Inter, system-ui, sans-serif" }}>
      {toast && <MessageToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.text, margin: 0, lineHeight: 1.2 }}>Settings</h1>
          <p style={{ fontSize: 15, color: colors.textSecondary, margin: "6px 0 0", maxWidth: 520, lineHeight: 1.5 }}>
            Company identity, business rules, security, integrations and feature flags.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={load} style={{ ...btnSecondary, display: "inline-flex", alignItems: "center", gap: 6 }} title="Reload settings" aria-label="Reload settings">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => void save()} disabled={saving} style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", gap: 6, opacity: saving ? 0.6 : 1 }}>
            <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div style={{ display: "flex", gap: 0, flexWrap: "wrap", borderBottom: `2px solid ${colors.border}`, marginBottom: 24 }}>
        {SECTIONS.map((section) => {
          const isActive = activeTab === section.id;
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 16px",
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                color: isActive ? colors.primary : colors.textSecondary,
                background: "none", border: "none", borderBottom: `2px solid ${isActive ? colors.primary : "transparent"}`,
                marginBottom: -2, cursor: "pointer", whiteSpace: "nowrap",
                transition: "color 0.15s ease, border-color 0.15s ease",
              }}
            >
              <span style={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={16} />
              </span>
              {section.title}
            </button>
          );
        })}
      </div>

      {/* Active section */}
      <div style={{ maxWidth: 920 }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 22 }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, background: colors.primaryLight, color: colors.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <activeSection.icon size={20} />
            </span>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: 0 }}>{activeSection.title}</h2>
              <p style={{ fontSize: 13, color: colors.textSecondary, margin: "4px 0 0", lineHeight: 1.5 }}>{activeSection.description}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "18px 20px" }}>
            {activeSection.fields.map((field) => {
              const isBoolean = field.type === "boolean";
              const isMultiline = field.type === "multiline";
              return (
                <div key={field.key} style={{ gridColumn: isBoolean || isMultiline ? "1 / -1" : "auto" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: isBoolean ? 0 : 6 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>{field.label}</label>
                    {!isBoolean && <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.3px" }}>{field.type}</span>}
                  </div>
                  <FieldControl field={field} value={values[field.key] ?? ""} onChange={(v) => update(field.key, v)} />
                  {field.help && <div style={helpStyle}>{field.help}</div>}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 20, borderTop: `1px solid ${colors.border}`, marginTop: 24 }}>
            <button onClick={() => void save()} disabled={saving} style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", gap: 6, opacity: saving ? 0.6 : 1 }}>
              <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Focus + animations */}
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        input:focus, select:focus, textarea:focus { border-color: ${colors.primary} !important; box-shadow: 0 0 0 3px ${colors.primaryLight}; }
        button:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
}
