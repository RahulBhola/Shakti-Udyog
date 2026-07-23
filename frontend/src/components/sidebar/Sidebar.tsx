import { useState } from "react";
import {
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Home,
  ClipboardList,
  FileText,
  ShoppingCart,
  Factory,
  CloudUpload,
  Receipt,
  Users,
  Building2,
  List,
  BarChart3,
  type LucideIcon,
  Settings,
  Package,
  Tag,
  Bell,
  User,
  CreditCard,
  Building,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { cn } from "../../lib/utils";
import { SidebarSection } from "./SidebarSection";
import { SidebarItem } from "./SidebarItem";

export interface NavItem {
  label: string;
  href: string;
}

export interface NavSection {
  label: string | null;
  items: NavItem[];
}

const labelIconMap: Record<string, LucideIcon> = {
  Dashboard: Home,
  RFQs: ClipboardList,
  Quotations: FileText,
  Orders: ShoppingCart,
  "Manufacturing Board": Factory,
  "Upload Center": CloudUpload,
  Invoices: Receipt,
  Users: Users,
  Companies: Building2,
  Products: Package,
  Categories: Tag,
  Settings: Settings,
  "Audit Logs": List,
  Reports: BarChart3,
  Payments: CreditCard,
  Documents: FileText,
  Company: Building,
  Notifications: Bell,
  Profile: User,
  Support: HelpCircle,
};

function iconForLabel(label: string): LucideIcon {
  return labelIconMap[label] ?? FileText;
}

interface SidebarProps {
  sections: NavSection[];
  onLogout?: () => void;
}

export function Sidebar({ sections, onLogout }: SidebarProps) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = onLogout ?? (() => {
    logout();
    window.location.href = "/login";
  });

  const roleLabel =
    user?.roles.includes("Admin") ? "Administrator"
    : user?.roles.includes("DataUpdater") ? "Data Updater"
    : "User";

  const displayName = user?.fullName ?? user?.email ?? "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen z-40 shrink-0",
        "bg-[var(--bg-sidebar)]",
        "border-r border-[var(--border-default)]",
        "flex flex-col",
        "transition-all duration-250 ease-[cubic-bezier(0.22,0.61,0.36,1)]",
        collapsed ? "w-[72px]" : "w-[280px]",
      )}
      aria-label="Sidebar navigation"
    >
      {/* Logo + collapse button */}
      <div
        className={cn(
          "flex items-center shrink-0",
          collapsed ? "justify-center h-16" : "justify-between px-4 h-16",
        )}
      >
        {!collapsed && (
          <a href="/" className="flex items-baseline gap-0 no-underline hover:no-underline">
            <span className="text-lg font-extrabold tracking-tight text-[var(--text-primary)]">
              Shakti
            </span>
            <span className="text-lg font-extrabold tracking-tight text-[var(--color-primary)]">
              Udyog
            </span>
          </a>
        )}

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "flex items-center justify-center rounded-lg",
            "text-[var(--text-sidebar)] hover:text-[var(--text-sidebar-hover)] hover:bg-[var(--bg-surface-hover)]",
            "transition-all duration-200",
            "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary)]",
            collapsed ? "w-9 h-9 mx-auto" : "w-8 h-8",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Scrollable nav area */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin",
          collapsed ? "px-3 py-4" : "px-4 pb-4",
        )}
        aria-label="Primary navigation"
      >
        <style>{`
          .scrollbar-thin::-webkit-scrollbar { width: 4px; }
          .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
          .scrollbar-thin::-webkit-scrollbar-thumb { background: #334155; border-radius: 999px; }
          .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #475569; }
          .scrollbar-thin { scrollbar-width: thin; scrollbar-color: #334155 transparent; }
        `}</style>

        {sections.map((section) => (
          <div key={section.label ?? "__root__"} className="flex flex-col gap-1">
            {section.label && (
              <SidebarSection label={section.label} isCollapsed={collapsed} />
            )}
            {section.items.map((item) => (
              <SidebarItem
                key={item.href}
                icon={iconForLabel(item.label)}
                label={item.label}
                href={item.href}
                isCollapsed={collapsed}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom profile card */}
      <div
        className={cn(
          "shrink-0 border-t border-[var(--border-default)]",
          collapsed ? "p-2" : "p-4 pt-3",
        )}
      >
        <div
          className={cn(
            "rounded-xl transition-all duration-200",
            "bg-[var(--bg-surface)] border border-[var(--border-default)]",
            collapsed ? "p-2" : "p-3",
          )}
        >
          <div className="flex items-center gap-3 w-full">
            <span
              className={cn(
                "flex items-center justify-center rounded-lg shrink-0",
                "bg-[var(--color-primary)] text-[var(--color-primary-text)] font-bold",
                collapsed ? "w-9 h-9 text-sm" : "w-9 h-9 text-sm",
              )}
              aria-hidden="true"
            >
              {initials}
            </span>

            {!collapsed && (
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {displayName}
                </div>
                <div className="text-[11px] font-medium text-[var(--text-secondary)] truncate">
                  {roleLabel}
                </div>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex items-center gap-2 w-full mt-2 px-2 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--color-danger)] hover:bg-[var(--bg-surface-hover)] transition-all duration-200"
              aria-label="Sign out"
            >
              <LogOut size={13} />
              Sign out
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}