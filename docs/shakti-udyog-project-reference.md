# Shakti Udyog — Complete Project Reference

> **Generated:** 2026-07-28  
> **Purpose:** Single source-of-truth for LLM agents working on this project. Read this file instead of exploring the full codebase.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Directory Structure](#2-directory-structure)
3. [Technology Stack](#3-technology-stack)
4. [Architecture](#4-architecture)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [User Roles & Permissions](#6-user-roles--permissions)
7. [Frontend: Routes & Pages](#7-frontend-routes--pages)
8. [Backend: API Endpoints](#8-backend-api-endpoints)
9. [Data Model (Entities)](#9-data-model-entities)
10. [Workflows & Statuses](#10-workflows--statuses)
11. [Production Kanban System](#11-production-kanban-system)
12. [UI Theme & Design System](#12-ui-theme--design-system)
13. [Security Rules](#13-security-rules)
14. [Configuration](#14-configuration)
15. [Key Code Patterns](#15-key-code-patterns)

---

## 1. Project Overview

**Shakti Udyog** is a full-stack web platform for an iron casting manufacturing business. It includes:

- **Public Website** — Marketing site with product catalogue, capabilities, quality info, Enquiry/contact forms
- **Customer Portal** — Logged-in customer dashboard for Enquiries, quotations, orders, invoices, payments, documents
- **Engineer Portal** — Internal staff portal for managing Enquiries, quotations, orders, content
- **Admin Portal** — Full administration: users, roles, content, orders, production, audit logs, reports

**Company:** Shakti Udyog (est. 1965), Ludhiana, Punjab, India  
**Product:** Grey iron castings, ductile iron castings, custom/OEM castings, machining & finishing  
**Capacity:** 299 tons/month, 50+ casting grades, 60+ years experience, 9000+ customers served

### Implementation Order

1. Project setup, database, migrations, configuration, Swagger ✅
2. Authentication, password reset, roles, authorization policies ✅
3. Public website and Enquiry flow ✅
4. Customer portal: Enquiries, quotations, orders, tracking, documents, invoices, payments ✅
5. Engineer and Admin portals ✅
6. Jira integration, reports, and refinements 🔲

---

## 2. Directory Structure

```
D:\Projects\Shakti Udyog\
├── CLAUDE.md                          # Project instructions for LLM agents
├── docs/
│   ├── shakti-udyog-requirements.md   # Full functional requirements (source of truth)
│   └── shakti-udyog-project-reference.md  # THIS FILE
│
├── backend/
│   ├── ShaktiUdyog.sln
│   ├── src/
│   │   ├── ShaktiUdyog.Api/           # ASP.NET Core Web API (presentation layer)
│   │   │   ├── Program.cs             # App startup, DI, middleware, seeding
│   │   │   ├── Controllers/           # 15 API controllers
│   │   │   ├── Services/              # 20+ application services
│   │   │   ├── Contracts/             # Request/response DTOs
│   │   │   ├── Authorization/         # Policy provider + handler
│   │   │   ├── Validation/            # FluentValidation validators
│   │   │   └── Infrastructure/        # Swagger setup, exception handler
│   │   ├── ShaktiUdyog.Domain/        # Domain layer (entities + constants)
│   │   │   ├── Entities/              # 60+ entity classes
│   │   │   └── Constants/             # Roles, Permissions, Statuses, AuthPolicies
│   │   └── ShaktiUdyog.Infrastructure/ # Data access + infrastructure
│   │       ├── Data/                  # AppDbContext, migrations, seeders
│   │       ├── Auth/                  # JWT, password reset, email sender
│   │       ├── Auditing/              # Audit log writer
│   │       ├── Storage/               # File storage + PDF services
│   │       └── Notifications/         # Notification service
│   └── tests/
│       └── ShaktiUdyog.Api.Tests/     # Integration tests (4 test files)
│
├── frontend/
│   ├── package.json                   # React 19, Vite 8, TailwindCSS 4
│   ├── vite.config.ts
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx                   # App entry point
│   │   ├── App.tsx                    # Router with all routes
│   │   ├── config.ts                  # Runtime config (VITE_API_BASE_URL)
│   │   ├── api/                       # API client modules
│   │   │   ├── client.ts              # Base fetch wrapper (JWT, auto-refresh, error handling)
│   │   │   ├── publicApi.ts           # Public endpoints
│   │   │   ├── customerApi.ts         # Customer portal endpoints
│   │   │   ├── engineerApi.ts          # Engineer endpoints
│   │   │   └── adminApi.ts            # Admin endpoints
│   │   ├── auth/                      # Authentication
│   │   │   ├── AuthContext.tsx         # React context for auth state
│   │   │   ├── authService.ts         # Login/refresh/logout/me calls
│   │   │   ├── oauthService.ts        # Google/Apple OAuth
│   │   │   ├── ProtectedRoute.tsx     # Route guard component
│   │   │   ├── roles.ts              # Role constants
│   │   │   ├── tokenStorage.ts       # In-memory access token store
│   │   │   └── ThemeContext.tsx       # Light/dark theme toggle
│   │   ├── components/               # Shared components
│   │   │   ├── PublicLayout.tsx       # Public site layout (header/footer)
│   │   │   ├── Seo.tsx               # SEO meta tags
│   │   │   ├── Skeleton.tsx          # Loading skeleton
│   │   │   ├── ui.tsx                # Basic UI components
│   │   │   ├── sidebar/              # Sidebar for portals
│   │   │   └── dashboard/            # Dashboard components
│   │   ├── pages/                    # Public website pages
│   │   ├── portal/                   # Portal layouts + pages
│   │   │   ├── CustomerLayout.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   └── pages/                # Portal page components
│   │   ├── content/                  # Static content data (pages info, FAQs)
│   │   ├── styles/                   # CSS files
│   │   └── features/                 # Feature modules
│   └── public/                       # Static assets (images, robots.txt, sitemap.xml)
```

---

## 3. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React + TypeScript | 19.x / 6.x |
| **Build** | Vite | 8.x |
| **Styling** | TailwindCSS | 4.x |
| **Icons** | Lucide React | 1.x |
| **Charts** | Recharts | 3.x |
| **Routing** | React Router DOM | 7.x |
| **Font** | Inter Variable (@fontsource) | 5.x |
| **Backend** | ASP.NET Core | .NET 9 |
| **ORM** | Entity Framework Core | 9.x |
| **Database** | SQL Server | - |
| **Auth** | ASP.NET Core Identity + JWT Bearer | 9.x |
| **API Docs** | Swashbuckle / Swagger | 7.x |
| **Validation** | FluentValidation | 12.x |
| **Linting** | oxlint | 1.x |

---

## 4. Architecture

### Backend Layers (Clean Architecture)

```
ShaktiUdyog.Api (Presentation)
  └── Controllers → call Services → return DTOs
  └── Middleware: GlobalExceptionHandler, RateLimiting, CORS
  └── Auth: PermissionPolicyProvider, PermissionAuthorizationHandler
  └── Validation: FluentValidation validators per request type

ShaktiUdyog.Domain (Core)
  └── Entities: 60+ POCO classes
  └── Constants: Roles, Permissions, Statuses, AuthPolicies

ShaktiUdyog.Infrastructure (Data Access)
  └── AppDbContext: EF Core context with full Fluent API config
  └── Migrations: 18 migrations (Initial → ProductMaster)
  └── Auth: TokenService, PasswordResetService, JwtOptions
  └── Storage: LocalFileStorageService (pluggable)
  └── Auditing: AuditWriter
```

### Frontend Architecture

```
App.tsx (BrowserRouter)
  ├── PublicLayout → Public pages (/, /about, /products, ...)
  ├── /login, /signup, /auth/callback, /unauthorized
  ├── /customer/* (ProtectedRoute: Customer role)
  │   └── CustomerLayout → customer portal pages
  └── /admin/* (ProtectedRoute: Admin or Engineer role)
      └── AdminLayout → admin/engineer portal pages
```

### API Client Layer

A single fetch wrapper (`client.ts`) handles:
- Automatic JWT Bearer token attachment
- 401 → silent refresh via HttpOnly cookie → retry once
- Typed `apiGet`, `apiPost`, `apiPatch`, `apiPut`, `apiDelete`, `apiUpload`, `apiDownload`
- ProblemDetails error parsing with trace ID

### Token Security

- **Access token**: Stored in-memory only (never localStorage/sessionStorage)
- **Refresh token**: HttpOnly cookie managed by the API (never accessible to JS)
- **Auto-refresh**: On 401, one silent refresh attempt before showing error
- **Session bootstrap**: On page reload, attempt silent refresh to restore session

---

## 5. Authentication & Authorization

### Authentication Flow

1. User logs in with email + password → API returns `accessToken` + sets HttpOnly refresh cookie
2. Access token is stored in-memory, attached as `Authorization: Bearer <token>`
3. On 401, frontend calls `/api/v1/auth/refresh` — if the HttpOnly cookie is valid, new tokens issued
4. Logout revokes refresh token server-side + clears in-memory token

### External Auth (Optional)

- Google OAuth (via `Microsoft.AspNetCore.Authentication.Google`)
- Apple Sign-In (via OpenID Connect)
- Configured in `ExternalAuth` section of appsettings.json / env vars

### Password Policy

- Minimum length: 12 characters
- Requires: digit, lowercase, uppercase, non-alphanumeric
- Unique email required
- Lockout: 5 failed attempts → 15-minute lockout
- Reset tokens expire in 15-30 minutes, single-use, hashed in DB

### Authorization Model

**Role-based + Permission-based authorization:**

```csharp
// Named role policies
[Authorize(Policy = "AdminOnly")]
[Authorize(Policy = "CustomerOnly")]

// Dynamic permission policies
[Authorize(Policy = "permission:enquiry.read.assigned")]
```

- `PermissionPolicyProvider` — resolves `permission:<name>` policies dynamically
- `PermissionAuthorizationHandler` — checks the `permission` claim in JWT
- Backend enforces ALL authorization — frontend guards are UX only

### JWT Configuration

| Setting | Value |
|---------|-------|
| Issuer | `ShaktiUdyog.Api` |
| Audience | `ShaktiUdyog.Clients` |
| Access Token TTL | 15 minutes |
| Refresh Token TTL | 7 days |
| Clock Skew | 0 |
| MapInboundClaims | false (preserves raw claim names) |
| Signing Key | From env vars / user secrets (min 32 bytes) |

---

## 6. User Roles & Permissions

### Roles

| Role | Description |
|------|-------------|
| `Admin` | Full system access, user management, approvals, audit logs |
| `Engineer` | Content and operations staff — manages Enquiries, orders, products, production jobs |
| `Customer` | Portal users — own company's Enquiries, orders, invoices, documents |

### Permissions (Fine-Grained)

| Permission | Admin | Engineer | Customer |
|-----------|-------|-------------|----------|
| `users.manage` | ✅ | ❌ | ❌ |
| `roles.manage` | ✅ | ❌ | ❌ |
| `content.edit` | ✅ | ✅ | ❌ |
| `content.publish` | ✅ | ❌ | ❌ |
| `enquiry.read.assigned` | ✅ | ✅ | ❌ |
| `enquiry.update.assigned` | ✅ | ✅ | ❌ |
| `quotation.create` | ✅ | ✅ | ❌ |
| `order.update.assigned` | ✅ | ✅ | ❌ |
| `order.publish.customer_status` | ✅ | ❌ | ❌ |
| `invoice.manage` | ✅ | ❌ | ❌ |
| `payment.verify` | ✅ | ❌ | ❌ |
| `audit.read` | ✅ | ❌ | ❌ |

### Authorization Policies

| Policy Name | Required Roles |
|-------------|---------------|
| `AdminOnly` | Admin |
| `EngineerOnly` | Engineer, Admin |
| `CustomerOnly` | Customer |

---

## 7. Frontend: Routes & Pages

### Public Website (`/`)

| Route | Page | Content Source |
|-------|------|---------------|
| `/` | HomePage | `content/home.ts` |
| `/about` | AboutPage | `content/about.ts`, `content/company.ts` |
| `/products` | ProductsPage | API → public products |
| `/products/:slug` | ProductDetailPage | API → public product |
| `/capabilities` | CapabilitiesPage | `content/capabilities.ts` |
| `/quality` | QualityPage | `content/quality.ts` |
| `/industries` | IndustriesPage | `content/industries.ts` |
| `/resources` | ResourcesPage | API → resources |
| `/resources/:slug` | ResourceDetailPage | API → resource |
| `/contact` | ContactPage | Contact form (submits enquiry) |
| `/request-a-quote` | RequestQuotePage | Enquiry form (with file upload) |
| `/privacy-policy` | LegalPage (slug="privacy-policy") | Static |
| `/terms-of-use` | LegalPage (slug="terms-of-use") | Static |
| `/cookie-policy` | LegalPage (slug="cookie-policy") | Static |
| `*` | NotFoundPage | 404 |

### Auth Pages

| Route | Page |
|-------|------|
| `/login` | LoginPage (email/password + Google/Apple OAuth) |
| `/signup` | SignUpPage (registration) |
| `/auth/callback` | AuthCallbackPage (OAuth callback handler) |
| `/unauthorized` | UnauthorizedPage |
| `/access-denied` | AccessDeniedPage |

### Customer Portal (`/customer/*`)

Requires `Customer` role.

| Route | Page | Key Features |
|-------|------|-------------|
| `/customer/dashboard` | DashboardPage | Open Enquiries, active quotations, orders, recent docs, notifications |
| `/customer/enquirys` | EnquiryListPage | Paginated list with search/filter |
| `/customer/enquirys/new` | EnquiryNewPage | Multi-field Enquiry form with file upload |
| `/customer/enquirys/:id` | EnquiryDetailPage | Enquiry details with timeline, comments, file download |
| `/customer/enquirys/:id/edit` | EnquiryEditPage | Edit draft Enquiry |
| `/customer/quotations` | QuotationListPage | List with status badges |
| `/customer/quotations/:id` | QuotationDetailPage | Line items, commercial terms, accept/decline |
| `/customer/orders` | OrderListPage | List with status tracking |
| `/customer/orders/:id` | OrderDetailPage | Items, shipments, commercial, documents |
| `/customer/orders/:id/timeline` | OrderTimelinePage | Amazon-style timeline |
| `/customer/invoices` | InvoiceListPage | List with payment status |
| `/customer/invoices/:id` | InvoiceDetailPage | Invoice + payments |
| `/customer/documents` | DocumentsPage | Download documents |
| `/customer/notifications` | NotificationsPage | In-app notifications |
| `/customer/profile` | ProfilePage | Edit profile, change password |
| `/customer/payments` | PaymentsPage | Submit payment proof |
| `/customer/company` | CompanyPage | Company details |
| `/customer/settings` | SettingsPage | Portal settings |
| `/customer/support` | SupportPage | Raise support request |

### Admin Portal (`/admin/*`)

Requires `Admin` or `Engineer` role.

| Route | Page | Role Access |
|-------|------|-------------|
| `/admin/dashboard` | AdminDashboardPage | Admin + Engineer |
| `/admin/enquirys` | EngineerEnquiryListPage | Admin + Engineer |
| `/admin/enquirys/:id` | EngineerEnquiryDetailPage | Admin + Engineer |
| `/admin/quotations` | EngineerQuotationListPage | Admin + Engineer |
| `/admin/quotations/new` | CreateQuotationPage | Admin + Engineer |
| `/admin/quotations/:id` | AdminQuotationDetailPage | Admin + Engineer |
| `/admin/orders` | EngineerOrderListPage | Admin + Engineer |
| `/admin/orders/:id` | AdminOrderDetailPage | Admin + Engineer |
| `/admin/production` | AdminProductionPage | Admin + Engineer |
| `/admin/documents` | AdminDocumentsPage | Admin + Engineer |
| `/admin/invoices` | AdminInvoiceManagePage | Admin |
| `/admin/invoices/new` | AdminInvoiceCreatePage | Admin |
| `/admin/users` | AdminUsersPage | Admin only |
| `/admin/companies` | AdminCompaniesPage | Admin only |
| `/admin/products` | AdminProductPage | Admin + Engineer |
| `/admin/products/:id` | AdminProductDetailPage | Admin + Engineer |
| `/admin/categories` | AdminCategoryPage | Admin + Engineer |
| `/admin/settings` | AdminSettingsPage | Admin |
| `/admin/audit-logs` | AdminAuditLogsPage | Admin |
| `/admin/reports` | AdminReportsPage | Admin |

---

## 8. Backend: API Endpoints

All endpoints are under `/api/v1/`. Authentication: JWT Bearer.

### Public Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/public/enquiries` | Submit contact enquiry (honeypot spam protection) |
| POST | `/api/v1/public/enquirys` | Submit public Enquiry (with optional file upload) |
| GET | `/api/v1/public/products` | List published products |
| GET | `/api/v1/public/products/{slug}` | Get product by slug |
| GET | `/api/v1/public/resources` | List published resources |
| GET | `/api/v1/public/resources/{slug}` | Get resource by slug |

### Auth Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login → returns access token + sets HttpOnly refresh cookie |
| POST | `/api/v1/auth/refresh` | Refresh access token via cookie |
| POST | `/api/v1/auth/logout` | Revoke refresh token |
| POST | `/api/v1/auth/register` | Register new customer account |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Reset password with token |
| GET | `/api/v1/auth/me` | Get current user profile + roles + permissions |
| POST | `/api/v1/auth/external/login` | Initiate OAuth login |
| POST | `/api/v1/auth/external/callback` | OAuth callback handler |

### Customer Endpoints (Requires Customer role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/customer/dashboard` | Dashboard summary |
| GET | `/api/v1/customer/enquirys` | List Enquiries (paginated, filterable) |
| POST | `/api/v1/customer/enquirys` | Create Enquiry |
| GET | `/api/v1/customer/enquirys/{id}` | Get Enquiry detail |
| PATCH | `/api/v1/customer/enquirys/{id}` | Update draft Enquiry |
| DELETE | `/api/v1/customer/enquirys/{id}` | Soft-delete Enquiry |
| POST | `/api/v1/customer/enquirys/{id}/submit` | Submit draft Enquiry |
| GET | `/api/v1/customer/enquirys/{id}/timeline` | Get Enquiry status history |
| POST | `/api/v1/customer/enquirys/{id}/files` | Upload Enquiry file |
| GET | `/api/v1/customer/quotations` | List quotations |
| GET | `/api/v1/customer/quotations/{id}` | Get quotation detail |
| GET | `/api/v1/customer/quotations/{id}/timeline` | Get quotation timeline |
| POST | `/api/v1/customer/quotations/{id}/response` | Accept/decline/negotiate quotation |
| GET | `/api/v1/customer/orders` | List orders |
| GET | `/api/v1/customer/orders/{id}` | Get order detail |
| GET | `/api/v1/customer/orders/{id}/timeline` | Get order timeline |
| POST | `/api/v1/customer/orders/{id}/support-requests` | Raise support request |
| POST | `/api/v1/customer/orders/{id}/pay-advance` | Submit advance payment proof |
| GET | `/api/v1/customer/invoices` | List invoices |
| GET | `/api/v1/customer/invoices/{id}` | Get invoice detail |
| GET | `/api/v1/customer/documents` | List documents |
| GET | `/api/v1/customer/documents/{id}/download` | Download document |
| GET | `/api/v1/customer/notifications` | List notifications |
| POST | `/api/v1/customer/notifications/{id}/read` | Mark notification read |
| GET | `/api/v1/customer/payments` | List payments |
| POST | `/api/v1/customer/payments/proof` | Submit payment proof |
| GET | `/api/v1/customer/profile` | Get profile |
| PATCH | `/api/v1/customer/profile` | Update profile |
| POST | `/api/v1/customer/profile/change-password` | Change password |

### Engineer Endpoints (Requires Engineer or Admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/engineer/dashboard` | Engineer dashboard summary |
| GET | `/api/v1/engineer/enquirys` | List all Enquiries (paginated) |
| GET | `/api/v1/engineer/enquirys/{id}` | Get Enquiry detail with internal data |
| PATCH | `/api/v1/engineer/enquirys/{id}/status` | Update Enquiry status |
| PATCH | `/api/v1/engineer/enquirys/{id}/assign` | Assign Enquiry to user |
| POST | `/api/v1/engineer/enquirys/{id}/comments` | Add Enquiry comment |
| GET | `/api/v1/engineer/quotations` | List all quotations |
| GET | `/api/v1/engineer/quotations/{id}` | Get quotation detail |
| POST | `/api/v1/engineer/quotations` | Create quotation |
| PUT | `/api/v1/engineer/quotations/{id}` | Update quotation |
| POST | `/api/v1/engineer/quotations/{id}/submit` | Submit for approval |
| POST | `/api/v1/engineer/quotations/{id}/attachments` | Upload attachment |
| POST | `/api/v1/engineer/quotations/{id}/comments` | Add comment |
| GET | `/api/v1/engineer/orders` | List all orders |
| GET | `/api/v1/engineer/orders/{id}` | Get order detail |
| PATCH | `/api/v1/engineer/orders/{id}/milestones` | Update order milestone |
| POST | `/api/v1/engineer/orders/{id}/shipment` | Create shipment record |
| POST | `/api/v1/engineer/orders/{id}/documents` | Upload order document |

### Admin Endpoints (Requires Admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/quotations` | List all quotations |
| GET | `/api/v1/admin/quotations/{id}` | Get quotation detail |
| PATCH | `/api/v1/admin/quotations/{id}/approve` | Approve quotation |
| PATCH | `/api/v1/admin/quotations/{id}/reject` | Reject quotation |
| PATCH | `/api/v1/admin/quotations/{id}/issue` | Issue quotation to customer |
| PATCH | `/api/v1/admin/quotations/{id}/cancel` | Cancel quotation |
| PATCH | `/api/v1/admin/quotations/{id}/override-status` | Override status |
| GET | `/api/v1/admin/quotations/{id}/history` | Get status history |
| POST | `/api/v1/admin/quotations/{quotationId}/create-order` | Create order from accepted quotation |
| PATCH | `/api/v1/admin/orders/{orderId}/verify-advance` | Verify advance payment |
| PATCH | `/api/v1/admin/orders/{orderId}/stage` | Update order production stage |
| GET | `/api/v1/admin/orders` | List all orders |
| GET | `/api/v1/admin/orders/{id}` | Get order detail |
| PATCH | `/api/v1/admin/orders/{id}/approve-update` | Approve order update |
| PATCH | `/api/v1/admin/orders/{id}/override-status` | Override order status |
| PATCH | `/api/v1/admin/orders/{id}/cancel` | Cancel order |
| GET | `/api/v1/admin/orders/{id}/history` | Get order status history |
| GET | `/api/v1/admin/users` | List users |
| GET | `/api/v1/admin/companies` | List companies |
| GET | `/api/v1/admin/invoices` | List invoices |
| GET | `/api/v1/admin/invoices/{id}` | Get invoice detail |
| POST | `/api/v1/admin/invoices` | Create invoice |
| GET | `/api/v1/admin/products` | List products |
| GET | `/api/v1/admin/products/{id}` | Get product |
| POST | `/api/v1/admin/products` | Create product |
| PUT | `/api/v1/admin/products/{id}` | Update product |
| DELETE | `/api/v1/admin/products/{id}` | Delete product |
| GET | `/api/v1/admin/categories` | List categories |
| POST | `/api/v1/admin/categories` | Create category |
| PUT | `/api/v1/admin/categories/{id}` | Update category |
| GET | `/api/v1/admin/industries` | List industries |
| POST | `/api/v1/admin/industries` | Create industry |
| PUT | `/api/v1/admin/industries/{id}` | Update industry |
| GET | `/api/v1/admin/resources` | List resources |
| POST | `/api/v1/admin/resources` | Create resource |
| PUT | `/api/v1/admin/resources/{id}` | Update resource |
| GET | `/api/v1/admin/faqs` | List FAQs |
| POST | `/api/v1/admin/faqs` | Create FAQ |
| PUT | `/api/v1/admin/faqs/{id}` | Update FAQ |
| GET | `/api/v1/admin/gallery` | List gallery |
| DELETE | `/api/v1/admin/gallery/{id}` | Delete gallery item |
| GET | `/api/v1/admin/product-master` | List product master |
| GET | `/api/v1/admin/product-master/{id}` | Get product master detail |
| POST | `/api/v1/admin/product-master` | Create product master |
| PUT | `/api/v1/admin/product-master/{id}` | Update product master |
| DELETE | `/api/v1/admin/product-master/{id}` | Archive product master |
| POST | `/api/v1/admin/product-master/{id}/duplicate` | Duplicate product master |
| POST | `/api/v1/admin/product-master/{id}/attachments` | Upload attachment |
| GET | `/api/v1/admin/product-master/{id}/usage` | Get product usage |
| GET | `/api/v1/admin/product-master/stats` | Get product stats |

### Production Board Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/production/board` | Get production board data |
| GET | `/api/v1/production/jobs` | List production jobs |
| GET | `/api/v1/production/jobs/{id}` | Get job detail |
| POST | `/api/v1/production/jobs` | Create production job |
| PATCH | `/api/v1/production/jobs/{id}` | Update production job |
| PATCH | `/api/v1/production/jobs/{id}/move` | Move job to next stage |
| POST | `/api/v1/production/jobs/{id}/quality` | Record quality inspection |
| POST | `/api/v1/production/jobs/{id}/comments` | Add comment |
| PUT | `/api/v1/production/jobs/{id}/comments/{commentId}` | Edit comment |
| DELETE | `/api/v1/production/jobs/{id}/comments/{commentId}` | Delete comment |
| GET | `/api/v1/production/dashboard` | Production dashboard stats |
| GET | `/api/v1/production/stages` | List production stages |
| GET | `/api/v1/production/departments` | List departments |
| GET | `/api/v1/production/machines` | List machines |
| GET | `/api/v1/production/preferences` | Get user board preferences |
| PUT | `/api/v1/production/preferences` | Save user board preferences |

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (DB connectivity) |

---

## 9. Data Model (Entities)

The database has **60+ entity tables** under SQL Server. Key entity groups:

### Identity & Access

| Entity | Table | Key Fields |
|--------|-------|------------|
| `ApplicationUser` | AspNetUsers | Email, FullName, PhoneNumber, CompanyName |
| `ApplicationRole` | AspNetRoles | Name |
| `RefreshToken` | RefreshTokens | TokenHash, UserId, ExpiresAtUtc, ReplacedByTokenHash |
| `PasswordResetToken` | PasswordResetTokens | TokenHash, UserId, ExpiresAtUtc |
| `UserCompany` | UserCompanies | UserId, CompanyId (unique constraint) |
| `Company` | Companies | Name, Address, GstNumber, DeliveryAddresses |

### Enquiry → Quotation → Order Pipeline

| Entity | Table | Key Fields |
|--------|-------|------------|
| `Enquiry` | Enquiries | FullName, CompanyName, Email, Phone, ProductType, Quantity, Status, Priority, IsDraft, IsDeleted, RowVersion |
| `EnquiryItem` | EnquiryItems | PartNumber, Description, MaterialGrade, Quantity |
| `EnquiryFile` | EnquiryFiles | FileName, ContentType, StorageKey, EnquiryId |
| `EnquiryStatusHistory` | EnquiryStatusHistory | FromStatus, ToStatus, ChangedByRole, Note |
| `EnquiryComment` | EnquiryComments | AuthorRole, Message, IsCustomerVisible |
| `EnquiryAssignment` | EnquiryAssignments | EnquiryId, AssignedToUserId, IsActive |
| `Quotation` | Quotations | QuotationNumber, Subtotal, Tax, Total, Status, ValidUntilUtc, DeliveryTime, Warranty, RowVersion |
| `QuotationItem` | QuotationItems | PartNumber, Description, MaterialGrade, UnitPrice, LineTotal |
| `QuotationRevision` | QuotationRevisions | ChangeNotes, PreviousTotal, NewTotal |
| `QuotationStatusHistory` | QuotationStatusHistory | FromStatus, ToStatus |
| `QuotationComment` | QuotationComments | AuthorRole, Message |
| `QuotationAttachment` | QuotationAttachments | FileName, StorageKey |
| `QuotationApproval` | QuotationApprovals | Action, Comment |
| `Order` | Orders | OrderNumber, Status, PurchaseOrderReference, AdvancePercent, AdvanceAmount, AdvancePaid, AdvancePaymentRef, QuotationTotal, PaymentTerms, RowVersion |
| `OrderItem` | OrderItems | PartNumber, Description, MaterialGrade, Unit, QuantityOrdered, QuantityProduced, QuantityDispatched, UnitRate |
| `OrderMilestone` | OrderMilestones | StatusCode, CustomerMessage, InternalNote, IsCustomerVisible |
| `OrderStatusHistory` | OrderStatusHistory | FromStatus, ToStatus |
| `OrderComment` | OrderComments | AuthorRole, Message |
| `Shipment` | Shipments | Transporter, TrackingNumber |
| `ShipmentTrackingEvent` | ShipmentTrackingEvents | Location, Description |

### Finance

| Entity | Table | Key Fields |
|--------|-------|------------|
| `Invoice` | Invoices | InvoiceNumber, Subtotal, Tax, Total, AmountPaid, BalanceDue, Status, RowVersion |
| `InvoiceItem` | InvoiceItems | Description, HsnSacCode, UnitPrice, TaxPercent, LineTotal |
| `InvoiceStatusHistory` | InvoiceStatusHistory | FromStatus, ToStatus |
| `InvoiceAttachment` | InvoiceAttachments | FileName, StorageKey |
| `CreditNote` | CreditNotes | CreditNoteNumber, Total, Reason |
| `DebitNote` | DebitNotes | DebitNoteNumber, Total, Reason |
| `Payment` | Payments | PaymentReference, Method, Amount, Status |

### Content

| Entity | Table | Key Fields |
|--------|-------|------------|
| `Product` | Products | Title, Slug (unique), Summary, Description, TypicalApplications, CommonGrades |
| `ProductMedia` | ProductMedias | FileName, StorageKey, AltText, SortOrder |
| `ProductMaster` | ProductMasters | ProductCode (unique), ProductName, CastingType, Material, StandardCost, SellingPrice |
| `ProductMasterAttachment` | ProductMasterAttachments | FileName, StorageKey, Description |
| `Category` | Categories | Name, Slug, Description, ParentId |
| `Industry` | Industries | Name, Description, ExampleComponents |
| `Resource` | Resources | Title, Slug (unique), Summary, Body |
| `Faq` | Faqs | Question, Answer, Category |
| `GalleryItem` | GalleryItems | FileName, StorageKey, Caption, AltText, Album |

### Production

| Entity | Table | Key Fields |
|--------|-------|------------|
| `ProductionJob` | ProductionJobs | JobNumber (unique), CastingName, CurrentStage, Priority, ProgressPercent, Status |
| `ProductionStage` | ProductionStages | Name (unique), SortOrder, Color, Icon |
| `ProductionStageHistory` | ProductionStageHistory | FromStage, ToStage, Remarks |
| `ProductionQuality` | ProductionQualities | InspectionStatus, AcceptedQty, RejectedQty, Inspector |
| `ProductionComment` | ProductionComments | AuthorName, Message, CommentType |
| `ProductionTimeline` | ProductionTimelines | Event, Details |
| `ProductionDepartment` | ProductionDepartments | Name (unique) |
| `ProductionMachine` | ProductionMachines | Name, Department, Status |

### Other

| Entity | Table | Key Fields |
|--------|-------|------------|
| `Document` | Documents | Title, Category, FileName, StorageKey, Status, Tags |
| `DocumentFolder` | DocumentFolders | Name, ParentId |
| `DocumentVersion` | DocumentVersions | FileName, StorageKey, VersionNumber |
| `Notification` | Notifications | Type, Title, Body, LinkPath, IsRead |
| `SupportRequest` | SupportRequests | Subject, Message, Status |
| `Enquiry` | Enquiries | FullName, CompanyName, Email, Phone, Message, Status |
| `AuditLog` | AuditLogs | Action, EntityType, EntityId, OldValues, NewValues, IpAddress |
| `KanbanTask` | KanbanTasks | Title, Description, Status, Priority |
| `UserBoardPreference` | UserBoardPreferences | VisibleColumns, VisibleCardFields, CardSize, DisplayMode |

### Key Relationships

```
Company ──< UserCompany >── ApplicationUser
Company ──< Enquiry ──< Quotation ──< Order ──< Shipment
Enquiry ──< EnquiryItem
Enquiry ──< EnquiryFile
Enquiry ──< EnquiryStatusHistory
Enquiry ──< EnquiryComment
Enquiry ──< EnquiryAssignment
Quotation ──< QuotationItem
Quotation ──< QuotationRevision
Quotation ──< QuotationStatusHistory
Order ──< OrderItem
Order ──< OrderMilestone
Order ──< OrderStatusHistory
Order ──< Invoice
Invoice ──< InvoiceItem
Invoice ──< Payment
Order ──< ProductionJob ──< ProductionStageHistory
```

All sensitive changes → `AuditLog` (immutable — cannot be modified or deleted).

---

## 10. Workflows & Statuses

### Enquiry Status Lifecycle

```
Draft → Submitted → Received → Under Review → Approved → Quoted → Accepted
                                                                         → Rejected          → Declined
                                                                                            → Expired
                                      Any state → Cancelled (terminal)
```

States: `Draft`, `Submitted`, `Received`, `Under Review`, `Approved`, `Rejected`, `Quoted`, `Accepted`, `Declined`, `Expired`, `Cancelled`

### Quotation Status Lifecycle

```
Draft → Pending Approval → Approved → Issued → Viewed → Negotiating → Accepted → Converted
                             → Draft                                    → Declined
                                                                        → Expired
Any state → Cancelled (terminal)
```

States: `Draft`, `Pending Approval`, `Approved`, `Issued`, `Viewed`, `Negotiating`, `Accepted`, `Converted`, `Declined`, `Expired`, `Cancelled`

### Order Status Lifecycle (Customer-Visible)

```
Pending Advance → Awaiting Approval → Advance Confirmed → Confirmed → Pattern / Tooling → In Production → Quality Inspection → Packed → Ready to Dispatch → Dispatched → Delivered → Closed
                                                                                        ↑         ↑                                      → Returned
Any active state → On Hold → back to previous state
Any state → Cancelled (terminal)
```

Internal codes: `pending_advance`, `awaiting_approval`, `advance_paid`, `confirmed`, `pattern_development`, `production`, `quality_check`, `packed`, `ready_to_dispatch`, `dispatched`, `delivered`, `on_hold`, `cancelled`, `returned`, `closed`

### Invoice Statuses

`Draft` → `Issued` → `Partially Paid` → `Paid` | `Overdue` | `Cancelled` | `Credit Note Issued`

### Payment Statuses

`Pending Verification` → `Verified` | `Rejected`

### Document Categories

`Inspection Report`, `Invoice`, `Packing List`, `Certificate`, `Delivery Challan`, `Drawing`

### Enquiry-to-Order Full Workflow

```
Customer submits Enquiry
  → Engineer validates details
  → Admin/authorized sales approver reviews
  → Quotation issued to customer
  → Customer accepts or declines
  → Admin creates order from accepted quotation (with 30% advance)
  → Customer submits advance payment proof
  → Admin verifies payment → production starts
  → Engineer records production milestones
  → Customer receives status and approved documents
  → Invoice issued
  → Payment status recorded or online payment completed
  → Order dispatched, delivered, and closed
```

### Content Publishing Workflow

```
Engineer creates/edits draft
  → Admin reviews the change
  → Admin approves or rejects with comment
  → Approved content published
  → System records audit entry
```

---

## 11. Production Kanban System

A 25-stage drag-and-drop Kanban board for manufacturing workflow management, inspired by Jira.

### Production Stages (ordered)

```
1.  New Enquiries             9.  Raw Material Ready    17. Fettling
2.  Engineering Review   10. Core Making           18. Shot Blasting
3.  Quotation Sent       11. Moulding             19. Machining
4.  Customer Approval    12. Furnace Charging      20. Heat Treatment
5.  Order Confirmed      13. Melting              21. Surface Finishing
6.  Pattern Design       14. Pouring              22. Quality Inspection
7.  Pattern Making       15. Cooling              23. Packing
8.  Material Planning    16. Shakeout             24. Ready for Dispatch
                                                     25. Dispatched
```

### Board Features

- Drag-and-drop cards between stages
- Priority indicators: Critical, High, Medium, Low
- Color-coded columns per stage
- Progress bar per job
- Blocked jobs highlighted with red border
- Detail panel (slide-in drawer) with tabs: Overview, Quality, Comments, Timeline
- Customizable view: column visibility, card size (compact/normal/large), display mode
- User board preferences persisted
- Context menu on cards

### Job Priority Levels

`Critical`, `High`, `Medium`, `Low`

### Quality Inspection Results

`Pass`, `Fail`, `Conditional`, `Pending`

---

## 12. UI Theme & Design System

### "Glacier" Glassmorphism Theme

A custom CSS design system based on the provided Stitch hi-fi mockups.

**Design Language:**
- Deep navy-black base (`#0a0e1a`)
- Frosted glass surfaces with `backdrop-filter: blur(16-24px)`
- Ice-blue primary accent (`#7dd3fc`)
- Soft lavender secondary (`#c8a0f0`)
- Luminous (not structural) borders — rgba with low opacity
- Depth via blur + opacity, not shadows
- Glow effects on interaction

### Design Tokens

Defined in `styles/tokens.css` as CSS custom properties:

| Token Group | Examples |
|-------------|----------|
| Colors | `--c-bg`, `--c-ink`, `--c-ember`, `--c-lavender`, `--c-line` |
| Glass | `--glass`, `--glass-strong`, `--glass-blur`, `--glow` |
| Typography | `--font-sans` (Inter), `--fs-base` through `--fs-3xl` |
| Spacing | `--sp-1` (4px) through `--sp-9` (96px) |
| Layout | `--container` (72rem), `--radius`, `--radius-lg` |
| Motion | `--dur` (200ms), `--ease` (custom bezier) |

### Light Theme

Supported via `[data-theme="light"]` overrides with white backgrounds, darker text.

### Key Components

- **Glass cards** — `.card` with `--glass` background, blur, border, hover glow
- **Bento grids** — `.bento-card` with background images, overlay, content
- **Hero sections** — atmospheric depth with radial gradient glows
- **Process timelines** — icon + body layout with hover effects
- **Stats strip** — 4-column grid of numbers
- **CTA band** — elevated glass with gradient edge
- **FAQ accordion** — native `<details>` with custom styling
- **Buttons** — `.btn--primary` (glass ice-blue), `.btn--ghost`
- **Forms** — glass inputs with glow focus
- **Kanban board** — Jira-inspired column layout with drag-and-drop
- **Auth pages** — centered card layout with social buttons

### Responsive Breakpoints

- Mobile: default
- Tablet: `min-width: 40rem`
- Desktop: `min-width: 48rem`
- Wide: `min-width: 60rem`

---

## 13. Security Rules

### Access Control

- **Backend-enforced**: Every non-public endpoint has `[Authorize]` — never rely on frontend-only hiding
- **Customer isolation**: All customer queries filtered by authenticated user's company ID — never trust browser-supplied IDs
- **Least privilege**: New users have no company access until approved by admin
- **Role changes**: Require admin confirmation

### Rate Limiting

| Policy | Limit | Scope |
|--------|-------|-------|
| `auth` | 10 req/min | Per IP on login endpoints |
| `public` | 20 req/min (configurable) | Per IP on Enquiry/enquiry endpoints |

### File Security

- Check file extension, MIME type, actual file signature, size
- Store files outside public web root (encrypted private storage)
- Authorize every download against user's company, role, document visibility
- Never use permanent public drawing URLs

### Audit Logging

- Records: who changed what, when, from which IP
- Stored in `AuditLogs` table
- **Immutable** — `GuardAuditLogImmutability()` in `SaveChanges` prevents modification/deletion
- Covers: logins, file access, data changes, approvals, status updates

### Authentication

- Passwords hashed via ASP.NET Core Identity (PBKDF2/bcrypt)
- Short-lived access tokens (15 min) + rotated refresh tokens (7 days)
- Account lockout after 5 failed attempts (15 min)
- Password reset: hashed tokens, 15-30 min expiry, single-use
- Devices: MFA available for all roles, required for Admin

### Data Protection

- HTTPS enforced in production (HSTS)
- Secrets never in source code — always env vars / user secrets
- Refresh tokens: HttpOnly cookies only
- Access tokens: in-memory only (frontend)

---

## 14. Configuration

### Backend (`appsettings.json`)

```json
{
  "ConnectionStrings": { "DefaultConnection": "" },
  "Frontend": { "BaseUrl": "http://localhost:5173" },
  "ExternalAuth": {
    "Google": { "ClientId": "", "ClientSecret": "" },
    "Apple": { "ClientId": "", "TeamId": "", "KeyId": "", "PrivateKeyPath": "" },
    "AllowedRedirectHosts": ["http://localhost:5173"]
  }
}
```

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `ConnectionStrings__DefaultConnection` | SQL Server connection string |
| `Jwt__SigningKey` | JWT signing key (min 32 bytes) |
| `DevAdmin__Password` | Dev seed admin password |
| `DevCustomer__Password` | Dev seed customer password |
| `RateLimits__PublicPerMinute` | Rate limit for public endpoints |

### Frontend (`VITE_*`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `http://localhost:5000` | Backend API URL |

---


### Payment Gateway

**Current:** Manual/offline payment flow is implemented:
- Customer submits transaction reference number and payment proof
- Admin verifies payment manually
- Order advances from `pending_advance → awaiting_approval → advance_paid → confirmed`

**Future Plan:**
- Integrate Razorpay or Stripe payment gateway for instant UPI/card/NetBanking
- Webhook-based automatic payment verification (removes manual step)
- Payment gateway callback marks order as `advance_paid` automatically
- Customer sees "Pay Now" with embedded checkout instead of manual form
- Refund/cancel flow through gateway API
- Planned but not yet implemented — current manual flow is sufficient for B2B high-value transactions

## 15. Key Code Patterns

### Adding a New API Endpoint

1. Define request/response DTOs in `Contracts/` (using C# records)
2. Create/update service interface + implementation in `Services/`
3. Add controller action with route, auth attributes, validation
4. Register service in `Program.cs` DI
5. (Optional) Add FluentValidation validator in `Validation/`

### Adding a New Frontend Page

1. Create page component in `pages/` (public) or `portal/pages/` (portal)
2. Lazy-load in `App.tsx` with `React.lazy()`
3. Add `<Route>` in the appropriate route group
4. Add API call in the appropriate `api/*Api.ts` file

### Customer Data Isolation Pattern

Every customer API query applies both:
- The authenticated user's ID (from JWT `sub` claim)
- Their approved company relationship (from `UserCompany` table)

Server never trusts a `companyId` or `orderId` from the browser without verification.

### Audit Log Immutability

```csharp
// AppDbContext enforces audit log protection
private void GuardAuditLogImmutability()
{
    var tampered = ChangeTracker.Entries<AuditLog>()
        .Any(e => e.State is EntityState.Modified or EntityState.Deleted);
    if (tampered)
        throw new InvalidOperationException("Audit log entries are immutable.");
}
```

### Frontend Auth Ref Pattern

```typescript
// client.ts — auto-refresh on 401
if (response.status === 401 && retryOn401) {
  const renewed = await authService.refresh();
  if (renewed) return request<T>(path, init, false);  // retry once
}
```

### Static Content Pattern (Public Pages)

Public website pages use static content files (`content/*.ts`) that define the page structure as typed objects. The components render from these objects. For pages that need dynamic data (products, resources), API calls are made.

### Spam Protection

Public forms use a honeypot field (`website`) — hidden from humans, visible to bots. If filled, the API returns a fake success without creating a record.

---

## Appendix: Migration History

| # | Migration Name | Purpose |
|---|---------------|---------|
| 1 | `InitialCreate` | Base schema |
| 2 | `AddAuthTables` | Identity, refresh tokens, password reset |
| 3 | `AddPublicSubmissions` | Enquiries, Enquiries |
| 4 | `AddCustomerPortal` | Companies, UserCompanies, Products |
| 5 | `AddEnquiryModule` | EnquiryItems, EnquiryFiles, EnquiryStatusHistory, EnquiryComments, EnquiryAssignments |
| 6 | `AddQuotationModule` | Quotations, QuotationItems, Revisions, StatusHistory, Comments, Attachments, Approvals |
| 7 | `AddOrderModule` | Orders, OrderItems, OrderMilestones, Shipments |
| 8 | `FixQuotationIsDeleted` | Add soft-delete to quotations |
| 9 | `AddProductModule` | ProductMedia, Categories, Industries, Resources, FAQs, Gallery |
| 10 | `AddContentModule` | Content management tables |
| 11 | `AddDocumentModule` | Documents, DocumentFolders, DocumentVersions |
| 12 | `AddInvoiceModule` | Invoices, InvoiceItems, StatusHistory, Attachments, Credit/Debit Notes, Payments |
| 13 | `AddJiraModule` | Jira integration tables |
| 14 | `AddJiraIssueTypeMappings` | Jira issue type mappings |
| 15 | `AddCompanyNameToUser` | CompanyName field on ApplicationUser |
| 16 | `AddKanbanTask` | Kanban task board |
| 17 | `AddKanbanTaskFix` | Kanban task fixes |
| 18 | `AddJiraMappingFieldsNew` | Jira mapping fields |
| 19 | `AddProductionKanban` | Production jobs, stages, quality, comments, timeline |
| 20 | `AddUserBoardPreferences` | User board view preferences |
| 21 | `AddCommentAuthorAndEditTracking` | Comment authorship + edit tracking |
| 22 | `AddEnquiryPriority` | Priority field on Enquiry |
| 23 | `AddProductMaster` | Product master data + attachments |
| 24 | `AddOrderPaymentFields` | Order advance payment fields + milestone DTOs |

---

*End of project reference. This file covers all subsystems of the Shakti Udyog platform as of 2026-07-28.*
