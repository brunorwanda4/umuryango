# Architecture Context

## Purpose

This document describes the intended technical architecture for Rwanda Family. It helps AI agents and developers make consistent decisions about frontend, backend, database, storage, background jobs, authentication, deployment, observability, and scalability.

## Scope

This document covers system architecture and engineering conventions. It does not replace implementation-specific README files, API documentation, or schema migrations.

## Definitions

- Tenant Boundary: The family-level isolation boundary used to protect data.
- API Layer: The NestJS HTTP interface used by the frontend and future clients.
- Domain Module: A backend module responsible for one business area.
- Server State: Data fetched from the backend and cached by TanStack Query.
- Client State: Local UI state that is not the source of truth.
- Background Job: Async work processed by BullMQ, such as notifications or exports.
- Object Storage: Bunny Storage for files and generated reports.
- Audit Event: Immutable record of a sensitive action.

## Architecture

Rwanda Family uses a modular, tenant-aware architecture. The family is the primary data isolation boundary, the backend is responsible for business rules and authorization, the frontend is responsible for role-aware user workflows, and background infrastructure handles slow or retryable work.

## System Architecture

Rwanda Family follows a modular web application architecture:

- Frontend renders the user experience and calls the API.
- Backend validates requests, enforces permissions, applies business rules, persists data, and emits events.
- PostgreSQL stores transactional data.
- Redis supports queues, caching, rate limits, and temporary state.
- BullMQ processes background jobs.
- Bunny Storage stores uploaded files and generated exports.
- Email, SMS, and push providers deliver notifications.
- Docker and CI/CD support deployment.

## Frontend Architecture

Suggested stack:

- Next.js 15.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- TanStack Query.
- Zustand.

Recommended structure:

```text
frontend/
  src/
    app/
    components/
    features/
      auth/
      families/
      finance/
      contributions/
      projects/
      reports/
    lib/
    styles/
```

Guidelines:

- Use server components where useful, but keep interactive workflows in client components.
- Use TanStack Query for API data, cache invalidation, optimistic updates, pagination, and mutations.
- Use Zustand only for local UI state such as open panels, selected filters, and temporary wizard state.
- Keep API clients typed.
- Keep forms accessible and validation-aware.
- Use URL query params for shareable filters where useful.
- Use semantic theme tokens for black-and-white defaults, dark mode, and future family-specific branding.
- Keep user-facing text localization-ready even while English is the only active language.

## Backend Architecture

Suggested stack:

- NestJS.
- TypeScript.
- PostgreSQL.
- Prisma ORM.
- Redis.
- BullMQ.

Recommended modules:

```text
backend/
  src/
    auth/
    users/
    families/
    members/
    permissions/
    finance/
    contributions/
    savings/
    debts/
    budgets/
    projects/
    announcements/
    events/
    documents/
    reports/
    notifications/
    audit/
    common/
```

Guidelines:

- Controllers handle HTTP mapping only.
- Services enforce business rules.
- Repositories or Prisma services handle persistence.
- Guards enforce authentication and authorization.
- DTOs validate input.
- Interceptors and filters handle response shaping and errors.
- Domain events trigger async side effects.

## Database Architecture

PostgreSQL is the source of truth for transactional data.

Core data groups:

- Users and authentication.
- Families and memberships.
- Roles and permissions.
- Financial records.
- Categories.
- Contributions.
- Savings goals.
- Debts.
- Budgets.
- Projects.
- Announcements.
- Events.
- Documents.
- Notifications.
- Audit logs.

Rules:

- Use `familyId` for family-scoped data.
- Use foreign keys for important relationships.
- Use indexes for high-volume filters.
- Use database transactions for financial mutations.
- Use migrations for every schema change.
- Keep audit logs append-only.

## API Architecture

The API should use versioned REST endpoints.

