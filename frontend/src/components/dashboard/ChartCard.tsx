import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface ChartCardProps {
  title: string;
  children: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function ChartCard({ title, children, subtitle, action, className }: ChartCardProps) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5",
        "shadow-sm transition-all duration-200 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">{title}</h3>
          {subtitle && <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 m-0">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
}