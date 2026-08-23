# Shakti Udyog — Complete Application Architecture & Interactive Flow Document

**Document Version:** 1.0.0  
**Target Platform:** ASP.NET Core 9 Web API (.NET 9) + React 19 / TypeScript / Vite 8 + Microsoft SQL Server  
**Classification:** Core System Architecture & Interactive Flow Specification  

---

## 1. Executive System Topology

Shakti Udyog is an end-to-end Foundry ERP and Customer Commerce Platform engineered for heavy-duty industrial casting operations (Grey Iron & Ductile Iron). The platform operates across three integrated planes:
1. **Public Marketing & Dynamic Product Showcase** (`/`, `/products`, `/capabilities`, `/resources`, `/contact`)
2. **Customer Self-Service Portal** (`/customer/*` — RFQs, Quotations, Orders, Invoices, Milestones, Documents)
3. **Internal ERP & Manufacturing Execution System (MES)** (`/admin/*` — CRM, Sales Pipeline, 25-Stage Production Kanban, Billing, Product Master Catalog, Multi-Device Security)

```mermaid
flowchart TD
    subgraph ClientLayers ["Client Presentation Layer (React 19 + TypeScript + Vite 8)"]
        PublicApp["Public Website<br/>(Dynamic Catalog, RFQ Flow, Knowledge Base)"]
        CustomerPortal["Customer Portal<br/>(Order Tracking, Quotes, Invoices, Docs)"]
        AdminERP["Admin & Engineer ERP Portal<br/>(25-Stage Kanban, CRM, Master Catalog, Audit)"]
    end

    subgraph SecurityGateway ["Security & Access Gateway"]
        AuthMiddleware["JWT Dual-Token Auth + Refresh Cookie"]
        SessionManager["Multi-Device Session Controller<br/>(UserSessions Table, Device Fingerprinting)"]
        RBAC["Role-Based Access Control<br/>(Admin, Engineer, Customer)"]
    end

    subgraph BackendAPI ["Application Layer (ASP.NET Core 9 Web API)"]
        PublicCtrl["Public Controllers<br/>(/api/v1/public/*)"]
        CustomerCtrl["Customer Controllers<br/>(/api/v1/customer/*)"]
        AdminCtrl["Admin & ERP Controllers<br/>(/api/v1/admin/*)"]
        SignalRHub["SignalR Real-Time Hub<br/>(/hubs/notifications, Order Progress)"]
    end

    subgraph DomainCore ["Domain & Business Logic Layer"]
        ProductService["ProductMaster & Sync Service"]
        OrderWorkflow["25-Stage Manufacturing Engine"]
        QuotationEngine["Cost Estimation & Margin Calculator"]
        InvoiceEngine["GST & Financial Ledger Engine"]
        AuditService["Immutable Audit Trail Writer"]
    end

    subgraph DataStorage ["Data & Persistence Layer (SQL Server + File Storage)"]
        SQLDB[("Microsoft SQL Server<br/>(60+ POCO Relational Entities)")]
        FileStore[("Binary / Document Storage<br/>(Drawings, CAD, Inspection PDFs, Images)")]
    end

    ClientLayers --> SecurityGateway
    SecurityGateway --> BackendAPI
    BackendAPI --> DomainCore
    DomainCore --> DataStorage
    DomainCore -.-> SignalRHub
    SignalRHub -.Real-time Updates.-> ClientLayers
```

---

## 2. Product Master Catalog & Public Site Synchronization Architecture

All products displayed on the public website and managed within the admin portal share a **Single Source of Truth** in the `ProductMasters` relational database table.

