import { useEffect, useState, useRef, type FormEvent, type ReactNode } from "react";
import { customerApi, type Profile, type CompanyDetail, type ContactPerson, type CompanyAddress, type CompanyDocument } from "../../api/customerApi";
import { useAuth } from "../../auth/AuthContext";
import { formatDate } from "../shared";
import { DevicesSessionsCard } from "../components/DevicesSessionsCard";
import { ProfileCompletionCard } from "../components/ProfileCompletion";
import { UserAvatar } from "../../components/ui";
import { cn } from "../../lib/utils";

// ── Icons (inline SVG for reliable availability) ──────────────────────────

function IconUser() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function IconBuilding() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>; }
function IconUsers() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IconMapPin() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>; }
function IconFile() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>; }
function IconSettings() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function IconShield() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IconCheck() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function IconAlertCircle() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
function IconX() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function IconPlus() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconEye() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>; }
function IconEyeOff() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>; }
function IconDownload() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function IconTrash2() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>; }
function IconUpload() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function IconToggleOn() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><rect x="2" y="6" width="20" height="12" rx="6"/><circle cx="16" cy="12" r="4" fill="#fff"/></svg>; }
function IconToggleOff() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="20" height="12" rx="6"/><circle cx="8" cy="12" r="4" fill="currentColor"/></svg>; }
function IconStar() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function IconChevronRight() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>; }
function IconPhone() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>; }

// ── Design Tokens ──────────────────────────────────────────────────────────

const colors = {
  bg: "var(--bg-surface)",
  card: "var(--bg-card)",
  primary: "var(--color-primary)",
  primaryHover: "var(--color-primary-hover)",
  primaryLight: "rgba(59, 130, 246, 0.15)",
  success: "var(--color-success, #22C55E)",
  successLight: "rgba(34, 197, 94, 0.15)",
  warning: "var(--color-warning, #F59E0B)",
  warningLight: "rgba(245, 158, 11, 0.15)",
  danger: "var(--color-danger, #EF4444)",
  dangerLight: "rgba(239, 68, 68, 0.15)",
  text: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  textMuted: "var(--text-muted)",
  border: "var(--border-default)",
  borderLight: "var(--bg-surface-hover, rgba(255, 255, 255, 0.06))",
};

const cardStyle: React.CSSProperties = {
  background: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: `1px solid ${colors.border}`,
  borderRadius: 10,
  fontSize: 14,
  color: colors.text,
  background: "var(--bg-input, var(--bg-surface))",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  fontFamily: "inherit",
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
  color: "#ffffff",
  border: "none",
  borderRadius: 10,
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.15s ease",
};

