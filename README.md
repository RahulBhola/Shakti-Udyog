# Shakti Udyog Platform

Secure iron-casting business platform for Shakti Udyog: public website plus Admin, Data Updater, and Customer portals.

- Functional source of truth: [`docs/shakti-udyog-requirements.md`](docs/shakti-udyog-requirements.md)
- Project rules: [`CLAUDE.md`](CLAUDE.md)

## Repository layout

```text
backend/
  ShaktiUdyog.sln
  src/
    ShaktiUdyog.Domain/          # Entities, role/permission/policy constants (no dependencies)
    ShaktiUdyog.Infrastructure/  # EF Core DbContext, migrations, seeding, token/auth services
    ShaktiUdyog.Api/             # ASP.NET Core Web API, auth endpoints, Swagger, health checks
  tests/
    ShaktiUdyog.Api.Tests/       # xUnit integration + unit tests
  .env.example                   # Environment variable examples (no secrets)
frontend/
  src/
    api/         # Typed API client with JWT attachment + refresh retry
    auth/        # Token storage, auth service, AuthContext, ProtectedRoute, roles
    features/    # Page components grouped by area (public, auth, shared, ...)
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

1. Backend database: the development connection string in `appsettings.Development.json` uses Windows authentication against `localhost\SQLEXPRESS`; adjust the instance name if yours differs, or override via the `ConnectionStrings__DefaultConnection` environment variable (see [`backend/.env.example`](backend/.env.example)).

2. Backend secrets (required): the API refuses to start without a JWT signing key of at least 32 bytes. Set it via user secrets:

   ```bash
   cd backend/src/ShaktiUdyog.Api
   dotnet user-secrets init
   dotnet user-secrets set "Jwt:SigningKey" "$(openssl rand -base64 48)"
   # Optional: seed a Development-only demo admin (admin@shaktiudyog.local).
   # Must satisfy the password policy (12+ chars, upper/lower/digit/symbol).
   dotnet user-secrets set "DevAdmin:Password" "<LOCAL_DEV_ONLY_PASSWORD>"
   # Optional per-developer connection string override:
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<your connection string>"
   ```

3. Frontend: copy `frontend/.env.example` to `frontend/.env.local` and adjust `VITE_API_BASE_URL` if the API is not on `http://localhost:5000`.

## Database setup

```bash
cd backend
dotnet ef database update --project src/ShaktiUdyog.Infrastructure --startup-project src/ShaktiUdyog.Api
```

Migrations applied: `InitialCreate` (Identity tables + immutable `AuditLogs`) and `AddAuthTables` (`RefreshTokens`, `PasswordResetTokens`, `UserCompanies`). The three application roles (`Admin`, `DataUpdater`, `Customer`) are seeded automatically at API startup (idempotent). No user accounts are seeded outside Development — accounts are created through admin-approval flows.

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

- API base: [http://localhost:5000](http://localhost:5000)
- Swagger UI (Development only): [http://localhost:5000/swagger](http://localhost:5000/swagger) — supports JWT Bearer testing via the Authorize button
- Health check: [http://localhost:5000/health](http://localhost:5000/health) (verifies database connectivity)
- Meta endpoint: [http://localhost:5000/api/v1/meta](http://localhost:5000/api/v1/meta)

### Authentication endpoints

| Endpoint | Purpose |
| --- | --- |
| `POST /api/v1/auth/login` | Email + password → short-lived JWT + refresh token (body + HttpOnly cookie) |
| `POST /api/v1/auth/refresh` | Rotate refresh token, issue new JWT; reuse of a rotated token revokes the chain |
| `POST /api/v1/auth/forgot-password` | Always returns a neutral success message; hashed one-time token stored |
| `POST /api/v1/auth/reset-password` | Consume reset token, set new password, revoke all sessions |
| `POST /api/v1/auth/logout` | Revoke the presented refresh token and clear the cookie |
| `GET /api/v1/auth/me` | Authenticated user's identity, roles, and permissions |

Auth endpoints are rate-limited per IP (10 requests/minute → HTTP 429).

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

- App: [http://localhost:5173](http://localhost:5173) — the homepage shows live API connectivity status; portal routes are guarded by role-aware protected routes (server-side authorization still applies).

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

## Security notes

- Authorization is always enforced in the backend: role policies (`AdminOnly`, `DataUpdaterOnly`, `CustomerOnly`) plus dynamic permission policies (`permission:<name>`, e.g. `permission:invoice.manage`). Frontend route guards are UX only.
- Access tokens are 15-minute JWTs (HS256, zero clock skew); refresh tokens are 64-byte random values stored **hashed** (SHA-256) with rotation and reuse-detection chain revocation.
- Password reset tokens are hashed at rest, single-use, 20-minute expiry; the forgot-password endpoint never discloses whether an email exists.
- Passwords are hashed by ASP.NET Core Identity's current hasher; policy: 12+ chars, upper/lower/digit/symbol; lockout after 5 failed attempts (15 minutes).
- The refresh cookie is HttpOnly, Secure, SameSite=Strict, path-scoped to `/api/v1/auth`. The frontend keeps access tokens in memory only.
- The `AuditLogs` table is insert-only; auth events (login success/failure, lockout, resets, revocations) are audited.
- Swagger UI is exposed only in the Development environment.
- CORS allows only the configured frontend origin (`Frontend:BaseUrl`) with credentials.
- All company details displayed anywhere must come from `docs/shakti-udyog-requirements.md`; unverified details stay as placeholders.

## Customer portal (Milestone 4)

- Portal: [http://localhost:5173/customer](http://localhost:5173/customer) — requires the Customer role.
- Development demo login: `customer@demo.local` — password in user secrets (`DevCustomer:Password`, seeded with clearly-labelled demo data only in Development).
- Every `/api/v1/customer/*` endpoint requires the Customer role and filters all data by the caller's approved company (`UserCompanies`); cross-company or unknown IDs return 404. Internal milestone notes and internal documents are never selected into customer responses.
- Protected files (drawings, payment proofs) are stored outside the web root via `IFileStorageService` (local implementation; cloud implementation is a future DI swap) with extension, size, and magic-byte validation. Downloads stream through the API after authorization — no file paths or public URLs.

## Milestone status

- ✅ Milestone 1 — foundation: solution structure, EF Core + SQL Server, initial migration, role seeding, Swagger, health check, error handling, frontend scaffold.
- ✅ Milestone 2 — authentication & authorization: JWT + refresh-token rotation, login/logout/refresh/forgot/reset/me endpoints, permission model and policy-based authorization, rate limiting, auth auditing, frontend auth foundation (context, protected routes, login page).
- ⏭ Milestone 3 — public website & RFQ flow: marketing pages from the requirements copy, enquiry + RFQ forms with server-side validation, secure drawing uploads, spam protection.
