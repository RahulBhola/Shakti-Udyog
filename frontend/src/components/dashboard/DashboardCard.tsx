import { type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import { AnimatedCounter } from "./AnimatedCounter";

export interface DashboardCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  href?: string;
  iconColorClass?: string;
  iconBgClass?: string;
  trend?: {
    direction: "up" | "down";
    value: string;
    label?: string;
  };
  prefix?: string;
}

const iconColorMap: Record<string, string> = {
  blue: "text-[var(--kpi-blue)]", green: "text-[var(--kpi-green)]", purple: "text-[var(--kpi-purple)]",
  teal: "text-[var(--kpi-teal)]", orange: "text-[var(--kpi-orange)]", pink: "text-[var(--kpi-pink)]",
  yellow: "text-[var(--kpi-yellow)]", red: "text-[var(--color-danger)]", indigo: "text-[var(--kpi-indigo)]", cyan: "text-[var(--kpi-teal)]",
};

const iconBgMap: Record<string, string> = {
  blue: "bg-[var(--kpi-blue-bg)]", green: "bg-[var(--kpi-green-bg)]", purple: "bg-[var(--kpi-purple-bg)]",
  teal: "bg-[var(--kpi-teal-bg)]", orange: "bg-[var(--kpi-orange-bg)]", pink: "bg-[var(--kpi-pink-bg)]",
  yellow: "bg-[var(--kpi-yellow-bg)]", red: "bg-[var(--color-danger)]/10", indigo: "bg-[var(--kpi-indigo-bg)]", cyan: "bg-[var(--kpi-teal-bg)]",
};

export function DashboardCard({
  icon: Icon, label, value, href, iconColorClass, iconBgClass, trend, prefix,
}: DashboardCardProps) {
  const colorClass = iconColorClass ?? iconColorMap.blue;
  const bgClass = iconBgClass ?? iconBgMap.blue;

  const inner = (
    <div
      className={cn(
        "relative flex flex-col rounded-[18px] border border-[var(--border-default)]",
        "bg-[var(--bg-card)] p-5",
        "shadow-sm",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        "h-full",
      )}
    >
      <div className="flex items-center gap-3 mb-2.5">
        <span className={cn("flex items-center justify-center w-10 h-10 rounded-xl shrink-0", bgClass)}>
          <Icon size={19} className={cn("shrink-0", colorClass)} aria-hidden="true" />
        </span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ml-auto",
              trend.direction === "up"
                ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                : "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
            )}
          >
            {trend.direction === "up" ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
      <div className="text-[36px] font-bold tracking-tight text-[var(--text-primary)] leading-none mb-1">
        {prefix && <span className="text-[var(--text-muted)] text-lg mr-1">{prefix}</span>}
        <AnimatedCounter value={value} />
      </div>
      <div className="text-sm font-medium text-[var(--text-secondary)]">{label}</div>
      {trend?.label && <div className="text-[12px] text-[var(--text-muted)] mt-1.5">{trend.label}</div>}
    </div>
  );

  if (href) {
    return <Link to={href} className="block no-underline hover:no-underline">{inner}</Link>;
  }
  return inner;
}