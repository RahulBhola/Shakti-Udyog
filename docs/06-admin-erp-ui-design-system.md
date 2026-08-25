# Shakti Udyog Admin ERP UI/UX Design System & Styling Guide

> **Official AI Assistant & Developer Reference for Admin & Portal UI Design**  
> This document establishes the strict UI/UX design standards, component architecture, color palettes, and interaction patterns approved for Shakti Udyog. All future AI assistants and developers must adhere to these patterns when creating or modifying portal pages.

---

## 1. Core Design Philosophy & Visual Principles

1. **Rich Modern Glassmorphism & High-Contrast ERP Theme**:
   - Clean, dark/light adaptive backgrounds:
     - Light Mode: `#ffffff` surface, `#f8fafc` background, subtle borders `border-neutral-200/90`.
     - Dark Mode: `#0c0f17` / `#0f121a` surface, `#090b10` background, borders `border-white/10`.
   - Subtle backdrop blur (`backdrop-blur-xl`, `backdrop-blur-xs`) on headers, modals, and sliding drawers.
   - Distinctive neon/glow accents for primary brand colors (Orange `--color-primary`, Purple for Admins, Blue for Engineers, Emerald for Customers/Active states).

2. **Zero Native Browser Popups Rule**:
   - **CRITICAL**: Never use native browser `alert()`, `confirm()`, or `prompt()`.
   - Always use custom glassmorphic confirmation modals (e.g. `StatusConfirmModal`, `DeleteConfirmModal`, `ConfirmDialog`) with:
     - Icon badges with theme-colored backgrounds.
     - Full item preview (Avatar, Name, Email/Code, Role/Category).
     - Contextual consequence warning (explaining that data remains safe and reversible).
     - Clean `[Cancel]` and `[Confirm Action]` buttons with loading spinners.

3. **Spacious Table & Grid Architecture (`min-w-[1100px]`)**:
   - Every data table wrapper must enforce a minimum width (`min-w-[1100px]`) to guarantee zero column collision or awkward wrapping on action buttons, badges, or contact information.
   - Actions columns must always have fixed padding and `minWidth: 120px–140px` with dedicated 32×32px framed icon buttons.

---

## 2. Standard Page Layout Anatomy

Every admin management page (Users, Products, Orders, Enquiries, Quotes) must follow this 5-tier vertical hierarchy:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Hero Header & Quick Action Buttons                                  │
│    [Icon] Title + Registered Count Badge + [Clean Clutter / + Add / 🔄]│
├────────────────────────────────────────────────────────────────────────┤
│ 2. KPI Metrics Grid (4 to 5 Glass Cards)                               │
│    [Total]       [Admins/Grades]   [Engineers]   [Clients]   [Active]  │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Filter & Toolbar Bar                                                │
│    [🔍 Real-time Search Input]    [Segmented Role/Status Filter Tabs]   │
│    [▼ Advanced Filters: Date Range, Company, Category, Reset]          │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Interactive Data Table / Card Rows                                  │
│    Sticky Header | Avatar + Name | Role/Cat | Status Switch | Actions  │
│    Pagination Footer: Showing X–Y of Z | Rows Per Page | Page Nav      │
├────────────────────────────────────────────────────────────────────────┤
│ 5. Slide-Out Right-Hand Side (RHS) Drawer (on item click / 👁️ view)   │
│    Full Height | Metadata | Spec Lists | In-drawer Forms | Actions     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Styling Tokens & Code Patterns

### A. Role Badges with Domain Icons

Always pair role names with corresponding Lucide icons:

```tsx
export function RoleBadge({ role }: { role: string }) {
  const r = role?.trim() || "Customer";
  if (r === "Admin") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-xs">
        <Shield size={12} className="shrink-0 text-purple-500" />
        <span>Administrator</span>
      </span>
    );
  }
  if (r === "Engineer") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-xs">
        <Wrench size={12} className="shrink-0 text-blue-500" />
        <span>Engineer</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
      <Building2 size={12} className="shrink-0 text-emerald-500" />
      <span>Customer</span>
    </span>
  );
}
```

---

### B. Dynamic Deterministic Avatar Palette

Generate deterministic avatar colors so every user/entity gets a vibrant, consistent visual identity without storing extra color fields:

