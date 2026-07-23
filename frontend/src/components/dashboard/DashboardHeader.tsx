import { RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";

interface DashboardHeaderProps {
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function DashboardHeader({ onRefresh, refreshing }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-[40px] font-bold tracking-tight text-[var(--text-primary)] m-0 leading-none">
          Welcome back, Administrator 👋
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-2 m-0">
          Here's what's happening with your business today.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className={cn(
              "flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-medium",
              "text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-default)]",
              "hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]",
              "shadow-sm",
              "transition-all duration-200",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary)]",
              refreshing && "opacity-50 pointer-events-none",
            )}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw size={14} className={cn(refreshing && "animate-spin")} />
            Refresh
          </button>
        )}
      </div>
    </header>
  );
}