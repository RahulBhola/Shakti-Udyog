import { useEffect, useState, useRef, type FormEvent } from "react";
import { customerApi, type Profile, type CompanyDetail, type ContactPerson, type CompanyAddress, type CompanyDocument, type SecurityInfo } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { formatDate } from "../shared";

// ── Icons (inline SVG for reliable availability) ──────────────────────────

function IconUser() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function IconBuilding() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>; }
function IconUsers() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IconMapPin() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>; }
function IconFile() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>; }
function IconSettings() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function IconShield() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IconChevronRight() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>; }
function IconCheck() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function IconAlertCircle() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
function IconX() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function IconPlus() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconEye() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>; }
function IconEyeOff() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>; }
function IconDownload() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function IconTrash2() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>; }
function IconRefresh() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>; }
function IconUpload() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function IconToggleOn() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><rect x="2" y="6" width="20" height="12" rx="6"/><circle cx="16" cy="12" r="4" fill="#fff"/></svg>; }
function IconToggleOff() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="20" height="12" rx="6"/><circle cx="8" cy="12" r="4" fill="currentColor"/></svg>; }
function IconStar() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }

// ── Design Tokens ──────────────────────────────────────────────────────────

const colors = {
  bg: "#F7F9FC",
  card: "#FFFFFF",
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  primaryLight: "rgba(37, 99, 235, 0.08)",
  success: "#22C55E",
  successLight: "rgba(34, 197, 94, 0.10)",
  warning: "#F59E0B",
  warningLight: "rgba(245, 158, 11, 0.10)",
  danger: "#EF4444",
  dangerLight: "rgba(239, 68, 68, 0.10)",
  text: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
};

const cardStyle: React.CSSProperties = {
  background: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05), 0 1px 3px 0 rgba(0,0,0,0.03)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: `1px solid ${colors.border}`,
  borderRadius: 10,
  fontSize: 14,
  color: colors.text,
  background: colors.card,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: colors.text,
  marginBottom: 6,
};

const btnPrimary: React.CSSProperties = {
  background: colors.primary,
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.15s ease",
};

const btnSecondary: React.CSSProperties = {
  background: "transparent",
  color: colors.textSecondary,
  border: `1px solid ${colors.border}`,
  borderRadius: 10,
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const btnDanger: React.CSSProperties = {
  background: "transparent",
  color: colors.danger,
  border: `1px solid ${colors.danger}`,
  borderRadius: 10,
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

// ── Utility Components ─────────────────────────────────────────────────────

function Skeleton({ width = "100%", height = 20 }: { width?: string | number; height?: number }) {
  return <div style={{ width, height, background: colors.borderLight, borderRadius: 6, animation: "pulse 2s infinite" }} />;
}

function MessageToast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  const bg = type === "success" ? colors.success : colors.danger;
  return (
    <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, background: bg, color: "#fff", padding: "14px 20px", borderRadius: 12, fontSize: 14, fontWeight: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 10, maxWidth: 400 }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, display: "flex" }}><IconX /></button>
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.4)" }}>
      <div style={{ ...cardStyle, width: 400, maxWidth: "90vw" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: colors.text }}>{title}</h3>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: colors.textSecondary, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={btnSecondary}>Cancel</button>
          <button onClick={onConfirm} style={{ ...btnPrimary, background: colors.danger }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Verification Badges ────────────────────────────────────────────────────

function VerificationBadge({ label, verified }: { label: string; verified: boolean }) {
  const bg = verified ? colors.successLight : colors.warningLight;
  const fg = verified ? colors.success : colors.warning;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: bg, color: fg }}>
      {verified ? <IconCheck /> : <IconAlertCircle />}
      {label}
    </span>
  );
}

// ── Tab Configuration ─────────────────────────────────────────────────────

interface Tab { key: string; label: string; icon: () => JSX.Element; }
const tabs: Tab[] = [
  { key: "personal", label: "Personal", icon: IconUser },
  { key: "company", label: "Company", icon: IconBuilding },
  { key: "contacts", label: "Contact Persons", icon: IconUsers },
  { key: "addresses", label: "Addresses", icon: IconMapPin },
  { key: "documents", label: "Documents", icon: IconFile },
  { key: "preferences", label: "Preferences", icon: IconSettings },
  { key: "security", label: "Security", icon: IconShield },
];

// ── Field definitions for company form ─────────────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "select" | "email" | "tel" | "url";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  colSpan?: 1 | 2 | 3;
}

const businessTypeOptions = [
  { value: "", label: "Select..." },
  { value: "Private Limited", label: "Private Limited" },
  { value: "Public Limited", label: "Public Limited" },
  { value: "Partnership", label: "Partnership" },
  { value: "Proprietorship", label: "Proprietorship" },
  { value: "LLP", label: "LLP" },
  { value: "Government", label: "Government" },
  { value: "Other", label: "Other" },
];