```tsx
const AVATAR_PALETTES = [
  { bg: "rgba(59,130,246,0.15)", fg: "#3B82F6", border: "rgba(59,130,246,0.3)" },
  { bg: "rgba(168,85,247,0.15)", fg: "#A855F7", border: "rgba(168,85,247,0.3)" },
  { bg: "rgba(20,184,166,0.15)", fg: "#14B8A6", border: "rgba(20,184,166,0.3)" },
  { bg: "rgba(249,115,22,0.15)", fg: "#F97316", border: "rgba(249,115,22,0.3)" },
  { bg: "rgba(236,72,153,0.15)", fg: "#EC4899", border: "rgba(236,72,153,0.3)" },
  { bg: "rgba(34,197,94,0.15)", fg: "#22C55E", border: "rgba(34,197,94,0.3)" },
];

export function getAvatarStyle(identifier: string) {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}
```

---

### C. 1-Click Interactive Status Toggle Switch

Direct, interactive status pills right inside table rows or cards:

```tsx
<button
  type="button"
  onClick={() => void onOpenStatusModal(item)}
  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border transition-all cursor-pointer whitespace-nowrap ${
    item.isActive
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25 shadow-xs"
      : "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-300 dark:border-white/10 hover:bg-neutral-500/20"
  }`}
>
  <span className={`w-2 h-2 rounded-full ${item.isActive ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"}`} />
  <span>{item.isActive ? "Active" : "Inactive"}</span>
</button>
```

---

### D. Custom Glassmorphic Status & Delete Confirmation Modals

Standard modal structure for all destructive or status-altering operations:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={onClose}>
  <div
    className="w-full max-w-md bg-white dark:bg-[#121520] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
    onClick={(e) => e.stopPropagation()}
    role="dialog"
  >
    {/* Header */}
    <div className="px-6 py-4 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between bg-amber-500/5 text-amber-600 dark:text-amber-400">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Power size={17} />
        </div>
        <h3 className="font-extrabold text-sm m-0">Deactivate User Account</h3>
      </div>
      <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer">
        <X size={16} />
      </button>
    </div>

    {/* Body with Item Preview */}
    <div className="p-6 space-y-4">
      <div className="p-3.5 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/[0.02] flex items-center gap-3">
        {/* Avatar + Info */}
      </div>

      <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">
        Are you sure you want to deactivate <strong>{user.fullName}</strong>?
      </p>

      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
        <strong>Note:</strong> All existing orders, quotations, enquiries, and audit records will remain completely intact.
      </div>
    </div>

    {/* Foot */}
    <div className="px-6 py-4 bg-neutral-50 dark:bg-white/[0.02] border-t border-neutral-100 dark:border-white/10 flex items-center justify-end gap-2.5">
      <button type="button" className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100" onClick={onClose}>
        Cancel
      </button>
      <button type="button" className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm" onClick={onConfirm}>
        Deactivate Account
      </button>
    </div>
  </div>
</div>
```

---

### E. Ambient Glowing Radial Gradient KPI Card Pattern

Every KPI metric card must feature top-left icon badges, high-contrast typography, and smooth ambient top-right radial glow gradients:

```tsx
{/* Blue KPI Card */}
<div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(59,130,246,0.18),transparent)] before:pointer-events-none">
  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
    <Users size={18} />
  </div>
  <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight">
    {kpis.total}
  </div>
  <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Total Users</div>
  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">All platform accounts</div>
</div>

{/* Color Palettes for Gradients:
  - Blue:    before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(59,130,246,0.18),transparent)]
  - Emerald: before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(16,185,129,0.18),transparent)]
  - Purple:  before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(168,85,247,0.18),transparent)]
  - Amber:   before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(249,115,22,0.18),transparent)]
  - Teal:    before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(20,184,166,0.18),transparent)]
*/}
```

---

### F. Slide-Out Right-Hand Side (RHS) Drawer Architecture

For full specifications and in-place sub-view editing (ensuring closing the edit form never closes the drawer):

```tsx
<div
  className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl bg-white dark:bg-[#0c0f17] border-l border-neutral-200 dark:border-white/10 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300"
  role="dialog"
  onClick={(e) => e.stopPropagation()}
>
  {/* Sticky Top Header with Back / Close Button */}
  {/* Scrollable Body: flex-1 overflow-y-auto */}
  {/* Sticky Footer Actions: border-t */}
</div>
```

---

## 4. Summary Checklist for Future UI Modifications

- [x] Use rich Tailwind CSS utility tokens paired with dark/light variables (`dark:bg-[#0c0f17]`, `border-neutral-200/90 dark:border-white/10`).
- [x] Hoist all React hooks (`useState`, `useEffect`, `useRef`) to the very top of components before any early returns.
- [x] Always enforce `minWidth: 1100px` on administrative tables.
- [x] Provide 1-click clipboard copy buttons for identifiers and emails.
- [x] Replace all `window.confirm` / `alert` calls with custom modal components.
- [x] Keep test user accounts clean with automated or 1-click cleanup actions.
