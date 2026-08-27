import { RefreshCw, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";

interface DashboardHeaderProps {
  userName?: string;
  companyName?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function DashboardHeader({ userName, companyName, onRefresh, refreshing }: DashboardHeaderProps) {
  const displayName = userName?.trim() || "Valued Partner";

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] m-0 leading-tight">
            Welcome back, {displayName} 👋
          </h1>
          {companyName && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 flex items-center gap-1">
              <Sparkles size={11} />
              {companyName}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 m-0">
          Here's an overview of your active casting RFQs, quotations, foundry production, and quality test reports.
        </p>
        <p className="text-[11px] font-semibold text-[var(--text-muted)] mt-1 m-0">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className={cn(
              "flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-bold",
              "text-neutral-700 dark:text-neutral-300 bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10",
              "hover:bg-neutral-50 dark:hover:bg-white/5",
              "shadow-xs cursor-pointer",
              "transition-all duration-200",
              refreshing && "opacity-50 pointer-events-none"
            )}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw size={13} className={cn(refreshing && "animate-spin text-orange-500")} />
            <span>Refresh</span>
          </button>
        )}
      </div>
    </header>
  );
}