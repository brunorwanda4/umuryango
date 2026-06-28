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
| Finance | Planned | Income, expenses, categories, approvals, receipts, budgets. |
| Contributions/Savings | Planned | Campaigns, member status, payments, goals, progress. |
| Debts | Planned | Borrowed/lent direction, schedules, repayments, reminders. |
| Projects/Documents | Planned | Projects, budgets, updates, document upload/download/versioning. |
| Communication/Events | Planned | Announcements, emergency alerts, events, RSVP, attendance, reminders. |
| Reports/Exports | Planned | Monthly/annual/budget/savings/debt/project reports, PDF, Excel, print. |
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
