# Shakti Udyog AI Assistant Instructions

Read the following core documentation files in `docs/` to understand the project architecture, requirements, security, frontend, and roadmap:

1. `docs/00-system-architecture-and-objects-overview.md` (System Architecture & Objects Overview - SAO)
2. `docs/01-product-requirements-document.md` (Product Requirements Document - PRD)
3. `docs/02-technical-architecture-document.md` (Technical Architecture Document - TAD)
4. `docs/03-security-and-access-document.md` (Security & Access Control Document - SAD)
5. `docs/04-frontend-specification-document.md` (Frontend Specification Document - FSD)
6. `docs/05-feature-ticket-list.md` (Feature Ticket List - FTL)
7. `docs/06-admin-erp-ui-design-system.md` (Admin ERP UI/UX Design System & Styling Guide - DSY)

## Testing Guidelines & User Management
- **Always delete new users created after testing** or **reuse the standard existing demo/test users** (e.g. `customer@demo.local`, `engineer@demo.local`, `admin@demo.local`) so that test clutter does not accumulate in the database.

## Autonomous Workflow & Command Execution
- Proactively execute terminal commands, builds, and code modifications autonomously without asking for redundant confirmations. Proceed directly with tasks to completion.

## GitHub Push Instructions
- When asked to push changes, automatically check `git status` and `git diff`.
- Generate a short, concise, and easy commit message summarizing the changes.
- Automatically stage all changes (`git add .`), commit (`git commit -m "..."`), and push to the remote repository (`git push`) without needing further instructions.