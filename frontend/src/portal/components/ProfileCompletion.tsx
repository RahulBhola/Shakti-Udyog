import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  ShieldCheck,
  Briefcase,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";

/* ------------------------------------------------------------------ */
/*  Types & Calculation Logic                                          */
/* ------------------------------------------------------------------ */

export interface CompletenessItem {
  key: string;
  label: string;
  category: "personal" | "contact" | "company" | "security";
  icon: LucideIcon;
  completed: boolean;
  points: number;
  tip?: string;
  actionPath?: string;
}

export interface CompletenessResult {
  percentage: number;
  statusLabel: string;
  statusColor: "emerald" | "indigo" | "amber" | "rose";
  items: CompletenessItem[];
  completedItems: CompletenessItem[];
  pendingItems: CompletenessItem[];
  missingCount: number;
}

/**
 * Universally evaluates profile completion across Customers, Admins, Engineers, and General Users.
 */
export function calculateProfileCompleteness(data: any): CompletenessResult {
  if (!data) {
    return {
      percentage: 0,
      statusLabel: "Incomplete",
      statusColor: "rose",
      items: [],
      completedItems: [],
      pendingItems: [],
      missingCount: 0,
    };
  }

  // Extract attributes whether passed as Profile, User, AdminProfile, or AuthUser
  const fullName = (data.fullName || data.name || "").trim();
  const email = (data.email || "").trim();
  const phoneNumber = (data.phoneNumber || data.phone || "").trim();
  const designation = (data.designation || data.title || "").trim();
  const companyName = (data.company?.name || data.companyName || "").trim();
  const hasAddress = Boolean(
    data.company?.deliveryAddresses ||
    data.addressLine1 ||
    data.city ||
    data.registeredAddress ||
    (data.addresses && data.addresses.length > 0)
  );
  const isEmailVerified = data.emailConfirmed !== false && Boolean(email);

  const items: CompletenessItem[] = [
    {
      key: "fullName",
      label: "Full Name",
      category: "personal",
      icon: User,
      completed: fullName.length >= 2,
      points: 20,
      tip: "Provide your official personal or representative name",
    },
    {
      key: "email",
      label: "Verified Email Address",
      category: "contact",
      icon: Mail,
      completed: isEmailVerified,
      points: 20,
      tip: "Registered corporate communication address",
    },
    {
      key: "phoneNumber",
      label: "Primary Phone Number",
      category: "contact",
      icon: Phone,
      completed: phoneNumber.length >= 7,
      points: 20,
      tip: "Direct mobile or business landline for critical alerts",
    },
    {
      key: "designation",
      label: "Job Title / Role Designation",
      category: "personal",
      icon: Briefcase,
      completed: Boolean(designation || data.role || (data.roles && data.roles.length > 0)),
      points: 15,
      tip: "Operational title (e.g. Purchase Lead, Plant Engineer, Admin)",
    },
    {
      key: "company",
      label: "Company / Organization Entity",
      category: "company",
      icon: Building2,
      completed: Boolean(companyName || (data.roles && data.roles.includes("Admin")) || (data.roles && data.roles.includes("Engineer"))),
      points: 15,
      tip: "Linked business organization or corporate unit",
    },
    {
      key: "address",
      label: "Delivery / Facility Address",
      category: "company",
      icon: MapPin,
      completed: hasAddress || (data.roles && data.roles.includes("Admin")) || (data.roles && data.roles.includes("Engineer")),
      points: 10,
      tip: "Dispatch location, foundry plant, or billing address",
    },
  ];

  const earnedPoints = items.reduce((acc, item) => (item.completed ? acc + item.points : acc), 0);
  const maxPoints = items.reduce((acc, item) => acc + item.points, 0);
  const percentage = Math.min(100, Math.round((earnedPoints / maxPoints) * 100));

  const completedItems = items.filter((i) => i.completed);
  const pendingItems = items.filter((i) => !i.completed);
  const missingCount = pendingItems.length;

  let statusLabel = "Needs Attention";
  let statusColor: "emerald" | "indigo" | "amber" | "rose" = "rose";

  if (percentage === 100) {
    statusLabel = "100% Fully Completed";
    statusColor = "emerald";
  } else if (percentage >= 80) {
    statusLabel = "Almost Complete";
    statusColor = "emerald";
  } else if (percentage >= 50) {
    statusLabel = "Partially Completed";
    statusColor = "amber";
  } else {
    statusLabel = "Action Required";
    statusColor = "rose";
  }

  return {
    percentage,
    statusLabel,
    statusColor,
    items,
    completedItems,
    pendingItems,
    missingCount,
  };
}

/* ------------------------------------------------------------------ */
/*  Visual Progress Bar Component                                      */
/* ------------------------------------------------------------------ */

