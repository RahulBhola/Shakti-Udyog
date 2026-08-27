import { type LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";

export interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isCollapsed: boolean;
  isActive?: boolean;
}

export function SidebarItem({
  icon: Icon,
  label,
  href,
  isCollapsed,
  isActive: forceActive,
}: SidebarItemProps) {
  return (
    <NavLink
      to={href}
      end
      className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] rounded-xl no-underline"
      aria-label={isCollapsed ? label : undefined}
    >
      {({ isActive: navActive }) => {
        const active = forceActive ?? navActive;
        return (
          <span
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3.5 h-10.5 text-sm font-medium w-full",
              "transition-all duration-200",
              active &&
                "text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-500/30 shadow-sm shadow-blue-500/25 font-semibold",
              !active &&
                "text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent",
              isCollapsed && "justify-center px-0",
            )}
          >
            <Icon
              size={isCollapsed ? 20 : 18}
              strokeWidth={1.75}
              className={cn(
                "shrink-0 transition-colors duration-200",
                active ? "text-white" : "text-slate-400 group-hover:text-blue-400",
              )}
              aria-hidden="true"
            />
            {!isCollapsed && <span className="truncate">{label}</span>}

            {isCollapsed && (
              <span
                role="tooltip"
                className={cn(
                  "absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold",
                  "bg-[#111827] text-white border border-white/10 shadow-xl",
                  "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
                  "transition-all duration-200",
                  "whitespace-nowrap z-50 pointer-events-none",
                )}
              >
                {label}
              </span>
            )}
          </span>
        );
      }}
    </NavLink>
  );
}