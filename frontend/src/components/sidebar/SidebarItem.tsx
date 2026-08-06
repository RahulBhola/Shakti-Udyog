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
              "group relative flex items-center gap-3 rounded-xl px-3 h-11 text-sm font-medium w-full",
              "transition-all duration-200",
              "hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-sidebar-hover)]",
              active &&
                "text-white bg-[var(--color-primary)] shadow-sm hover:bg-[var(--color-primary-hover)] hover:text-white",
              !active && "text-[var(--text-sidebar)]",
              isCollapsed && "justify-center px-0",
            )}
          >
            <Icon
              size={isCollapsed ? 22 : 20}
              strokeWidth={1.5}
              className={cn(
                "shrink-0 transition-colors duration-200",
                active ? "text-white" : "group-hover:text-[var(--color-primary)]",
              )}
              aria-hidden="true"
            />
            {!isCollapsed && <span>{label}</span>}

            {isCollapsed && (
              <span
                role="tooltip"
                className={cn(
                  "absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium",
                  "bg-[var(--text-primary)] text-[var(--bg-app)] shadow-lg",
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