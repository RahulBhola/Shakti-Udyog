# Shakti Udyog Platform

Secure iron-casting business platform for Shakti Udyog: public website plus Admin, Data Updater, and Customer portals.

- Functional source of truth: [`docs/shakti-udyog-requirements.md`](docs/shakti-udyog-requirements.md)
- Project rules: [`CLAUDE.md`](CLAUDE.md)

## Repository layout

```
backend/
  ShaktiUdyog.sln
  src/
    ShaktiUdyog.Domain/          # Entities, role/policy constants (no dependencies)
    ShaktiUdyog.Infrastructure/  # EF Core DbContext, migrations, role seeding
    ShaktiUdyog.Api/             # ASP.NET Core Web API, Swagger, health checks
  tests/
    ShaktiUdyog.Api.Tests/       # xUnit integration + unit tests
  .env.example                   # Environment variable examples (no secrets)
frontend/
  src/
    api/         # Typed API client
    auth/        # Role constants (mirror of backend roles)
    features/    # Page components grouped by area (public, shared, ...)
    config.ts    # Runtime config from Vite env vars
  .env.example   # Frontend env examples (VITE_* only — ships to browser)
docs/            # Requirements
```

## Prerequisites

- .NET SDK 9.0+ (`dotnet --version`)
- Node.js 20+ and npm (`node --version`)
- SQL Server (local instance, SQL Express, or LocalDB). Development default: `localhost\SQLEXPRESS` with Windows authentication.
- EF Core CLI tools: `dotnet tool install --global dotnet-ef` (or `dotnet tool update --global dotnet-ef`)

## Configuration

No secrets are committed. Configuration comes from `appsettings.*.json` (non-secret defaults) and environment variables / user secrets (anything sensitive).

1. Backend: see [`backend/.env.example`](backend/.env.example). The development connection string in `appsettings.Development.json` uses Windows authentication against `localhost\SQLEXPRESS`; adjust the instance name if yours differs, or override via:
   ```bash
   # PowerShell
   $env:ConnectionStrings__DefaultConnection = "Server=localhost\SQLEXPRESS;Database=ShaktiUdyogDev;Trusted_Connection=True;TrustServerCertificate=True"
   ```
   For values you want persisted per-developer, prefer user secrets:
   ```bash
   cd backend/src/ShaktiUdyog.Api
   dotnet user-secrets init
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<your connection string>"
   ```
2. Frontend: copy `frontend/.env.example` to `frontend/.env.local` and adjust `VITE_API_BASE_URL` if the API is not on `http://localhost:5000`.

## Database setup

```bash
cd backend
dotnet ef database update --project src/ShaktiUdyog.Infrastructure --startup-project src/ShaktiUdyog.Api
```

This creates the `ShaktiUdyogDev` database with ASP.NET Core Identity tables and the immutable `AuditLogs` table. The three application roles (`Admin`, `DataUpdater`, `Customer`) are seeded automatically at API startup (idempotent). No user accounts are seeded — accounts are created through admin-approval flows in Milestone 2.

To add a new migration after changing entities:

```bash
cd backend
dotnet ef migrations add <Name> --project src/ShaktiUdyog.Infrastructure --startup-project src/ShaktiUdyog.Api --output-dir Data/Migrations
```

## Run the backend

```bash
cd backend
dotnet run --project src/ShaktiUdyog.Api --launch-profile http
```

- API base: http://localhost:5000
- Swagger UI (Development only): http://localhost:5000/swagger
- Health check: http://localhost:5000/health (verifies database connectivity)
- Meta endpoint: http://localhost:5000/api/v1/meta

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173 — the homepage shows live API connectivity status.

## Build and test

```bash
# Backend build + tests
cd backend
dotnet build
dotnet test

# Frontend production build
cd frontend
npm run build
```

## Security notes (Milestone 1 state)

- Authorization policies (`RequireAdmin`, `RequireDataUpdater`, `RequireCustomer`) are registered in the API; endpoints added in later milestones must apply them server-side — frontend checks are never sufficient.
- The `AuditLogs` table is insert-only; the DbContext rejects updates/deletes.
- Swagger UI is exposed only in the Development environment.
- CORS allows only the configured frontend origin (`Frontend:BaseUrl`).
- Identity password policy: minimum 12 characters with mixed character classes; lockout after 5 failed attempts.
- All company details displayed anywhere must come from `docs/shakti-udyog-requirements.md`; unverified details stay as placeholders.

## Milestone status

- ✅ Milestone 1 — foundation: solution structure, EF Core + SQL Server, initial migration, Identity role seeding, Swagger, health check, error handling, frontend scaffold with routing placeholders.
- ⏭ Milestone 2 — authentication: JWT access tokens, refresh-token rotation, login/password-reset endpoints, MFA groundwork, fine-grained permission policies, audit logging of auth events.
