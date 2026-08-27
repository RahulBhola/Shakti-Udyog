import { useState } from "react";
import {
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
  UserCheck,
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
import { UserAvatar } from "../ui/UserAvatar";
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
  Enquiries: ClipboardList,
  Quotes: FileText,
  Quotations: FileText,
  Orders: ShoppingCart,
  "My Orders": ShoppingCart,
  "Manufacturing Board": Factory,
  "Upload Center": CloudUpload,
  Invoices: Receipt,
  "Invoices & Billing": Receipt,
  Users: Users,
  Engineers: UserCheck,
  Companies: Building2,
  Products: Package,
  Categories: Tag,
  Settings: Settings,
  "Audit Logs": List,
  Reports: BarChart3,
  Payments: CreditCard,
  Documents: FileText,
  "Document Library": FileText,
  Company: Building,
  "Company & Profile": User,
  Notifications: Bell,
  Profile: User,
  Support: HelpCircle,
  "Help & Support": HelpCircle,
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
    : user?.roles.includes("Engineer") ? "Engineer"
    : "User";

  const displayName = user?.fullName ?? user?.email ?? "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen z-40 shrink-0",
        "bg-[var(--bg-sidebar)]",
        "border-r border-[var(--border-default)]",
        // Show the sidebar only on desktop (>= 1024px); below that the mobile-nav takes over.
        "hidden lg:flex flex-col",
        "transition-all duration-250 ease-[cubic-bezier(0.22,0.61,0.36,1)]",
        collapsed ? "lg:w-[72px]" : "lg:w-[280px]",
      )}
      aria-label="Sidebar navigation"
    >
      {/* Logo + collapse button */}
      <div
        className={cn(
          "flex items-center shrink-0 border-b border-[var(--border-default)]",
          collapsed ? "justify-center h-16" : "justify-between px-4 h-16",
        )}
      >
        {!collapsed && (
          <a href="/" className="flex items-baseline gap-0.5 no-underline hover:no-underline">
            <span className="text-lg font-extrabold tracking-tight text-[var(--text-primary)]">
              Shakti
            </span>
            <span className="text-lg font-extrabold tracking-tight text-blue-500">
              Udyog
            </span>
          </a>
        )}

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "flex items-center justify-center rounded-xl",
            "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.06]",
            "transition-all duration-200 cursor-pointer",
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
          "flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll py-2",
          collapsed ? "px-2.5" : "px-3.5",
        )}
        aria-label="Primary navigation"
      >
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
          collapsed ? "p-2" : "p-3.5",
        )}
      >
        <div
          className={cn(
            "rounded-2xl transition-all duration-200",
            "bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xs",
            collapsed ? "p-2" : "p-3",
          )}
        >
          <div className="flex items-center gap-3 w-full">
            <UserAvatar
              avatarUrl={user?.avatarUrl}
              displayName={displayName}
              initials={initials}
              size="md"
              shape="rounded"
            />

            {!collapsed && (
              <div className="flex-1 min-w-0 text-left">
                <div className="text-xs font-bold text-[var(--text-primary)] truncate">
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
              className="flex items-center gap-2 w-full mt-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-[var(--text-secondary)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-150 cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut size={13} />
              <span>Sign out</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}