const currencyOptions = [
  { value: "", label: "Select..." },
  { value: "INR", label: "INR (₹)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
];

const paymentMethodOptions = [
  { value: "", label: "Select..." },
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Cheque", label: "Cheque" },
  { value: "UPI", label: "UPI" },
  { value: "Letter of Credit", label: "Letter of Credit" },
  { value: "Cash", label: "Cash" },
];

const communicationOptions = [
  { value: "", label: "Select..." },
  { value: "Email", label: "Email" },
  { value: "Phone", label: "Phone" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Portal", label: "Portal" },
];

const languageOptions = [
  { value: "", label: "Select..." },
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Punjabi", label: "Punjabi" },
];

const documentTypeOptions = [
  { value: "GST Certificate", label: "GST Certificate" },
  { value: "PAN Card", label: "PAN Card" },
  { value: "Company Registration", label: "Company Registration" },
  { value: "MSME Certificate", label: "MSME Certificate" },
  { value: "ISO Certificate", label: "ISO Certificate" },
  { value: "Company Logo", label: "Company Logo" },
  { value: "Other", label: "Other" },
];

// ── Main Component ─────────────────────────────────────────────────────────

export default function ProfilePage() {
  // Tab state
  const [activeTab, setActiveTab] = useState("personal");

  // Data state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [addresses, setAddresses] = useState<CompanyAddress[]>([]);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ── Data Loading ─────────────────────────────────────────────────────────

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [p, c, ct, a, d] = await Promise.all([
        customerApi.profile(),
        customerApi.companyDetail().catch(() => null),
        customerApi.contacts().catch<ContactPerson[]>(() => []),
        customerApi.addresses().catch<CompanyAddress[]>(() => []),
        customerApi.companyDocuments().catch<CompanyDocument[]>(() => []),
      ]);
      setProfile(p);
      setCompany(c);
      setContacts(ct);
      setAddresses(a);
      setDocuments(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
  }

  // ── Personal Tab ─────────────────────────────────────────────────────────

  async function handleSavePersonal(e: FormEvent) {
    e.preventDefault();
    const data = new FormData(e.currentTarget as HTMLFormElement);
    setBusy(true);
    try {
      await customerApi.updateProfile({
        fullName: (data.get("fullName") as string)?.trim() || undefined,
        phoneNumber: (data.get("phoneNumber") as string)?.trim() || undefined,
        deliveryAddresses: (data.get("deliveryAddresses") as string)?.trim() || undefined,
      });
      showToast("Personal information updated.", "success");
      const p = await customerApi.profile();
      setProfile(p);
    } catch {
      showToast("Could not update personal information.", "error");
    } finally { setBusy(false); }
  }

  // ── Company Tab ──────────────────────────────────────────────────────────

  async function handleSaveCompany(e: FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    setBusy(true);
    try {
      await customerApi.updateCompany({
        legalBusinessName: (data.get("legalBusinessName") as string)?.trim() || undefined,
        businessType: (data.get("businessType") as string) || undefined,
        industry: (data.get("industry") as string)?.trim() || undefined,
        website: (data.get("website") as string)?.trim() || undefined,
        companyEmail: (data.get("companyEmail") as string)?.trim() || undefined,
        companyPhone: (data.get("companyPhone") as string)?.trim() || undefined,
        purchaseEmail: (data.get("purchaseEmail") as string)?.trim() || undefined,
        accountsEmail: (data.get("accountsEmail") as string)?.trim() || undefined,
        registeredAddress: (data.get("registeredAddress") as string)?.trim() || undefined,
        factoryAddress: (data.get("factoryAddress") as string)?.trim() || undefined,
        city: (data.get("city") as string)?.trim() || undefined,
        state: (data.get("state") as string)?.trim() || undefined,
        country: (data.get("country") as string)?.trim() || undefined,
        pinCode: (data.get("pinCode") as string)?.trim() || undefined,
        gstNumber: (data.get("gstNumber") as string)?.trim() || undefined,
        panNumber: (data.get("panNumber") as string)?.trim() || undefined,
        cinNumber: (data.get("cinNumber") as string)?.trim() || undefined,
        msmeNumber: (data.get("msmeNumber") as string)?.trim() || undefined,
        preferredCurrency: (data.get("preferredCurrency") as string) || undefined,
        preferredPaymentMethod: (data.get("preferredPaymentMethod") as string) || undefined,
        preferredCommunication: (data.get("preferredCommunication") as string) || undefined,
        preferredLanguage: (data.get("preferredLanguage") as string) || undefined,
      });
      showToast("Company information updated.", "success");
      const c = await customerApi.companyDetail();
      setCompany(c);
    } catch {
      showToast("Could not update company information.", "error");
    } finally { setBusy(false); }
  }

  async function handleResetCompany() {
    try {
      const c = await customerApi.companyDetail();
      setCompany(c);
      showToast("Changes have been reset.", "success");
    } catch {
      showToast("Could not reset changes.", "error");
    }
  }

  // ── Contact Persons ──────────────────────────────────────────────────────

  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactPerson | null>(null);
  const [contactForm, setContactForm] = useState({ fullName: "", designation: "", department: "", email: "", phone: "", isPrimary: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "contact" | "address" | "document"; id: string; label: string } | null>(null);

  function openNewContact() {
    setEditingContact(null);
    setContactForm({ fullName: "", designation: "", department: "", email: "", phone: "", isPrimary: false });
    setShowContactModal(true);
  }

  function openEditContact(c: ContactPerson) {
    setEditingContact(c);
    setContactForm({ fullName: c.fullName, designation: c.designation, department: c.department || "", email: c.email, phone: c.phone, isPrimary: c.isPrimary });
    setShowContactModal(true);
  }

  async function handleSaveContact() {
    if (!contactForm.fullName.trim() || !contactForm.designation.trim() || !contactForm.email.trim() || !contactForm.phone.trim()) {
      showToast("Please fill all required fields.", "error");
      return;
    }
    setBusy(true);
    try {
      if (editingContact) {
        const updated = await customerApi.updateContact(editingContact.id, {
          fullName: contactForm.fullName.trim(),
          designation: contactForm.designation.trim(),
          department: contactForm.department.trim() || undefined,
          email: contactForm.email.trim(),
          phone: contactForm.phone.trim(),
          isPrimary: contactForm.isPrimary,
        });
        setContacts(prev => prev.map(c => c.id === editingContact.id ? updated : c));
        showToast("Contact updated.", "success");
      } else {
        const created = await customerApi.createContact({
          fullName: contactForm.fullName.trim(),
          designation: contactForm.designation.trim(),
          department: contactForm.department.trim() || undefined,
          email: contactForm.email.trim(),
          phone: contactForm.phone.trim(),
          isPrimary: contactForm.isPrimary,
        });
        setContacts(prev => [...prev, created]);
        showToast("Contact added.", "success");
      }
      setShowContactModal(false);
    } catch {
      showToast("Could not save contact.", "error");
    } finally { setBusy(false); }
  }

  async function handleDeleteContact(id: string) {
    setBusy(true);
    try {
      await customerApi.deleteContact(id);
      setContacts(prev => prev.filter(c => c.id !== id));
      showToast("Contact deleted.", "success");
    } catch {
      showToast("Could not delete contact.", "error");
    } finally { setBusy(false); setDeleteConfirm(null); }
  }

  // ── Addresses ────────────────────────────────────────────────────────────

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CompanyAddress | null>(null);
  const [addressForm, setAddressForm] = useState({ addressType: "Head Office", address: "", city: "", state: "", country: "", pinCode: "", isPrimary: false });

  function openNewAddress() {
    setEditingAddress(null);
    setAddressForm({ addressType: "Head Office", address: "", city: "", state: "", country: "", pinCode: "", isPrimary: false });
    setShowAddressModal(true);
  }

  function openEditAddress(a: CompanyAddress) {
    setEditingAddress(a);
    setAddressForm({ addressType: a.addressType, address: a.address, city: a.city || "", state: a.state || "", country: a.country || "", pinCode: a.pinCode || "", isPrimary: a.isPrimary });
    setShowAddressModal(true);
  }

  async function handleSaveAddress() {
    if (!addressForm.addressType || !addressForm.address.trim()) {
      showToast("Please fill address type and address.", "error");
      return;
    }
    setBusy(true);
    try {
      if (editingAddress) {
        const updated = await customerApi.updateAddress(editingAddress.id, {
          addressType: addressForm.addressType,
          address: addressForm.address.trim(),
          city: addressForm.city.trim() || undefined,
          state: addressForm.state.trim() || undefined,
          country: addressForm.country.trim() || undefined,
          pinCode: addressForm.pinCode.trim() || undefined,
          isPrimary: addressForm.isPrimary,
        });
        setAddresses(prev => prev.map(a => a.id === editingAddress.id ? updated : a));
        showToast("Address updated.", "success");
      } else {
        const created = await customerApi.createAddress({
          addressType: addressForm.addressType,
          address: addressForm.address.trim(),
          city: addressForm.city.trim() || undefined,
          state: addressForm.state.trim() || undefined,
          country: addressForm.country.trim() || undefined,
          pinCode: addressForm.pinCode.trim() || undefined,
          isPrimary: addressForm.isPrimary,
        });
        setAddresses(prev => [...prev, created]);
        showToast("Address added.", "success");
      }
      setShowAddressModal(false);
    } catch {
      showToast("Could not save address.", "error");
    } finally { setBusy(false); }
  }

  async function handleDeleteAddress(id: string) {
    setBusy(true);
    try {
      await customerApi.deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      showToast("Address deleted.", "success");
    } catch {
      showToast("Could not delete address.", "error");
    } finally { setBusy(false); setDeleteConfirm(null); }
  }

  // ── Documents ────────────────────────────────────────────────────────────

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDocType, setUploadingDocType] = useState("GST Certificate");

  async function handleUploadDocument(file: File) {
    if (!file) return;
    setBusy(true);
    try {
      const result = await customerApi.uploadCompanyDocument(uploadingDocType, file);
      const docs = await customerApi.companyDocuments();
      setDocuments(docs);
      showToast(`${result.fileName} uploaded.`, "success");
    } catch {
      showToast("Could not upload document.", "error");
    } finally { setBusy(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }

  async function handleDeleteDocument(id: string) {
    setBusy(true);
    try {
      await customerApi.deleteCompanyDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      showToast("Document deleted.", "success");
    } catch {
      showToast("Could not delete document.", "error");
    } finally { setBusy(false); setDeleteConfirm(null); }
  }

  // ── Preferences ──────────────────────────────────────────────────────────

  const [preferences, setPreferences] = useState({
    language: "English",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    currency: "INR",
    emailNotifications: true,
    quotationUpdates: true,
    invoiceNotifications: true,
    marketingEmails: false,
  });

  async function handleSavePreferences() {
    setBusy(true);
    try {
      // Simulate save — backend endpoint TBD
      await new Promise(r => setTimeout(r, 300));
      showToast("Preferences saved.", "success");
    } catch {
      showToast("Could not save preferences.", "error");
    } finally { setBusy(false); }
  }

  // ── Security ─────────────────────────────────────────────────────────────

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    const data = new FormData(e.currentTarget as HTMLFormElement);
    const current = data.get("currentPassword") as string;
    const newPw = data.get("newPassword") as string;
    const confirmPw = data.get("confirmPassword") as string;
    if (!current || !newPw || !confirmPw) { showToast("Fill all password fields.", "error"); return; }
    if (newPw.length < 12) { showToast("New password must be at least 12 characters.", "error"); return; }
    if (newPw !== confirmPw) { showToast("New password and confirm password do not match.", "error"); return; }
    setBusy(true);
    try {
      await customerApi.securityChangePassword(current, newPw);
      (e.currentTarget as HTMLFormElement).reset();
      showToast("Password changed. Other sessions have been signed out.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Password change failed.", "error");
    } finally { setBusy(false); }
  }

  async function handleToggleMfa() {
    setBusy(true);
    try {
      if (securityInfo?.mfaEnabled) {
        await customerApi.disableMfa();
        showToast("MFA disabled.", "success");
      } else {
        await customerApi.enableMfa();
        showToast("MFA enabled.", "success");
      }
      const s = await customerApi.securityInfo().catch(() => null);
      if (s) setSecurityInfo(s);
    } catch {
      showToast("Could not update MFA.", "error");
    } finally { setBusy(false); }
  }

  // ── Render Helpers ───────────────────────────────────────────────────────

  function renderField(field: FieldDef, value: string | undefined, onChange?: (v: string) => void) {
    const id = `field-${field.key}`;
    const styles = { ...inputStyle };
    if (field.type === "select" && field.options) {
      return (
        <div key={field.key}>
          <label htmlFor={id} style={labelStyle}>{field.label}{field.required && <span style={{ color: colors.danger, marginLeft: 2 }}>*</span>}</label>
          <select id={id} name={field.key} value={value ?? ""} onChange={onChange ? e => onChange(e.target.value) : undefined} style={{ ...styles, cursor: "pointer", appearance: "none" as const, backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 36 }}>
            {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      );
    }
    return (
      <div key={field.key}>
        <label htmlFor={id} style={labelStyle}>{field.label}{field.required && <span style={{ color: colors.danger, marginLeft: 2 }}>*</span>}</label>
        <input id={id} name={field.key} type={field.type} defaultValue={value ?? ""} placeholder={field.placeholder} style={styles} onFocus={e => { e.target.style.borderColor = colors.primary; }} onBlur={e => { e.target.style.borderColor = colors.border; }} />
      </div>
    );
  }

  // ── Loading / Error ──────────────────────────────────────────────────────

  if (error && !profile) {
    return (
      <div style={{ background: colors.bg, minHeight: "100vh", padding: 32 }}>
        <div style={{ ...cardStyle, textAlign: "center" as const, padding: 48 }}>
          <p style={{ color: colors.danger, fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>Failed to load profile</p>
          <p style={{ color: colors.textSecondary, fontSize: 14, margin: "0 0 20px" }}>{error}</p>
          <button onClick={loadAll} style={btnPrimary}>Try Again</button>
        </div>
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div style={{ background: colors.bg, minHeight: "100vh", padding: 32 }}>
        <div style={{ display: "grid", gap: 24 }}>
          <Skeleton height={32} width={200} />
          <Skeleton height={16} width={400} />
          <div style={{ display: "flex", gap: 8 }}>{[1,2,3,4,5].map(i => <Skeleton key={i} width={120} height={36} />)}</div>
          <div style={{ ...cardStyle, height: 300 }} />
        </div>
      </div>
    );
  }

  // ── Main Render ─────────────────────────────────────────────────────────

  return (
    <div style={{ background: colors.bg, minHeight: "100vh", padding: "24px 32px", fontFamily: "Inter, system-ui, sans-serif" }}>
      {toast && <MessageToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {deleteConfirm && (
        <ConfirmDialog
          title={`Delete ${deleteConfirm.label}?`}
          message="This action cannot be undone."
          onConfirm={() => {
            if (deleteConfirm.type === "contact") handleDeleteContact(deleteConfirm.id);
            else if (deleteConfirm.type === "address") handleDeleteAddress(deleteConfirm.id);
            else if (deleteConfirm.type === "document") handleDeleteDocument(deleteConfirm.id);
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        {/* Title Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.text, margin: 0, lineHeight: 1.2 }}>Profile</h1>
            <p style={{ fontSize: 15, color: colors.textSecondary, margin: "6px 0 0", maxWidth: 480, lineHeight: 1.5 }}>
              Manage your personal, company and account settings.
            </p>
          </div>
          {/* Account Since Card */}
          <div style={{ ...cardStyle, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: colors.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary }}>
              <IconBuilding />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: colors.textSecondary, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Account Since</p>
              <p style={{ margin: "2px 0 0", fontSize: 14, color: colors.text, fontWeight: 700 }}>
                {profile?.accountCreatedAtUtc ? formatDate(profile.accountCreatedAtUtc) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 0, flexWrap: "wrap", borderBottom: `2px solid ${colors.border}`, marginBottom: 24 }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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
                <tab.icon />
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}

      {/* ═══ Personal Tab ═══ */}
      {activeTab === "personal" && (
        <div style={{ display: "grid", gap: 24, maxWidth: 800 }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 20px" }}>Personal Information</h2>
            <form onSubmit={handleSavePersonal} style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input name="fullName" type="text" defaultValue={profile?.fullName ?? ""} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Designation</label>
                  <input name="designation" type="text" defaultValue={profile?.company?.name ? "Customer Representative" : ""} placeholder="e.g. Purchase Manager" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input value={profile?.email ?? ""} disabled style={{ ...inputStyle, background: colors.borderLight, color: colors.textSecondary }} />
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: colors.successLight, color: colors.success }}>
                    <IconCheck /> Verified
                  </span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.textMuted }}>Email changes require Shakti Udyog support.</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Country Code</label>
                  <select defaultValue="+91" style={inputStyle}>
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input name="phoneNumber" type="tel" defaultValue={profile?.phoneNumber ?? ""} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Preferred Communication</label>
                <select defaultValue="Email" style={inputStyle}>
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Delivery Addresses</label>
                <textarea name="deliveryAddresses" defaultValue={profile?.company?.deliveryAddresses ?? ""} placeholder="One address per line" style={{ ...inputStyle, minHeight: 80, resize: "vertical" as const }} />
              </div>
              <div style={{ display: "flex", gap: 10, paddingTop: 8 }}>
                <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>{busy ? "Saving..." : "Save Personal Information"}</button>
              </div>
            </form>
          </div>

          {/* Profile Picture */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 16px" }}>Profile Picture</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: colors.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary, fontSize: 32, fontWeight: 700 }}>
                {(profile?.fullName ?? profile?.email ?? "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 13, color: colors.textSecondary }}>JPG, PNG or SVG. Max 2 MB.</p>
                <button style={btnSecondary}>Change Photo</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Company Tab ═══ */}
      {activeTab === "company" && (
        <div style={{ display: "grid", gap: 24 }}>
          {/* Verification Status */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 16px" }}>Verification Status</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: colors.textSecondary }}>Overall Status:</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: colors.warningLight, color: colors.warning }}>
                <IconAlertCircle /> Partially Verified
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <VerificationBadge label="GST Verified" verified={company?.gstVerified ?? false} />
              <VerificationBadge label="Email Verified" verified={company?.emailVerified ?? false} />
              <VerificationBadge label="Phone Verified" verified={company?.phoneVerified ?? false} />
              <VerificationBadge label="Company Verification" verified={(company?.verificationStatus ?? "Pending") === "Verified"} />
            </div>
          </div>

          {/* Company Information Form */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 20px" }}>Company Information</h2>
            <form onSubmit={handleSaveCompany} style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {renderField({ key: "legalBusinessName", label: "Legal Business Name", type: "text", placeholder: "e.g. Shakti Udyog Pvt Ltd" }, company?.legalBusinessName ?? undefined)}
                {renderField({ key: "businessType", label: "Business Type", type: "select", required: true, options: businessTypeOptions }, company?.businessType ?? undefined)}
                {renderField({ key: "industry", label: "Industry", type: "text", placeholder: "e.g. Iron Casting" }, company?.industry ?? undefined)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {renderField({ key: "website", label: "Company Website", type: "url", placeholder: "https://" }, company?.website ?? undefined)}
                {renderField({ key: "companyEmail", label: "Company Email", type: "email", required: true }, company?.companyEmail ?? undefined)}
                {renderField({ key: "companyPhone", label: "Company Phone", type: "tel", required: true }, company?.companyPhone ?? undefined)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {renderField({ key: "purchaseEmail", label: "Purchase Department Email", type: "email" }, company?.purchaseEmail ?? undefined)}
                {renderField({ key: "accountsEmail", label: "Accounts Department Email", type: "email" }, company?.accountsEmail ?? undefined)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {renderField({ key: "registeredAddress", label: "Registered Address", type: "text", required: true, placeholder: "Full address" }, company?.registeredAddress ?? undefined)}
                {renderField({ key: "factoryAddress", label: "Factory Address", type: "text", placeholder: "Optional" }, company?.factoryAddress ?? undefined)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
                {renderField({ key: "city", label: "City", type: "text", required: true }, company?.city ?? undefined)}
                {renderField({ key: "state", label: "State", type: "text", required: true }, company?.state ?? undefined)}
                {renderField({ key: "country", label: "Country", type: "text", required: true }, company?.country ?? undefined)}
                {renderField({ key: "pinCode", label: "PIN Code", type: "text", required: true }, company?.pinCode ?? undefined)}
                {renderField({ key: "gstNumber", label: "GST Number", type: "text", required: true, placeholder: "e.g. 03ABCDE1234F1Z5" }, company?.gstNumber ?? undefined)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {renderField({ key: "panNumber", label: "PAN Number", type: "text", placeholder: "e.g. ABCDE1234F" }, company?.panNumber ?? undefined)}
                {renderField({ key: "cinNumber", label: "CIN Number", type: "text", placeholder: "Optional" }, company?.cinNumber ?? undefined)}
                {renderField({ key: "msmeNumber", label: "MSME/Udyam Number", type: "text", placeholder: "Optional" }, company?.msmeNumber ?? undefined)}
                {renderField({ key: "preferredCurrency", label: "Preferred Currency", type: "select", options: currencyOptions }, company?.preferredCurrency ?? undefined)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {renderField({ key: "preferredPaymentMethod", label: "Preferred Payment Method", type: "select", options: paymentMethodOptions }, company?.preferredPaymentMethod ?? undefined)}
                {renderField({ key: "preferredCommunication", label: "Preferred Communication", type: "select", options: communicationOptions }, company?.preferredCommunication ?? undefined)}
                {renderField({ key: "preferredLanguage", label: "Preferred Language", type: "select", options: languageOptions }, company?.preferredLanguage ?? undefined)}
              </div>

              <div style={{ display: "flex", gap: 12, paddingTop: 12, borderTop: `1px solid ${colors.border}` }}>
                <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>{busy ? "Saving..." : "Save Company Information"}</button>
                <button type="button" onClick={handleResetCompany} style={btnSecondary}>Reset Changes</button>
              </div>
            </form>
          </div>

          {/* Bottom row: Company Logo + Verification Status card */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Company Logo */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 16px" }}>Company Logo</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ width: 100, height: 100, borderRadius: 16, background: colors.borderLight, display: "flex", alignItems: "center", justifyContent: "center", border: `2px dashed ${colors.border}`, color: colors.textMuted, fontSize: 12, textAlign: "center" }}>
                  {company?.companyLogoUrl ? <img src={company.companyLogoUrl} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 14 }} /> : "No Logo"}
                </div>
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: 13, color: colors.textSecondary }}>Allowed: JPG, PNG, SVG. Max 2 MB.</p>
                  <button style={btnSecondary}>Change Logo</button>
                </div>
              </div>
            </div>

            {/* Verification Status Card */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 16px" }}>Company Verification</h2>
              {(company?.verificationStatus ?? "Pending") === "Pending" || company?.verificationStatus === "Submitted" ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: colors.warningLight, color: colors.warning }}>
                      <IconAlertCircle /> {company?.verificationStatus === "Submitted" ? "Under Review" : "Pending"}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 4px", fontSize: 14, color: colors.textSecondary, lineHeight: 1.5 }}>
                    Our team is reviewing your company information and uploaded documents. You will be notified after verification.
                  </p>
                  {company?.verificationSubmittedOn && (
                    <p style={{ margin: "8px 0 0", fontSize: 12, color: colors.textMuted }}>
                      Submitted on: {formatDate(company.verificationSubmittedOn)}
                    </p>
                  )}
                  {company?.verificationStatus === "Pending" && (
                    <button type="button" style={{ ...btnPrimary, marginTop: 16 }} onClick={async () => {
                      try { await customerApi.submitCompanyVerification(); showToast("Verification submitted.", "success"); const c = await customerApi.companyDetail(); setCompany(c); } catch { showToast("Could not submit.", "error"); }
                    }}>Submit for Verification</button>
                  )}
                </div>
              ) : company?.verificationStatus === "Verified" ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: colors.successLight, color: colors.success }}>
                      <IconCheck /> Verified
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: colors.textSecondary }}>Your company has been verified.</p>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: colors.dangerLight, color: colors.danger }}>
                      <IconX /> Rejected
                    </span>
                  </div>
                  <p style={{ margin: "0 0 8px", fontSize: 14, color: colors.textSecondary }}>Your verification was not approved. Please update your documents and resubmit.</p>
                  <button type="button" style={btnPrimary}>Resubmit</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Contact Persons Tab ═══ */}
      {activeTab === "contacts" && (
        <div>
          <div style={{ ...cardStyle }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: 0 }}>Contact Persons</h2>
              <button onClick={openNewContact} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }}><IconPlus /> Add Contact</button>
            </div>
            {contacts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px" }}>
                <div style={{ fontSize: 14, color: colors.textMuted, marginBottom: 8 }}>No contacts added yet.</div>
                <button onClick={openNewContact} style={btnSecondary}>Add your first contact</button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {contacts.map(c => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: colors.bg, borderRadius: 12, border: `1px solid ${colors.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: colors.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary, fontWeight: 700, fontSize: 16 }}>
                        {c.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 600, color: colors.text, fontSize: 14 }}>{c.fullName}</span>
                          {c.isPrimary && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: colors.warningLight, color: colors.warning }}>
                              <IconStar /> Primary
                            </span>
                          )}
                        </div>
                        <p style={{ margin: "2px 0 0", fontSize: 13, color: colors.textSecondary }}>{c.designation}{c.department ? ` · ${c.department}` : ""}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 13, color: colors.textSecondary }}>{c.email} · {c.phone}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEditContact(c)} style={{ ...btnSecondary, padding: "6px 12px", fontSize: 12 }}>Edit</button>
                      <button onClick={() => setDeleteConfirm({ type: "contact", id: c.id, label: c.fullName })} style={{ ...btnDanger, padding: "6px 12px", fontSize: 12 }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Modal */}
          {showContactModal && (
            <div style={{ position: "fixed", inset: 0, zIndex: 9997, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.4)" }}>
              <div style={{ ...cardStyle, width: 520, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text }}>{editingContact ? "Edit Contact" : "Add Contact"}</h3>
                  <button onClick={() => setShowContactModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textSecondary, padding: 4 }}><IconX /></button>
                </div>
                <div style={{ display: "grid", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Full Name *</label>
                      <input value={contactForm.fullName} onChange={e => setContactForm(p => ({ ...p, fullName: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Designation *</label>
                      <input value={contactForm.designation} onChange={e => setContactForm(p => ({ ...p, designation: e.target.value }))} style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Department</label>
                    <input value={contactForm.department} onChange={e => setContactForm(p => ({ ...p, department: e.target.value }))} style={inputStyle} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Email *</label>
                      <input type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Phone *</label>
                      <input type="tel" value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} style={inputStyle} />
                    </div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: colors.text }}>
                    <input type="checkbox" checked={contactForm.isPrimary} onChange={e => setContactForm(p => ({ ...p, isPrimary: e.target.checked }))} style={{ width: 18, height: 18, accentColor: colors.primary }} />
                    Set as Primary Contact
                  </label>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: `1px solid ${colors.border}` }}>
                    <button onClick={() => setShowContactModal(false)} style={btnSecondary}>Cancel</button>
                    <button onClick={handleSaveContact} disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>{busy ? "Saving..." : "Save Contact"}</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ Addresses Tab ═══ */}
      {activeTab === "addresses" && (
        <div>
          <div style={{ ...cardStyle }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: 0 }}>Addresses</h2>
              <button onClick={openNewAddress} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }}><IconPlus /> Add Address</button>
            </div>
            {addresses.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px" }}>
                <div style={{ fontSize: 14, color: colors.textMuted, marginBottom: 8 }}>No addresses added yet.</div>
                <button onClick={openNewAddress} style={btnSecondary}>Add your first address</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 12 }}>
                {addresses.map(a => (
                  <div key={a.id} style={{ padding: "16px 20px", background: colors.bg, borderRadius: 12, border: `1px solid ${colors.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 600, color: colors.text, fontSize: 14 }}>{a.addressType}</span>
                        {a.isPrimary && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: colors.warningLight, color: colors.warning }}>
                            <IconStar /> Primary
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => openEditAddress(a)} style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11 }}>Edit</button>
                        <button onClick={() => setDeleteConfirm({ type: "address", id: a.id, label: a.addressType })} style={{ ...btnDanger, padding: "4px 10px", fontSize: 11 }}>Delete</button>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: colors.textSecondary, lineHeight: 1.5 }}>{a.address}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.textMuted }}>{[a.city, a.state, a.pinCode, a.country].filter(Boolean).join(", ")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Address Modal */}
          {showAddressModal && (
            <div style={{ position: "fixed", inset: 0, zIndex: 9997, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.4)" }}>
              <div style={{ ...cardStyle, width: 560, maxWidth: "90vw" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text }}>{editingAddress ? "Edit Address" : "Add Address"}</h3>
                  <button onClick={() => setShowAddressModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textSecondary, padding: 4 }}><IconX /></button>
                </div>
                <div style={{ display: "grid", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Address Type *</label>
                    <select value={addressForm.addressType} onChange={e => setAddressForm(p => ({ ...p, addressType: e.target.value }))} style={inputStyle}>
                      <option value="Head Office">Head Office</option>
                      <option value="Factory">Factory</option>
                      <option value="Warehouse">Warehouse</option>
                      <option value="Billing">Billing</option>
                      <option value="Shipping">Shipping</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Address *</label>
                    <textarea value={addressForm.address} onChange={e => setAddressForm(p => ({ ...p, address: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: "vertical" as const }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>City</label>
                      <input value={addressForm.city} onChange={e => setAddressForm(p => ({ ...p, city: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>State</label>
                      <input value={addressForm.state} onChange={e => setAddressForm(p => ({ ...p, state: e.target.value }))} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Country</label>
                      <input value={addressForm.country} onChange={e => setAddressForm(p => ({ ...p, country: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>PIN Code</label>
                      <input value={addressForm.pinCode} onChange={e => setAddressForm(p => ({ ...p, pinCode: e.target.value }))} style={inputStyle} />
                    </div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: colors.text }}>
                    <input type="checkbox" checked={addressForm.isPrimary} onChange={e => setAddressForm(p => ({ ...p, isPrimary: e.target.checked }))} style={{ width: 18, height: 18, accentColor: colors.primary }} />
                    Set as Primary Address
                  </label>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: `1px solid ${colors.border}` }}>
                    <button onClick={() => setShowAddressModal(false)} style={btnSecondary}>Cancel</button>
                    <button onClick={handleSaveAddress} disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>{busy ? "Saving..." : "Save Address"}</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ Documents Tab ═══ */}
      {activeTab === "documents" && (
        <div style={{ display: "grid", gap: 24 }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 20px" }}>Documents</h2>
            {/* Upload Section */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: 16, background: colors.bg, borderRadius: 12, border: `1px solid ${colors.border}` }}>
              <select value={uploadingDocType} onChange={e => setUploadingDocType(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: 180 }}>
                {documentTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input ref={fileInputRef} type="file" onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadDocument(f); }} style={{ display: "none" }} accept=".pdf,.jpg,.jpeg,.png,.svg,.doc,.docx,.xls,.xlsx" />
              <button onClick={() => fileInputRef.current?.click()} disabled={busy} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6, opacity: busy ? 0.6 : 1 }}><IconUpload /> Upload Document</button>
              <span style={{ fontSize: 12, color: colors.textMuted }}>PDF, images, Office docs. Max 11 MB.</span>
            </div>

            {/* Document List */}
            {documents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 16px", color: colors.textMuted, fontSize: 14 }}>
                No documents uploaded yet. Upload your GST Certificate, PAN Card, and other verification documents.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {documents.map(d => (
                  <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.bg }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: colors.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary, flexShrink: 0 }}>
                        <IconFile />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.fileName}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>
                          {d.documentType} · {formatDate(d.uploadedAtUtc)} · {d.sizeBytes > 1024 ? `${(d.sizeBytes / 1024).toFixed(1)} KB` : `${d.sizeBytes} B`}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {/* Status badge */}
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                        background: d.status === "Verified" ? colors.successLight : d.status === "Rejected" ? colors.dangerLight : colors.warningLight,
                        color: d.status === "Verified" ? colors.success : d.status === "Rejected" ? colors.danger : colors.warning,
                      }}>
                        {d.status === "Verified" ? <IconCheck /> : d.status === "Rejected" ? <IconX /> : <IconAlertCircle />}
                        {d.status}
                      </span>
                      <a href={customerApi.downloadCompanyDocument(d.id)} download style={{ ...btnSecondary, padding: "6px 10px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}><IconDownload /> Download</a>
                      <button onClick={() => setDeleteConfirm({ type: "document", id: d.id, label: d.fileName })} style={{ ...btnDanger, padding: "6px 10px", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><IconTrash2 /> Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Preferences Tab ═══ */}
      {activeTab === "preferences" && (
        <div style={{ maxWidth: 640 }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 20px" }}>Preferences</h2>
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Language</label>
                  <select value={preferences.language} onChange={e => setPreferences(p => ({ ...p, language: e.target.value }))} style={inputStyle}>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Punjabi">Punjabi</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Timezone</label>
                  <select value={preferences.timezone} onChange={e => setPreferences(p => ({ ...p, timezone: e.target.value }))} style={inputStyle}>
                    <option value="Asia/Kolkata">India (IST, UTC+5:30)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Date Format</label>
                  <select value={preferences.dateFormat} onChange={e => setPreferences(p => ({ ...p, dateFormat: e.target.value }))} style={inputStyle}>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Currency</label>
                  <select value={preferences.currency} onChange={e => setPreferences(p => ({ ...p, currency: e.target.value }))} style={inputStyle}>
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 16, marginTop: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: "0 0 16px" }}>Email Notifications</h3>
                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    { key: "emailNotifications", label: "Email Notifications" },
                    { key: "quotationUpdates", label: "Quote Updates" },
                    { key: "invoiceNotifications", label: "Invoice Notifications" },
                    { key: "marketingEmails", label: "Marketing Emails" },
                  ].map(item => (
                    <label key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: 8, borderRadius: 8, background: colors.bg }}>
                      <span style={{ fontSize: 14, color: colors.text }}>{item.label}</span>
                      <button
                        type="button"
                        onClick={() => setPreferences(p => ({ ...p, [item.key]: !(p as any)[item.key] }))}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: (preferences as any)[item.key] ? colors.primary : colors.textMuted }}
                      >
                        {(preferences as any)[item.key] ? <IconToggleOn /> : <IconToggleOff />}
                      </button>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ paddingTop: 8 }}>
                <button onClick={handleSavePreferences} disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>{busy ? "Saving..." : "Save Preferences"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Security Tab ═══ */}
      {activeTab === "security" && (
        <div style={{ display: "grid", gap: 24, maxWidth: 640 }}>
          {/* Change Password */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 20px" }}>Change Password</h2>
            <form onSubmit={handleChangePassword} style={{ display: "grid", gap: 14 }}>
              <div>
                <label htmlFor="sp-current" style={labelStyle}>Current Password *</label>
                <div style={{ position: "relative" }}>
                  <input id="sp-current" name="currentPassword" type={showCurrentPw ? "text" : "password"} autoComplete="current-password" required style={{ ...inputStyle, paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowCurrentPw(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: colors.textSecondary, padding: 4, display: "flex" }}>
                    {showCurrentPw ? <IconEye /> : <IconEyeOff />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="sp-new" style={labelStyle}>New Password *</label>
                <div style={{ position: "relative" }}>
                  <input id="sp-new" name="newPassword" type={showNewPw ? "text" : "password"} autoComplete="new-password" required minLength={12} style={{ ...inputStyle, paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowNewPw(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: colors.textSecondary, padding: 4, display: "flex" }}>
                    {showNewPw ? <IconEye /> : <IconEyeOff />}
                  </button>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: colors.textMuted }}>12+ characters with upper, lower, digit, and symbol.</p>
              </div>
              <div>
                <label htmlFor="sp-confirm" style={labelStyle}>Confirm New Password *</label>
                <div style={{ position: "relative" }}>
                  <input id="sp-confirm" name="confirmPassword" type={showConfirmPw ? "text" : "password"} autoComplete="new-password" required minLength={12} style={{ ...inputStyle, paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowConfirmPw(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: colors.textSecondary, padding: 4, display: "flex" }}>
                    {showConfirmPw ? <IconEye /> : <IconEyeOff />}
                  </button>
                </div>
              </div>
              <div>
                <button type="submit" disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>{busy ? "Changing..." : "Change Password"}</button>
              </div>
            </form>
          </div>

          {/* Two-Factor Authentication */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 16px" }}>Two-Factor Authentication</h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 14, color: colors.text, fontWeight: 500 }}>{securityInfo?.mfaEnabled ? "MFA is enabled" : "MFA is disabled"}</p>
                <p style={{ margin: 0, fontSize: 13, color: colors.textSecondary }}>Add an extra layer of security to your account.</p>
              </div>
              <button onClick={handleToggleMfa} disabled={busy} style={securityInfo?.mfaEnabled ? { ...btnDanger } : { ...btnPrimary }}>
                {busy ? "..." : securityInfo?.mfaEnabled ? "Disable MFA" : "Enable MFA"}
              </button>
            </div>
          </div>

          {/* Active Sessions */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: 0 }}>Active Sessions</h2>
              <button style={{ ...btnSecondary, display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "8px 16px" }}>
                <IconRefresh /> View Sessions
              </button>
            </div>
            {securityInfo?.activeSessions && securityInfo.activeSessions.length > 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {securityInfo.activeSessions.slice(0, 3).map(s => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: colors.bg, borderRadius: 10 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.text }}>
                        {s.deviceName ?? "Unknown device"}
                        {s.isCurrent && <span style={{ color: colors.success, marginLeft: 8, fontSize: 12, fontWeight: 500 }}>Current session</span>}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>{s.ipAddress} · {formatDate(s.createdAtUtc)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>No active sessions found.</p>
            )}
          </div>

          {/* Login History Placeholder */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 16px" }}>Login History</h2>
            <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>Login history tracking will be available in a future update.</p>
          </div>
        </div>
      )}

      {/* ── Style tag for animations ── */}
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        input:focus, select:focus, textarea:focus { border-color: ${colors.primary} !important; box-shadow: 0 0 0 3px ${colors.primaryLight}; }
        button:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
}
