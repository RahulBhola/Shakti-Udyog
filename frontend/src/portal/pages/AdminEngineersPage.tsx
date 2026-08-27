import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch } from "../../api/client";
import { adminApi } from "../../api/adminApi";
import { EmptyState, Loading } from "../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { formatDate } from "../shared";
import {
  RefreshCw, ChevronLeft, ChevronRight, X, Eye,
  Mail, Phone, Copy, Check,
  UserCheck, UserPlus, Wrench, Sparkles,
  Clock, Calendar, Search, Power, CheckCircle2,
  EyeOff, ShieldCheck, HardHat, Ban,
} from "lucide-react";
import { ProfileCompletenessBadge, ProfileProgressBar, calculateProfileCompleteness } from "../components/ProfileCompletion";
import "./erpListView.css";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EngineerUser {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  createdAtUtc: string;
  lastLoginAtUtc: string | null;
  companyName: string | null;
  role: string;
}

interface Filters {
  search: string;
  status: string;
}

const EMPTY_FILTERS: Filters = { search: "", status: "All" };
const PAGE_SIZES = [10, 20, 50, 100];

/* ------------------------------------------------------------------ */
/*  Avatar Colors & Helpers                                            */
/* ------------------------------------------------------------------ */

const AVATAR_PALETTES = [
  { bg: "rgba(59,130,246,0.15)", fg: "#3B82F6", border: "rgba(59,130,246,0.3)" },
  { bg: "rgba(168,85,247,0.15)", fg: "#A855F7", border: "rgba(168,85,247,0.3)" },
  { bg: "rgba(20,184,166,0.15)", fg: "#14B8A6", border: "rgba(20,184,166,0.3)" },
  { bg: "rgba(249,115,22,0.15)", fg: "#F97316", border: "rgba(249,115,22,0.3)" },
  { bg: "rgba(236,72,153,0.15)", fg: "#EC4899", border: "rgba(236,72,153,0.3)" },
  { bg: "rgba(34,197,94,0.15)", fg: "#22C55E", border: "rgba(34,197,94,0.3)" },
];

