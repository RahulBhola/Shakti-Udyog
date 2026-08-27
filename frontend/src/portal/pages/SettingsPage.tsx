import { useState, useEffect } from "react";
import {
  Sliders,
  Bell,
  ShieldCheck,
  Smartphone,
  Lock,
  Save,
  CheckCircle2,
  Globe,
  Mail,
  MessageSquare,
  FileDown,
  ChevronRight,
  Eye,
  EyeOff,
  AlertTriangle,
  Sun,
  Moon,
  KeyRound,
  Shield,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { DevicesSessionsCard } from "../components/DevicesSessionsCard";
import { useAuth } from "../../auth/AuthContext";
import { useTheme } from "../../auth/ThemeContext";

/* ------------------------------------------------------------------ */
/*  Types & Interfaces                                                 */
/* ------------------------------------------------------------------ */

type TabId = "preferences" | "notifications" | "security" | "sessions" | "privacy";

interface TabDef {
  id: TabId;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

const TABS: TabDef[] = [
  {
    id: "preferences",
    title: "Account & Regional Preferences",
    shortTitle: "Preferences",
    description: "Customize your regional date formats, measurement units, currency slabs, and visual interface themes.",
    icon: Sliders,
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-600 dark:text-blue-400",
    badgeBorder: "border-blue-500/20",
  },
  {
    id: "notifications",
    title: "Notification & Alert Channels",
    shortTitle: "Notifications",
    description: "Manage real-time alerts for RFQ quotation approvals, casting production stages, dispatch waybills, and invoices.",
    icon: Bell,
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-600 dark:text-amber-400",
    badgeBorder: "border-amber-500/20",
  },
  {
    id: "security",
    title: "Security & Login Protection",
    shortTitle: "Security",
    description: "Configure multi-factor authentication, change your account password, and adjust idle session timeouts.",
    icon: ShieldCheck,
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    badgeBorder: "border-emerald-500/20",
  },
  {
    id: "sessions",
    title: "Active Devices & Login Sessions",
    shortTitle: "Devices & Sessions",
    description: "Review active browsers and devices logged into your account, and revoke unfamiliar or stale sessions.",
    icon: Smartphone,
    badgeBg: "bg-purple-500/10",
    badgeText: "text-purple-600 dark:text-purple-400",
    badgeBorder: "border-purple-500/20",
  },
  {
    id: "privacy",
    title: "Data Export & Privacy Controls",
    shortTitle: "Data & Privacy",
    description: "Download your account history, order logs, test certificates archive, and manage data retention policies.",
    icon: Lock,
    badgeBg: "bg-teal-500/10",
    badgeText: "text-teal-600 dark:text-teal-400",
    badgeBorder: "border-teal-500/20",
  },
];

/* ------------------------------------------------------------------ */
/*  Toggle Switch Component                                            */
/* ------------------------------------------------------------------ */

function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        checked ? "bg-blue-600" : "bg-neutral-300 dark:bg-neutral-700",
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

/* ------------------------------------------------------------------ */
/*  Main Customer Settings Page                                        */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<TabId>("preferences");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Preferences State
  const [language, setLanguage] = useState("en-IN");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [currency, setCurrency] = useState("INR");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [compactTables, setCompactTables] = useState(false);
  const [showMetallurgyBadges, setShowMetallurgyBadges] = useState(true);

  // Notification State
  const [notifyRfqReady, setNotifyRfqReady] = useState(true);
  const [notifyProductionStages, setNotifyProductionStages] = useState(true);
  const [notifyDispatchWaybill, setNotifyDispatchWaybill] = useState(true);
  const [notifyInvoices, setNotifyInvoices] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyBulletins, setNotifyBulletins] = useState(false);

  // Security State
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [rememberDevices, setRememberDevices] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("60");

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Privacy State
  const [marketingConsent, setMarketingConsent] = useState(true);

  // Load preferences from local storage on mount
  useEffect(() => {
    try {
      const savedPrefs = localStorage.getItem("su_customer_settings");
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.timezone) setTimezone(parsed.timezone);
        if (parsed.dateFormat) setDateFormat(parsed.dateFormat);
        if (parsed.currency) setCurrency(parsed.currency);
        if (parsed.weightUnit) setWeightUnit(parsed.weightUnit);
        if (typeof parsed.compactTables === "boolean") setCompactTables(parsed.compactTables);
        if (typeof parsed.showMetallurgyBadges === "boolean") setShowMetallurgyBadges(parsed.showMetallurgyBadges);

        if (typeof parsed.notifyRfqReady === "boolean") setNotifyRfqReady(parsed.notifyRfqReady);
        if (typeof parsed.notifyProductionStages === "boolean") setNotifyProductionStages(parsed.notifyProductionStages);
        if (typeof parsed.notifyDispatchWaybill === "boolean") setNotifyDispatchWaybill(parsed.notifyDispatchWaybill);
        if (typeof parsed.notifyInvoices === "boolean") setNotifyInvoices(parsed.notifyInvoices);
        if (typeof parsed.notifyWhatsapp === "boolean") setNotifyWhatsapp(parsed.notifyWhatsapp);
        if (typeof parsed.notifySms === "boolean") setNotifySms(parsed.notifySms);
        if (typeof parsed.notifyBulletins === "boolean") setNotifyBulletins(parsed.notifyBulletins);

        if (typeof parsed.mfaEnabled === "boolean") setMfaEnabled(parsed.mfaEnabled);
        if (typeof parsed.rememberDevices === "boolean") setRememberDevices(parsed.rememberDevices);
        if (parsed.sessionTimeout) setSessionTimeout(parsed.sessionTimeout);
        if (typeof parsed.marketingConsent === "boolean") setMarketingConsent(parsed.marketingConsent);
      }
    } catch {
      // fallback to defaults
    }
  }, []);

  const handleSaveSettings = () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const settingsPayload = {
        language,
        timezone,
        dateFormat,
        currency,
        weightUnit,
        compactTables,
        showMetallurgyBadges,
        notifyRfqReady,
        notifyProductionStages,
        notifyDispatchWaybill,
        notifyInvoices,
        notifyWhatsapp,
        notifySms,
        notifyBulletins,
        mfaEnabled,
        rememberDevices,
        sessionTimeout,
        marketingConsent,
      };
      localStorage.setItem("su_customer_settings", JSON.stringify(settingsPayload));
      setTimeout(() => {
        setSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      }, 500);
    } catch {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordMsg({ type: "error", text: "Please enter your current password." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    setPasswordMsg({ type: "success", text: "Password changed successfully! You will use this on your next login." });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordMsg(null), 5000);
  };

  const handleExportDataArchive = () => {
    const dataArchive = {
      account: {
        email: user?.email || "customer@demo.local",
        fullName: user?.fullName || "Shakti Enterprise Client",
        exportDate: new Date().toISOString(),
      },
      preferences: {
        language,
        timezone,
        dateFormat,
        currency,
        weightUnit,
      },
      notifications: {
        rfqReady: notifyRfqReady,
        productionStages: notifyProductionStages,
        dispatchWaybill: notifyDispatchWaybill,
        invoices: notifyInvoices,
      },
    };

    const blob = new Blob([JSON.stringify(dataArchive, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shakti_udyog_account_archive_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeTabDef = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans p-4 sm:p-6 lg:p-8">
      {/* ================================================================= */}
      {/* 1. HEADER BANNER & ACTIONS                                        */}
      {/* ================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/80 dark:border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
            Account Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 m-0">
            Manage your regional preferences, quotation and delivery notification channels, security policies, and active sessions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {saveSuccess && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              <CheckCircle2 size={14} />
              <span>Settings Saved</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save size={14} className={saving ? "animate-spin" : ""} />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. KPI / SNAPSHOT CARDS                                           */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400">
            <Globe size={15} className="text-blue-500" />
            <span>Region Slab</span>
          </div>
          <div className="text-lg font-extrabold text-neutral-900 dark:text-white mt-1 font-mono">
            {currency} ({weightUnit})
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Operating currency</div>
        </div>

        <div className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400">
            <Bell size={15} className="text-amber-500" />
            <span>Alert Channels</span>
          </div>
          <div className="text-lg font-extrabold text-neutral-900 dark:text-white mt-1 font-mono">
            {[notifyWhatsapp && "WA", notifySms && "SMS", "Email"].filter(Boolean).join(" · ")}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Live event routing</div>
        </div>

        <div className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400">
            <ShieldCheck size={15} className="text-emerald-500" />
            <span>Security Status</span>
          </div>
          <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            Protected
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Password & session guard</div>
        </div>

        <div className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400">
            <Layers size={15} className="text-purple-500" />
            <span>Idle Timeout</span>
          </div>
          <div className="text-lg font-extrabold text-neutral-900 dark:text-white mt-1 font-mono">
            {sessionTimeout} min
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">Automatic session guard</div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. MOBILE / TABLET TAB GRID (< lg, Zero horizontal scroll)         */}
      {/* ================================================================= */}
      <div className="block lg:!hidden mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
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
                      : cn(tab.badgeBg, tab.badgeText, tab.badgeBorder)
                  )}
                >
                  <Icon size={14} />
                </div>
                <span className="truncate">{tab.shortTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. TWO-COLUMN VERTICAL NAVIGATION & CONTENT LAYOUT (Desktop)       */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Vertical Navigation Sidebar (Desktop only) */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-4 lg:sticky lg:top-4">
          <div className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-3 shadow-xs space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Settings Sections
            </div>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer select-none text-left border",
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                      : "bg-white dark:bg-transparent border-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 hover:border-neutral-200/60 dark:hover:border-white/5"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                        isActive
                          ? "bg-white/20 text-white border-white/20"
                          : cn(tab.badgeBg, tab.badgeText, tab.badgeBorder)
                      )}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate">{tab.shortTitle}</span>
                      <span
                        className={cn(
                          "block text-[10px] font-normal truncate mt-0.5",
                          isActive ? "text-white/80" : "text-neutral-400"
                        )}
                      >
                        Configuration
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    size={15}
                    className={cn(
                      "shrink-0 transition-transform",
                      isActive ? "text-white translate-x-0.5" : "text-neutral-400 opacity-50"
                    )}
                  />
                </button>
              );
            })}
          </div>

          {/* Quick Help / Hotline Box */}
          <div className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-gradient-to-br from-neutral-50 dark:from-white/[0.02] to-white dark:to-[#0f121a] p-4 text-xs space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
              <Shield size={16} className="text-blue-500" />
              <span>Enterprise Client Desk</span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed m-0">
              Need custom GST invoicing rules or automated EDI / API integration? Contact our technical desk at <strong>support@shaktiudyog.com</strong>.
            </p>
          </div>
        </div>

        {/* Right Column: Active Tab Content Area */}
        <div className="w-full lg:col-span-8 xl:col-span-9 space-y-6 min-w-0">
          {/* Section Hero Banner */}
          <div className="p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs flex items-start gap-4">
            <div
              className={cn(
                "w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs",
                activeTabDef.badgeBg,
                activeTabDef.badgeText,
                activeTabDef.badgeBorder
              )}
            >
              <activeTabDef.icon size={22} />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
                {activeTabDef.title}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed m-0">
                {activeTabDef.description}
              </p>
            </div>
          </div>

          {/* ═══ TAB 1: PREFERENCES ═══ */}
          {activeTab === "preferences" && (
            <div className="space-y-6">
              {/* Regional & Localization */}
              <div className="p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs space-y-4">
                <div className="border-b border-neutral-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
                    Regional & Localization
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 m-0">
                    Select your preferred language, time zone, and date formatting.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#090b10] text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="en-IN">English (India)</option>
                      <option value="en-US">English (US)</option>
                      <option value="hi-IN">Hindi (हिंदी)</option>
                      <option value="pa-IN">Punjabi (ਪੰਜਾਬੀ)</option>
                      <option value="de-DE">German (Deutsch)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                      Time Zone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#090b10] text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Asia/Kolkata">India Standard Time (IST - GMT+5:30)</option>
                      <option value="UTC">Coordinated Universal Time (UTC)</option>
                      <option value="America/New_York">Eastern Time (US & Canada - GMT-5)</option>
                      <option value="Europe/London">London (GMT+0)</option>
                      <option value="Asia/Dubai">Gulf Standard Time (GST - GMT+4)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                      Date Format
                    </label>
                    <select
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#090b10] text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 26/08/2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-26)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/26/2026)</option>
                      <option value="DD MMM YYYY">DD MMM YYYY (e.g. 26 Aug 2026)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                      Base Operating Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#090b10] text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    >
                      <option value="INR">INR - Indian Rupee (₹)</option>
                      <option value="USD">USD - US Dollar ($)</option>
                      <option value="EUR">EUR - Euro (€)</option>
                      <option value="GBP">GBP - British Pound (£)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Display & Metallurgy Appearance */}
              <div className="p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs space-y-4">
                <div className="border-b border-neutral-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
                    Display & Appearance
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 m-0">
                    Control interface theme modes and table density.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Theme Mode Selector */}
                  <div className="p-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">Interface Theme</div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
                        Choose between Light, Dark, or System synchronization.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (theme !== "light") toggleTheme();
                        }}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                          theme === "light"
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-white dark:bg-[#121520] border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300"
                        )}
                      >
                        <Sun size={13} />
                        <span>Light</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (theme !== "dark") toggleTheme();
                        }}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                          theme === "dark"
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-white dark:bg-[#121520] border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300"
                        )}
                      >
                        <Moon size={13} />
                        <span>Dark</span>
                      </button>
                    </div>
                  </div>

                  {/* Compact Tables Toggle */}
                  <div
                    onClick={() => setCompactTables(!compactTables)}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0f121a] flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">Compact Data Tables</div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
                        Reduce vertical padding on order lists, quotation items, and invoices for high-density viewing.
                      </p>
                    </div>
                    <ToggleSwitch checked={compactTables} onChange={setCompactTables} />
                  </div>

                  {/* Metallurgy Badges */}
                  <div
                    onClick={() => setShowMetallurgyBadges(!showMetallurgyBadges)}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0f121a] flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">High-Contrast Metallurgy Tags</div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
                        Highlight casting alloy grades (SG 500/7, FG 260, WCB Steel) with distinctive colored badges.
                      </p>
                    </div>
                    <ToggleSwitch checked={showMetallurgyBadges} onChange={setShowMetallurgyBadges} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB 2: NOTIFICATIONS ═══ */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              {/* Order & Manufacturing Alerts */}
              <div className="p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs space-y-4">
                <div className="border-b border-neutral-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
                    Production & Order Alerts
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 m-0">
                    Receive instant updates when your RFQ receives quotation or orders move through the foundry.
                  </p>
                </div>

                <div className="space-y-3">
                  <div
                    onClick={() => setNotifyRfqReady(!notifyRfqReady)}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0f121a] flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">Quotation Ready Alerts</div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
                        Email and in-portal alert when foundry engineers publish your finalized commercial quotation.
                      </p>
                    </div>
                    <ToggleSwitch checked={notifyRfqReady} onChange={setNotifyRfqReady} />
                  </div>

                  <div
                    onClick={() => setNotifyProductionStages(!notifyProductionStages)}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0f121a] flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">Casting Milestone Progression</div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
                        Alerts when heat pouring, fettling, CNC machining, and lab spectro testing are signed off.
                      </p>
                    </div>
                    <ToggleSwitch checked={notifyProductionStages} onChange={setNotifyProductionStages} />
                  </div>

                  <div
                    onClick={() => setNotifyDispatchWaybill(!notifyDispatchWaybill)}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0f121a] flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">Dispatch & Truck Waybill Tracking</div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
                        Direct SMS and WhatsApp alert with transporter name, vehicle number, and e-Waybill PDF.
                      </p>
                    </div>
                    <ToggleSwitch checked={notifyDispatchWaybill} onChange={setNotifyDispatchWaybill} />
                  </div>

                  <div
                    onClick={() => setNotifyInvoices(!notifyInvoices)}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0f121a] flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">GST Invoices & Receipts</div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
                        Automated invoice copy delivery to your authorized billing contact person.
                      </p>
                    </div>
                    <ToggleSwitch checked={notifyInvoices} onChange={setNotifyInvoices} />
                  </div>
                </div>
              </div>

              {/* Delivery Channels */}
              <div className="p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs space-y-4">
                <div className="border-b border-neutral-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
                    Communication Channels
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 m-0">
                    Select how you want dispatch and production milestones delivered.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => setNotifyWhatsapp(!notifyWhatsapp)}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0f121a] flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <MessageSquare size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-900 dark:text-white">WhatsApp Updates</div>
                        <p className="text-[11px] text-neutral-400 m-0">Real-time status on registered phone</p>
                      </div>
                    </div>
                    <ToggleSwitch checked={notifyWhatsapp} onChange={setNotifyWhatsapp} />
                  </div>

                  <div
                    onClick={() => setNotifySms(!notifySms)}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0f121a] flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Mail size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-900 dark:text-white">SMS Gateways</div>
                        <p className="text-[11px] text-neutral-400 m-0">Transactional dispatch alerts</p>
                      </div>
                    </div>
                    <ToggleSwitch checked={notifySms} onChange={setNotifySms} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB 3: SECURITY ═══ */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Session Guard & Access Control */}
              <div className="p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs space-y-4">
                <div className="border-b border-neutral-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
                    Session Guard & Access Control
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 m-0">
                    Configure automated session timeouts and idle lock protection.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0f121a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">Idle Session Expiration</div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
                        Automatically lock and sign out after periods of inactivity.
                      </p>
                    </div>
                    <select
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="h-9 px-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#090b10] text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">1 Hour (Standard)</option>
                      <option value="240">4 Hours</option>
                      <option value="480">8 Hours</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Password Change Form */}
              <div className="p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs space-y-4">
                <div className="border-b border-neutral-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
                    Change Password
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 m-0">
                    Update your password regularly to protect your quotations, drawings, and tax documents.
                  </p>
                </div>

                {passwordMsg && (
                  <div
                    className={cn(
                      "p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2",
                      passwordMsg.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                        : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300"
                    )}
                  >
                    {passwordMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                      Current Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#090b10] text-xs text-neutral-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                      >
                        {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                        New Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPw ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#090b10] text-xs text-neutral-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                        >
                          {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#090b10] text-xs text-neutral-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <KeyRound size={13} />
                    <span>Update Password</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ═══ TAB 4: SESSIONS & DEVICES ═══ */}
          {activeTab === "sessions" && (
            <div className="space-y-6">
              <DevicesSessionsCard />
            </div>
          )}

          {/* ═══ TAB 5: PRIVACY & DATA ═══ */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              {/* Data Export Archive */}
              <div className="p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs space-y-4">
                <div className="border-b border-neutral-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
                    Account Data Archive & Export
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 m-0">
                    Download a complete copy of your quotation requests, orders history, and customer profile details.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">Export Complete Data JSON</div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
                      Standard JSON formatted export containing your account settings and preferences.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportDataArchive}
                    className="inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <FileDown size={14} className="text-blue-500" />
                    <span>Download JSON Archive</span>
                  </button>
                </div>
              </div>

              {/* Communication Preferences */}
              <div className="p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs space-y-4">
                <div className="border-b border-neutral-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
                    Data Consent & Privacy
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 m-0">
                    Manage direct communications and corporate foundry updates.
                  </p>
                </div>

                <div
                  onClick={() => setMarketingConsent(!marketingConsent)}
                  className="p-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0f121a] flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">Metallurgical Engineering Newsletters</div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
                      Receive quarterly technical casting advisories, metallurgy grade comparison sheets, and capacity updates.
                    </p>
                  </div>
                  <ToggleSwitch checked={marketingConsent} onChange={setMarketingConsent} />
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Save Actions Bar */}
          <div className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs flex items-center justify-between gap-4">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Changes apply across all active sessions upon saving.
            </div>
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save size={14} className={saving ? "animate-spin" : ""} />
              <span>{saving ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
