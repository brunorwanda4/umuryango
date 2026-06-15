# Progress Tracker

## Purpose

This document tracks the current product and engineering progress for Rwanda Family. It gives AI agents and developers a shared baseline for what exists, what is planned, what is in progress, and what decisions still need confirmation.

## Scope

This tracker covers documentation, frontend, backend, database, infrastructure, security, testing, and future roadmap items. It should be updated whenever meaningful work is completed or plans change.

## Definitions

- Not Started: No meaningful implementation exists yet.
- Planned: The feature is expected but not yet actively built.
- In Progress: Implementation has started.
- Blocked: Work cannot continue without a decision or dependency.
- Complete: The feature is implemented, tested, and documented.
- Needs Verification: Implementation exists but needs testing or review.

## Current Snapshot

Project name: Rwanda Family.

Primary goal: Build a production-ready family management platform for money, contributions, reports, announcements, events, documents, projects, and communication.

Current documentation baseline:

- `AGENTS.md`: Created.
- `context/project-overview.md`: Created.
- `context/business-domain-context.md`: Created.
- `context/architecture-context.md`: Created.
- `context/ui-context.md`: Created.
- `context/code-standards.md`: Created.
- `context/ai-workflow-rules.md`: Created.
- `context/progress-tracker.md`: Created.

## Architecture

Planned target architecture:

- Frontend: Bun (runtime and package manager), Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand.
- Backend: pnpm (package manager), NestJS, TypeScript, PostgreSQL, Prisma ORM, Redis, BullMQ.
- Storage: Bunny Storage.
- Authentication: JWT and refresh tokens.
- Deployment: Docker, VPS, CI/CD.

Status:

- Frontend directory exists.
- Backend directory exists.
- Detailed implementation status should be filled in after code inspection.

## Feature Status

| Area | Status | Notes |
| --- | --- | --- |
| Authentication | Planned | Register, login, email verification, password reset, MFA, sessions. |
| Family Management | Planned | Create family, invite members, roles, permissions, profile, settings. |
| Income Tracking | Planned | Categories, receipts, reports, filters. |
| Expense Tracking | Planned | Categories, approval workflow, receipts, analytics. |
| Savings Management | Planned | Goals, target dates, contributions, milestones. |
| Debt Management | Planned | Borrowed/lent records, schedules, due dates, reminders. |
| Budget Management | Planned | Monthly, annual, category budgets, comparisons. |
| Family Contributions | Planned | Monthly, event, emergency, and project contributions. |
| Family Projects | Planned | Budgets, timelines, members, progress, documents. |
| Announcements | Planned | Notices, emergency alerts, pinned announcements. |
| Event Management | Planned | RSVP, attendance, reminders, reports. |
| Reports | Planned | PDF, Excel, print, financial and project reports. |
| Notifications | Planned | In-app, email, SMS, push. |
| Documents | Planned | Upload, download, search, version history. |
| Dashboard | Planned | Income, expenses, savings, debt, projects, events, activity. |
| Theme System | Planned | Default black-and-white theme, light mode, dark mode, and future family customization. |
| Localization Readiness | Planned | English-only MVP with structure ready for Kinyarwanda, French, Swahili, and other languages. |

## Workflows

### Updating This Tracker

When work is completed:

1. Update the relevant status.
2. Add a short note about what changed.
3. Link to important files if useful.
4. Record known gaps.
5. Add next steps.

### Example Status Update

```text
| Expense Tracking | In Progress | Expense create form and API DTO added. Approval workflow not implemented yet. |
```

### Release Readiness Workflow

Before marking a major feature complete:

1. Confirm business rules are implemented.
2. Confirm permissions are enforced.
3. Confirm tests cover key paths.
4. Confirm UI handles loading, error, empty, and success states.
5. Confirm documentation is updated.
6. Confirm observability and audit requirements are met where relevant.

## Examples

### Good Tracker Update

```text
| Contributions | In Progress | Campaign list and create form added. Payment recording and reminders remain planned. |
```

### Good Milestone Note

```text
Milestone 2: Core Finance moved to In Progress after income and expense schemas were added. Approval workflow, receipts, and reports are still open.
```

### Bad Tracker Update

```text
| Reports | Complete | Done. |
```

The bad update does not say what was implemented, what was tested, or which report types are covered.

## Milestones

### Milestone 1: Foundation

Status: Planned.

Goals:

- Project structure.
- Documentation baseline.
- Authentication foundation.
- Family model.
- Member model.
- Role and permission model.
- Initial dashboard shell.

### Milestone 2: Core Finance

Status: Planned.

Goals:

- Income tracking.
- Expense tracking.
- Categories.
- Approval workflow.
- Receipts.
- Basic finance reports.

### Milestone 3: Contributions And Savings

Status: Planned.

Goals:

- Contribution campaigns.
- Member payment status.
- Savings goals.
- Savings progress.
- Contribution reports.

### Milestone 4: Projects And Documents

Status: Planned.

Goals:

- Family projects.
- Project budgets.
- Project updates.
- Document upload and download.
- Version history.

### Milestone 5: Communication And Events

Status: Planned.

Goals:

- Announcements.
- Emergency alerts.
- Events.
- RSVP.
- Attendance.
- Reminders.

### Milestone 6: Reporting And Exports

Status: Planned.

Goals:

- Monthly reports.
- Annual reports.
- Budget reports.
- Savings reports.
- Debt reports.
- Project reports.
- PDF export.
- Excel export.
- Print support.

### Milestone 7: Production Hardening

Status: Planned.

Goals:

- Security review.
- Rate limiting.
- Audit logs.
- Observability.
- Backups.
- CI/CD.
- Docker deployment.
- Load testing.

## Known Decisions

- Family is the primary tenant boundary.
- Financial records must be auditable.
- Backend must enforce permissions.
- Reports must be generated from persisted source records.
- Mobile-first design is required.
- The default product theme is black and white.
- Light mode and dark mode should be supported.
- Future families should be able to customize branding and theme settings.
- English is the only active language for the first version.
- The application should be built so future languages can be added with minimal UI and architecture changes.
- The first regional focus is Rwanda.
- The system should scale globally.

## Open Questions

- What is the initial default currency: RWF only or configurable per family from day one?
- Which SMS provider should be used for Rwanda?
- Which email provider should be used?
- Should mobile money integration be part of MVP or later?
- What exact permission templates should ship by default?
- What document file types and size limits should be allowed?
- Should reports include leader/member signatures or approval stamps?
- Which languages should be added first after English: Kinyarwanda, French, Swahili, or another language?
- Which theme settings should families be allowed to customize first: logo, primary color, report branding, or dashboard accents?

## Risks

- Financial correctness risk if money is calculated with unsafe numeric types.
- Privacy risk if family scoping is missed.
- Trust risk if audit logs are incomplete.
- Usability risk if money entry is too slow on mobile.
- Scalability risk if reports query large datasets without indexes.
- Notification fatigue if reminders are not configurable.

## Best Practices

- Update this tracker after each milestone-level change.
- Keep statuses honest.
- Do not mark features complete without tests and documentation.
- Capture open questions early.
- Keep MVP scope practical.
- Prioritize trust, correctness, and usability over feature volume.

## Future Plans

- Add links to implemented routes and modules.
- Add release history.
- Add production incident log.
- Add architecture decision records.
- Add data model progress matrix.
- Add test coverage summary.
- Add localization progress matrix.
