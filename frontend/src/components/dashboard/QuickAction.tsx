import { type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

interface QuickActionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

export function QuickAction({ icon: Icon, title, description, href }: QuickActionProps) {
  return (
    <Link
      to={href}
      className={cn(
        "group flex items-center gap-3 rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)]",
        "p-4 shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30 hover:shadow-lg",
        "no-underline hover:no-underline cursor-pointer",
      )}
    >
      <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 shrink-0">
        <Icon size={18} className="text-[var(--color-primary)] transition-colors duration-200 group-hover:text-[var(--color-primary-hover)]" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors duration-200">
          {title}
        </div>
        <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">{description}</div>
      </div>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors duration-200 shrink-0"
      >
        <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}