```mermaid
flowchart TD
    subgraph AdminPortal ["Admin Portal (/admin/products)"]
        AdminUI["Admin Product List & 7-Step Drawer<br/>(Create / Edit / Spec / Upload CAD & Photos)"]
    end

    subgraph DatabaseLayer ["Microsoft SQL Server (Single Source of Truth)"]
        CategoriesTable[("Categories Table<br/>(9 Product Categories)")]
        ProductMastersTable[("ProductMasters Table<br/>(Seeded Catalog + Admin-Added Products)")]
        AttachmentsTable[("ProductMasterAttachments Table<br/>(Drawings, CAD, Photos)")]
    end

    subgraph BackendAPI ["ASP.NET Core 9 Web API"]
        AdminAPI["/api/v1/admin/product-master<br/>(Admin CRUD & File Uploads)"]
        PublicAPI["/api/v1/public/products<br/>(Cached / Fast Public Product Catalog)"]
        PublicImageAPI["/api/v1/public/products/{id}/image<br/>(Public Image Streaming)"]
    end

    subgraph PublicSite ["Public Website (/products)"]
        PublicList["Public ProductsPage.tsx<br/>(Dynamic Live Fetch + Search + Category Filter)"]
        PublicModal["Quick Specs Modal & Detail View<br/>(Metallurgy, Tolerances, Tensile Strength)"]
        EnquiryTrigger["Submit Enquiry Modal<br/>(Auto Pre-fills Selected Product Name)"]
    end

    AdminUI -->|POST / PUT with auth| AdminAPI
    AdminAPI --> ProductMastersTable
    AdminAPI --> AttachmentsTable

    CategoriesTable -.Foreign Key.-> ProductMastersTable
    AttachmentsTable -.Foreign Key.-> ProductMastersTable

    ProductMastersTable --> PublicAPI
    AttachmentsTable --> PublicImageAPI

    PublicList -->|GET /api/v1/public/products| PublicAPI
    PublicList -->|GET image| PublicImageAPI
    PublicList --> PublicModal
    PublicModal --> EnquiryTrigger
```

### Unified Product Schema Matrix

| Field | Type | Description | Visibility / Usage |
| :--- | :--- | :--- | :--- |
| `Id` | `Guid` | Unique product identifier | Internal & Public API |
| `ProductCode` | `string` | Foundry Part/SKU (e.g. `PRD-SEW-001`) | Admin ERP & Quote Line Items |
| `ProductName` | `string` | Commercial & Engineering Name | Admin ERP, Public Catalog, Quotes |
| `CategoryId` | `Guid?` | Link to `Categories` (9 Core Sectors) | Admin Filter & Public Filter Tabs |
| `Material` | `string?` | `Grey Iron` / `Ductile Iron` | Metallurgy Filter & Material Badges |
| `MaterialGrade` | `string?` | `FG 200`, `FG 220`, `FG 260`, `SG 500/7`, `SG 600/3`, `SG 700/2` | Technical Specs Modal & ERP |
| `Standard` | `string?` | Standard specification (e.g. `IS 1865 / EN-GJS-500-7`) | Quality Compliance & Public Specs |
| `Weight` | `decimal?` | Unit weight in Kilograms (e.g. `0.65 kg`) | Shipping, Pricing, Public Card |
| `ImageUrl` | `string?` | Static image URL or uploaded attachment endpoint | Public Product Cards & Hero |
| `Application` | `string?` | Industrial use case (e.g. `Lockstitch machinery`) | Search Keyword & Public Detail |
| `Description` | `string?` | Engineering narrative & features | Technical Specs & Quotations |
| `Tolerance` | `string?` | Dimensional tolerance (e.g. `±0.015 mm CMM`) | Quality Standard & Specs Modal |
| `Hardness` | `string?` | Brinell Hardness (e.g. `170–230 HBW`) | Metallurgy Matrix & Inspection |
| `TensileStrength` | `string?` | Tensile rating (e.g. `500 MPa min`) | Engineering Data Sheet & Specs |
| `Status` | `string` | `Active` (Visible Publicly), `Draft`, `Archived` | Visibility & Lifecycle Control |

---

## 3. End-to-End Enterprise Flow (Inquiry to Delivery)

The lifecycle of an order spans customer inquiry, commercial negotiation, 25-stage casting production, quality certification, invoicing, and dispatch.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer / Buyer
    participant PublicSite as Public Portal / UI
    participant Backend as ASP.NET Core Web API
    participant DB as SQL Server
    actor Admin as Foundry Admin / Sales
    actor Engineer as Floor Engineer / QA

    %% Phase 1: Inquiry & RFQ
    Customer->>PublicSite: Browse Catalog & Submit RFQ / Enquiry
    PublicSite->>Backend: POST /api/v1/public/enquiries
    Backend->>DB: Save Enquiry (Status: Submitted)
    Backend-->>Admin: Realtime Notification (New RFQ Received)

    %% Phase 2: Review & Quotation
    Admin->>Backend: GET /api/v1/admin/enquiries/{id}
    Admin->>Backend: POST /api/v1/admin/quotations (Pricing, GST, Delivery Terms)
    Backend->>DB: Save Quotation (Status: Issued)
    Backend-->>Customer: Notification: "Quotation QT-XXXX Ready"

    %% Phase 3: Acceptance & Order Creation
    Customer->>Backend: POST /api/v1/customer/quotations/{id}/accept
    Backend->>DB: Update Quote (Status: Accepted) & Create Order SO-XXXX
    Backend-->>Admin: Realtime Notification: "Order Confirmed SO-XXXX"

    %% Phase 4: Production Execution
    Admin->>Backend: Assign Order to Foundry Engineer
    loop 25 Manufacturing Stages
        Engineer->>Backend: Advance Stage (e.g., Melting -> Spectrometer -> Pouring)
        Backend->>DB: Update Stage & Record Log
        Backend-->>Customer: SignalR Push / Live Stage Update (e.g., "Pouring In Progress")
    end

    %% Phase 5: QA Sign-off & Invoicing
    Engineer->>Backend: Upload CMM & Spectro Test Reports
    Admin->>Backend: POST /api/v1/admin/invoices (Generate Tax Invoice)
    Backend->>DB: Save Invoice & Update Order (Status: Dispatched)
    Backend-->>Customer: Invoice Ready for Download (PDF)

    %% Phase 6: Dispatch & Closure
    Admin->>Backend: Input Vehicle No & Dispatch Note
    Customer->>Backend: Track Shipment & Download Mill Test Certificate
