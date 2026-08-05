# Portal UI Design System (ERP List Views)

> Source of truth for the premium ERP look used by the Admin / Engineer / Customer
> **list pages** (Invoices, Quotations, Orders, Enquiries, Payments, etc.).
> Read this before restyling or building any new list/table page in a portal.

## Where the styling lives

- **`frontend/src/portal/portal.css`** — global layout + theme tokens for every portal
  (sidebar, topbar, content grid, badges, stat cards, theme variables).
- **`frontend/src/portal/pages/erpListView.css`** — the shared ERP **list-page** stylesheet.
  Both the Invoice page (`AdminInvoiceManagePage.tsx`) and Quotation page
  (`QuotationListPage.tsx`) import this one file. Class names use the `.inv-` prefix
  (historical), but the styles are generic and reused across list pages.

> **Important:** Keep ONE shared stylesheet for list views. If a page needs the ERP list
> look, `import "../erpListView.css"` (or `./erpListView.css`) and reuse the classes below.
> Do **not** duplicate this CSS per page.

## Theme tokens (dark, default)

Backgrounds / surfaces:

| Token | Value | Use |
|---|---|---|
| `--bg-app` | `#0a0e1a` | page background |
| `--bg-card` / `--bg-surface` | `#111827` | cards, panels |
| `--bg-sidebar` | `#0B1220` | sidebar |
| `--bg-input` | `rgba(15,21,36,0.55)` | inputs |

Text: `--text-primary #F8FAFC`, `--text-secondary #94A3B8`, `--text-muted #64748B`.

Accent: `--color-primary #3B82F6`, hover `--color-primary-hover #2563EB`.

Status colors: `--color-success #22C55E`, `--color-warning #F59E0B`,
`--color-danger #EF4444`, `--color-purple #A78BFA`, `--color-teal #14B8A6`.

KPI accent vars: `--kpi-blue #3B82F6`, `--kpi-green #22C55E`, `--kpi-orange #F97316`,
`--kpi-purple #A78BFA`, `--kpi-teal #14B8A6`, `--kpi-pink #EC4899`.

**Shape / shadow:** cards `border-radius: 16px`, controls `10–12px`, badges `999px`;
shadows `--shadow-sm / --shadow-md / --shadow-lg`.

## The canonical list-page structure

Every ERP list page follows this exact layout (copy the skeleton, reuse the classes):

```
<div className="inv-page">                       // vertical stack, gap 24px

  {/* 1. Header — title + subtitle left, actions right (no create action if not needed) */}
  <div className="inv-header">
    <div>
      <h1 className="inv-header__title">…</h1>
      <p className="inv-header__subtitle">…</p>
    </div>
    <div className="inv-header__actions"> …buttons… </div>
  </div>

  {/* 2. KPI cards — grid, one card per metric */}
  <div className="inv-kpi-grid">
    {kpis.map(k => (
      <div className="inv-kpi"
           style={{ "--inv-kpi-color": k.color, "--inv-kpi-bg": k.bg,
                    "--inv-kpi-glow": k.glow } as CSSProperties}>
        <span className="inv-kpi__icon"><Icon size={20} /></span>
        <span className="inv-kpi__value">{k.value}</span>
        <span className="inv-kpi__label">{k.label}</span>
        <span className="inv-kpi__hint">{k.hint}</span>
      </div>
    ))}
  </div>

  {/* 3. Search & filter bar */}
  <div className="inv-filterbar">
    <div className="inv-field" style={{ flex: "1 1 240px" }}>
      <label className="inv-field__label">Search</label>
      <input className="inv-input" placeholder="…" />
    </div>
    <div className="inv-field">
      <label className="inv-field__label">Status</label>
      <select className="inv-select">…</select>
    </div>
    <button className="inv-btn inv-btn--icon" title="Refresh"><RefreshCw size={16}/></button>
    {hasFilter && <button className="inv-btn"><X size={14}/> Clear</button>}
  </div>

  {/* 4. Desktop table */}
  {data && visible.length > 0 && (
    <div className="inv-table-wrap">
      <div className="inv-scroll">
        <table className="inv-table">
          <thead><tr><th>…</th></tr></thead>
          <tbody>{visible.map(row => <tr key={row.id} onClick={…}>…</tr>)}</tbody>
        </table>
      </div>
    </div>
  )}

  {/* 5. Mobile cards — shown only below 900px via CSS */}
  <div className="inv-mobile">
    {visible.map(item => <div className="inv-card" onClick={…}>…</div>)}
  </div>

  {/* 6. Status / loading / empty */}
  {error && <EmptyState title="…" text={error} />}
  {!data && !error && <div className="inv-status"><Loading label="…" /></div>}
  {data && visible.length === 0 && !error && <div className="inv-status">No records match.</div>}

  {/* 7. Pagination */}
  <div className="inv-pagination">
    <span className="inv-pagination__info">Showing … of …</span>
    <select className="inv-select" value={pageSize}>… rows per page …</select>
    <button className="inv-page-btn">‹</button>
    <button className="inv-page-btn inv-page-btn--active">n</button>
    <button className="inv-page-btn">›</button>
  </div>
</div>
```