function getAvatarStyle(identifier: string) {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function initials(name: string | null, email?: string): string {
  if (name && name.trim()) {
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return "?";
}

function lastLoginLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  return formatDate(iso);
}

function generateStrongPassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";
  let res = "Eng!";
  for (let i = 0; i < 16; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

/* ------------------------------------------------------------------ */
/*  Create Engineer Modal                                              */
/* ------------------------------------------------------------------ */

function CreateEngineerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (createdEmail: string) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePassword = () => {
    const pwd = generateStrongPassword();
    setPassword(pwd);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter the engineer's full name.");
      return;
    }
    if (!password || password.length < 12) {
      setError("Password must be at least 12 characters long.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.createEngineer({
        fullName: fullName.trim(),
        password,
        email: email.trim() ? email.trim() : undefined,
      });
      onCreated(res.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create engineer profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-[#121520] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between bg-blue-500/5">
          <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm m-0 text-neutral-900 dark:text-white">Create Engineer Profile</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 m-0">Provision internal technical team credentials</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-900 dark:text-white outline-none focus:border-blue-500"
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Email Address
                </label>
                <span className="text-[11px] text-neutral-400">(Optional - auto generated if empty)</span>
              </div>
              <input
                type="email"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-900 dark:text-white outline-none focus:border-blue-500"
                placeholder="e.g. rahul.sharma@shaktiudyog.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-[11px] text-neutral-400 m-0">
                If left blank, email will be auto-generated as <span className="font-mono text-neutral-500 dark:text-neutral-400">firstname.lastname@shaktiudyog.local</span>
              </p>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Initial Password <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Sparkles size={12} />
                  <span>Auto Generate</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-900 dark:text-white outline-none focus:border-blue-500 font-mono"
                  placeholder="Minimum 12 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={12}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-[11px] text-neutral-400 m-0">
                Must contain at least 12 characters. The engineer can update their password upon first login.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-neutral-50 dark:bg-white/[0.02] border-t border-neutral-100 dark:border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-neutral-400">Role will default to <strong>Engineer</strong></span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
              >
                <UserPlus size={14} />
                <span>{loading ? "Creating..." : "Create Engineer"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom Status Confirmation Modal (Deactivate / Activate)           */
/* ------------------------------------------------------------------ */

function EngineerStatusModal({
  user,
  onClose,
  onConfirm,
  loading,
}: {
  user: EngineerUser;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const isDeactivating = user.isActive;
  const palette = getAvatarStyle(user.fullName || user.email);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-[#121520] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className={`px-6 py-4 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between ${
          isDeactivating ? "bg-amber-500/5 text-amber-600 dark:text-amber-400" : "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDeactivating ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
            }`}>
              <Power size={17} />
            </div>
            <h3 className="font-extrabold text-sm m-0">
              {isDeactivating ? "Deactivate Engineer Profile" : "Activate Engineer Profile"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* User Preview Card */}
          <div className="p-3.5 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/[0.02] flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm border shadow-xs shrink-0"
              style={{ background: palette.bg, color: palette.fg, borderColor: palette.border }}
            >
              {initials(user.fullName, user.email)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                {user.fullName || "Unnamed Engineer"}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate">
                {user.email}
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
              <Wrench size={12} /> Engineer
            </span>
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">
            {isDeactivating ? (
              <>
                Are you sure you want to deactivate <strong className="text-neutral-900 dark:text-white">{user.fullName || user.email}</strong>?
                The engineer will be immediately restricted from accessing the shop floor board, cost estimation tools, and customer enquiries.
              </>
            ) : (
              <>
                Activate <strong className="text-neutral-900 dark:text-white">{user.fullName || user.email}</strong> to restore full access to engineering tasks and production workflows.
              </>
            )}
          </p>

          <div className={`p-3 rounded-xl text-xs leading-relaxed font-medium border ${
            isDeactivating
              ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
          }`}>
            {isDeactivating ? (
              <span><strong>Note:</strong> All past cost calculations, technical reviews, and engineering assignments remain preserved.</span>
            ) : (
              <span><strong>Note:</strong> The engineer can sign in immediately with their existing credentials.</span>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-neutral-50 dark:bg-white/[0.02] border-t border-neutral-100 dark:border-white/10 flex items-center justify-end gap-2.5">
          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-sm cursor-pointer ${
              isDeactivating
                ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
            }`}
          >
            <Power size={13} />
            <span>{loading ? "Updating..." : isDeactivating ? "Deactivate Engineer" : "Activate Engineer"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Engineer Profile RHS Drawer                                        */
/* ------------------------------------------------------------------ */

function EngineerDetailsDrawer({
  user,
  onClose,
  onOpenStatusModal,
}: {
  user: EngineerUser;
  onClose: () => void;
  onOpenStatusModal: (u: EngineerUser) => void;
}) {
  const [copied, setCopied] = useState(false);
  const palette = getAvatarStyle(user.fullName || user.email);

  const copyEmail = () => {
    navigator.clipboard.writeText(user.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 animate-in fade-in duration-200" onClick={onClose} />
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-[#0c0f17] border-l border-neutral-200 dark:border-white/10 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#0f121a] shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm border shadow-xs"
              style={{ background: palette.bg, color: palette.fg, borderColor: palette.border }}
            >
              {initials(user.fullName, user.email)}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-neutral-900 dark:text-white m-0">
                {user.fullName || "Engineer Profile"}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0 mt-0.5 font-mono">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Role Banner */}
          <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/60 dark:bg-white/[0.02] flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Assigned Role</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  <Wrench size={13} />
                  <span>Technical Engineer</span>
                </span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 text-right">Status</div>
              <div className="mt-1.5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                  user.isActive
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-300 dark:border-white/10"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${user.isActive ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"}`} />
                  <span>{user.isActive ? "Active Staff" : "Deactivated"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Profile Completion Status Bar */}
          {(() => {
            const result = calculateProfileCompleteness(user);
            return (
              <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#121520] space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" /> Profile Completion
                  </span>
                  <ProfileCompletenessBadge percentage={result.percentage} />
                </div>
                <ProfileProgressBar percentage={result.percentage} size="sm" showLabel={false} />
                <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                  <span>{result.completedItems.length} of {result.items.length} details provided</span>
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">{result.statusLabel}</span>
                </div>
              </div>
            );
          })()}

          {/* Access & Capabilities Badge Cards */}
          <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/[0.03] space-y-3">
            <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <ShieldCheck size={15} /> Platform Authorizations
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#121520] border border-neutral-200/80 dark:border-white/10 flex items-center gap-2">
                <HardHat size={14} className="text-orange-500" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Shop Floor Board</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#121520] border border-neutral-200/80 dark:border-white/10 flex items-center gap-2">
                <Wrench size={14} className="text-blue-500" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Cost Estimation</span>
              </div>
            </div>
          </div>

          {/* Contact Details List */}
          <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#121520] p-4 space-y-3 shadow-xs">
            <div className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-100 dark:border-white/5">
              Contact & Record Details
            </div>

            <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-white/5">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Mail size={13} className="text-orange-500" /> Email Address
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-900 dark:text-white font-mono">{user.email}</span>
                <button
                  type="button"
                  onClick={copyEmail}
                  className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
                  title="Copy email"
                >
                  {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-white/5">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Phone size={13} className="text-blue-500" /> Phone Number
              </span>
              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                {user.phoneNumber || <span className="text-neutral-400/60 italic font-normal">Not provided</span>}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-white/5">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Calendar size={13} className="text-teal-500" /> Account Since
              </span>
              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                {formatDate(user.createdAtUtc)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-white/5">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Clock size={13} className="text-emerald-500" /> Profile Updated
              </span>
              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                {user.lastLoginAtUtc ? formatDate(user.lastLoginAtUtc) : formatDate(user.createdAtUtc)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Clock size={13} className="text-amber-500" /> Last Active
              </span>
              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                {lastLoginLabel(user.lastLoginAtUtc) ?? <span className="text-neutral-400/60 font-normal">Never logged in</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-[#0f121a] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <a
              href={`mailto:${user.email}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-200/80 dark:bg-white/10 text-neutral-800 dark:text-white text-xs font-bold hover:bg-neutral-300 dark:hover:bg-white/20 transition-all"
            >
              <Mail size={13} />
              <span>Email</span>
            </a>

            <button
              type="button"
              onClick={() => onOpenStatusModal(user)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                user.isActive
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              <Power size={13} />
              <span>{user.isActive ? "Deactivate" : "Activate"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function AdminEngineersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.roles.includes("Admin");
  const [users, setUsers] = useState<EngineerUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewing, setViewing] = useState<EngineerUser | null>(null);
  const [statusUser, setStatusUser] = useState<EngineerUser | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const load = useCallback((isManual = false) => {
    if (isManual) setRefreshing(true);
    return apiGet<EngineerUser[]>("/api/v1/admin/users")
      .then((all) => {
        setUsers(all.filter((u) => u.role === "Engineer"));
        if (isManual) {
          setFeedbackNotice("Engineer roster refreshed successfully.");
          setTimeout(() => setFeedbackNotice(null), 2500);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => {
        if (isManual) setRefreshing(false);
      });
  }, []);

  useEffect(() => { void load(false); }, [load]);

  const filtered = useMemo(() => {
    return (users ?? []).filter((u) => {
      const q = filters.search.trim().toLowerCase();
      if (q) {
        const nameMatch = (u.fullName ?? "").toLowerCase().includes(q);
        const emailMatch = u.email.toLowerCase().includes(q);
        const phoneMatch = (u.phoneNumber ?? "").toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !phoneMatch) return false;
      }
      if (filters.status === "Active" && !u.isActive) return false;
      if (filters.status === "Inactive" && u.isActive) return false;
      return true;
    });
  }, [users, filters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const kpis = useMemo(() => {
    const list = users ?? [];
    const now = new Date();
    return {
      total: list.length,
      active: list.filter((u) => u.isActive).length,
      inactive: list.filter((u) => !u.isActive).length,
      newThisMonth: list.filter((u) => {
        const d = new Date(u.createdAtUtc);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }).length,
    };
  }, [users]);

  // Status Change execution
  async function handleToggleStatusConfirm() {
    if (!statusUser) return;
    setStatusLoading(true);
    try {
      await apiPatch(`/api/v1/admin/users/${statusUser.id}/toggle-active`, {});
      setFeedbackNotice(`Engineer "${statusUser.fullName || statusUser.email}" is now ${statusUser.isActive ? "Deactivated" : "Active"}.`);
      setTimeout(() => setFeedbackNotice(null), 3000);
      if (viewing?.id === statusUser.id) {
        setViewing({ ...viewing, isActive: !viewing.isActive });
      }
      setStatusUser(null);
      load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not update user status");
    } finally {
      setStatusLoading(false);
    }
  }

  if (!isAdmin) {
    return (
      <EmptyState
        title="Access Restricted"
        text="Only Administrators are authorized to view and manage Engineer profiles."
      />
    );
  }

  if (error) return <EmptyState title="Engineers unavailable" text={error} />;
  if (!users) return <div className="py-24 text-center"><Loading label="Loading engineers roster..." /></div>;

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* 1. HERO HEADER                                                    */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-sm">
            <Wrench size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
                Engineer Roster
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {kpis.total} Total Staff
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
              Manage technical staff responsible for technical feasibility review, BOM cost estimation, quote preparation, and shop floor tasks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold transition-all shadow-sm shadow-orange-500/20 cursor-pointer"
          >
            <UserPlus size={15} />
            <span>Add Engineer Profile</span>
          </button>

          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer disabled:opacity-60"
            title="Refresh Engineers"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin text-blue-500" : ""} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {feedbackNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. KPI METRICS CARDS                                              */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Total Engineers */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(59,130,246,0.18),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Wrench size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight">
            {kpis.total}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Total Engineers</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Admin-provisioned staff</div>
        </div>

        {/* Active Staff */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(16,185,129,0.18),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <UserCheck size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight">
            {kpis.active}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Active Staff</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Authorized for shop floor</div>
        </div>

        {/* Inactive / On Leave */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(249,115,22,0.18),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Ban size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight">
            {kpis.inactive}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Inactive / Suspended</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Temporarily suspended</div>
        </div>

        {/* New This Month */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(20,184,166,0.18),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight">
            {kpis.newThisMonth}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">New This Month</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Recently onboarded</div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. TOOLBAR & SEGMENTED FILTER TABS                                 */}
      {/* ================================================================= */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Real-time Search Input */}
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => {
                setFilters((f) => ({ ...f, search: e.target.value }));
                setPage(1);
              }}
              placeholder="Search engineers by name, email..."
              className="w-full pl-10 pr-4 h-10 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-blue-500 shadow-xs"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, search: "" }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Segmented Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { label: "All Engineers", status: "All", count: kpis.total },
              { label: "Active Staff", status: "Active", count: kpis.active },
              { label: "Inactive", status: "Inactive", count: kpis.inactive },
            ].map((tab) => {
              const isCurrent = filters.status === tab.status;

              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    setFilters((f) => ({ ...f, status: tab.status }));
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    isCurrent ? "bg-white/20 text-white" : "bg-neutral-200/70 dark:bg-white/10 text-neutral-500 dark:text-neutral-400"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}

            {(filters.search || filters.status !== "All") && (
              <button
                type="button"
                onClick={() => { setFilters(EMPTY_FILTERS); setPage(1); }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. MODERN HIGH-END TABLE                                           */}
      {/* ================================================================= */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-24 text-center text-neutral-400 space-y-2">
            <Wrench size={44} className="mx-auto opacity-30 text-blue-500" />
            <p className="text-sm font-medium text-neutral-500">No engineers match the current filter.</p>
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ minWidth: 1000 }}>
              <thead>
                <tr className="bg-neutral-50/80 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10">
                  <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Engineer
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Role & Scope
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Contact Email
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Onboarded Date
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Profile Status
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Status
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Last Login
                  </th>
                  <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.04]">
                {paged.map((u) => {
                  const palette = getAvatarStyle(u.fullName || u.email);

                  return (
                    <tr
                      key={u.id}
                      onClick={() => setViewing(u)}
                      className="hover:bg-neutral-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      {/* Engineer Name & Identity */}
                      <td className="py-3.5 px-5 align-middle">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm border shadow-xs shrink-0"
                            style={{ background: palette.bg, color: palette.fg, borderColor: palette.border }}
                          >
                            {initials(u.fullName, u.email)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                              {u.fullName || "Unnamed Engineer"}
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                              Technical Staff
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-xs">
                          <Wrench size={12} className="shrink-0 text-blue-500" />
                          <span>Engineer Staff</span>
                        </span>
                      </td>

                      {/* Contact Email */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                          <Mail size={12} className="text-orange-500 shrink-0" />
                          <span className="font-mono truncate max-w-[200px]">{u.email}</span>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          {formatDate(u.createdAtUtc)}
                        </div>
                      </td>

                      {/* Profile Completeness Status */}
                      <td className="py-3.5 px-4 align-middle">
                        <ProfileCompletenessBadge percentage={calculateProfileCompleteness(u).percentage} compact />
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-3.5 px-4 align-middle" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setStatusUser(u)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border transition-all whitespace-nowrap cursor-pointer hover:shadow-xs ${
                            u.isActive
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                              : "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-300 dark:border-white/10 hover:bg-neutral-500/20"
                          }`}
                          title="Click to toggle Active / Deactivated"
                        >
                          <span className={`w-2 h-2 rounded-full ${u.isActive ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"}`} />
                          <span>{u.isActive ? "Active" : "Inactive"}</span>
                        </button>
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                          <Clock size={12} className="text-neutral-400 shrink-0" />
                          <span>{lastLoginLabel(u.lastLoginAtUtc) ?? <span className="text-neutral-400/50 font-normal">Never</span>}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewing(u)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-xs transition-all cursor-pointer"
                            title="View Full Profile"
                          >
                            <Eye size={14} />
                          </button>

                          <a
                            href={`mailto:${u.email}`}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-xs transition-all"
                            title="Send Direct Email"
                          >
                            <Mail size={14} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ================================================================= */}
        {/* PAGINATION FOOTER                                                 */}
        {/* ================================================================= */}
        <div className="p-4 bg-neutral-50/60 dark:bg-white/[0.01] border-t border-neutral-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-3">
            <span>
              Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length} engineers
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-neutral-400">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 text-xs rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === pageCount || Math.abs(n - safePage) <= 1)
              .map((n, idx, arr) => (
                <div key={n} className="flex items-center">
                  {idx > 0 && n - arr[idx - 1] > 1 && (
                    <span className="px-1 text-neutral-400">...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      n === safePage
                        ? "bg-blue-600 text-white shadow-xs"
                        : "border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5"
                    }`}
                  >
                    {n}
                  </button>
                </div>
              ))}

            <button
              type="button"
              disabled={safePage >= pageCount}
              onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 5. VIEW PROFILE RHS SLIDING DRAWER                                */}
      {/* ================================================================= */}
      {viewing && (
        <EngineerDetailsDrawer
          user={viewing}
          onClose={() => setViewing(null)}
          onOpenStatusModal={(u) => setStatusUser(u)}
        />
      )}

      {/* ================================================================= */}
      {/* 6. STATUS CHANGE CONFIRMATION MODAL (DEACTIVATE / ACTIVATE)       */}
      {/* ================================================================= */}
      {statusUser && (
        <EngineerStatusModal
          user={statusUser}
          onClose={() => setStatusUser(null)}
          onConfirm={() => void handleToggleStatusConfirm()}
          loading={statusLoading}
        />
      )}

      {/* ================================================================= */}
      {/* 7. CREATE ENGINEER MODAL                                          */}
      {/* ================================================================= */}
      {showCreateModal && (
        <CreateEngineerModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(createdEmail) => {
            setShowCreateModal(false);
            setFeedbackNotice(`Engineer account successfully created for ${createdEmail}`);
            setTimeout(() => setFeedbackNotice(null), 3500);
            load();
          }}
        />
      )}
    </div>
  );
}