```

---

## 4. Complete Application Flow by Portal

### 4.1 Public Website Flow

```mermaid
flowchart TD
    Home["Home Page (/)\n- Foundry Hero & Capabilities\n- Apple-Style Lineup Showcase\n- Interactive Process Timeline"]
    Products["Products Page (/products)\n- Unified Master Catalog (Live API)\n- Live Search & Multi-Category Filter\n- Material Switcher (Grey vs Ductile)\n- Quick Specs Modal"]
    ProductDetail["Product Detail (/products/:slug)\n- Metallurgy & Chemical Breakdown\n- Dimensional Tolerances\n- Tensile & Hardness Metrics"]
    Capabilities["Capabilities Page (/capabilities)\n- Melting Furnaces (Inductotherm)\n- Sand Lab & Molding Lines\n- Spectrometry & Quality Rig"]
    Resources["Resources Page (/resources)\n- Engineering Defect Guides\n- Metallurgy Comparison Charts"]
    Contact["Contact Page (/contact)\n- Location Maps & RFQ Form\n- Anti-Spam Honeypot Verification"]
    Auth["Auth Flow (/login, /signup)\n- Role Redirect (Admin vs Customer)\n- Multi-Device Session Registration"]

    Home --> Products
    Home --> Capabilities
    Home --> Resources
    Home --> Contact
    Home --> Auth

    Products --> ProductDetail
    Products -->|Click 'Request Quote'| RFQModal["RFQ Modal\n(Auto-populates Product Details)"]
    ProductDetail -->|Click 'Request Quote'| RFQModal
    RFQModal -->|Submit| BackendAPI["POST /api/v1/public/enquiries"]
