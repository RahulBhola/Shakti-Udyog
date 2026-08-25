import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch, apiDelete } from "../../api/client";
import { adminApi } from "../../api/adminApi";
import { EmptyState, Loading } from "../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { formatDate } from "../shared";
import {
  RefreshCw, ChevronLeft, ChevronRight, X, Eye,
  Mail, Phone, Copy, Check, Filter,
  User as UserIcon, Users, UserCheck, Crown,
  Trash2, AlertTriangle, Shield, Wrench, Building2,
  Sparkles, Clock, Calendar, Search,
  Power, CheckCircle2,
} from "lucide-react";
import "./erpListView.css";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AdminUser {
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
  role: string;
  status: string;
  company: string;
  joinedFrom: string;
  joinedTo: string;
}

const EMPTY_FILTERS: Filters = {
  search: "",
  role: "All",
  status: "All",
  company: "All",
  joinedFrom: "",
  joinedTo: "",
};

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

/* ------------------------------------------------------------------ */
/*  Role Badge Component                                               */
/* ------------------------------------------------------------------ */

function RoleBadge({ role }: { role: string }) {
  const r = role?.trim() || "Customer";
  if (r === "Admin") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-xs">
        <Shield size={12} className="shrink-0 text-purple-500" />
        <span>Administrator</span>
      </span>
    );
  }
  if (r === "Engineer") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-xs">
        <Wrench size={12} className="shrink-0 text-blue-500" />
        <span>Engineer</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
      <Building2 size={12} className="shrink-0 text-emerald-500" />
      <span>Customer</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Modern Custom Status Confirmation Modal (Deactivate / Activate)    */
/* ------------------------------------------------------------------ */

