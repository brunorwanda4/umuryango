# Progress Tracker

Keep this file short. Update it only for meaningful product or engineering progress. Inspect the code before relying on status here.

## Snapshot

- Project: Rwanda Family.
- Goal: production-ready family management for money, contributions, reports, announcements, events, documents, projects, and communication.
- Architecture target: `frontend/` with Bun + Next.js 15; `backend/` with pnpm + NestJS + Prisma + PostgreSQL; Redis/BullMQ; Bunny Storage; Docker/VPS/CI-CD.
- Documentation baseline exists: `AGENTS.md` and all `context/*.md` files.

## Feature Status

| Area | Status | Notes |
| --- | --- | --- |
| Authentication | Planned | Register, login, verification, reset, MFA, sessions. |
| Family Management | In progress | Create family exists; authority/capability member permissions, invites, settings, soft removal, and audit endpoints are implemented for the family module. |
| Finance | In progress | Family money overview UI plus income, expenses, categories, approvals, receipts, and budgets pages/navigation exist. Personal income and expense records use an explicit personal scope within the family tenant boundary: they are owned by the authenticated creator, excluded from family ledgers and approval queues, and auto-approved without family record permissions. Personal dashboards calculate totals server-side, support month filtering and live CRUD, and use the existing family categories. Category changes are authorized and audited; deletion archives categories instead of hard-deleting financial master data. Family income also supports monthly rent/recurring tracking with expected amount, due date, paid amount, remaining balance, payment status, property/unit metadata, contact-linked payer selection/creation, backend validation, audit snapshots, focused tests, and a server-side recurring-income payment endpoint. Backend Loans API, Prisma models, repayment balance logic, loan documents metadata, audit logs, contact-aware borrower/lender selection/creation, and loan tests are implemented. Broader finance write-flow hardening remains. |
| Contributions/Savings | Planned | Campaigns, member status, payments, goals, progress. |
| Debts | Planned | Borrowed/lent direction, schedules, repayments, reminders. |
| Projects/Documents | In progress | Project persistence, overview aggregation, and create-project API are implemented; documents and project contribution/update write flows remain. |
| Communication/Events | In progress | Family Contacts module is implemented with trusted people/organizations, emergency and loan contact flags, search/filter UI, soft delete, audit events, and loan integration. Announcements, emergency alerts, events, RSVP, attendance, and reminders remain. |
| Reports/Exports | In progress | `GET /api/v1/families/:familyId/reports/overview` implemented — aggregates contribution payments and project budgets server-side with VIEW_REPORTS permission check. Income/expense/savings/debt ledgers return null until those modules are modelled. Export table not yet modelled. |
| Notifications | Planned | In-app, email, SMS, push. |
| Dashboard/UI System | Planned | Role dashboards, black-and-white theme, light/dark mode, localization-ready text. |

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
