import { cn } from "../../lib/utils";

export interface SidebarSectionProps {
  label: string;
  isCollapsed: boolean;
}

export function SidebarSection({ label, isCollapsed }: SidebarSectionProps) {
  if (isCollapsed) return null;

  return (
    <div
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]",
        "select-none mt-6 first:mt-0",
        "px-3",
      )}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}