function StatusConfirmModal({
  user,
  onClose,
  onConfirm,
  loading,
}: {
  user: AdminUser;
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
              {isDeactivating ? "Deactivate User Account" : "Activate User Account"}
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
                {user.fullName || "Unnamed User"}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate">
                {user.email}
              </div>
            </div>
            <RoleBadge role={user.role} />
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">
            {isDeactivating ? (
              <>
                Are you sure you want to deactivate <strong className="text-neutral-900 dark:text-white">{user.fullName || user.email}</strong>?
                The user will be immediately blocked from signing in to the platform.
              </>
            ) : (
              <>
                Activate <strong className="text-neutral-900 dark:text-white">{user.fullName || user.email}</strong> to restore full access to their account.
              </>
            )}
          </p>

          <div className={`p-3 rounded-xl text-xs leading-relaxed font-medium border ${
            isDeactivating
              ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
          }`}>
            {isDeactivating ? (
              <span><strong>Note:</strong> All existing orders, quotations, enquiries, and audit records will remain completely intact.</span>
            ) : (
              <span><strong>Note:</strong> The user can immediately sign in with their existing credentials.</span>
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
            <span>{loading ? "Updating..." : isDeactivating ? "Deactivate Account" : "Activate Account"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Clean Test Clutter Confirm Modal                                   */
/* ------------------------------------------------------------------ */

function CleanTestsConfirmModal({
  count,
  onClose,
  onConfirm,
  loading,
}: {
  count: number;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-[#121520] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between bg-amber-500/5 text-amber-600 dark:text-amber-400">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Sparkles size={17} />
            </div>
            <h3 className="font-extrabold text-sm m-0">Clean Test Accounts</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">
            Found <strong className="text-amber-500 font-bold">{count} temporary test accounts</strong> generated during automated test runs (e.g. <span className="font-mono text-neutral-500">sessiontest_</span>, <span className="font-mono text-neutral-500">rotatetest_</span>).
          </p>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
            <strong>Cleanup Action:</strong> This will purge these test user records, session tokens, and temporary company records to keep your database clean.
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm shadow-amber-500/20 cursor-pointer"
          >
            <Sparkles size={13} />
            <span>{loading ? "Cleaning..." : "Purge Test Accounts"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Delete Confirm Modal                                               */
/* ------------------------------------------------------------------ */

function DeleteConfirmModal({
  user,
  onClose,
  onConfirm,
  loading,
}: {
  user: AdminUser;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const [typed, setTyped] = useState("");
  const isMatch = typed.trim().toLowerCase() === "delete";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-[#121520] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between bg-red-500/5">
          <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle size={17} />
            </div>
            <h3 className="font-extrabold text-sm m-0">Delete User Account</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">
            Are you sure you want to permanently delete the account for{" "}
            <strong className="text-neutral-900 dark:text-white">{user.fullName || user.email}</strong>?
          </p>

          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 leading-relaxed font-medium">
            <strong>Warning:</strong> This action is irreversible. All sessions, refresh tokens, and direct permissions will be terminated immediately.
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
              To confirm, type <span className="text-red-500 font-mono font-bold">delete</span> below:
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-300 dark:border-white/10 bg-white dark:bg-[#161a26] text-neutral-900 dark:text-white outline-none focus:border-red-500"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type 'delete' to confirm"
              autoFocus
            />
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
            disabled={!isMatch || loading}
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm shadow-red-500/20 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>{loading ? "Deleting..." : "Permanently Delete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  User Profile RHS Drawer                                            */
/* ------------------------------------------------------------------ */

function UserDetailsDrawer({
  user,
  isSelfUser,
  onClose,
  onOpenStatusModal,
  onDeleteUser,
}: {
  user: AdminUser;
  isSelfUser: boolean;
  onClose: () => void;
  onOpenStatusModal: (u: AdminUser) => void;
  onDeleteUser?: (u: AdminUser) => void;
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
        {/* Drawer Header */}
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
                {user.fullName || "User Profile"}
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

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Identity & Status Header Banner */}
          <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/60 dark:bg-white/[0.02] flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Account Access</div>
              <div className="flex items-center gap-2 mt-1.5">
                <RoleBadge role={user.role} />
                {isSelfUser && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    You (Current Session)
                  </span>
                )}
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
                  <span>{user.isActive ? "Active Account" : "Deactivated"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Profile Specifications List */}
          <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#121520] p-4 space-y-3 shadow-xs">
            <div className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-100 dark:border-white/5">
              Contact & Organization Information
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
                <Building2 size={13} className="text-purple-500" /> Organization / Company
              </span>
              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                {user.companyName || <span className="text-neutral-400/80 font-medium">Internal Staff</span>}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-white/5">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Calendar size={13} className="text-teal-500" /> Registered On
              </span>
              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                {formatDate(user.createdAtUtc)}
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

        {/* Drawer Footer Actions */}
        <div className="p-6 border-t border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-[#0f121a] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <a
              href={`mailto:${user.email}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-200/80 dark:bg-white/10 text-neutral-800 dark:text-white text-xs font-bold hover:bg-neutral-300 dark:hover:bg-white/20 transition-all"
            >
              <Mail size={13} />
              <span>Email</span>
            </a>

            {!isSelfUser && (
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
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isSelfUser && onDeleteUser && (
              <button
                type="button"
                onClick={() => onDeleteUser(user)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewing, setViewing] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusUser, setStatusUser] = useState<AdminUser | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showCleanTestsModal, setShowCleanTestsModal] = useState(false);
  const [cleaningTests, setCleaningTests] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const load = useCallback((isManual = false) => {
    if (isManual) setRefreshing(true);
    return apiGet<AdminUser[]>("/api/v1/admin/users")
      .then((data) => {
        setUsers(data);
        if (isManual) {
          setFeedbackNotice("Users directory refreshed successfully.");
          setTimeout(() => setFeedbackNotice(null), 2500);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => {
        if (isManual) setRefreshing(false);
      });
  }, []);

  useEffect(() => { void load(false); }, [load]);

  // Companies list
  const companies = useMemo(() => {
    if (!users) return [] as string[];
    return Array.from(new Set(users.map((u) => u.companyName).filter((c): c is string => !!c))).sort();
  }, [users]);

  // Check how many test accounts exist in the current user list
  const testUsersCount = useMemo(() => {
    if (!users) return 0;
    return users.filter((u) =>
      u.email.startsWith("sessiontest_") ||
      u.email.startsWith("rotatetest_") ||
      u.email.includes(".test.local")
    ).length;
  }, [users]);

  // Filtered users
  const filtered = useMemo(() => {
    return (users ?? []).filter((u) => {
      const q = filters.search.trim().toLowerCase();
      if (q) {
        const nameMatch = (u.fullName ?? "").toLowerCase().includes(q);
        const emailMatch = u.email.toLowerCase().includes(q);
        const phoneMatch = (u.phoneNumber ?? "").toLowerCase().includes(q);
        const companyMatch = (u.companyName ?? "").toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !phoneMatch && !companyMatch) return false;
      }

      if (filters.role !== "All" && u.role !== filters.role) return false;
      if (filters.status === "Active" && !u.isActive) return false;
      if (filters.status === "Inactive" && u.isActive) return false;
      if (filters.company !== "All" && (u.companyName ?? "") !== filters.company) return false;

      if (filters.joinedFrom && new Date(u.createdAtUtc) < new Date(filters.joinedFrom)) return false;
      if (filters.joinedTo) {
        const end = new Date(filters.joinedTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(u.createdAtUtc) > end) return false;
      }
      return true;
    });
  }, [users, filters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Global KPI stats
  const kpis = useMemo(() => {
    const list = users ?? [];
    return {
      total: list.length,
      active: list.filter((u) => u.isActive).length,
      inactive: list.filter((u) => !u.isActive).length,
      admins: list.filter((u) => u.role === "Admin").length,
      engineers: list.filter((u) => u.role === "Engineer").length,
      customers: list.filter((u) => u.role === "Customer").length,
    };
  }, [users]);

  // Clean Test Accounts Execution
  const handleCleanTestAccounts = async () => {
    setCleaningTests(true);
    try {
      const res = await adminApi.cleanTestUsers();
      setFeedbackNotice(res.message || "Test accounts cleaned up successfully.");
      setTimeout(() => setFeedbackNotice(null), 3000);
      setShowCleanTestsModal(false);
      load();
    } catch (e: any) {
      window.alert(e instanceof Error ? e.message : "Failed to clean test accounts.");
    } finally {
      setCleaningTests(false);
    }
  };

  // Toggle User Active Status Execution
  async function handleToggleStatusConfirm() {
    if (!statusUser) return;
    setStatusLoading(true);
    try {
      await apiPatch(`/api/v1/admin/users/${statusUser.id}/toggle-active`, {});
      setFeedbackNotice(`"${statusUser.fullName || statusUser.email}" is now ${statusUser.isActive ? "Deactivated" : "Active"}.`);
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

  // Delete User Confirmation Execution
  async function handleDeleteConfirm() {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      await apiDelete(`/api/v1/admin/users/${deletingUser.id}`);
      setFeedbackNotice(`User account "${deletingUser.fullName || deletingUser.email}" deleted permanently.`);
      setTimeout(() => setFeedbackNotice(null), 3000);
      setDeletingUser(null);
      if (viewing?.id === deletingUser.id) setViewing(null);
      load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Failed to delete user account.");
    } finally {
      setDeleteLoading(false);
    }
  }

  const isSelf = (u: AdminUser) => currentUser != null && String(u.id) === String(currentUser.id);

  if (error) return <EmptyState title="Users directory unavailable" text={error} />;
  if (!users) return <div className="py-24 text-center"><Loading label="Loading users directory..." /></div>;

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* 1. HERO HEADER                                                    */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shadow-sm">
            <Users size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
                User Management
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200/70 dark:border-white/10">
                {kpis.total} Total Users
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
              Manage platform accounts, security permissions, organization mappings, and user activity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {testUsersCount > 0 && (
            <button
              type="button"
              onClick={() => setShowCleanTestsModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Clean up test accounts generated during test runs"
            >
              <Sparkles size={14} />
              <span>Clean Test Clutter ({testUsersCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer disabled:opacity-60"
            title="Refresh Users"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin text-orange-500" : ""} />
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Total Users</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-xl font-extrabold text-neutral-900 dark:text-white mt-2">{kpis.total}</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">All platform accounts</div>
        </div>

        <div className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Admins</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Crown size={16} />
            </div>
          </div>
          <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">{kpis.admins}</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Full governance rights</div>
        </div>

        <div className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Engineers</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Wrench size={16} />
            </div>
          </div>
          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">{kpis.engineers}</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Production board access</div>
        </div>

        <div className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Customers</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Building2 size={16} />
            </div>
          </div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{kpis.customers}</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Client portal accounts</div>
        </div>

        <div className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Active Accounts</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="text-xl font-extrabold text-teal-600 dark:text-teal-400 mt-2">{kpis.active}</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            {kpis.inactive > 0 ? `${kpis.inactive} Deactivated` : "100% Active"}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. TOOLBAR & SEGMENTED FILTER TABS                                 */}
      {/* ================================================================= */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Real-time Search Input */}
          <div className="relative w-full lg:w-96">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => {
                setFilters((f) => ({ ...f, search: e.target.value }));
                setPage(1);
              }}
              placeholder="Search by name, email, phone, company..."
              className="w-full pl-10 pr-4 h-10 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-orange-500 shadow-xs"
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

          {/* Quick Segmented Role Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { label: "All Users", role: "All", status: "All", count: kpis.total },
              { label: "Admins", role: "Admin", status: "All", count: kpis.admins },
              { label: "Engineers", role: "Engineer", status: "All", count: kpis.engineers },
              { label: "Customers", role: "Customer", status: "All", count: kpis.customers },
              { label: "Active", role: "All", status: "Active", count: kpis.active },
              { label: "Inactive", role: "All", status: "Inactive", count: kpis.inactive },
            ].map((tab) => {
              const isCurrent =
                filters.role === tab.role &&
                (tab.status === "All" || filters.status === tab.status);

              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    setFilters((f) => ({
                      ...f,
                      role: tab.role,
                      status: tab.status,
                    }));
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
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

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                showAdvancedFilters || filters.company !== "All" || filters.joinedFrom || filters.joinedTo
                  ? "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  : "border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
              }`}
            >
              <Filter size={13} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Bar */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-neutral-100 dark:border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">Company / Organization</label>
              <select
                value={filters.company}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, company: e.target.value }));
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-orange-500"
              >
                <option value="All">All Companies</option>
                {companies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">Joined From Date</label>
              <input
                type="date"
                value={filters.joinedFrom}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, joinedFrom: e.target.value }));
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">Joined To Date</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.joinedTo}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, joinedTo: e.target.value }));
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Reset all filters"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 4. MODERN HIGH-END TABLE                                           */}
      {/* ================================================================= */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-24 text-center text-neutral-400 space-y-2">
            <UserIcon size={44} className="mx-auto opacity-30" />
            <p className="text-sm font-medium text-neutral-500">No users match the current search or filters.</p>
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="text-xs text-[var(--color-primary)] hover:underline font-bold cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ minWidth: 1100 }}>
              <thead>
                <tr className="bg-neutral-50/80 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10">
                  <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    User & Identity
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Role & Access
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Organization
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Contact Details
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Joined Date
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
                  const self = isSelf(u);
                  const palette = getAvatarStyle(u.fullName || u.email);

                  return (
                    <tr
                      key={u.id}
                      onClick={() => setViewing(u)}
                      className={`hover:bg-neutral-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer ${
                        self ? "bg-blue-500/[0.03]" : ""
                      }`}
                    >
                      {/* User & Identity */}
                      <td className="py-3.5 px-5 align-middle">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm border shadow-xs shrink-0"
                            style={{ background: palette.bg, color: palette.fg, borderColor: palette.border }}
                          >
                            {initials(u.fullName, u.email)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                                {u.fullName || "Unnamed User"}
                              </span>
                              {self && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate mt-0.5">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Access */}
                      <td className="py-3.5 px-4 align-middle">
                        <RoleBadge role={u.role} />
                      </td>

                      {/* Organization */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white">
                          <Building2 size={13} className="text-neutral-400 shrink-0" />
                          <span className="truncate max-w-[160px]">
                            {u.companyName || <span className="font-normal text-neutral-400 italic">Internal Staff</span>}
                          </span>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                            <Mail size={12} className="text-orange-500 shrink-0" />
                            <span className="font-mono truncate max-w-[180px]">{u.email}</span>
                          </div>
                          {u.phoneNumber ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                              <Phone size={11} className="text-neutral-400 shrink-0" />
                              <span>{u.phoneNumber}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-neutral-400/50 italic">No phone added</div>
                          )}
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          {formatDate(u.createdAtUtc)}
                        </div>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-3.5 px-4 align-middle" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={self}
                          onClick={() => setStatusUser(u)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border transition-all whitespace-nowrap ${
                            self ? "opacity-60 cursor-default" : "cursor-pointer hover:shadow-xs"
                          } ${
                            u.isActive
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                              : "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-300 dark:border-white/10 hover:bg-neutral-500/20"
                          }`}
                          title={self ? "Cannot toggle own account status" : "Click to toggle Active / Deactivated"}
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
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 hover:shadow-xs transition-all cursor-pointer"
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

                          {!self && (
                            <button
                              type="button"
                              onClick={() => setDeletingUser(u)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-neutral-400 hover:border-red-500/40 hover:text-red-500 hover:bg-red-500/5 hover:shadow-xs transition-all cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
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
              Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length} users
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
                        ? "bg-[var(--color-primary)] text-white shadow-xs"
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
        <UserDetailsDrawer
          user={viewing}
          isSelfUser={isSelf(viewing)}
          onClose={() => setViewing(null)}
          onOpenStatusModal={(u) => setStatusUser(u)}
          onDeleteUser={(u) => {
            setViewing(null);
            setDeletingUser(u);
          }}
        />
      )}

      {/* ================================================================= */}
      {/* 6. STATUS CHANGE CONFIRMATION MODAL (DEACTIVATE / ACTIVATE)       */}
      {/* ================================================================= */}
      {statusUser && (
        <StatusConfirmModal
          user={statusUser}
          onClose={() => setStatusUser(null)}
          onConfirm={() => void handleToggleStatusConfirm()}
          loading={statusLoading}
        />
      )}

      {/* ================================================================= */}
      {/* 7. CLEAN TEST ACCOUNTS CONFIRMATION MODAL                         */}
      {/* ================================================================= */}
      {showCleanTestsModal && (
        <CleanTestsConfirmModal
          count={testUsersCount}
          onClose={() => setShowCleanTestsModal(false)}
          onConfirm={() => void handleCleanTestAccounts()}
          loading={cleaningTests}
        />
      )}

      {/* ================================================================= */}
      {/* 8. TYPE 'DELETE' CONFIRMATION MODAL                               */}
      {/* ================================================================= */}
      {deletingUser && (
        <DeleteConfirmModal
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={() => void handleDeleteConfirm()}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