Examples:

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/families/:familyId/dashboard
POST   /api/v1/families/:familyId/expenses
PATCH  /api/v1/families/:familyId/expenses/:expenseId/approve
GET    /api/v1/families/:familyId/reports/monthly
POST   /api/v1/families/:familyId/documents
```

Conventions:

- Use path-level family scoping where practical.
- Validate `familyId` membership for every family-scoped endpoint.
- Return paginated lists for high-volume resources.
- Use consistent error codes and messages.
- Do not expose internal implementation details.

## Localization Architecture

The first production language is English. The architecture should still prepare for future localization across the frontend, backend, notifications, reports, and exports.

Guidelines:

- Keep UI strings extractable into translation files.
- Keep backend validation and error codes stable so messages can be translated separately.
- Store user or family language preference when localization is introduced.
- Format dates, numbers, currencies, and percentages by locale.
- Keep notification and report templates language-aware.
- Use English as the fallback language.

## Authorization Architecture

Authorization must be enforced on the backend.

Recommended layers:

- Authentication guard verifies the user session or token.
- Family membership guard verifies access to the family.
- Permission guard verifies the required capability.
- Service-level checks enforce record ownership, status transitions, and domain-specific constraints.

Example permissions:

- `family.manage_settings`
- `members.invite`
- `members.approve`
- `expenses.create`
- `expenses.approve`
- `income.create`
- `reports.view_all`
- `documents.upload`
- `documents.view_private`
- `projects.manage`

## Storage Architecture

Bunny Storage should store binary files. PostgreSQL should store metadata.

Metadata should include:

- File ID.
- Family ID.
- Uploaded by.
- Original filename.
- Storage key.
- MIME type.
- Size.
- Document type.
- Visibility.
- Version number.
- Created date.

Workflows:

1. Backend validates upload permission.
2. Backend validates file metadata.
3. File is uploaded to storage.
4. Metadata is persisted.
5. Audit event is written.
6. Secure download link is generated when needed.

## Background Job Architecture

Use BullMQ for long-running and retryable work.

Job types:

- Send email.
- Send SMS.
- Send push notification.
- Generate PDF report.
- Generate Excel report.
- Process document metadata.
- Send contribution reminders.
- Send event reminders.
- Clean expired sessions.

Best practices:

- Make jobs idempotent.
- Store job status when user-visible.
- Retry transient failures.
- Use dead-letter handling or failure logs.
- Avoid doing slow work inside HTTP request handlers.

## Reporting Architecture

Reports should be generated from database source records.

Report workflow:

1. User requests report.
2. API verifies permissions.
3. Service fetches approved records.
4. Service calculates totals.
5. For immediate reports, API returns JSON.
6. For exports, background job generates PDF or Excel.
7. Export is stored securely.
8. User receives download notification.

## Observability Architecture

Production should include:

- Structured logs.
- Request correlation IDs.
- Error tracking.
- Queue failure monitoring.
- API latency metrics.
- Database query monitoring.
- Authentication event monitoring.
- Storage failure alerts.

Do not log sensitive data such as passwords, tokens, MFA secrets, private document contents, or full reset URLs.

## Scalability Requirements

The system should support:

- Thousands of families.
- Millions of transactions.
- Real-time or near-real-time updates.
- Offline-first support in future clients.
- Mobile-first usage.
- Background exports and notifications.

Scaling practices:

- Index high-cardinality filters.
- Use pagination.
- Keep reports efficient.
- Cache read-heavy dashboard summaries where safe.
- Use queues for expensive work.
- Avoid N+1 database queries.

## Workflows

The architecture must support complete product workflows instead of isolated screens or endpoints. Common workflows include authentication, family setup, member invitation, financial record submission, approval, contribution collection, report export, document upload, event reminders, and notification delivery.

Each workflow should define:

- The initiating user and required permission.
- The source records read or written.
- The status transitions.
- The audit event.
- Any background jobs.
- The frontend cache invalidation or refresh behavior.
- The user-visible success and failure states.

## Examples

### Expense Approval Flow

```text
Frontend mutation
  -> API route
  -> Auth guard
  -> Family membership guard
  -> Permission guard
  -> Expense service
  -> Database transaction
  -> Audit event
  -> Notification job
  -> Query invalidation
```

### Document Upload Flow

```text
Upload form
  -> API validation
  -> Storage upload
  -> Metadata persistence
  -> Audit log
  -> Secure document list refresh
```

## Best Practices

- Keep tenant checks close to data access.
- Use typed DTOs and typed API clients.
- Prefer explicit status transitions.
- Use transactions for financial consistency.
- Keep background jobs retry-safe.
- Cache only data that can tolerate staleness.
- Keep reports reproducible.

## Future Plans

- WebSocket or server-sent events for real-time updates.
- Offline sync conflict resolution.
- Read replicas for reporting.
- Event-sourced audit streams for sensitive financial changes.
- Dedicated notification service.
- Dedicated reporting service if export volume grows.
- Mobile app API compatibility.
- Family-level theme configuration for brand colors, logos, and report styling.
- Language preferences and localization-ready notification and report templates.