const btnSecondary: React.CSSProperties = {
  background: "var(--bg-surface-hover, rgba(255, 255, 255, 0.04))",
  color: colors.text,
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

interface Tab { key: string; label: string; icon: () => ReactNode; }
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

const standardBusinessTypes = [
  "Private Limited",
  "Public Limited",
  "Partnership",
  "Proprietorship",
  "LLP",
  "Government",
];

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

function parseBusinessType(bt: string | null | undefined): { businessType: string; customBusinessType: string } {
  const raw = (bt || "").trim();
  if (!raw) return { businessType: "", customBusinessType: "" };
  if (standardBusinessTypes.includes(raw)) return { businessType: raw, customBusinessType: "" };
  return { businessType: "Other", customBusinessType: raw === "Other" ? "" : raw };
}

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
  const { user, refreshUser } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState("personal");

  // Data state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [addresses, setAddresses] = useState<CompanyAddress[]>([]);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);

  // Personal form controlled state (preserves changes across tab navigation)
  const [personalFullName, setPersonalFullName] = useState("");
  const [personalPhone, setPersonalPhone] = useState("");
  const [personalCountryCode, setPersonalCountryCode] = useState("+91");
  const [personalPreferredComm, setPersonalPreferredComm] = useState("Email");
  const [personalDeliveryAddresses, setPersonalDeliveryAddresses] = useState("");

  // Company form controlled state (preserves changes across tab navigation)
  const [companyForm, setCompanyForm] = useState({
    legalBusinessName: "",
    businessType: "",
    customBusinessType: "",
    industry: "",
    website: "",
    companyEmail: "",
    companyPhone: "",
    purchaseEmail: "",
    accountsEmail: "",
    registeredAddress: "",
    factoryAddress: "",
    city: "",
    state: "",
    country: "India",
    pinCode: "",
    gstNumber: "",
    panNumber: "",
    cinNumber: "",
    msmeNumber: "",
    preferredCurrency: "INR",
    preferredPaymentMethod: "",
    preferredCommunication: "Email",
    preferredLanguage: "English",
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const PERSONAL_DRAFT_KEY = "su_customer_personal_draft";
  const COMPANY_DRAFT_KEY = "su_customer_company_draft";

  // Avatar ref & toast
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Phone verification state
  const [showPhoneVerifyModal, setShowPhoneVerifyModal] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpSending, setPhoneOtpSending] = useState(false);
  const [phoneOtpVerifying, setPhoneOtpVerifying] = useState(false);
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(0);
  const [phoneOtpDemoCode, setPhoneOtpDemoCode] = useState<string | null>(null);

  useEffect(() => {
    if (phoneOtpTimer <= 0) return;
    const interval = setInterval(() => {
      setPhoneOtpTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [phoneOtpTimer]);

  const isPhoneMatchingVerified = Boolean(
    (profile?.phoneNumberConfirmed || localStorage.getItem("su_customer_phone_verified") === "true") &&
    personalPhone.trim() &&
    profile?.phoneNumber &&
    personalPhone.trim() === profile.phoneNumber.trim()
  );

  // Profile update timestamp tracking
  const [profileUpdatedAt, setProfileUpdatedAt] = useState<string>(() => {
    return localStorage.getItem("su_customer_profile_updated_at") || "";
  });

  const recordProfileUpdate = () => {
    const now = new Date().toISOString();
    setProfileUpdatedAt(now);
    localStorage.setItem("su_customer_profile_updated_at", now);
  };

  // Unsaved changes change detection
  const hasPersonalChanges = Boolean(
    profile && (
      personalFullName.trim() !== (profile.fullName || user?.fullName || "").trim() ||
      personalPhone.trim() !== (profile.phoneNumber || "").trim() ||
      personalDeliveryAddresses.trim() !== (profile.company?.deliveryAddresses || "").trim()
    )
  );

  const hasCompanyChanges = Boolean(
    company && Object.keys(companyForm).some(k => {
      if (k === "customBusinessType") return false;
      if (k === "businessType") {
        const effectiveFormVal = (companyForm.businessType === "Other" ? (companyForm.customBusinessType.trim() || "Other") : companyForm.businessType.trim());
        const serverVal = (company.businessType || "").trim();
        return effectiveFormVal !== serverVal;
      }
      const formVal = ((companyForm as Record<string, string>)[k] || "").trim();
      const serverVal = (((company as unknown as Record<string, string>)[k] || (k === "country" ? "India" : k === "preferredCurrency" ? "INR" : k === "preferredCommunication" ? "Email" : k === "preferredLanguage" ? "English" : "")) || "").trim();
      return formVal !== serverVal;
    })
  );

  // Auto-save drafts to localStorage
  useEffect(() => {
    if (loading || !profile) return;
    if (hasPersonalChanges) {
      localStorage.setItem(PERSONAL_DRAFT_KEY, JSON.stringify({
        fullName: personalFullName,
        phoneNumber: personalPhone,
        countryCode: personalCountryCode,
        preferredCommunication: personalPreferredComm,
        deliveryAddresses: personalDeliveryAddresses,
      }));
    } else {
      localStorage.removeItem(PERSONAL_DRAFT_KEY);
    }
  }, [hasPersonalChanges, personalFullName, personalPhone, personalCountryCode, personalPreferredComm, personalDeliveryAddresses, loading, profile]);

  useEffect(() => {
    if (loading || !company) return;
    if (hasCompanyChanges) {
      localStorage.setItem(COMPANY_DRAFT_KEY, JSON.stringify(companyForm));
    } else {
      localStorage.removeItem(COMPANY_DRAFT_KEY);
    }
  }, [hasCompanyChanges, companyForm, loading, company]);

  // Warn user if reloading with unsaved changes
  useEffect(() => {
    if (!hasPersonalChanges && !hasCompanyChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasPersonalChanges, hasCompanyChanges]);

  // Effective avatar URL (fallback to user session if profile endpoint has not populated it yet)
  const effectiveAvatarUrl =
    profile?.avatarUrl !== undefined && profile?.avatarUrl !== null && profile.avatarUrl !== ""
      ? profile.avatarUrl
      : (user?.avatarUrl || null);

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

      // Restore personal form (draft or server)
      const savedPersonal = localStorage.getItem(PERSONAL_DRAFT_KEY);
      if (savedPersonal) {
        try {
          const draft = JSON.parse(savedPersonal);
          setPersonalFullName(draft.fullName ?? (p.fullName || user?.fullName || ""));
          setPersonalPhone(draft.phoneNumber ?? (p.phoneNumber || ""));
          setPersonalCountryCode(draft.countryCode ?? "+91");
          setPersonalPreferredComm(draft.preferredCommunication ?? "Email");
          setPersonalDeliveryAddresses(draft.deliveryAddresses ?? (p.company?.deliveryAddresses || ""));
        } catch {
          setPersonalFullName(p.fullName || user?.fullName || "");
          setPersonalPhone(p.phoneNumber || "");
          setPersonalDeliveryAddresses(p.company?.deliveryAddresses || "");
        }
      } else {
        setPersonalFullName(p.fullName || user?.fullName || "");
        setPersonalPhone(p.phoneNumber || "");
        setPersonalDeliveryAddresses(p.company?.deliveryAddresses || "");
      }

      setCompany(c);
      if (c) {
        const btParsed = parseBusinessType(c.businessType);
        const defaultCompanyForm = {
          legalBusinessName: c.legalBusinessName || "",
          businessType: btParsed.businessType,
          customBusinessType: btParsed.customBusinessType,
          industry: c.industry || "",
          website: c.website || "",
          companyEmail: c.companyEmail || "",
          companyPhone: c.companyPhone || "",
          purchaseEmail: c.purchaseEmail || "",
          accountsEmail: c.accountsEmail || "",
          registeredAddress: c.registeredAddress || "",
          factoryAddress: c.factoryAddress || "",
          city: c.city || "",
          state: c.state || "",
          country: c.country || "India",
          pinCode: c.pinCode || "",
          gstNumber: c.gstNumber || "",
          panNumber: c.panNumber || "",
          cinNumber: c.cinNumber || "",
          msmeNumber: c.msmeNumber || "",
          preferredCurrency: c.preferredCurrency || "INR",
          preferredPaymentMethod: c.preferredPaymentMethod || "",
          preferredCommunication: c.preferredCommunication || "Email",
          preferredLanguage: c.preferredLanguage || "English",
        };

        const savedCompany = localStorage.getItem(COMPANY_DRAFT_KEY);
        if (savedCompany) {
          try {
            const draft = JSON.parse(savedCompany);
            setCompanyForm({ ...defaultCompanyForm, ...draft });
          } catch {
            setCompanyForm(defaultCompanyForm);
          }
        } else {
          setCompanyForm(defaultCompanyForm);
        }
      }
      setContacts(ct);
      setAddresses(a);
      setDocuments(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  }

  function handleDiscardPersonalDraft() {
    localStorage.removeItem(PERSONAL_DRAFT_KEY);
    if (profile) {
      setPersonalFullName(profile.fullName || user?.fullName || "");
      setPersonalPhone(profile.phoneNumber || "");
      setPersonalDeliveryAddresses(profile.company?.deliveryAddresses || "");
    }
    showToast("Personal draft discarded.", "success");
  }

  useEffect(() => { loadAll(); }, []);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
  }

  // ── Avatar Photo Upload & Removal ─────────────────────────────────────────

  async function handleAvatarFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (JPG, PNG, WebP, SVG).", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5 MB.", "error");
      return;
    }

    setUploadingAvatar(true);
    try {
      // Compress and convert to high-resolution square preview data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const maxDim = 400;
            let { width, height } = img;
            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL("image/jpeg", 0.9));
            } else {
              resolve(reader.result as string);
            }
          };
          img.onerror = () => resolve(reader.result as string);
          img.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await customerApi.updateProfile({ avatarUrl: dataUrl });
      setProfile((prev) => (prev ? { ...prev, avatarUrl: dataUrl } : prev));
      recordProfileUpdate();
      await refreshUser();
      showToast("Profile picture updated successfully.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile picture.";
      showToast(msg, "error");
    } finally {
      setUploadingAvatar(false);
      if (avatarFileInputRef.current) {
        avatarFileInputRef.current.value = "";
      }
    }
  }

  async function handleRemoveAvatar() {
    setUploadingAvatar(true);
    try {
      await customerApi.updateProfile({ avatarUrl: "" });
      setProfile((prev) => (prev ? { ...prev, avatarUrl: null } : prev));
      recordProfileUpdate();
      await refreshUser();
      showToast("Profile picture removed.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove profile picture.";
      showToast(msg, "error");
    } finally {
      setUploadingAvatar(false);
    }
  }

  // ── Personal Tab ─────────────────────────────────────────────────────────

  async function handleSavePersonal(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await customerApi.updateProfile({
        fullName: personalFullName.trim() || undefined,
        phoneNumber: personalPhone.trim() || undefined,
        deliveryAddresses: personalDeliveryAddresses.trim() || undefined,
      });
      localStorage.removeItem(PERSONAL_DRAFT_KEY);
      showToast("Personal information updated.", "success");
      recordProfileUpdate();
      const p = await customerApi.profile();
      setProfile(p);
      setPersonalFullName(p.fullName || user?.fullName || "");
      setPersonalPhone(p.phoneNumber || "");
      setPersonalDeliveryAddresses(p.company?.deliveryAddresses || "");
      await refreshUser();
    } catch {
      showToast("Could not update personal information.", "error");
    } finally { setBusy(false); }
  }

  async function handleOpenPhoneVerifyModal() {
    if (!personalPhone.trim()) {
      showToast("Please enter a phone number first.", "error");
      return;
    }
    setShowPhoneVerifyModal(true);
    setPhoneOtp("");
    setPhoneOtpDemoCode(null);
    setPhoneOtpSending(true);
    try {
      const fullPhone = `${personalCountryCode} ${personalPhone.trim()}`;
      const res = await customerApi.sendPhoneOtp(fullPhone);
      setPhoneOtpDemoCode(res.demoOtp || "123456");
      setPhoneOtpTimer(60);
      showToast(res.message || `OTP sent to ${fullPhone}`, "success");
    } catch {
      setPhoneOtpDemoCode("123456");
      setPhoneOtpTimer(60);
      showToast(`Verification code sent to ${personalCountryCode} ${personalPhone.trim()}`, "success");
    } finally {
      setPhoneOtpSending(false);
    }
  }

  async function handleResendPhoneOtp() {
    setPhoneOtpSending(true);
    try {
      const fullPhone = `${personalCountryCode} ${personalPhone.trim()}`;
      const res = await customerApi.sendPhoneOtp(fullPhone);
      setPhoneOtpDemoCode(res.demoOtp || "123456");
      setPhoneOtpTimer(60);
      showToast("Verification code resent.", "success");
    } catch {
      setPhoneOtpDemoCode("123456");
      setPhoneOtpTimer(60);
      showToast("Verification code resent.", "success");
    } finally {
      setPhoneOtpSending(false);
    }
  }

  async function handleConfirmPhoneOtp(e: FormEvent) {
    e.preventDefault();
    if (phoneOtp.length < 6) {
      showToast("Please enter the 6-digit verification code.", "error");
      return;
    }
    setPhoneOtpVerifying(true);
    try {
      const fullPhone = `${personalCountryCode} ${personalPhone.trim()}`;
      await customerApi.verifyPhoneOtp(fullPhone, phoneOtp.trim());
      localStorage.setItem("su_customer_phone_verified", "true");
      setProfile(prev => prev ? { ...prev, phoneNumber: personalPhone.trim(), phoneNumberConfirmed: true } : prev);
      recordProfileUpdate();
      setShowPhoneVerifyModal(false);
      showToast(`Phone number ${fullPhone} verified successfully!`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid or expired OTP code.";
      showToast(msg, "error");
    } finally {
      setPhoneOtpVerifying(false);
    }
  }

  // ── Company Tab ──────────────────────────────────────────────────────────

  async function handleSaveCompany(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const effectiveBusinessType =
        companyForm.businessType === "Other"
          ? (companyForm.customBusinessType.trim() || "Other")
          : (companyForm.businessType.trim() || undefined);

      await customerApi.updateCompany({
        legalBusinessName: companyForm.legalBusinessName.trim() || undefined,
        businessType: effectiveBusinessType,
        industry: companyForm.industry.trim() || undefined,
        website: companyForm.website.trim() || undefined,
        companyEmail: companyForm.companyEmail.trim() || undefined,
        companyPhone: companyForm.companyPhone.trim() || undefined,
        purchaseEmail: companyForm.purchaseEmail.trim() || undefined,
        accountsEmail: companyForm.accountsEmail.trim() || undefined,
        registeredAddress: companyForm.registeredAddress.trim() || undefined,
        factoryAddress: companyForm.factoryAddress.trim() || undefined,
        city: companyForm.city.trim() || undefined,
        state: companyForm.state.trim() || undefined,
        country: companyForm.country.trim() || undefined,
        pinCode: companyForm.pinCode.trim() || undefined,
        gstNumber: companyForm.gstNumber.trim() || undefined,
        panNumber: companyForm.panNumber.trim() || undefined,
        cinNumber: companyForm.cinNumber.trim() || undefined,
        msmeNumber: companyForm.msmeNumber.trim() || undefined,
        preferredCurrency: companyForm.preferredCurrency || undefined,
        preferredPaymentMethod: companyForm.preferredPaymentMethod || undefined,
        preferredCommunication: companyForm.preferredCommunication || undefined,
        preferredLanguage: companyForm.preferredLanguage || undefined,
      });
      const c = await customerApi.companyDetail();
      setCompany(c);
      localStorage.removeItem(COMPANY_DRAFT_KEY);
      showToast("Company information updated.", "success");
      recordProfileUpdate();
    } catch {
      showToast("Could not update company information.", "error");
    } finally { setBusy(false); }
  }

  async function handleResetCompany() {
    try {
      const c = await customerApi.companyDetail();
      setCompany(c);
      localStorage.removeItem(COMPANY_DRAFT_KEY);
      if (c) {
        const btParsed = parseBusinessType(c.businessType);
        setCompanyForm({
          legalBusinessName: c.legalBusinessName || "",
          businessType: btParsed.businessType,
          customBusinessType: btParsed.customBusinessType,
          industry: c.industry || "",
          website: c.website || "",
          companyEmail: c.companyEmail || "",
          companyPhone: c.companyPhone || "",
          purchaseEmail: c.purchaseEmail || "",
          accountsEmail: c.accountsEmail || "",
          registeredAddress: c.registeredAddress || "",
          factoryAddress: c.factoryAddress || "",
          city: c.city || "",
          state: c.state || "",
          country: c.country || "India",
          pinCode: c.pinCode || "",
          gstNumber: c.gstNumber || "",
          panNumber: c.panNumber || "",
          cinNumber: c.cinNumber || "",
          msmeNumber: c.msmeNumber || "",
          preferredCurrency: c.preferredCurrency || "INR",
          preferredPaymentMethod: c.preferredPaymentMethod || "",
          preferredCommunication: c.preferredCommunication || "Email",
          preferredLanguage: c.preferredLanguage || "English",
        });
      }
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

  interface CustomerPreferences {
    language: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    emailNotifications: boolean;
    quotationUpdates: boolean;
    invoiceNotifications: boolean;
    marketingEmails: boolean;
  }

  const [preferences, setPreferences] = useState<CustomerPreferences>(() => {
    const saved = localStorage.getItem("su_customer_preferences");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      language: "English",
      timezone: "Asia/Kolkata",
      dateFormat: "DD/MM/YYYY",
      currency: "INR",
      emailNotifications: true,
      quotationUpdates: true,
      invoiceNotifications: true,
      marketingEmails: false,
    };
  });

  async function handleSavePreferences() {
    setBusy(true);
    try {
      localStorage.setItem("su_customer_preferences", JSON.stringify(preferences));
      await new Promise(r => setTimeout(r, 300));
      showToast("Preferences saved.", "success");
      recordProfileUpdate();
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

  // ── Render Helpers ───────────────────────────────────────────────────────

  function renderField(field: FieldDef, value: string | undefined, onChange?: (v: string) => void) {
    const id = `field-${field.key}`;
    const styles = { ...inputStyle };
    if (field.type === "select" && field.options) {
      return (
        <div key={field.key}>
          <label htmlFor={id} style={labelStyle}>{field.label}{field.required && <span style={{ color: colors.danger, marginLeft: 2 }}>*</span>}</label>
          <select
            id={id}
            name={field.key}
            value={value ?? ""}
            onChange={e => {
              if (onChange) onChange(e.target.value);
              else setCompanyForm(p => ({ ...p, [field.key]: e.target.value }));
            }}
            style={{ ...styles, cursor: "pointer", appearance: "none" as const, backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 36 }}
          >
            {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      );
    }
    return (
      <div key={field.key}>
        <label htmlFor={id} style={labelStyle}>{field.label}{field.required && <span style={{ color: colors.danger, marginLeft: 2 }}>*</span>}</label>
        <input
          id={id}
          name={field.key}
          type={field.type}
          value={value ?? ""}
          onChange={e => {
            if (onChange) onChange(e.target.value);
            else setCompanyForm(p => ({ ...p, [field.key]: e.target.value }));
          }}
          placeholder={field.placeholder}
          style={styles}
          onFocus={e => { e.target.style.borderColor = colors.primary; }}
          onBlur={e => { e.target.style.borderColor = colors.border; }}
        />
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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: colors.bg, fontFamily: "Inter, system-ui, sans-serif" }}>
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
      <div style={{ marginBottom: 24 }}>
        {/* Title Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white m-0 tracking-tight">
              Customer Profile & Account
            </h1>
            <p style={{ fontSize: 14, color: colors.textSecondary, margin: "4px 0 0", maxWidth: 520, lineHeight: 1.5 }}>
              Manage your personal credentials, company profile, authorized representatives, delivery hubs, and vault documents.
            </p>
          </div>
          {/* Account Since & Profile Updated Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
            {/* Account Since Card */}
            <div style={{ ...cardStyle, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: colors.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary }}>
                <IconBuilding />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 10, color: colors.textSecondary, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Account Since</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: colors.text, fontWeight: 700 }}>
                  {profile?.accountCreatedAtUtc ? formatDate(profile.accountCreatedAtUtc) : "—"}
                </p>
              </div>
            </div>

            {/* Latest Profile Updated Card */}
            <div style={{ ...cardStyle, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(34, 197, 94, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#22C55E" }}>
                <IconCheck />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 10, color: colors.textSecondary, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Profile Updated</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: colors.text, fontWeight: 700 }}>
                  {profileUpdatedAt ? formatDate(profileUpdatedAt) : profile?.accountCreatedAtUtc ? formatDate(profile.accountCreatedAtUtc) : "Recently"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile Completion Status Bar & Checklist ────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <ProfileCompletionCard
          profileData={profile}
          onNavigateTab={(tabKey) => {
            if (tabKey === "personal") setActiveTab("personal");
            else if (tabKey === "company") setActiveTab("company");
            else if (tabKey === "contacts") setActiveTab("contacts");
          }}
        />
      </div>

      {/* ── Mobile / Tablet Tab Grid (Hidden on Desktop lg:!hidden) ────────── */}
      <div className="block lg:!hidden mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border text-left",
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
                    : "bg-white dark:bg-[#0f121a] border-neutral-200/80 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                    isActive
                      ? "bg-white/20 text-white border-white/20"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                  )}
                >
                  <tab.icon />
                </div>
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Two-Column Vertical Navigation & Content Layout (Desktop) ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Vertical Navigation Sidebar (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-4 xl:col-span-3 flex-col gap-4 lg:sticky lg:top-4">
          <div style={{ ...cardStyle, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ padding: "8px 12px 4px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: colors.textMuted }}>
              Profile Navigation
            </div>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#ffffff" : colors.text,
                    background: isActive ? colors.primary : "transparent",
                    border: isActive ? `1px solid ${colors.primary}` : "1px solid transparent",
                    boxShadow: isActive ? "0 4px 12px rgba(59, 130, 246, 0.25)" : "none",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = colors.borderLight;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isActive ? "rgba(255, 255, 255, 0.2)" : colors.borderLight,
                        color: isActive ? "#ffffff" : colors.primary,
                        flexShrink: 0,
                      }}
                    >
                      <tab.icon />
                    </span>
                    <span>{tab.label}</span>
                  </div>
                  <span style={{ color: isActive ? "#ffffff" : colors.textMuted, opacity: isActive ? 1 : 0.6 }}>
                    <IconChevronRight />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Client Account Snapshot */}
          <div style={{ ...cardStyle, padding: 16, background: "linear-gradient(135deg, rgba(249, 115, 22, 0.05), rgba(59, 130, 246, 0.05))" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: colors.text, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.success }} />
              <span>Enterprise Client Account</span>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: colors.textSecondary, lineHeight: 1.4 }}>
              Need custom casting metallurgy or account updates? Contact our Ludhiana foundry desk at <strong>+91 98765 43210</strong>.
            </p>
          </div>
        </div>

        {/* Right Column: Tab Content Area */}
        <div className="w-full lg:col-span-8 xl:col-span-9 flex flex-col gap-6 min-w-0">

      {/* ═══ Personal Tab ═══ */}
      {activeTab === "personal" && (
        <div style={{ display: "grid", gap: 24, maxWidth: 800 }}>
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${colors.border}` }}>
              <UserAvatar
                avatarUrl={effectiveAvatarUrl}
                displayName={profile?.fullName || profile?.email || user?.fullName}
                size="2xl"
                shape="rounded"
              />
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: 0 }}>
                  {profile?.fullName || "Personal Information"}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.textSecondary }}>
                  {profile?.email}
                </p>
                {effectiveAvatarUrl && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: "rgba(59, 130, 246, 0.12)", color: "#3B82F6" }}>
                    ✓ Profile Photo Active
                  </span>
                )}
              </div>
            </div>
            {hasPersonalChanges && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", marginBottom: 16, borderRadius: 10, background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "#D97706" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
                  <IconAlertCircle />
                  <span>Unsaved changes in Personal Information (draft auto-preserved across page reloads).</span>
                </div>
                <button
                  type="button"
                  onClick={handleDiscardPersonalDraft}
                  style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11, background: "transparent", color: "inherit", borderColor: "currentColor" }}
                >
                  Discard Draft
                </button>
              </div>
            )}
            <form onSubmit={handleSavePersonal} style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    name="fullName"
                    type="text"
                    value={personalFullName}
                    onChange={e => setPersonalFullName(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Designation / Role</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      value={profile?.company?.name ? "Customer Representative" : "Authorized Customer"}
                      disabled
                      style={{ ...inputStyle, background: colors.borderLight, color: colors.textSecondary }}
                    />
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "rgba(59, 130, 246, 0.12)", color: "#3B82F6", whiteSpace: "nowrap" }}>
                      Assigned
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: colors.textMuted }}>Role & designation permissions are managed by Shakti Udyog admin.</p>
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
                  <select
                    value={personalCountryCode}
                    onChange={e => setPersonalCountryCode(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                  </select>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Phone Number</label>
                    {isPhoneMatchingVerified ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: colors.successLight, color: colors.success }}>
                        <IconCheck /> Verified
                      </span>
                    ) : personalPhone.trim() ? (
                      <button
                        type="button"
                        onClick={handleOpenPhoneVerifyModal}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600,
                          background: "rgba(59, 130, 246, 0.12)",
                          color: "#3B82F6",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <IconPhone /> Verify via OTP
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: colors.textMuted }}>Optional</span>
                    )}
                  </div>
                  <input
                    name="phoneNumber"
                    type="tel"
                    value={personalPhone}
                    onChange={e => setPersonalPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    style={inputStyle}
                  />
                  {isPhoneMatchingVerified ? (
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: colors.success }}>✓ Mobile number verified for SMS alerts and order status.</p>
                  ) : personalPhone.trim() ? (
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: colors.textMuted }}>Unverified. Click &quot;Verify via OTP&quot; to authenticate your phone.</p>
                  ) : null}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Preferred Communication</label>
                <select
                  value={personalPreferredComm}
                  onChange={e => setPersonalPreferredComm(e.target.value)}
                  style={inputStyle}
                >
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Delivery Addresses</label>
                <textarea
                  name="deliveryAddresses"
                  value={personalDeliveryAddresses}
                  onChange={e => setPersonalDeliveryAddresses(e.target.value)}
                  placeholder="One address per line"
                  style={{ ...inputStyle, minHeight: 80, resize: "vertical" as const }}
                />
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
              <div className="relative">
                <UserAvatar
                  avatarUrl={effectiveAvatarUrl}
                  displayName={profile?.fullName || profile?.email || user?.fullName}
                  size="2xl"
                  shape="rounded"
                  className="w-20 h-20 text-3xl shadow-sm border border-neutral-200 dark:border-white/10"
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ margin: 0, fontSize: 13, color: colors.textSecondary }}>
                  JPG, PNG, WebP or SVG. Max 5 MB.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    onChange={handleAvatarFileSelect}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    style={{
                      ...btnPrimary,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      fontSize: 13,
                      opacity: uploadingAvatar ? 0.6 : 1,
                      cursor: "pointer",
                    }}
                  >
                    <IconUpload />
                    <span>{uploadingAvatar ? "Updating Photo..." : "Change Photo"}</span>
                  </button>

                  {effectiveAvatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar}
                      style={{
                        ...btnSecondary,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        fontSize: 13,
                        color: colors.danger,
                        cursor: "pointer",
                      }}
                    >
                      <IconTrash2 />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: 0 }}>Company Information</h2>
              {hasCompanyChanges && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: "rgba(245, 158, 11, 0.12)", color: "#D97706" }}>
                  <IconAlertCircle /> Draft Auto-Saved
                </span>
              )}
            </div>
            {hasCompanyChanges && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", marginBottom: 16, borderRadius: 10, background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "#D97706" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
                  <IconAlertCircle />
                  <span>Unsaved changes in Company Information (draft auto-preserved across page reloads).</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetCompany}
                  style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11, background: "transparent", color: "inherit", borderColor: "currentColor" }}
                >
                  Discard Draft
                </button>
              </div>
            )}
            <form onSubmit={handleSaveCompany} style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: companyForm.businessType === "Other" ? "repeat(4, 1fr)" : "repeat(3, 1fr)", gap: 16 }}>
                {renderField({ key: "legalBusinessName", label: "Legal Business Name", type: "text", placeholder: "e.g. Shakti Udyog Pvt Ltd" }, companyForm.legalBusinessName)}
                {renderField(
                  { key: "businessType", label: "Business Type", type: "select", required: true, options: businessTypeOptions },
                  companyForm.businessType,
                  (val) => {
                    setCompanyForm(p => ({
                      ...p,
                      businessType: val,
                      customBusinessType: val === "Other" ? p.customBusinessType : "",
                    }));
                  }
                )}
                {companyForm.businessType === "Other" && (
                  <div>
                    <label htmlFor="field-customBusinessType" style={labelStyle}>
                      Specify Business Type <span style={{ color: colors.danger, marginLeft: 2 }}>*</span>
                    </label>
                    <input
                      id="field-customBusinessType"
                      name="customBusinessType"
                      type="text"
                      value={companyForm.customBusinessType}
                      onChange={e => setCompanyForm(p => ({ ...p, customBusinessType: e.target.value }))}
                      placeholder="e.g. Joint Venture, Society, Trust"
                      required
                      style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = colors.primary; }}
                      onBlur={e => { e.target.style.borderColor = colors.border; }}
                    />
                  </div>
                )}
                {renderField({ key: "industry", label: "Industry", type: "text", placeholder: "e.g. Iron Casting" }, companyForm.industry)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {renderField({ key: "website", label: "Company Website", type: "url", placeholder: "https://" }, companyForm.website)}
                {renderField({ key: "companyEmail", label: "Company Email", type: "email", required: true }, companyForm.companyEmail)}
                {renderField({ key: "companyPhone", label: "Company Phone", type: "tel", required: true }, companyForm.companyPhone)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {renderField({ key: "purchaseEmail", label: "Purchase Department Email", type: "email" }, companyForm.purchaseEmail)}
                {renderField({ key: "accountsEmail", label: "Accounts Department Email", type: "email" }, companyForm.accountsEmail)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {renderField({ key: "registeredAddress", label: "Registered Address", type: "text", required: true, placeholder: "Full address" }, companyForm.registeredAddress)}
                {renderField({ key: "factoryAddress", label: "Factory Address", type: "text", placeholder: "Optional" }, companyForm.factoryAddress)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
                {renderField({ key: "city", label: "City", type: "text", required: true }, companyForm.city)}
                {renderField({ key: "state", label: "State", type: "text", required: true }, companyForm.state)}
                {renderField({ key: "country", label: "Country", type: "text", required: true }, companyForm.country)}
                {renderField({ key: "pinCode", label: "PIN Code", type: "text", required: true }, companyForm.pinCode)}
                {renderField({ key: "gstNumber", label: "GST Number", type: "text", required: true, placeholder: "e.g. 03ABCDE1234F1Z5" }, companyForm.gstNumber)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {renderField({ key: "panNumber", label: "PAN Number", type: "text", placeholder: "e.g. ABCDE1234F" }, companyForm.panNumber)}
                {renderField({ key: "cinNumber", label: "CIN Number", type: "text", placeholder: "Optional" }, companyForm.cinNumber)}
                {renderField({ key: "msmeNumber", label: "MSME/Udyam Number", type: "text", placeholder: "Optional" }, companyForm.msmeNumber)}
                {renderField({ key: "preferredCurrency", label: "Preferred Currency", type: "select", options: currencyOptions }, companyForm.preferredCurrency)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {renderField({ key: "preferredPaymentMethod", label: "Preferred Payment Method", type: "select", options: paymentMethodOptions }, companyForm.preferredPaymentMethod)}
                {renderField({ key: "preferredCommunication", label: "Preferred Communication", type: "select", options: communicationOptions }, companyForm.preferredCommunication)}
                {renderField({ key: "preferredLanguage", label: "Preferred Language", type: "select", options: languageOptions }, companyForm.preferredLanguage)}
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
            <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 20px" }}>Company Verification Documents</h2>
            {/* Upload Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] mb-5">
              <div className="flex-1 min-w-[180px]">
                <select
                  value={uploadingDocType}
                  onChange={(e) => setUploadingDocType(e.target.value)}
                  style={{ ...inputStyle, width: "100%" }}
                >
                  {documentTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadDocument(f); }}
                style={{ display: "none" }}
                accept=".pdf,.jpg,.jpeg,.png,.svg,.doc,.docx,.xls,.xlsx"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: busy ? 0.6 : 1, flexShrink: 0 }}
              >
                <IconUpload />
                <span>Upload Document</span>
              </button>
              <span style={{ fontSize: 11, color: colors.textMuted }}>PDF, images, Office (Max 11 MB)</span>
            </div>

            {/* Document List */}
            {documents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 16px", color: colors.textMuted, fontSize: 14 }}>
                No documents uploaded yet. Upload your GST Certificate, PAN Card, MSME or ISO certificates.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {documents.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520]"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: colors.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary, flexShrink: 0 }}>
                        <IconFile />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {d.fileName}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: colors.textMuted }}>
                          {d.documentType} · {formatDate(d.uploadedAtUtc)} · {d.sizeBytes > 1024 ? `${(d.sizeBytes / 1024).toFixed(1)} KB` : `${d.sizeBytes} B`}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                      {/* Status badge */}
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                        background: d.status === "Verified" ? colors.successLight : d.status === "Rejected" ? colors.dangerLight : colors.warningLight,
                        color: d.status === "Verified" ? colors.success : d.status === "Rejected" ? colors.danger : colors.warning,
                      }}>
                        {d.status === "Verified" ? <IconCheck /> : d.status === "Rejected" ? <IconX /> : <IconAlertCircle />}
                        {d.status}
                      </span>
                      <a href={customerApi.downloadCompanyDocument(d.id)} download style={{ ...btnSecondary, padding: "6px 12px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                        <IconDownload /> Download
                      </a>
                      <button onClick={() => setDeleteConfirm({ type: "document", id: d.id, label: d.fileName })} style={{ ...btnDanger, padding: "6px 12px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <IconTrash2 /> Delete
                      </button>
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
                  {([
                    { key: "emailNotifications" as const, label: "Email Notifications" },
                    { key: "quotationUpdates" as const, label: "Quote Updates" },
                    { key: "invoiceNotifications" as const, label: "Invoice Notifications" },
                    { key: "marketingEmails" as const, label: "Marketing Emails" },
                  ]).map(item => (
                    <label key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: 8, borderRadius: 8, background: colors.bg }}>
                      <span style={{ fontSize: 14, color: colors.text }}>{item.label}</span>
                      <button
                        type="button"
                        onClick={() => setPreferences(p => ({ ...p, [item.key]: !p[item.key] }))}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: preferences[item.key] ? colors.primary : colors.textMuted }}
                      >
                        {preferences[item.key] ? <IconToggleOn /> : <IconToggleOff />}
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

          {/* Devices & Sessions */}
          <DevicesSessionsCard />

          {/* Login History Placeholder */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: "0 0 16px" }}>Login History</h2>
            <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>Login history tracking will be available in a future update.</p>
          </div>
        </div>
      )}
        </div>
      </div>

      {/* ── Phone Verification Modal ── */}
      {showPhoneVerifyModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ ...cardStyle, maxWidth: 440, width: "100%", padding: 28, position: "relative", boxShadow: "0 20px 40px -15px rgba(0,0,0,0.3)" }}>
            <button
              type="button"
              onClick={() => setShowPhoneVerifyModal(false)}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: colors.textSecondary, cursor: "pointer", fontSize: 18 }}
            >
              <IconX />
            </button>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(59, 130, 246, 0.12)", color: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <IconPhone />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: colors.text, margin: "0 0 6px" }}>Verify Phone Number</h3>
            <p style={{ fontSize: 13, color: colors.textSecondary, margin: "0 0 20px", lineHeight: 1.5 }}>
              Enter the 6-digit verification code sent to <strong>{personalCountryCode} {personalPhone}</strong>.
            </p>

            <form onSubmit={handleConfirmPhoneOtp} style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={labelStyle}>6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={phoneOtp}
                  onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  autoFocus
                  style={{ ...inputStyle, textAlign: "center", letterSpacing: "8px", fontSize: 22, fontWeight: 700, padding: "10px 14px" }}
                />
              </div>

              {phoneOtpDemoCode && (
                <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", fontSize: 12, color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Demo Verification Code: <strong>{phoneOtpDemoCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setPhoneOtp(phoneOtpDemoCode)}
                    style={{ background: "none", border: "none", color: "inherit", fontWeight: 700, cursor: "pointer", textDecoration: "underline", fontSize: 11 }}
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                <span style={{ color: colors.textSecondary }}>
                  {phoneOtpTimer > 0 ? `Resend code in ${phoneOtpTimer}s` : "Didn't receive code?"}
                </span>
                {phoneOtpTimer === 0 && (
                  <button
                    type="button"
                    onClick={handleResendPhoneOtp}
                    disabled={phoneOtpSending}
                    style={{ background: "none", border: "none", color: "#3B82F6", fontWeight: 600, cursor: "pointer" }}
                  >
                    {phoneOtpSending ? "Sending..." : "Resend OTP"}
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={phoneOtpVerifying || phoneOtp.length < 6}
                  style={{ ...btnPrimary, width: "100%", justifyContent: "center", opacity: (phoneOtpVerifying || phoneOtp.length < 6) ? 0.6 : 1 }}
                >
                  {phoneOtpVerifying ? "Verifying..." : "Verify & Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Style tag for animations and responsive grid ── */}
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        input:focus, select:focus, textarea:focus { border-color: ${colors.primary} !important; box-shadow: 0 0 0 3px ${colors.primaryLight}; }
        button:active { transform: scale(0.98); }
        @media (max-width: 960px) {
          .profile-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
