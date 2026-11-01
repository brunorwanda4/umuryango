# Progress Tracker

Keep this file short. Update it only for meaningful product or engineering progress. Inspect the code before relying on status here.

## Snapshot

- Project: Umuryango.
- Goal: production-ready family management for money, contributions, reports, announcements, events, documents, projects, and communication.
- Architecture target: `frontend/` and `backend/` with Bun; Next.js 15 frontend and NestJS + Prisma + PostgreSQL backend; Redis/BullMQ; Bunny Storage; Docker/VPS/CI-CD.
- Documentation baseline exists: `AGENTS.md` and all `context/*.md` files.

## Feature Status

| Area | Status | Notes |
| --- | --- | --- |
| Authentication | Planned | Register, login, verification, reset, MFA, sessions. |
| Personal Plans | In progress | Authenticated-person tasks, long-term goals, financial or milestone progress, ordered milestones, soft deletion, person-scoped CRUD, summary cards, filters, responsive tabs, forms, and details are implemented at `/me/plans`. General contact/member profile routes and reminder delivery jobs remain. |
| Family Management | In progress | Create family exists; authority/capability member permissions, invites, settings, soft removal, and audit endpoints are implemented for the family module. |
| Finance | In progress | Family money overview UI plus income, expenses, categories, approvals, receipts, and budgets pages/navigation exist. Personal income and expense records use an explicit personal scope within the family tenant boundary: they are owned by the authenticated creator, excluded from family ledgers and approval queues, and auto-approved without family record permissions. Personal dashboards calculate totals server-side and support month filtering and live CRUD. Personal category master data is owner-scoped, starts with idempotently provisioned defaults, reports persisted usage totals, and is used by personal transaction validation and forms; family categories remain isolated. Category changes are authorized and audited; deletion archives categories instead of hard-deleting financial master data. Family income also supports monthly rent/recurring tracking with expected amount, due date, paid amount, remaining balance, payment status, property/unit metadata, contact-linked payer selection/creation, backend validation, audit snapshots, focused tests, and a server-side recurring-income payment endpoint. Backend Loans API, Prisma models, repayment balance logic, loan documents metadata, audit logs, contact-aware borrower/lender selection/creation, and loan tests are implemented. Broader finance write-flow hardening remains. |
| Contributions/Savings | Planned | Campaigns, member status, payments, goals, progress. |
| Debts | Planned | Borrowed/lent direction, schedules, repayments, reminders. |
| Projects/Documents | In progress | Project persistence, overview aggregation, and create-project API are implemented; documents and project contribution/update write flows remain. |
| Communication/Events | In progress | Family Contacts module is implemented with trusted people/organizations, emergency and loan contact flags, search/filter UI, soft delete, audit events, and loan integration. Announcements, emergency alerts, events, RSVP, attendance, and reminders remain. |
| Reports/Exports | In progress | `GET /api/v1/families/:familyId/reports/overview` implemented — aggregates contribution payments and project budgets server-side with VIEW_REPORTS permission check. Income/expense/savings/debt ledgers return null until those modules are modelled. Export table not yet modelled. |
| Notifications | Planned | In-app, email, SMS, push. |
| Dashboard/UI System | In progress | Unified mobile-first personal (`/me`) and family (`/family/:slug`) dashboard design system adapted from the reference visual identity. Features carbon balance cards with embedded income/expense sub-cards and dot indicators, quick action cards with dense metrics, rounded section cards, 2x2 metric grids, progress bars, and responsive two-column desktop layouts using semantic tokens. |

## Milestones

- M1 Foundation: project structure, auth foundation, family/member/permission models, dashboard shell.
- M2 Core Finance: income, expenses, categories, approvals, receipts, basic reports.
- M3 Contributions/Savings: campaigns, payment status, goals, progress, reports.
- M4 Projects/Documents: projects, budgets, updates, document storage/versioning.
- M5 Communication/Events: announcements, emergency alerts, RSVP, attendance, reminders.
- M6 Reporting/Exports: reports, PDF/Excel, print.
- M7 Production Hardening: security, rate limits, audit, observability, backups, CI/CD, Docker, load testing.

## Known Decisions

Family is the tenant boundary; backend enforces permissions; financial records are auditable; reports come from persisted records; mobile-first design; black-and-white default theme; light/dark support; English MVP with future localization; Rwanda first, global scale later.

## Open Questions

- Initial currency: RWF only or configurable per family from day one?
- SMS and email providers?
- Mobile money in MVP or later?
- Default permission templates?
- Allowed document types and size limits?
- Report signatures or approval stamps?
- First post-English languages?
- First family theme settings: logo, primary color, report branding, dashboard accents?

## Update Rule

When status changes, update the table with what changed, what remains, and any verification. Do not mark features complete without implementation, tests/checks, and documentation.


## Tauri v2 Desktop Platform (Next.js Unified UI)

- **Status**: Migrated to unified Next.js App Router UI.
- **Changes**:
  - The separate native React UI (`frontend/native/`), client offline SQLite database, client token vault, and offline synchronization screens were intentionally removed.
  - Desktop development runs the existing Next.js application on port 4914 via `bun run dev` and `tauri dev` (`devUrl: "http://localhost:4914"`).
  - Web and desktop share identical routes, components, and HTTP-only cookie authentication flows.
  - Tauri capabilities are reduced to least-privilege desktop features with no broad remote-domain IPC access.
  - Production desktop packaging is blocked until an authoritative production HTTPS deployment URL is configured (no localhost or fabricated domains). Backend synchronization models and contracts remain in place.
