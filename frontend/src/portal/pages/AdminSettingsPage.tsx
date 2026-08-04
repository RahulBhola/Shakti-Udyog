import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { Loading } from "../../components/ui";
import {
  Building2, Percent, Package, Bell, ShieldCheck, Plug, Flag,
  Save, CheckCircle2, XCircle, RefreshCw,
  type LucideIcon,
} from "lucide-react";
import "./erpListView.css";

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
      { key: "commercial.quotationValidityDays", label: "Quotation Validity (days)", type: "number" },
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
      { key: "feature.quotations", label: "Quotations", type: "boolean" },
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

function FieldControl({
  field, value, onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.type === "boolean") {
    const checked = value === "true";
    return (
      <div>
        <label className="inv-toggle">
          <input type="checkbox" checked={checked} onChange={(e) => onChange(String(e.target.checked))} />
          <span className="inv-form-label">{checked ? "Enabled" : "Disabled"}</span>
        </label>
        {field.help && <div className="inv-form-help">{field.help}</div>}
      </div>
    );
  }

  if (field.type === "multiline") {
    return (
      <>
        <textarea className="inv-input" value={value} placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)} />
        {field.help && <div className="inv-form-help">{field.help}</div>}
      </>
    );
  }

  return (
    <>
      <input
        className="inv-input"
        type={field.type === "number" ? "number" : field.type === "password" ? "password" : "text"}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {field.help && <div className="inv-form-help">{field.help}</div>}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => {
    adminApi.settings()
      .then((data) => { setValues(data ?? {}); setLoaded(true); })
      .catch(() => { setLoaded(true); });
  }, []);
  useEffect(load, [load]);

  const allKeys = useMemo(() => SECTIONS.flatMap((s) => s.fields.map((f) => f.key)), []);

  const update = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const payload: Record<string, string> = {};
      for (const key of allKeys) payload[key] = values[key] ?? "";
      await adminApi.updateSettings(payload);
      setStatus({ ok: true, text: "Settings saved." });
    } catch (e) {
      setStatus({ ok: false, text: e instanceof Error ? e.message : "Could not save settings." });
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return <div className="inv-status"><Loading label="Loading settings" /></div>;
  }

  return (
    <div className="inv-settings">
      {/* Header */}
      <div className="inv-header">
        <div>
          <h1 className="inv-header__title">Settings</h1>
          <p className="inv-header__subtitle">Company identity, business rules, security, integrations and feature flags.</p>
        </div>
        <div className="inv-header__actions">
          <button className="inv-btn inv-btn--icon" title="Reload settings" aria-label="Reload" onClick={load}>
            <RefreshCw size={16} />
          </button>
          <button className="inv-btn inv-btn--primary" onClick={() => void save()} disabled={saving}>
            <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Save status */}
      {status && (
        <div className="inv-filterbar" style={{ padding: "12px 18px", alignItems: "center" }}>
          {status.ok
            ? <CheckCircle2 size={16} style={{ color: "var(--color-success)" }} />
            : <XCircle size={16} style={{ color: "var(--color-danger)" }} />}
          <span style={{ color: status.ok ? "var(--color-success)" : "var(--color-danger)", fontSize: 13, fontWeight: 600 }}>{status.text}</span>
        </div>
      )}

      {/* Sections */}
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        return (
          <section key={section.id} className="inv-settings__section">
            <div className="inv-settings__head">
              <span className="inv-settings__icon"><Icon size={18} /></span>
              <div>
                <div className="inv-settings__title">{section.title}</div>
                <div className="inv-settings__desc">{section.description}</div>
              </div>
            </div>
            <div className="inv-settings__body">
              <div className="inv-form-grid">
                {section.fields.map((field) => (
                  <div key={field.key} className={`inv-form-field ${field.type === "multiline" ? "inv-form-field--full" : ""}`}>
                    <label className="inv-form-label">{field.label}</label>
                    <FieldControl field={field} value={values[field.key] ?? ""} onChange={(v) => update(field.key, v)} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
