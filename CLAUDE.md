# Shakti Udyog — Engineering & LLM Guidelines

## 1. Project Documentation Index (`docs/`)

The authoritative sources of truth for this repository are structured in `docs/`:

1. [`docs/01-product-requirements-document.md`](docs/01-product-requirements-document.md) — Product requirements, business domain, user personas, workflows.
2. [`docs/02-technical-architecture-document.md`](docs/02-technical-architecture-document.md) — Clean architecture, .NET 9 API, EF Core 9, SQL Server, 60 entities, API catalog, SignalR.
3. [`docs/03-security-and-access-document.md`](docs/03-security-and-access-document.md) — In-memory JWT + HttpOnly refresh cookies, RBAC, dynamic permissions, customer data isolation, audit logs.
4. [`docs/04-frontend-specification-document.md`](docs/04-frontend-specification-document.md) — React 19, TypeScript, Vite 8, "Glacier" design system, routes, ERP tables (`erpListView.css`).
5. [`docs/05-feature-ticket-list.md`](docs/05-feature-ticket-list.md) — Feature ticket breakdown across all 13 epics and roadmap.

---

## 2. Common Development Commands

### Backend (.NET 9 Web API)
```bash
# Build solution
cd backend
dotnet build

# Run unit and integration tests
dotnet test

# Apply pending database migrations
dotnet ef database update --project src/ShaktiUdyog.Infrastructure --startup-project src/ShaktiUdyog.Api

# Add a new migration
dotnet ef migrations add <MigrationName> --project src/ShaktiUdyog.Infrastructure --startup-project src/ShaktiUdyog.Api --output-dir Data/Migrations

# Run backend API locally (http://localhost:5000)
dotnet run --project src/ShaktiUdyog.Api --launch-profile http
```

### Frontend (React 19 + TypeScript + Vite 8)
```bash
# Install dependencies
cd frontend
npm install

# Run Vite dev server (http://localhost:5173)
npm run dev

# Run linter
npm run lint

# Production build
npm run build
```

---

## 3. Key Development Principles
- **Backend-Enforced Authorization:** Every non-public endpoint must be guarded by `[Authorize]`. Frontend route guards are for UX only.
- **Customer Data Isolation:** Every customer query must be filtered by the authenticated user's approved `CompanyId`. Never trust client-supplied company or order IDs.
- **Engineer Order Ownership:** Engineers can manage and update only orders assigned to them (`Order.AssignedToUserId`). Non-assigned updates return HTTP 403.
- **Immutable Audit Logging:** The `AuditLogs` table is insert-only and guarded at the `AppDbContext` level against modifications or deletions.
- **Shared ERP List Styling:** All portal table views import and use `erpListView.css` with `.inv-*` class conventions.