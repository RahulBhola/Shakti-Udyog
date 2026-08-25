import { useState, type FormEvent, useEffect, useCallback, useMemo } from "react";
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
  MapPin,
  Bell,
  RefreshCw,
  Clock,
  Copy,
  Check,
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
  const [loading, setLoading] = useState(true);

  // Form states - Personal
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("Operations & Plant Administration");
  const [employeeId, setEmployeeId] = useState("EMP-SU-001");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Form states - Enterprise Company Profile
  const [companyName, setCompanyName] = useState("Shakti Udyog");
  const [companyWebsite, setCompanyWebsite] = useState("https://shaktiudyog.com");
  const [companyEmail, setCompanyEmail] = useState("info@shaktiudyog.com");
  const [companyPhone, setCompanyPhone] = useState("+91 98765 43210");
  const [companyGstin, setCompanyGstin] = useState("03AAAAA0000A1Z5");
  const [companyPan, setCompanyPan] = useState("AAAAA0000A");
  const [companyCin, setCompanyCin] = useState("U27100PB1990PTC010000");
  const [companyMsme, setCompanyMsme] = useState("UDYAM-PB-12-0000000");
  const [companyRegAddress, setCompanyRegAddress] = useState("G.T. Road, Industrial Area, Ludhiana, Punjab - 141003");
  const [companyPlantAddress, setCompanyPlantAddress] = useState("Phase V, Focal Point, Ludhiana, Punjab - 141010");
  const [updatingCompany, setUpdatingCompany] = useState(false);
  const [companySuccess, setCompanySuccess] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);

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
  const [updatingNotifications, setUpdatingNotifications] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<"general" | "company" | "security" | "permissions" | "notifications">("general");
  const [copiedEmail, setCopiedEmail] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, settingsRes] = await Promise.allSettled([
        apiGet<ProfileData>("/api/v1/admin/profile"),
        adminApi.settings(),
      ]);

      if (profileRes.status === "fulfilled") {
        setProfile(profileRes.value);
        setFullName(profileRes.value.fullName || "");
        setPhoneNumber(profileRes.value.phoneNumber || "");
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
      }

      if (settingsRes.status === "fulfilled" && settingsRes.value) {
        const s = settingsRes.value;
        setSettings(s);
        if (s["company.name"]) setCompanyName(s["company.name"]);
        if (s["company.website"]) setCompanyWebsite(s["company.website"]);
        if (s["company.email"]) setCompanyEmail(s["company.email"]);
        if (s["company.phone"]) setCompanyPhone(s["company.phone"]);
        if (s["company.gstin"]) setCompanyGstin(s["company.gstin"]);
        if (s["company.pan"]) setCompanyPan(s["company.pan"]);
        if (s["company.cin"]) setCompanyCin(s["company.cin"]);
        if (s["company.msme"]) setCompanyMsme(s["company.msme"]);
        if (s["company.registeredAddress"]) setCompanyRegAddress(s["company.registeredAddress"]);
        if (s["company.plantAddress"]) setCompanyPlantAddress(s["company.plantAddress"]);

        if (s["notify.onEnquiry"]) setNotifyRfq(s["notify.onEnquiry"] === "true");
        if (s["notify.onOrderPlaced"]) setNotifyOrders(s["notify.onOrderPlaced"] === "true");
        if (s["notify.onPayment"]) setNotifyPayments(s["notify.onPayment"] === "true");
        if (s["notify.onInvoiceGenerated"]) setNotifyInvoices(s["notify.onInvoiceGenerated"] === "true");
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
        deliveryAddresses: companyPlantAddress || companyRegAddress,
      },
      roles: profile?.roles || user?.roles || ["Admin"],
    };
  }, [fullName, profile, user, phoneNumber, department, companyName, companyPlantAddress, companyRegAddress]);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setUpdatingProfile(true);

    try {
      await apiPatch("/api/v1/admin/profile", {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      setProfileSuccess("Personal credentials updated successfully.");
      if (profile) {
        setProfile({ ...profile, fullName, phoneNumber });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile.";
      setProfileError(msg);
    } finally {
      setUpdatingProfile(false);
    }
  }

  async function handleCompanySubmit(e: FormEvent) {
    e.preventDefault();
    setCompanyError(null);
    setCompanySuccess(null);
    setUpdatingCompany(true);

    try {
      const updatedSettings = {
        ...settings,
        "company.name": companyName.trim(),
        "company.website": companyWebsite.trim(),
        "company.email": companyEmail.trim(),
        "company.phone": companyPhone.trim(),
        "company.gstin": companyGstin.trim(),
        "company.pan": companyPan.trim(),
        "company.cin": companyCin.trim(),
        "company.msme": companyMsme.trim(),
        "company.registeredAddress": companyRegAddress.trim(),
        "company.plantAddress": companyPlantAddress.trim(),
      };
      await adminApi.updateSettings(updatedSettings);
      setSettings(updatedSettings);
      setCompanySuccess("Enterprise organization & plant profile updated successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save company profile.";
      setCompanyError(msg);
    } finally {
      setUpdatingCompany(false);
    }
  }

  async function handleNotificationSubmit(e: FormEvent) {
    e.preventDefault();
    setNotificationSuccess(null);
    setUpdatingNotifications(true);

    try {
      const updatedSettings = {
        ...settings,
        "notify.onEnquiry": String(notifyRfq),
        "notify.onOrderPlaced": String(notifyOrders),
        "notify.onPayment": String(notifyPayments),
        "notify.onInvoiceGenerated": String(notifyInvoices),
      };
      await adminApi.updateSettings(updatedSettings);
      setSettings(updatedSettings);
      setNotificationSuccess("Notification alert subscriptions updated.");
    } catch {
      // Ignored
    } finally {
      setUpdatingNotifications(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
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

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* ================================================================= */}
      {/* 1. HERO HEADER                                                    */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            Manage your personal staff identity, enterprise organization details, plant credentials, security, and alert subscriptions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-2xs cursor-pointer self-start sm:self-center"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-orange-500" : ""} />
          <span>{loading ? "Reloading..." : "Reload Profile"}</span>
        </button>
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
                {profile?.fullName || user?.fullName || "Staff Administrator"}
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
                {companyName} (Ludhiana Plant 1)
              </span>

              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-neutral-400" />
                Joined {profile?.createdAtUtc ? formatDate(profile.createdAtUtc) : "Active"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Identity Stat Chips */}
        <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
          <div className="p-3 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] text-center min-w-[100px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Department</div>
            <div className="text-xs font-extrabold text-neutral-900 dark:text-white mt-0.5">Operations</div>
          </div>
          <div className="p-3 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] text-center min-w-[100px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Admin Scope</div>
            <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">Full Root Access</div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. PROFILE COMPLETION STATUS CARD                                 */}
      {/* ================================================================= */}
      <ProfileCompletionCard
        profileData={compositeProfile}
        onNavigateTab={(tabKey) => {
          if (tabKey === "personal") setActiveTab("general");
          else if (tabKey === "company") setActiveTab("company");
          else if (tabKey === "contacts") setActiveTab("general");
        }}
      />

      {/* ================================================================= */}
      {/* 4. NAVIGATION TABS                                                */}
      {/* ================================================================= */}
      <div className="flex items-center gap-1.5 border-b border-neutral-200/80 dark:border-white/10 pb-2 overflow-x-auto">
        {[
          { id: "general", label: "Personal Details", icon: User },
          { id: "company", label: "Enterprise & Plant Profile", icon: Building2 },
          { id: "security", label: "Password & Active Sessions", icon: KeyRound },
          { id: "permissions", label: "System Permissions", icon: Layers },
          { id: "notifications", label: "Notification Preferences", icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap",
                isActive
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "bg-neutral-100 dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/10"
              )}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* 5. TAB CONTENT PANELS                                             */}
      {/* ================================================================= */}

      {/* ── TAB 1: Personal Details ── */}
      {activeTab === "general" && (
        <div className="p-6 sm:p-7 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-base font-extrabold text-neutral-900 dark:text-white m-0">Personal Identification</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 m-0">
              Update your public staff display name, employee code, direct mobile, and primary work email.
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all"
                />
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
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Direct Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all"
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
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Staff / Employee Code
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all font-mono"
                />
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

            {profileSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updatingProfile}
                className="inline-flex items-center gap-1.5 px-5 h-9 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Save size={14} className={updatingProfile ? "animate-spin" : ""} />
                <span>{updatingProfile ? "Saving Details..." : "Save Personal Details"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: Enterprise & Plant Profile ── */}
      {activeTab === "company" && (
        <div className="p-6 sm:p-7 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-base font-extrabold text-neutral-900 dark:text-white m-0">
              Enterprise Identity, Tax IDs & Plant Facilities
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 m-0">
              Corporate organization details, statutory tax numbers, and foundry plant addresses printed across invoices, quotes, and delivery notes.
            </p>
          </div>

          <form onSubmit={handleCompanySubmit} className="space-y-5">
            {/* Group 1: Corporate Identity */}
            <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.02] space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 m-0">
                Corporate Entity Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Enterprise Legal Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Shakti Udyog"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Official Website URL
                  </label>
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://shaktiudyog.com"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Primary Corporate Email
                  </label>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="info@shaktiudyog.com"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Corporate Phone / Helpline
                  </label>
                  <input
                    type="tel"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Group 2: Statutory Tax IDs */}
            <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.02] space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 m-0">
                Statutory & Tax Compliance Identifiers
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">GSTIN Number</label>
                  <input
                    type="text"
                    value={companyGstin}
                    onChange={(e) => setCompanyGstin(e.target.value)}
                    placeholder="03AAAAA0000A1Z5"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white font-mono uppercase focus:outline-none focus:border-[var(--color-primary)] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">PAN Number</label>
                  <input
                    type="text"
                    value={companyPan}
                    onChange={(e) => setCompanyPan(e.target.value)}
                    placeholder="AAAAA0000A"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white font-mono uppercase focus:outline-none focus:border-[var(--color-primary)] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">CIN Number</label>
                  <input
                    type="text"
                    value={companyCin}
                    onChange={(e) => setCompanyCin(e.target.value)}
                    placeholder="U27100PB1990PTC010000"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white font-mono uppercase focus:outline-none focus:border-[var(--color-primary)] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">MSME Udyam Reg.</label>
                  <input
                    type="text"
                    value={companyMsme}
                    onChange={(e) => setCompanyMsme(e.target.value)}
                    placeholder="UDYAM-PB-12-0000000"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white font-mono uppercase focus:outline-none focus:border-[var(--color-primary)] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Group 3: Plant & Office Addresses */}
            <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.02] space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 m-0">
                Facility & Plant Addresses
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <MapPin size={12} className="text-orange-500" /> Registered Corporate Office Address
                  </label>
                  <textarea
                    rows={2}
                    value={companyRegAddress}
                    onChange={(e) => setCompanyRegAddress(e.target.value)}
                    placeholder="G.T. Road, Industrial Area, Ludhiana, Punjab - 141003"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all resize-y"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Building2 size={12} className="text-blue-500" /> Foundry & Manufacturing Plant Address (Plant 1)
                  </label>
                  <textarea
                    rows={2}
                    value={companyPlantAddress}
                    onChange={(e) => setCompanyPlantAddress(e.target.value)}
                    placeholder="Phase V, Focal Point, Ludhiana, Punjab - 141010"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[var(--color-primary)] transition-all resize-y"
                  />
                </div>
              </div>
            </div>

            {companySuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{companySuccess}</span>
              </div>
            )}

            {companyError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{companyError}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updatingCompany}
                className="inline-flex items-center gap-1.5 px-5 h-9 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Save size={14} className={updatingCompany ? "animate-spin" : ""} />
                <span>{updatingCompany ? "Saving Enterprise Info..." : "Save Enterprise Profile"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 3: Security & Password ── */}
      {activeTab === "security" && (
        <div className="p-6 sm:p-7 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-base font-extrabold text-neutral-900 dark:text-white m-0">
              Account Security & Active Sessions
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 m-0">
              Change your administrative password and review all active device sessions.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
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
                  className="w-full pl-3.5 pr-10 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#090b10] text-neutral-900 dark:text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
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
                  className="w-full pl-3.5 pr-10 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#090b10] text-neutral-900 dark:text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
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
                  className="w-full pl-3.5 pr-10 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#090b10] text-neutral-900 dark:text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
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

          <div className="pt-4 border-t border-neutral-200/80 dark:border-white/10">
            <DevicesSessionsCard />
          </div>
        </div>
      )}

      {/* ── TAB 4: System Permissions ── */}
      {activeTab === "permissions" && (
        <div className="p-6 sm:p-7 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-base font-extrabold text-neutral-900 dark:text-white m-0">
              Assigned Capabilities & Authorizations
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 m-0">
              The following root authorizations are granted to your Tier-1 Master Administrator account.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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

      {/* ── TAB 5: Notification Preferences ── */}
      {activeTab === "notifications" && (
        <div className="p-6 sm:p-7 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-base font-extrabold text-neutral-900 dark:text-white m-0">
              Personal Notification & Alert Preferences
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 m-0">
              Choose which operational triggers send direct real-time alerts to your work email and notification bell.
            </p>
          </div>

          <form onSubmit={handleNotificationSubmit} className="space-y-4">
            <div className="space-y-3">
              {[
                { label: "New Customer Enquiry & RFQ Submission", desc: "Receive immediate alert when a customer uploads new casting requirements or CAD drawings.", checked: notifyRfq, set: setNotifyRfq },
                { label: "New Purchase Order Placement", desc: "Receive notification when an approved quotation is confirmed into an active order.", checked: notifyOrders, set: setNotifyOrders },
                { label: "Customer Payment Proof Uploaded", desc: "Notify when customer submits advance transaction reference or payment slip.", checked: notifyPayments, set: setNotifyPayments },
                { label: "Tax Invoice Issued or Cleared", desc: "Notify when accounts issues a final tax invoice or reconciles full balance.", checked: notifyInvoices, set: setNotifyInvoices },
              ].map((item, idx) => (
                <label
                  key={idx}
                  className="p-4 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-4 cursor-pointer hover:border-[var(--color-primary)]/40 transition-colors"
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

            {notificationSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{notificationSuccess}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updatingNotifications}
                className="inline-flex items-center gap-1.5 px-5 h-9 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Save size={14} className={updatingNotifications ? "animate-spin" : ""} />
                <span>{updatingNotifications ? "Saving..." : "Save Preferences"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