```

---

### 4.2 Customer Portal Flow (`/customer/*`)

```mermaid
flowchart LR
    subgraph CustomerPortal ["Customer Portal Experience"]
        CDashboard["Dashboard (/customer/dashboard)\n- Active Orders Overview\n- Pending Quotes & Actions\n- Live Production Tracker\n- Quick RFQ Launcher"]
        CEnquiries["My Enquiries (/customer/enquiries)\n- RFQ Status Tracker\n- Technical Spec Revisions\n- Chat & Clarifications"]
        CQuotes["Quotations (/customer/quotations)\n- Commercial Price Breakdowns\n- Delivery Timelines & Terms\n- 1-Click Accept / Request Revision"]
        COrders["My Orders (/customer/orders)\n- Real-time 25-Stage Kanban Milestones\n- Expected Dispatch Dates\n- Transporter & Vehicle Tracking"]
        CInvoices["Invoices & Billing (/customer/invoices)\n- Tax Invoices & GST Summaries\n- Payment Receipts\n- 1-Click PDF Download"]
        CDocs["Document Library (/customer/documents)\n- Mill Test Certificates (MTC)\n- Spectro Chemistry Analysis\n- CMM Inspection Reports"]
        CProfile["Company Profile (/customer/profile)\n- GSTIN & Delivery Addresses\n- Active Sessions & Security"]
    end

    CDashboard --> CEnquiries
    CDashboard --> CQuotes
    CDashboard --> COrders
    CDashboard --> CInvoices
    CDashboard --> CDocs
    CDashboard --> CProfile
```

---

### 4.3 Admin ERP & Manufacturing Flow (`/admin/*`)

```mermaid
flowchart TD
    subgraph AdminCockpit ["Foundry ERP Admin Operations"]
        ADashboard["Admin Dashboard (/admin/dashboard)\n- Revenue & Open RFQ Metrics\n- Active Heat Batches\n- Plant Capacity % & Scrap Rates"]
        
        subgraph SalesPipeline ["Sales & Commercial CRM"]
            AEnquiries["Enquiries Management (/admin/enquiries)\n- Triage, Assign Engineer, Review CAD\n- Convert to Quotation"]
            AQuotes["Quotation Builder (/admin/quotations)\n- Standard Cost vs Selling Markup\n- GST Calculation & Payment Terms\n- PDF Issue & Revision Tracking"]
            AOrders["Sales Orders (/admin/orders)\n- Link PO & Commercial Terms\n- Schedule Production Heat"]
        end

        subgraph ManufacturingMES ["Manufacturing Execution System (MES)"]
            ProductionBoard["25-Stage Production Board (/admin/production)\n- Visual Kanban Drag & Drop\n- Engineer Task Allocation\n- Heat Log & Chemistry Testing\n- SLA Bottleneck Alerts"]
        end

        subgraph FinancialLedger ["Finance & Invoicing"]
            AInvoices["Invoicing Center (/admin/invoices)\n- Generate Tax Invoice from Order\n- Upload Signed Invoices (PDF)\n- Payment Tracking & Ledger Match"]
        end

        subgraph MasterDataManagement ["Master Data & Admin"]
            AProducts["Product Master (/admin/products)\n- 7-Step Creation Wizard\n- Syncs to Public Site (/products)\n- Drawings & CAD Management"]
            ACategories["Categories (/admin/categories)\n- 9 Sector Taxonomy"]
            AUsers["Users & Engineers (/admin/users, /admin/engineers)\n- Workload & Role Administration"]
            AAudit["Audit Logs (/admin/audit-logs)\n- Immutable Security Trail"]
            AReports["Reports & Analytics (/admin/reports)\n- Foundry Yield & Scrap Pareto"]
        end
    end

    ADashboard --> SalesPipeline
    SalesPipeline --> ManufacturingMES
    ManufacturingMES --> FinancialLedger
    ADashboard --> MasterDataManagement
```

---

## 5. The 25-Stage Manufacturing Kanban State Machine

The foundry manufacturing process is structured into 6 critical operational phases comprising 25 discrete tracking stages:

```mermaid
stateDiagram-v2
    direction TB

    state "Phase 1: Pattern & Tooling" as Phase1 {
        [*] --> PatternInspection : P-01
        PatternInspection --> ToolingSetup : P-02
        ToolingSetup --> CoreBoxPreparation : P-03
        CoreBoxPreparation --> RiggingGating : P-04
    }

    state "Phase 2: Molding & Core Making" as Phase2 {
        RiggingGating --> SandPreparation : M-05
        SandPreparation --> CoreProduction : M-06
        CoreProduction --> MoldAssembly : M-07
        MoldAssembly --> MoldQualityInspection : M-08
    }

    state "Phase 3: Melting & Pouring" as Phase3 {
        MoldQualityInspection --> ChargeCalculation : C-09
        ChargeCalculation --> InductionMelting : C-10
        InductionMelting --> SpectrometerAnalysis : C-11 (Chemistry Sign-off)
        SpectrometerAnalysis --> InoculationTreatment : C-12 (Ductile/SG Node)
        InoculationTreatment --> LadlePouring : C-13
    }

    state "Phase 4: Cooling & Shakeout" as Phase4 {
        LadlePouring --> ControlledCooling : S-14
        ControlledCooling --> ShakeoutVibration : S-15
        ShakeoutVibration --> DegatingRunnerRemoval : S-16
    }

    state "Phase 5: Fettling & Heat Treatment" as Phase5 {
        DegatingRunnerRemoval --> ShotBlasting : F-17
        ShotBlasting --> GrindingFinishing : F-18
        GrindingFinishing --> HeatTreatmentAnnealing : F-19 (Stress Relief)
    }

    state "Phase 6: Machining, QA & Dispatch" as Phase6 {
        HeatTreatmentAnnealing --> CNCMachining : Q-20
        CNCMachining --> CMMInspection : Q-21 (Dimensional Sign-off)
        CMMInspection --> HydrostaticTesting : Q-22 (Pressure Test)
        HydrostaticTesting --> SurfacePaintingOiling : Q-23
        SurfacePaintingOiling --> PackagingBarcoding : Q-24
        PackagingBarcoding --> DispatchGatePass : Q-25
        DispatchGatePass --> [*]
    }
```

---

## 6. Authentication, Multi-Device Sessions & Security Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client Browser
    participant API as Auth Controller (/api/v1/auth)
    participant TokenService as JWT Token & Cookie Engine
    participant DB as UserSessions & AspNetUsers Tables

    User->>API: POST /api/v1/auth/login (Email, Password, Device Info)
    API->>DB: Validate User Credentials & Roles
    alt Credentials Valid
        API->>TokenService: Generate Access Token (Short-lived 15m)
        API->>TokenService: Generate Refresh Token (Long-lived 30d)
        TokenService->>DB: Insert record into UserSessions (DeviceId, IP, UserAgent, RefreshTokenHash)
        TokenService-->>User: Set HttpOnly Secure Cookie (Refresh Token) + Return Access Token JSON
        User->>User: Route to Portal based on Role (Admin -> /admin, Customer -> /customer)
    else Invalid Credentials
        API-->>User: 401 Unauthorized (Invalid credentials)
    end

    %% Subsequent Authenticated Request
    User->>API: GET /api/v1/admin/orders (Bearer AccessToken)
    API->>API: Validate JWT Signature & Claims
    API-->>User: 200 OK (Data Payload)

    %% Multi-Device Session Management
    User->>API: GET /api/v1/auth/sessions
    API->>DB: Query UserSessions for current User
    DB-->>API: Return Active Devices (Browser, OS, IP, LastActive)
    API-->>User: Display Active Sessions in Profile
    
    %% Revoke Other Devices
    User->>API: POST /api/v1/auth/sessions/{id}/revoke
    API->>DB: Invalidate session record
    API-->>User: Session Revoked
```

---

## 7. Complete API Endpoint Directory

### 7.1 Public API (`/api/v1/public/*`)
- `GET /api/v1/public/products` — Retrieve all active products with full specifications, categories, and image URLs.
- `GET /api/v1/public/products/{id}` — Retrieve single product detail.
- `GET /api/v1/public/products/{id}/image` — Stream public primary image or attachment.
- `GET /api/v1/public/categories` — List active product categories.
- `POST /api/v1/public/enquiries` — Submit new RFQ / quotation inquiry (with anti-spam honeypot).
- `POST /api/v1/public/contact-requests` — Submit general contact request.
- `GET /api/v1/public/resources` — Retrieve technical engineering articles & defect guides.

### 7.2 Authentication API (`/api/v1/auth/*`)
- `POST /api/v1/auth/login` — Authenticate user, issue access token & set refresh cookie.
- `POST /api/v1/auth/register` — Customer account self-registration.
- `POST /api/v1/auth/refresh-token` — Rotate refresh token & issue new access token.
- `POST /api/v1/auth/logout` — Revoke active session & clear cookie.
- `GET /api/v1/auth/sessions` — List all active login sessions for user.
- `POST /api/v1/auth/sessions/{id}/revoke` — Terminate specific remote session.

### 7.3 Admin ERP API (`/api/v1/admin/*`)
- `GET/POST /api/v1/admin/product-master` — Product Master ERP catalog CRUD.
- `POST /api/v1/admin/product-master/{id}/attachments` — Upload technical drawings/CAD/photos.
- `GET/POST /api/v1/admin/enquiries` — Manage customer RFQs, assign engineers, update status.
- `GET/POST /api/v1/admin/quotations` — Issue commercial quotations, manage pricing & GST.
- `GET/POST /api/v1/admin/orders` — Manage sales orders, milestone tracking, overrides.
- `GET/POST /api/v1/admin/invoices` — Tax invoice generation, payment tracking, PDF export.
- `GET /api/v1/admin/audit-logs` — Immutable system audit log inspection.
- `GET /api/v1/admin/reports` — Production throughput, scrap rate Pareto, foundry yield metrics.

### 7.4 Customer Portal API (`/api/v1/customer/*`)
- `GET /api/v1/customer/dashboard` — Live dashboard summary.
- `GET /api/v1/customer/enquiries` — Customer's submitted RFQs.
- `GET /api/v1/customer/quotations` — Issued quotations with 1-click acceptance.
- `GET /api/v1/customer/orders` — Active orders and 25-stage manufacturing progress.
- `GET /api/v1/customer/invoices` — Billing history, outstanding balance & PDF downloads.
- `GET /api/v1/customer/documents` — Inspection certificates, MTCs, and CAD drawings.

---

## 8. Summary of Architectural Guarantees

1. **Zero Data Fragmentation:** Product master data is maintained exclusively in `ProductMasters`, eliminating hardcoded client lists and ensuring instant synchronization between Admin ERP and Public marketing.
2. **Deterministic Manufacturing State:** Every order strictly adheres to the 25-stage foundry workflow with real-time audit logging and SignalR push updates.
3. **Enterprise Security & Isolation:** Multi-device session tracking, HttpOnly secure cookies, and strict Role-Based Access Control (Admin, Engineer, Customer) protect all operational, financial, and CAD assets.
