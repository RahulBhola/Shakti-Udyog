import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { apiGet, apiPatch, apiPost } from "../../api/client";
import { adminApi } from "../../api/adminApi";
import {
  User,
  Mail,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  Save,
  Layers,
  BadgeCheck,
  Bell,
  RefreshCw,
  Clock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  XCircle,
  X,
} from "lucide-react";
import { DevicesSessionsCard } from "../components/DevicesSessionsCard";
import { ProfileCompletionCard } from "../components/ProfileCompletion";
import { formatDate } from "../shared";
import { cn } from "../../lib/utils";
import "./erpListView.css";

interface ProfileData {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  createdAtUtc: string;
  lastLoginAtUtc: string | null;
  companyName: string | null;
  roles: string[];
}

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [originalSettings, setOriginalSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form states - Personal
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("Operations & Plant Administration");
  const [employeeId, setEmployeeId] = useState("EMP-SU-001");
  const [originalPersonal, setOriginalPersonal] = useState({
    fullName: "",
    phoneNumber: "",
    department: "Operations & Plant Administration",
    employeeId: "EMP-SU-001",
  });

  // Form states - Enterprise Company Profile
  const [companyName, setCompanyName] = useState("Shakti Udyog");
  const [companyWebsite, setCompanyWebsite] = useState("https://shaktiudyog.com");
  const [companyEmail, setCompanyEmail] = useState("info@shaktiudyog.com");
  const [companyPhone, setCompanyPhone] = useState("+91 98765 43210");
  const [companyCurrency, setCompanyCurrency] = useState("INR");
  const [companyGstin, setCompanyGstin] = useState("03AAAAA0000A1Z5");
  const [companyPan, setCompanyPan] = useState("AAAAA0000A");
  const [companyCin, setCompanyCin] = useState("U27100PB1990PTC010000");
  const [companyMsme, setCompanyMsme] = useState("UDYAM-PB-12-0000000");
  const [companyRegAddress, setCompanyRegAddress] = useState("Plot No. 42, Industrial Area, Phase II");
  const [companyFactoryAddress, setCompanyFactoryAddress] = useState("Unit 1 & 2, Foundry Cluster, Focal Point Phase V");
  const [companyCity, setCompanyCity] = useState("Ludhiana");
  const [companyState, setCompanyState] = useState("Punjab");
  const [companyPin, setCompanyPin] = useState("141010");

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Notification Preferences states
  const [notifyRfq, setNotifyRfq] = useState(true);
  const [notifyOrders, setNotifyOrders] = useState(true);
  const [notifyPayments, setNotifyPayments] = useState(true);
  const [notifyInvoices, setNotifyInvoices] = useState(true);

  // Navigation & Collapsible Groups state
  const [activeTab, setActiveTab] = useState<"company" | "personal" | "security" | "permissions" | "notifications">("personal");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [copiedEmail, setCopiedEmail] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, settingsRes] = await Promise.allSettled([
        apiGet<ProfileData>("/api/v1/admin/profile"),
        adminApi.settings(),
      ]);

      let initialEmpCode = "EMP-SU-001";
      let initialDept = "Operations & Plant Administration";

      if (settingsRes.status === "fulfilled" && settingsRes.value) {
        const s = settingsRes.value;
        setSettings(s);
        setOriginalSettings(s);

        if (s["admin.employeeCode"] || s["admin.employeeId"]) {
          initialEmpCode = s["admin.employeeCode"] || s["admin.employeeId"];
        }
        if (s["admin.department"]) {
          initialDept = s["admin.department"];
        }
        setEmployeeId(initialEmpCode);
        setDepartment(initialDept);

        if (s["company.name"]) setCompanyName(s["company.name"]);
        if (s["company.website"]) setCompanyWebsite(s["company.website"]);
        if (s["company.email"]) setCompanyEmail(s["company.email"]);
        if (s["company.phone"]) setCompanyPhone(s["company.phone"]);
        if (s["company.currency"]) setCompanyCurrency(s["company.currency"]);
        if (s["company.gst"] || s["company.gstin"]) setCompanyGstin(s["company.gst"] || s["company.gstin"] || "");
        if (s["company.pan"]) setCompanyPan(s["company.pan"]);
        if (s["company.cin"]) setCompanyCin(s["company.cin"]);
        if (s["company.msme"]) setCompanyMsme(s["company.msme"]);
        if (s["company.registeredAddress"]) setCompanyRegAddress(s["company.registeredAddress"]);
        if (s["company.factoryAddress"] || s["company.plantAddress"]) setCompanyFactoryAddress(s["company.factoryAddress"] || s["company.plantAddress"] || "");
        if (s["company.city"]) setCompanyCity(s["company.city"]);
        if (s["company.state"]) setCompanyState(s["company.state"]);
        if (s["company.pin"]) setCompanyPin(s["company.pin"]);

        if (s["notify.onNewEnquiry"] || s["notify.onEnquiry"]) setNotifyRfq((s["notify.onNewEnquiry"] || s["notify.onEnquiry"]) === "true");
        if (s["notify.onOrderStatus"] || s["notify.onOrderPlaced"]) setNotifyOrders((s["notify.onOrderStatus"] || s["notify.onOrderPlaced"]) === "true");
        if (s["notify.onPayment"]) setNotifyPayments(s["notify.onPayment"] === "true");
        if (s["notify.onInvoice"] || s["notify.onInvoiceGenerated"]) setNotifyInvoices((s["notify.onInvoice"] || s["notify.onInvoiceGenerated"]) === "true");
      }

      if (profileRes.status === "fulfilled") {
        const p = profileRes.value;
        setProfile(p);
        setFullName(p.fullName || "");
        setPhoneNumber(p.phoneNumber || "");
        setOriginalPersonal({
          fullName: p.fullName || "",
          phoneNumber: p.phoneNumber || "",
          department: initialDept,
          employeeId: initialEmpCode,
        });
      } else if (user) {
        setProfile({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: "",
          isActive: true,
          createdAtUtc: new Date().toISOString(),
          lastLoginAtUtc: new Date().toISOString(),
          companyName: "Shakti Udyog",
          roles: user.roles,
        });
        setFullName(user.fullName || "");
        setOriginalPersonal({
          fullName: user.fullName || "",
          phoneNumber: "",
          department: initialDept,
          employeeId: initialEmpCode,
        });
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Combined profile object for ProfileCompletion calculation
  const compositeProfile = useMemo(() => {
    return {
      fullName: fullName || profile?.fullName || user?.fullName || "",
      email: profile?.email || user?.email || "",
      phoneNumber: phoneNumber || profile?.phoneNumber || "",
      designation: department,
      companyName: companyName,
      company: {
        name: companyName,
        deliveryAddresses: companyFactoryAddress || companyRegAddress,
      },
      roles: profile?.roles || user?.roles || ["Admin"],
    };
  }, [fullName, profile, user, phoneNumber, department, companyName, companyFactoryAddress, companyRegAddress]);

  // Dirty detection - full field checking
  const isPersonalDirty = useMemo(() => {
    return (
      fullName !== originalPersonal.fullName ||
      phoneNumber !== originalPersonal.phoneNumber ||
      department !== originalPersonal.department ||
      employeeId !== originalPersonal.employeeId
    );
  }, [fullName, phoneNumber, department, employeeId, originalPersonal]);

  const isCompanyDirty = useMemo(() => {
    return (
      companyName !== (originalSettings["company.name"] ?? "Shakti Udyog") ||
      companyWebsite !== (originalSettings["company.website"] ?? "https://shaktiudyog.com") ||
      companyEmail !== (originalSettings["company.email"] ?? "info@shaktiudyog.com") ||
      companyPhone !== (originalSettings["company.phone"] ?? "+91 98765 43210") ||
      companyCurrency !== (originalSettings["company.currency"] ?? "INR") ||
      companyGstin !== (originalSettings["company.gst"] ?? originalSettings["company.gstin"] ?? "03AAAAA0000A1Z5") ||
      companyPan !== (originalSettings["company.pan"] ?? "AAAAA0000A") ||
      companyCin !== (originalSettings["company.cin"] ?? "U27100PB1990PTC010000") ||
      companyMsme !== (originalSettings["company.msme"] ?? "UDYAM-PB-12-0000000") ||
      companyRegAddress !== (originalSettings["company.registeredAddress"] ?? "Plot No. 42, Industrial Area, Phase II") ||
      companyFactoryAddress !== (originalSettings["company.factoryAddress"] ?? originalSettings["company.plantAddress"] ?? "Unit 1 & 2, Foundry Cluster, Focal Point Phase V") ||
      companyCity !== (originalSettings["company.city"] ?? "Ludhiana") ||
      companyState !== (originalSettings["company.state"] ?? "Punjab") ||
      companyPin !== (originalSettings["company.pin"] ?? "141010")
    );
  }, [
    companyName, companyWebsite, companyEmail, companyPhone, companyCurrency,
    companyGstin, companyPan, companyCin, companyMsme, companyRegAddress,
    companyFactoryAddress, companyCity, companyState, companyPin, originalSettings
  ]);

  const isNotificationsDirty = useMemo(() => {
    return (
      String(notifyRfq) !== (originalSettings["notify.onNewEnquiry"] ?? originalSettings["notify.onEnquiry"] ?? "true") ||
      String(notifyOrders) !== (originalSettings["notify.onOrderStatus"] ?? originalSettings["notify.onOrderPlaced"] ?? "true") ||
      String(notifyPayments) !== (originalSettings["notify.onPayment"] ?? "true") ||
      String(notifyInvoices) !== (originalSettings["notify.onInvoice"] ?? originalSettings["notify.onInvoiceGenerated"] ?? "true")
    );
  }, [notifyRfq, notifyOrders, notifyPayments, notifyInvoices, originalSettings]);

  const isDirty = isPersonalDirty || isCompanyDirty || isNotificationsDirty;

  async function handleSaveAll() {
    setSaving(true);
    try {
      // 1. Save personal profile if name or phone changed
      if (fullName !== originalPersonal.fullName || phoneNumber !== originalPersonal.phoneNumber) {
        await apiPatch("/api/v1/admin/profile", {
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
        });
        if (profile) setProfile({ ...profile, fullName, phoneNumber });
      }

      // 2. Save settings (staff code, department, enterprise details, notifications)
      const payload: Record<string, string> = {
        ...settings,
        "admin.employeeCode": employeeId.trim(),
        "admin.employeeId": employeeId.trim(),
        "admin.department": department.trim(),
        "company.name": companyName.trim(),
        "company.website": companyWebsite.trim(),
        "company.email": companyEmail.trim(),
        "company.phone": companyPhone.trim(),
        "company.currency": companyCurrency.trim(),
        "company.gst": companyGstin.trim(),
        "company.gstin": companyGstin.trim(),
        "company.pan": companyPan.trim(),
        "company.cin": companyCin.trim(),
        "company.msme": companyMsme.trim(),
        "company.registeredAddress": companyRegAddress.trim(),
        "company.factoryAddress": companyFactoryAddress.trim(),
        "company.plantAddress": companyFactoryAddress.trim(),
        "company.city": companyCity.trim(),
        "company.state": companyState.trim(),
        "company.pin": companyPin.trim(),
        "notify.onNewEnquiry": String(notifyRfq),
        "notify.onEnquiry": String(notifyRfq),
        "notify.onOrderStatus": String(notifyOrders),
        "notify.onOrderPlaced": String(notifyOrders),
        "notify.onPayment": String(notifyPayments),
        "notify.onInvoice": String(notifyInvoices),
        "notify.onInvoiceGenerated": String(notifyInvoices),
      };
      await adminApi.updateSettings(payload);
      setSettings(payload);
      setOriginalSettings(payload);
      setOriginalPersonal({
        fullName,
        phoneNumber,
        department,
        employeeId,
      });

      showToast("Profile & Staff Details updated successfully.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save profile changes.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setFullName(originalPersonal.fullName);
    setPhoneNumber(originalPersonal.phoneNumber);
    setDepartment(originalPersonal.department);
    setEmployeeId(originalPersonal.employeeId);

    const s = originalSettings;
    setCompanyName(s["company.name"] ?? "Shakti Udyog");
    setCompanyWebsite(s["company.website"] ?? "https://shaktiudyog.com");
    setCompanyEmail(s["company.email"] ?? "info@shaktiudyog.com");
    setCompanyPhone(s["company.phone"] ?? "+91 98765 43210");
    setCompanyCurrency(s["company.currency"] ?? "INR");
    setCompanyGstin(s["company.gst"] ?? s["company.gstin"] ?? "03AAAAA0000A1Z5");
    setCompanyPan(s["company.pan"] ?? "AAAAA0000A");
    setCompanyCin(s["company.cin"] ?? "U27100PB1990PTC010000");
    setCompanyMsme(s["company.msme"] ?? "UDYAM-PB-12-0000000");
    setCompanyRegAddress(s["company.registeredAddress"] ?? "Plot No. 42, Industrial Area, Phase II");
    setCompanyFactoryAddress(s["company.factoryAddress"] ?? s["company.plantAddress"] ?? "Unit 1 & 2, Foundry Cluster, Focal Point Phase V");
    setCompanyCity(s["company.city"] ?? "Ludhiana");
    setCompanyState(s["company.state"] ?? "Punjab");
    setCompanyPin(s["company.pin"] ?? "141010");

    setNotifyRfq((s["notify.onNewEnquiry"] || s["notify.onEnquiry"] || "true") === "true");
    setNotifyOrders((s["notify.onOrderStatus"] || s["notify.onOrderPlaced"] || "true") === "true");
    setNotifyPayments((s["notify.onPayment"] || "true") === "true");
    setNotifyInvoices((s["notify.onInvoice"] || s["notify.onInvoiceGenerated"] || "true") === "true");

    showToast("Changes discarded", "success");
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    setUpdatingPassword(true);
    try {
      await apiPost("/api/v1/admin/profile/change-password", {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess("Password updated successfully. Other active sessions have been signed out.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated successfully.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password.";
      setPasswordError(msg);
    } finally {
      setUpdatingPassword(false);
    }
  }

  const roleLabel =
    user?.roles.includes("Admin") ? "Master Administrator"
    : user?.roles.includes("Engineer") ? "Lead Staff Engineer"
    : "Staff Member";

  const initials = (profile?.fullName || user?.fullName || user?.email || "Admin")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  const copyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  // Tab definitions with icons, badges, descriptions
  const TABS = [
    {
      id: "personal",
      title: "Personal Staff Details",
      shortTitle: "Personal Details",
      description: "Manage your staff display name, designation, direct contact phone, and assigned operational units.",
      icon: User,
      badgeBg: "bg-amber-500/10",
      badgeText: "text-amber-600 dark:text-amber-400",
      badgeBorder: "border-amber-500/20",
      groupCount: 1,
    },
    {
      id: "company",
      title: "Company Identity & Tax Profile",
      shortTitle: "Company Profile",
      description: "Official business identity, registration credentials, and plant locations used across invoices, quotations, and reports.",
      icon: Building2,
      badgeBg: "bg-blue-500/10",
      badgeText: "text-blue-600 dark:text-blue-400",
      badgeBorder: "border-blue-500/20",
      groupCount: 3,
    },
    {
      id: "security",
      title: "Account Security & Active Sessions",
      shortTitle: "Password & Security",
      description: "Manage credentials, password complexity, and active device logins.",
      icon: KeyRound,
      badgeBg: "bg-purple-500/10",
      badgeText: "text-purple-600 dark:text-purple-400",
      badgeBorder: "border-purple-500/20",
      groupCount: 2,
    },
    {
      id: "permissions",
      title: "Assigned Capabilities & Authorizations",
      shortTitle: "System Permissions",
      description: "Overview of system authorizations granted to your Tier-1 Root Administrator profile.",
      icon: Layers,
      badgeBg: "bg-emerald-500/10",
      badgeText: "text-emerald-600 dark:text-emerald-400",
      badgeBorder: "border-emerald-500/20",
      groupCount: 1,
    },
    {
      id: "notifications",
      title: "Personal Alert & Relay Preferences",
      shortTitle: "Alert Preferences",
      description: "Configure direct real-time notification alerts for new enquiries, orders, payments, and invoices.",
      icon: Bell,
      badgeBg: "bg-rose-500/10",
      badgeText: "text-rose-600 dark:text-rose-400",
      badgeBorder: "border-rose-500/20",
      groupCount: 1,
    },
  ];

  const activeTabMeta = TABS.find((t) => t.id === activeTab) || TABS[0];

  // Master hide/show all in active tab
  const getTabGroupIds = (tabId: string): string[] => {
    switch (tabId) {
      case "company":
        return ["company-legal", "company-tax", "company-address"];
      case "personal":
        return ["personal-info"];
      case "security":
        return ["security-password", "security-sessions"];
      case "permissions":
        return ["permissions-matrix"];
      case "notifications":
        return ["notifications-relays"];
      default:
        return [];
    }
  };

  const areAllActiveCollapsed = useMemo(() => {
    const ids = getTabGroupIds(activeTab);
    if (!ids.length) return false;
    return ids.every((id) => !!collapsedGroups[id]);
  }, [activeTab, collapsedGroups]);

  const toggleAllActiveGroups = () => {
    const nextVal = !areAllActiveCollapsed;
    const ids = getTabGroupIds(activeTab);
    const updates = { ...collapsedGroups };
    ids.forEach((id) => {
      updates[id] = nextVal;
    });
    setCollapsedGroups(updates);
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-200">
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
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
              Administrator Profile & Organization
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Tier-1 System Admin
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 m-0">
            Manage your personal identity, company legal profile, statutory tax numbers, plant locations, and security settings.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
          {isDirty && (
            <button
              type="button"
              onClick={handleDiscard}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-2xs cursor-pointer"
            >
              <span>Discard</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 transition-all shadow-2xs cursor-pointer"
            title="Reload profile"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-orange-500" : ""} />
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
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
      {/* 2. HERO PROFILE CARD                                              */}
      {/* ================================================================= */}
      <div className="p-6 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            {initials}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white m-0">
                {fullName || profile?.fullName || user?.fullName || "Staff Administrator"}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <ShieldCheck size={13} /> {roleLabel}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Account
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap pt-0.5">
              <span className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-mono">
                <Mail size={13} className="text-orange-500" />
                {user?.email}
                <button
                  type="button"
                  onClick={copyEmail}
                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                  title="Copy email"
                >
                  {copiedEmail ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                </button>
              </span>

              <span className="flex items-center gap-1.5">
                <Building2 size={13} className="text-blue-500" />
                {companyName} ({companyCity} Plant)
              </span>

              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-neutral-400" />
                Joined {profile?.createdAtUtc ? formatDate(profile.createdAtUtc) : "Active"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stat Chips */}
        <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
          <div className="p-3 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] text-center min-w-[105px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Department</div>
            <div className="text-xs font-extrabold text-neutral-900 dark:text-white mt-0.5">{department}</div>
          </div>
          <div className="p-3 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] text-center min-w-[105px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Staff Code</div>
            <div className="text-xs font-extrabold text-[var(--color-primary)] mt-0.5 font-mono">{employeeId}</div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. PROFILE COMPLETION STATUS CARD                                 */}
      {/* ================================================================= */}
      <ProfileCompletionCard
        profileData={compositeProfile}
        onNavigateTab={(tabKey) => {
          if (tabKey === "personal") setActiveTab("personal");
          else if (tabKey === "company") setActiveTab("company");
          else if (tabKey === "contacts") setActiveTab("personal");
        }}
      />

      {/* ================================================================= */}
      {/* 4. NAVIGATION TABS                                                */}
      {/* ================================================================= */}
      <div className="flex items-center gap-2 border-b border-neutral-200/80 dark:border-white/10 pb-2 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap",
                isActive
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "bg-neutral-100 dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/10"
              )}
            >
              <Icon size={14} />
              <span>{tab.shortTitle}</span>
            </button>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* 5. ACTIVE TAB BANNER                                              */}
      {/* ================================================================= */}
      <div className="p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center border shadow-xs shrink-0",
              activeTabMeta.badgeBg,
              activeTabMeta.badgeText,
              activeTabMeta.badgeBorder
            )}
          >
            <activeTabMeta.icon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-neutral-900 dark:text-white m-0">
                {activeTabMeta.title}
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10">
                {activeTabMeta.groupCount} {activeTabMeta.groupCount === 1 ? "Section" : "Sections"}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 m-0">
              {activeTabMeta.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleAllActiveGroups}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-2xs cursor-pointer shrink-0 self-start sm:self-center"
          title={areAllActiveCollapsed ? "View all sections in this tab" : "Hide all sections in this tab"}
        >
          {areAllActiveCollapsed ? <Eye size={13} className="text-blue-500" /> : <EyeOff size={13} className="text-neutral-500" />}
          <span>{areAllActiveCollapsed ? "View All Sections" : "Hide All Sections"}</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* 6. TAB CONTENT PANELS                                             */}
      {/* ================================================================= */}

      {/* ── TAB 1: Personal Staff Details ── */}
      {activeTab === "personal" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs transition-all overflow-hidden">
            <div
              onClick={() => toggleGroup("personal-info")}
              className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
                    Personal Identity & Direct Contacts
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10">
                    6 Fields
                  </span>
                  {isPersonalDirty && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Modified
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 m-0">
                  Update your public staff display name, employee code, direct mobile, and primary work email.
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroup("personal-info");
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0",
                  collapsedGroups["personal-info"]
                    ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                    : "bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60"
                )}
              >
                {collapsedGroups["personal-info"] ? <Eye size={13} /> : <EyeOff size={13} />}
                <span>{collapsedGroups["personal-info"] ? "View Details" : "Hide Section"}</span>
                {collapsedGroups["personal-info"] ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              </button>
            </div>

            {!collapsedGroups["personal-info"] && (
              <div className="px-6 pb-6 pt-2 border-t border-neutral-100 dark:border-white/5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Bhola"
                      required
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                    />
                    <span className="block text-[11px] text-neutral-400">Your staff identity displayed across ERP audit logs</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Work Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200/70 dark:border-white/5 bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 font-mono cursor-not-allowed"
                      title="Corporate email is managed by your system administrator"
                    />
                    <span className="block text-[11px] text-neutral-400">Managed via administrative user registry</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Direct Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Department / Operational Unit
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Staff / Employee Code
                    </label>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="EMP-AD-001"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all font-mono"
                    />
                    <span className="block text-[11px] text-neutral-400">Unique alphanumeric staff identity badge identifier</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Assigned Foundry Plant
                    </label>
                    <input
                      type="text"
                      value="Shakti Udyog Main Foundry (Ludhiana Plant 1)"
                      disabled
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200/70 dark:border-white/5 bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-neutral-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={saving || !isPersonalDirty}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 h-8 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer",
                      isPersonalDirty
                        ? "bg-[var(--color-primary)] hover:opacity-90 text-white shadow-sm"
                        : "bg-neutral-100 dark:bg-white/5 text-neutral-400 dark:text-neutral-600 border border-neutral-200/80 dark:border-white/10 cursor-not-allowed"
                    )}
                  >
                    <Save size={13} className={saving ? "animate-spin" : ""} />
                    <span>{saving ? "Saving..." : "Save Personal Details"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: Enterprise Identity & Tax Profile ── */}
      {activeTab === "company" && (
        <div className="space-y-4">
          {/* Group 1: Legal Identity & Contact */}
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs transition-all overflow-hidden">
            <div
              onClick={() => toggleGroup("company-legal")}
              className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
                    Legal Identity & Contact
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10">
                    5 Fields
                  </span>
                </div>
                <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 m-0">
                  Primary enterprise identifiers and communication channels.
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroup("company-legal");
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0",
                  collapsedGroups["company-legal"]
                    ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                    : "bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60"
                )}
              >
                {collapsedGroups["company-legal"] ? <Eye size={13} /> : <EyeOff size={13} />}
                <span>{collapsedGroups["company-legal"] ? "View Details" : "Hide Section"}</span>
                {collapsedGroups["company-legal"] ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              </button>
            </div>

            {!collapsedGroups["company-legal"] && (
              <div className="px-6 pb-6 pt-2 border-t border-neutral-100 dark:border-white/5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Shakti Udyog"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                    />
                    <span className="block text-[11px] text-neutral-400">Legal registered name of the enterprise</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Official Website
                    </label>
                    <input
                      type="url"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder="https://shaktiudyog.com"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Primary Corporate Email
                    </label>
                    <input
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      placeholder="info@shaktiudyog.com"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Corporate Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Operating Currency Code
                    </label>
                    <input
                      type="text"
                      value={companyCurrency}
                      onChange={(e) => setCompanyCurrency(e.target.value)}
                      placeholder="INR"
                      className="w-full md:w-1/2 px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all font-mono"
                    />
                    <span className="block text-[11px] text-neutral-400">Standard ISO-4217 currency code</span>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-neutral-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={saving || !isCompanyDirty}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 h-8 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer",
                      isCompanyDirty
                        ? "bg-[var(--color-primary)] hover:opacity-90 text-white shadow-sm"
                        : "bg-neutral-100 dark:bg-white/5 text-neutral-400 dark:text-neutral-600 border border-neutral-200/80 dark:border-white/10 cursor-not-allowed"
                    )}
                  >
                    <Save size={13} className={saving ? "animate-spin" : ""} />
                    <span>{saving ? "Saving..." : "Save Company Profile"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Group 2: Statutory & Tax Registrations */}
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs transition-all overflow-hidden">
            <div
              onClick={() => toggleGroup("company-tax")}
              className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
                    Statutory & Tax Registrations
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10">
                    4 Fields
                  </span>
                </div>
                <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 m-0">
                  Government compliance credentials displayed on GST invoices and formal quotations.
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroup("company-tax");
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0",
                  collapsedGroups["company-tax"]
                    ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                    : "bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60"
                )}
              >
                {collapsedGroups["company-tax"] ? <Eye size={13} /> : <EyeOff size={13} />}
                <span>{collapsedGroups["company-tax"] ? "View Details" : "Hide Section"}</span>
                {collapsedGroups["company-tax"] ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              </button>
            </div>

            {!collapsedGroups["company-tax"] && (
              <div className="px-6 pb-6 pt-2 border-t border-neutral-100 dark:border-white/5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      GSTIN Number
                    </label>
                    <input
                      type="text"
                      value={companyGstin}
                      onChange={(e) => setCompanyGstin(e.target.value)}
                      placeholder="03AAAAA0000A1Z5"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Permanent Account Number (PAN)
                    </label>
                    <input
                      type="text"
                      value={companyPan}
                      onChange={(e) => setCompanyPan(e.target.value)}
                      placeholder="AAAAA0000A"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Corporate Identification Number (CIN)
                    </label>
                    <input
                      type="text"
                      value={companyCin}
                      onChange={(e) => setCompanyCin(e.target.value)}
                      placeholder="U27100PB1990PTC010000"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      MSME / Udyam Registration No.
                    </label>
                    <input
                      type="text"
                      value={companyMsme}
                      onChange={(e) => setCompanyMsme(e.target.value)}
                      placeholder="UDYAM-PB-12-0000000"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-neutral-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={saving || !isCompanyDirty}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 h-8 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer",
                      isCompanyDirty
                        ? "bg-[var(--color-primary)] hover:opacity-90 text-white shadow-sm"
                        : "bg-neutral-100 dark:bg-white/5 text-neutral-400 dark:text-neutral-600 border border-neutral-200/80 dark:border-white/10 cursor-not-allowed"
                    )}
                  >
                    <Save size={13} className={saving ? "animate-spin" : ""} />
                    <span>{saving ? "Saving..." : "Save Tax Profile"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Group 3: Addresses & Operational Facilities */}
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs transition-all overflow-hidden">
            <div
              onClick={() => toggleGroup("company-address")}
              className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
                    Addresses & Operational Facilities
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10">
                    5 Fields
                  </span>
                </div>
                <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 m-0">
                  Registered office and manufacturing foundry plant locations.
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroup("company-address");
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0",
                  collapsedGroups["company-address"]
                    ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                    : "bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60"
                )}
              >
                {collapsedGroups["company-address"] ? <Eye size={13} /> : <EyeOff size={13} />}
                <span>{collapsedGroups["company-address"] ? "View Details" : "Hide Section"}</span>
                {collapsedGroups["company-address"] ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              </button>
            </div>

            {!collapsedGroups["company-address"] && (
              <div className="px-6 pb-6 pt-2 border-t border-neutral-100 dark:border-white/5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Registered Head Office Address
                    </label>
                    <textarea
                      rows={2}
                      value={companyRegAddress}
                      onChange={(e) => setCompanyRegAddress(e.target.value)}
                      placeholder="Plot No. 42, Industrial Area, Phase II"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all resize-y"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Foundry Works & Plant Address
                    </label>
                    <textarea
                      rows={2}
                      value={companyFactoryAddress}
                      onChange={(e) => setCompanyFactoryAddress(e.target.value)}
                      placeholder="Unit 1 & 2, Foundry Cluster, Focal Point Phase V"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all resize-y"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      City
                    </label>
                    <input
                      type="text"
                      value={companyCity}
                      onChange={(e) => setCompanyCity(e.target.value)}
                      placeholder="Ludhiana"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      State / Province
                    </label>
                    <input
                      type="text"
                      value={companyState}
                      onChange={(e) => setCompanyState(e.target.value)}
                      placeholder="Punjab"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Postal PIN Code
                    </label>
                    <input
                      type="text"
                      value={companyPin}
                      onChange={(e) => setCompanyPin(e.target.value)}
                      placeholder="141010"
                      className="w-full md:w-1/2 px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-neutral-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={saving || !isCompanyDirty}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 h-8 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer",
                      isCompanyDirty
                        ? "bg-[var(--color-primary)] hover:opacity-90 text-white shadow-sm"
                        : "bg-neutral-100 dark:bg-white/5 text-neutral-400 dark:text-neutral-600 border border-neutral-200/80 dark:border-white/10 cursor-not-allowed"
                    )}
                  >
                    <Save size={13} className={saving ? "animate-spin" : ""} />
                    <span>{saving ? "Saving..." : "Save Addresses"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: Security & Password ── */}
      {activeTab === "security" && (
        <div className="space-y-4">
          {/* Group 1: Password Changer */}
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs transition-all overflow-hidden">
            <div
              onClick={() => toggleGroup("security-password")}
              className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
                    Change Password
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10">
                    3 Fields
                  </span>
                </div>
                <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 m-0">
                  Ensure your administrative account uses a secure password with at least 8 characters.
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroup("security-password");
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0",
                  collapsedGroups["security-password"]
                    ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                    : "bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60"
                )}
              >
                {collapsedGroups["security-password"] ? <Eye size={13} /> : <EyeOff size={13} />}
                <span>{collapsedGroups["security-password"] ? "View Details" : "Hide Section"}</span>
                {collapsedGroups["security-password"] ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              </button>
            </div>

            {!collapsedGroups["security-password"] && (
              <div className="px-6 pb-6 pt-2 border-t border-neutral-100 dark:border-white/5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg pt-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Current Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                        className="w-full pl-3.5 pr-10 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw((v) => !v)}
                        className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                      >
                        {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPw ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        required
                        minLength={8}
                        className="w-full pl-3.5 pr-10 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw((v) => !v)}
                        className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                      >
                        {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      Confirm New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPw ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                        minLength={8}
                        className="w-full pl-3.5 pr-10 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw((v) => !v)}
                        className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                      >
                        {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {passwordSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  {passwordError && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="inline-flex items-center gap-1.5 px-5 h-9 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <KeyRound size={14} className={updatingPassword ? "animate-spin" : ""} />
                    <span>{updatingPassword ? "Updating Password..." : "Update Password"}</span>
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Group 2: Devices & Sessions */}
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs transition-all overflow-hidden">
            <div
              onClick={() => toggleGroup("security-sessions")}
              className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
                    Active Remote Devices & Sessions
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10">
                    Real-time Audit
                  </span>
                </div>
                <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 m-0">
                  Review logged-in browsers, IP addresses, and revoke unrecognized sessions.
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroup("security-sessions");
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0",
                  collapsedGroups["security-sessions"]
                    ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                    : "bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60"
                )}
              >
                {collapsedGroups["security-sessions"] ? <Eye size={13} /> : <EyeOff size={13} />}
                <span>{collapsedGroups["security-sessions"] ? "View Details" : "Hide Section"}</span>
                {collapsedGroups["security-sessions"] ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              </button>
            </div>

            {!collapsedGroups["security-sessions"] && (
              <div className="px-6 pb-6 pt-2 border-t border-neutral-100 dark:border-white/5 animate-in fade-in slide-in-from-top-1 duration-150">
                <DevicesSessionsCard />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: System Permissions ── */}
      {activeTab === "permissions" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs transition-all overflow-hidden">
            <div
              onClick={() => toggleGroup("permissions-matrix")}
              className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
                    Master Administrator Rights Matrix
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10">
                    6 Permissions
                  </span>
                </div>
                <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 m-0">
                  The following root authorizations are granted to your Tier-1 Master Administrator account.
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroup("permissions-matrix");
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0",
                  collapsedGroups["permissions-matrix"]
                    ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                    : "bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60"
                )}
              >
                {collapsedGroups["permissions-matrix"] ? <Eye size={13} /> : <EyeOff size={13} />}
                <span>{collapsedGroups["permissions-matrix"] ? "View Details" : "Hide Section"}</span>
                {collapsedGroups["permissions-matrix"] ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              </button>
            </div>

            {!collapsedGroups["permissions-matrix"] && (
              <div className="px-6 pb-6 pt-2 border-t border-neutral-100 dark:border-white/5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-3">
                  {[
                    { title: "User & Role Management", desc: "Create, view, manage, and assign roles across all customer and staff accounts.", enabled: true },
                    { title: "Enquiry & RFQ Estimation", desc: "Review customer technical drawings, approve costings, and publish formal quotes.", enabled: true },
                    { title: "Manufacturing & Kanban Board", desc: "Track and reassign orders across 25 production and QA inspection stages.", enabled: true },
                    { title: "Invoicing & Financial Ledger", desc: "Generate tax invoices, verify payment receipts, and reconcile advances.", enabled: true },
                    { title: "Master Catalog & Taxonomies", desc: "Manage casting products, material grades, surface finishes, and HSN codes.", enabled: true },
                    { title: "System Audit & Compliance Logs", desc: "Access immutable audit trails of all administrative and shop floor actions.", enabled: true },
                  ].map((perm) => (
                    <div
                      key={perm.title}
                      className="p-4 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/60 dark:bg-white/[0.02] flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white">{perm.title}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <BadgeCheck size={12} /> Active
                        </span>
                      </div>
                      <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 m-0 leading-relaxed">
                        {perm.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 5: Notification Preferences ── */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs transition-all overflow-hidden">
            <div
              onClick={() => toggleGroup("notifications-relays")}
              className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
                    Real-time Event Subscriptions
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10">
                    4 Event Rules
                  </span>
                </div>
                <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 m-0">
                  Choose which operational triggers send direct real-time alerts to your work email and notification bell.
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroup("notifications-relays");
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0",
                  collapsedGroups["notifications-relays"]
                    ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                    : "bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60"
                )}
              >
                {collapsedGroups["notifications-relays"] ? <Eye size={13} /> : <EyeOff size={13} />}
                <span>{collapsedGroups["notifications-relays"] ? "View Details" : "Hide Section"}</span>
                {collapsedGroups["notifications-relays"] ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              </button>
            </div>

            {!collapsedGroups["notifications-relays"] && (
              <div className="px-6 pb-6 pt-2 border-t border-neutral-100 dark:border-white/5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="space-y-3 pt-3">
                  {[
                    { label: "New Customer Enquiry & RFQ Submission", desc: "Receive immediate alert when a customer uploads new casting requirements or CAD drawings.", checked: notifyRfq, set: setNotifyRfq },
                    { label: "New Purchase Order Placement", desc: "Receive notification when an approved quotation is confirmed into an active order.", checked: notifyOrders, set: setNotifyOrders },
                    { label: "Customer Payment Proof Uploaded", desc: "Notify when customer submits advance transaction reference or payment slip.", checked: notifyPayments, set: setNotifyPayments },
                    { label: "Tax Invoice Issued or Cleared", desc: "Notify when accounts issues a final tax invoice or reconciles full balance.", checked: notifyInvoices, set: setNotifyInvoices },
                  ].map((item, idx) => (
                    <label
                      key={idx}
                      className="p-4 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#090b10] flex items-center justify-between gap-4 cursor-pointer hover:border-[var(--color-primary)]/40 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white">{item.label}</div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{item.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => item.set(e.target.checked)}
                        className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-0 cursor-pointer shrink-0"
                      />
                    </label>
                  ))}
                </div>

                <div className="flex justify-end pt-3 border-t border-neutral-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={saving || !isNotificationsDirty}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 h-8 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer",
                      isNotificationsDirty
                        ? "bg-[var(--color-primary)] hover:opacity-90 text-white shadow-sm"
                        : "bg-neutral-100 dark:bg-white/5 text-neutral-400 dark:text-neutral-600 border border-neutral-200/80 dark:border-white/10 cursor-not-allowed"
                    )}
                  >
                    <Save size={13} className={saving ? "animate-spin" : ""} />
                    <span>{saving ? "Saving..." : "Save Event Preferences"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 7. STICKY FLOATING ACTION BAR ON UNSAVED CHANGES                  */}
      {/* ================================================================= */}
      {isDirty && (
        <div className="fixed bottom-6 inset-x-0 max-w-xl mx-auto z-40 px-4 animate-in slide-in-from-bottom-5">
          <div className="p-3.5 rounded-2xl bg-neutral-900/95 dark:bg-white/10 text-white backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 pl-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-bold">Unsaved changes detected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDiscard}
                className="px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-[var(--color-primary)] hover:opacity-90 text-white shadow-sm transition-all cursor-pointer"
              >
                <Save size={13} className={saving ? "animate-spin" : ""} />
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