export function ProfileProgressBar({
  percentage,
  size = "md",
  showLabel = true,
  className,
}: {
  percentage: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}) {
  const heightClass = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  // Dynamic gradient color
  const getGradient = (pct: number) => {
    if (pct >= 100) return "from-emerald-500 via-teal-400 to-emerald-500 shadow-emerald-500/20";
    if (pct >= 75) return "from-emerald-500 to-teal-400";
    if (pct >= 50) return "from-amber-500 to-orange-400";
    return "from-rose-500 to-amber-500";
  };

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-600 dark:text-neutral-400">Profile Completion</span>
          <span className="font-extrabold font-mono text-neutral-900 dark:text-white">{percentage}%</span>
        </div>
      )}
      <div className={cn("w-full rounded-full bg-neutral-200/80 dark:bg-white/10 overflow-hidden relative", heightClass)}>
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out shadow-xs",
            getGradient(percentage)
          )}
          style={{ width: `${Math.max(4, Math.min(100, percentage))}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Compact Completeness Badge (for tables and headers)                */
/* ------------------------------------------------------------------ */

export function ProfileCompletenessBadge({
  percentage,
  compact = false,
}: {
  percentage: number;
  compact?: boolean;
}) {
  const getBadgeStyle = (pct: number) => {
    if (pct >= 100) {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    }
    if (pct >= 75) {
      return "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30";
    }
    if (pct >= 50) {
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    }
    return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2" title={`Profile ${percentage}% complete`}>
        <div className="w-16 h-1.5 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              percentage >= 100
                ? "bg-emerald-500"
                : percentage >= 75
                ? "bg-teal-500"
                : percentage >= 50
                ? "bg-amber-500"
                : "bg-rose-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-[11px] font-mono font-extrabold text-neutral-700 dark:text-neutral-300">
          {percentage}%
        </span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs",
        getBadgeStyle(percentage)
      )}
    >
      {percentage >= 100 ? (
        <Sparkles size={11} className="text-emerald-500 shrink-0" />
      ) : (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            percentage >= 75 ? "bg-teal-500" : percentage >= 50 ? "bg-amber-500" : "bg-rose-500"
          )}
        />
      )}
      <span className="font-mono">{percentage}%</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Full Profile Completion Card (for Profile Pages)                   */
/* ------------------------------------------------------------------ */

export function ProfileCompletionCard({
  profileData,
  onNavigateTab,
  className,
}: {
  profileData: any;
  onNavigateTab?: (tabKey: string) => void;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const result = useMemo(() => calculateProfileCompleteness(profileData), [profileData]);

  return (
    <div
      className={cn(
        "p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-xs space-y-5 transition-all",
        className
      )}
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={cn(
              "w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs",
              result.percentage >= 100
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                : result.percentage >= 75
                ? "bg-teal-500/10 text-teal-500 border-teal-500/30"
                : result.percentage >= 50
                ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                : "bg-rose-500/10 text-rose-500 border-rose-500/30"
            )}
          >
            {result.percentage >= 100 ? <ShieldCheck size={22} /> : <AlertCircle size={22} />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-[var(--text-primary)] m-0">
                Profile Completeness
              </h2>
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold border",
                  result.percentage >= 100
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : result.percentage >= 75
                    ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30"
                    : result.percentage >= 50
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                )}
              >
                {result.percentage}% • {result.statusLabel}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 m-0">
              {result.percentage >= 100
                ? "Your account and corporate profiles are fully verified and up to date."
                : `Complete ${result.missingCount} remaining item${result.missingCount > 1 ? "s" : ""} to unlock fast quotation processing and instant invoicing.`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-bold text-[var(--color-primary)] hover:underline self-end sm:self-center shrink-0 cursor-pointer"
        >
          {expanded ? "Hide Checklist" : "View Checklist"}
        </button>
      </div>

      {/* Progress Bar */}
      <ProfileProgressBar percentage={result.percentage} size="md" showLabel={false} />

      {/* Itemized Breakdown Checklist */}
      {expanded && (
        <div className="pt-2 border-t border-[var(--border-default)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {result.items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                onClick={() => {
                  if (onNavigateTab) {
                    if (item.category === "personal") onNavigateTab("personal");
                    else if (item.category === "company") onNavigateTab("company");
                    else if (item.category === "contact") onNavigateTab("contacts");
                  }
                }}
                className={cn(
                  "p-3 rounded-xl border flex items-center justify-between gap-3 transition-all",
                  onNavigateTab && "cursor-pointer hover:shadow-2xs",
                  item.completed
                    ? "bg-emerald-50/50 dark:bg-emerald-500/[0.03] border-emerald-200/80 dark:border-emerald-500/20"
                    : "bg-neutral-50/80 dark:bg-white/[0.02] border-[var(--border-default)] hover:border-amber-400/60"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
                      item.completed
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-neutral-200/70 dark:bg-white/5 text-neutral-400 border-[var(--border-default)]"
                    )}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate m-0">
                      {item.label}
                    </p>
                    <p className="text-[10.5px] text-[var(--text-secondary)] truncate m-0">
                      +{item.points}% weight
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {item.completed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={15} />
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline">
                      <span>Add</span>
                      <ChevronRight size={12} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard Floating Profile Completion Banner                      */
/* ------------------------------------------------------------------ */

export function ProfileCompletionBanner({
  profileData,
  href = "/customer/profile",
  storageKey = "shakti_hide_profile_banner",
}: {
  profileData: any;
  href?: string;
  storageKey?: string;
}) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  });
  const result = useMemo(() => calculateProfileCompleteness(profileData), [profileData]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, "true");
    } catch {}
  };

  if (dismissed || result.percentage >= 100) {
    return null;
  }

  return (
    <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15 dark:to-transparent shadow-xs animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
                Complete Your Profile ({result.percentage}% Done)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                {result.missingCount} item{result.missingCount > 1 ? "s" : ""} missing
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed m-0">
              Provide your phone number, designated company details, and billing addresses for automated tax invoices and quote calculations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
          <Link
            to={href}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white text-xs font-bold shadow-sm transition-all"
          >
            <span>Complete Now</span>
            <ChevronRight size={13} />
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss banner"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="mt-3.5">
        <ProfileProgressBar percentage={result.percentage} size="sm" showLabel={false} />
      </div>
    </div>
  );
}
