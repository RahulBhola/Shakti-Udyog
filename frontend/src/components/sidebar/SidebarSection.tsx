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
        "text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400/90 dark:text-slate-400/80",
        "select-none mt-5 first:mt-1",
        "px-3.5 py-1",
      )}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}