## Class inventory (`erpListView.css`)

- **Page / header:** `.inv-page`, `.inv-header`, `.inv-header__title`, `.inv-header__subtitle`, `.inv-header__actions`
- **Buttons:** `.inv-btn`, `.inv-btn--primary` (blue gradient + glow), `.inv-btn--icon`, `.inv-btn:disabled`
- **KPI:** `.inv-kpi-grid`, `.inv-kpi`, `.inv-kpi__icon`, `.inv-kpi__value`, `.inv-kpi__label`, `.inv-kpi__hint`, `.inv-kpi__delta`
- **Filter bar:** `.inv-filterbar`, `.inv-field`, `.inv-field__label`, `.inv-input`, `.inv-select` (custom arrow)
- **Table:** `.inv-table-wrap`, `.inv-scroll` (internal horizontal scroll), `.inv-table`, `.inv-check`, `.inv-row--selected`
- **Customer cell:** `.inv-customer`, `.inv-avatar`, `.inv-customer__name`, `.inv-customer__contact`
- **Links / dates:** `.inv-link` (blue clickable), `.inv-sub`, `.inv-date`, `.inv-time`, `.inv-overdue-tag`
- **Amount stack:** `.inv-amount`, `.inv-amount__total`, `.inv-amount__paid` (green), `.inv-amount__balance`
- **Badges:** `.inv-badge` + tone `.inv-badge--blue|green|orange|red|purple|gray`
- **Row actions / dropdown:** `.inv-actions`, `.inv-icon-btn`, `.inv-menu-wrap`, `.inv-menu`, `.inv-menu__item`, `.inv-menu__item--danger`, `.inv-menu__divider`
- **Pagination:** `.inv-pagination`, `.inv-pagination__info`, `.inv-page-btn`, `.inv-page-btn--active`
- **Empty / loading:** `.inv-status`
- **Mobile cards:** `.inv-mobile`, `.inv-card`, `.inv-card__top`, `.inv-card__customer`, `.inv-card__body`, `.inv-card__cell`, `.inv-card__label`, `.inv-card__value`, `.inv-card__footer`

**Responsive behavior (already in the stylesheet):** the table is hidden below `900px`
(`.inv-table-wrap { display:none }`) and the `.inv-mobile` card list is shown instead;
KPIs drop to 2 columns below 900px, 1 column below 480px.

## Badge tone mapping

Map a domain status to a tone, then render `<span className="inv-badge inv-badge--{tone}">`.
Convention used by the pages:

| Tone | Typical statuses |
|---|---|
| `green` | Accepted, Approved, Paid, Verified, Delivered, Resolved |
| `red` | Cancelled, Declined, Rejected, Overdue, Expired |
| `orange` | Pending Approval, Issued, Negotiating, Partially Paid |
| `purple` | Viewed, Converted, Credit Note, info |
| `blue` | Draft, Issued, open |
| `gray` | neutral / unknown |

## Rules for future agents

- **Do NOT modify** the sidebar (`src/components/sidebar/Sidebar.tsx`) or the top nav
  (`portal__topbar` in `AdminLayout.tsx` / `CustomerLayout.tsx`) unless explicitly asked.
- **Preserve** routes, backend logic, APIs, and data. UI redesigns are CSS/JSX only.
- **Never fabricate** data that the API doesn't provide (e.g., contact persons/emails that
  aren't in a list DTO). Show what the API returns; derive derived badges (e.g., payment
  status) from real fields.
- Use existing CSS vars (not hard-coded hex) so light/dark theme switching keeps working.
- Client-side filters refine the current page only; server-side search/status stay driven
  by the existing API params.
- If a wide table is added, keep it inside `.inv-scroll` so it scrolls internally instead
  of pushing the layout / causing a horizontal page shift.
- The content grid is `.portal__content` with `min-width: 0` and `> * { min-width: 0 }` so
  it **reflows (resizes)** beside the sidebar rather than shifting right or clipping.
