# Shakti Udyog Project Instructions

## Product

Build a secure iron-casting business platform for Shakti Udyog, including a public website and portals for Admin, Data Updater, and Customer users.

Before planning or implementing significant work, read:

`docs/shakti-udyog-requirements.md`

This document is the functional source of truth.

## Technology

- Frontend: React + TypeScript
- Backend: ASP.NET Core Web API (.NET 8+)
- Database: SQL Server with Entity Framework Core
- API documentation: Swagger / OpenAPI
- Authentication: ASP.NET Core Identity, JWT access tokens, refresh-token rotation
- Project tracking: Jira integration through the backend only

## Non-Negotiable Rules

- Enforce authorization in the backend, never only in the frontend.
- Customers may access only records belonging to their approved company.
- Never expose internal Jira comments, private drawings, invoices, or other customer data publicly.
- Never store passwords, card details, CVV values, API keys, or secrets in source code.
- Store customer drawings and documents in private storage with server-side access checks.
- Use audit logs for permission, order, invoice, payment, and status changes.
- Use placeholders for unverified Shakti Udyog company details; do not invent certifications, capacity, addresses, or claims.
- Do not overwrite unrelated files or existing user changes.

## Working Process

1. Inspect the relevant code before editing.
2. State a concise plan for any substantial feature.
3. Implement one milestone at a time.
4. Run relevant build, lint, and test commands after changes.
5. Report changed files, verification results, assumptions, and the next milestone.

## Initial Implementation Order

1. Project setup, database, migrations, configuration, and Swagger
2. Authentication, password reset, roles, and authorization policies
3. Public website and RFQ flow
4. Customer portal: RFQs, quotations, orders, tracking, documents, invoices, and payments
5. Data Updater and Admin portals
6. Jira integration, reports, and refinements
