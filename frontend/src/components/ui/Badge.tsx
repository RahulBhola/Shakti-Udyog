import React from "react";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({
  variant = "default",
  dot = false,
  children,
  className = "",
  ...props
}: BadgeProps) {
  const baseStyle =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border";

  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-slate-800/80 text-slate-300 border-slate-700/60",
    primary: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    danger: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    info: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    neutral: "bg-slate-700/40 text-slate-400 border-slate-600/40",
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: "bg-slate-400",
    primary: "bg-sky-400",
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-rose-400",
    info: "bg-indigo-400",
    neutral: "bg-slate-400",
  };

  return (
    <span className={`${baseStyle} ${variantStyles[variant]} ${className}`} {...props}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}

/** Resolves semantic status string to Badge variant. */
export function getStatusBadgeVariant(status: string | null | undefined): BadgeVariant {
  if (!status) return "default";
  const s = status.toLowerCase();
  if (s.includes("draft") || s.includes("pending")) return "warning";
  if (s.includes("approved") || s.includes("paid") || s.includes("delivered") || s.includes("active") || s.includes("completed"))
    return "success";
  if (s.includes("reject") || s.includes("cancel") || s.includes("overdue") || s.includes("failed"))
    return "danger";
  if (s.includes("review") || s.includes("submitted") || s.includes("progress") || s.includes("production"))
    return "primary";
  return "info";
}
