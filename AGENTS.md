# Rwanda Family Agent Guide

## Purpose

This file is the primary operating manual for AI agents and developers working on Rwanda Family. It defines the project mission, business rules, architecture expectations, code standards, security requirements, UI conventions, and contribution workflow.

AI agents must read this file before making product, architecture, database, API, or UI changes.

## Scope

This guide applies to the full Rwanda Family platform:

- Frontend applications built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, and Zustand.
- Backend services built with NestJS, TypeScript, PostgreSQL, Prisma, Redis, and BullMQ.
- Storage integrations such as Bunny Storage.
- Authentication, authorization, reporting, notifications, documents, family finance, and member management.
- Documentation, tests, migrations, CI/CD, Docker, and production operations.

## Project Mission

Rwanda Family is a modern family management platform for organizing family money, expenses, income, savings, debts, goals, reports, announcements, events, documents, responsibilities, and communication in one secure place.

The first market is Rwanda and the broader African family context, but the platform must be designed for global scale. The product replaces notebooks, WhatsApp money records, scattered spreadsheets, paper receipts, and manual family administration with a trusted digital system.

## Core Product Principles

- Trust first: financial records must be accurate, auditable, and protected.
- Family transparency: members should understand approved money movement without exposing data they are not allowed to see.
- Mobile first: most users are expected to use phones.
- Low-friction workflows: recording income, expenses, and contributions must be fast.
- Local relevance: support Rwandan and African family patterns, including family leaders, emergency contributions, event contributions, and extended-family projects.
- English first, localization ready: build the first version in English, but structure the product so Kinyarwanda, French, Swahili, and other languages can be added later without rewriting screens.
- Scalable design: the system should support thousands of families and millions of transactions.
- Responsible automation: AI assistance must never invent financial data, approvals, or audit history.

## Definitions

- Family: A private organization containing members, leaders, financial records, documents, events, and projects.
- Family Owner: The main administrator who creates the family, manages permissions, approves members, and sees full reports.
- Family Leader: A trusted representative who can manage activities, approve selected records, create announcements, and coordinate projects.
- Family Member: A normal user who can view allowed information, submit records, participate in events, and access approved reports.
- Contribution: Money expected or received from a family member for monthly, emergency, event, or project purposes.
- Income Record: Money received by the family or a family-managed fund.
- Expense Record: Money spent from family funds or submitted for approval.
- Savings Goal: A tracked target with contributions, milestones, and a deadline.
- Debt Record: Money borrowed or lent, with repayment schedule and status.
- Project: A family initiative with budget, timeline, members, documents, and updates.
- Audit Log: Immutable history of important actions, including financial changes and permission changes.

## Architecture

Rwanda Family uses a modular full-stack architecture with the family as the primary tenant boundary. The frontend owns presentation and interaction, the backend owns business rules and authorization, PostgreSQL stores source-of-truth transactional data, Redis and BullMQ support asynchronous work, and Bunny Storage stores uploaded documents and generated exports.

Agents should treat the architecture as production-oriented even during early development. Every feature should be designed with authentication, authorization, validation, auditability, scalability, and mobile-first usage in mind.

## Business Rules

- Every user belongs to zero or more families.
- A family must have exactly one active owner at minimum.
- Financial records must belong to a family.
- Financial records must have a currency, amount, date, category, creator, and status.
- Money amounts must be stored using integer minor units or decimal-safe database types. Do not use floating point for money.
- Submitted expenses should support approval states such as `draft`, `submitted`, `approved`, `rejected`, and `paid`.
- Income records can be entered by permitted users and may require approval depending on family settings.
- Contributions must track expected amount, paid amount, due date, payment status, and responsible member.
- Savings goals must track target amount, current amount, target date, and contribution history.
- Debt records must identify direction: money borrowed by the family or money lent by the family.
- Reports must be generated from persisted records, not from client-side assumptions.
- Documents must enforce access control by family, role, and document visibility.
- Permission changes, approvals, deletes, exports, and authentication-sensitive events must be logged.
- Do not hard-delete financial records in normal workflows. Use soft deletion or reversal records where auditability matters.

## Architecture Decisions

### Frontend

- Use Bun as the frontend runtime and package manager. Run scripts with `bun run <script>`, install with `bun install`, and execute one-off binaries with `bunx <pkg>`. Do not use npm, pnpm, or yarn in `frontend/`.
- Use Next.js 15 with the App Router.
- Use TypeScript for all application code.
- Use Tailwind CSS for styling.
- Use shadcn/ui for accessible, consistent UI primitives.
- Use `frontend/src/service/api.ts` for frontend API calls to the Nest backend. It builds `/api/v1` URLs from `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_API_BASE_URL`, sends cookies with `credentials: "include"`, and reads the backend `{ data, message }` response envelope. Do not duplicate `fetch` URL builders inside forms.
- Use `frontend/src/hooks/use-zod-form-submit.ts` for Zod-backed mutation forms when React Hook Form is appropriate.
- Use `frontend/src/components/common/form/common-form-field.tsx` for React Hook Form fields so forms compose the local shadcn `Field` component instead of the older shadcn `Form` wrapper.
- Use TanStack Query for server state, caching, retries, pagination, and mutations.
- Use Zustand only for local client state that is not authoritative server data.
- Keep feature code grouped by domain when possible.
- Favor server-rendered or streamed pages where it improves performance and security.

### Backend

- Use pnpm as the backend package manager. Run scripts with `pnpm <script>`, install with `pnpm install`, and execute one-off binaries with `pnpm dlx <pkg>`. Do not use npm, yarn, or bun in `backend/`.
- Use NestJS as the API framework.
- Use modular domains: auth, families, members, permissions, finance, contributions, projects, documents, notifications, reports, and audit.
- Use Prisma ORM with PostgreSQL.
- Use Redis for caching, sessions where appropriate, rate limiting, and queues.
- Use BullMQ for background jobs such as email, SMS, PDF export, Excel export, notifications, report generation, and document processing.
- Keep controllers thin. Put business logic in services and domain helpers.
- Validate all external input with DTOs and class validators or schema validators.

### Storage

- Use Bunny Storage for uploaded files, receipts, reports, and family documents.
- Store file metadata in PostgreSQL.
- Never trust client-provided file metadata without validation.
- Use signed URLs or secure proxy downloads for private files.

### Authentication

- Use JWT access tokens and refresh tokens.
- Store refresh tokens securely and support rotation.
- Support email verification, password reset, MFA, and session management.
- Hash passwords with a modern password hashing algorithm.
- Rate-limit login, password reset, verification, and MFA endpoints.

## Database Rules

- Every family-owned table must include `familyId` unless there is a strong documented reason.
- Include `createdAt` and `updatedAt` on all persistent entities.
- Include `createdById` on user-generated records.
- Use explicit enums for statuses and roles.
- Use indexes for common filters: `familyId`, `userId`, `status`, `date`, `categoryId`, and report ranges.
- Use transactions for multi-step financial changes.
- Use migrations for schema changes. Never edit production schema manually.
- Keep audit tables append-only.
- Prefer soft deletion for financial, document, and permission-sensitive records.
- Use database constraints for uniqueness and referential integrity.

## API Conventions

- Use REST endpoints unless a documented domain needs another interface.
- Prefix API routes by version, for example `/api/v1`.
- Use plural resources: `/families`, `/members`, `/expenses`, `/income-records`.
- Return consistent response envelopes where the backend standard defines them.
- Use pagination for list endpoints.
- Support filters for date range, category, status, member, and project where relevant.
- Use appropriate HTTP status codes.
- Never expose stack traces or internal errors to clients.
- Use idempotency keys for payment-like or contribution-recording operations where duplicate submission is possible.
- Include request correlation IDs in logs.

## Workflows

Core workflows include family creation, member invitation, member approval, income entry, expense submission, expense approval, contribution tracking, savings goal progress, debt repayment, event RSVP, document upload, report generation, and notification delivery.

Agents should implement workflows end to end across permissions, validation, persistence, audit logs, background jobs, and UI states. For sensitive flows, always include failure states such as unauthorized access, invalid status transitions, duplicate submissions, missing receipts, and unavailable export jobs.

## UI Conventions

- Design for mobile first, then scale to tablet and desktop.
- Prioritize dashboards, tables, filters, forms, and approval flows over marketing-style layouts.
- Use clear role-specific views for owner, leader, and member.
- Use English as the only active interface language for the current version.
- Do not hard-code user-facing text deep inside reusable logic; keep labels, messages, validation copy, empty states, reports, and notification text easy to move into translation files later.
- Design layouts so translated text can become longer without breaking buttons, tables, cards, dialogs, or mobile screens.
- Use black and white as the default visual identity for the current product.
- Support both light mode and dark mode from the beginning.
- Build theming through design tokens or CSS variables so future families can customize colors, branding, and appearance without rewriting components.
- Use cards only for repeated records, summaries, modals, and framed tools.
- Use shadcn/ui components for buttons, inputs, dialogs, dropdowns, tabs, tables, badges, and forms.
- Use icons for common actions such as edit, delete, approve, reject, download, upload, filter, and search.
- Keep financial numbers readable and formatted with currency.
- Make status visible through labels and restrained color, not color alone.
- Avoid clutter on mobile. Put advanced filters behind drawers or compact controls.
- Do not show unauthorized actions disabled if doing so leaks sensitive permissions; hide them unless product requirements say otherwise.

## shadcn/ui Components

shadcn/ui is the required component layer for all frontend UI. Components are added as source code into the project via the CLI, then composed. Do not hand-roll styled `div`s when a shadcn component already covers the need.

### Setup and CLI

- shadcn is a frontend tool, so run it with Bun: `bunx shadcn@latest <command>`. Do not use `pnpm dlx` or `npx` for shadcn.
- Initialize once if `frontend/components.json` does not yet exist: `bunx shadcn@latest init`. Use a black-and-white base theme consistent with the product identity.
- Add components before importing them: `bunx shadcn@latest add button card dialog table badge`. Never import a component that has not been added.
- Search registries before writing custom UI: `bunx shadcn@latest search`.
- Before creating, fixing, or debugging a component, fetch its docs first: `bunx shadcn@latest docs <component>`, then read the returned URLs. Do not guess the API.
- Use the explicit registry the user names. Do not default to a registry on the user's behalf.
- After adding any component, read the generated files and verify composition, imports, and icon library before using them.

### Usage rules

- Use existing components first; compose rather than reinvent. A settings page is `Tabs` + `Card` + form controls; a dashboard is `Sidebar` + `Card` + `Chart` + `Table`.
- Use built-in variants (`variant`, `size`) before adding custom styles.
- Use semantic color tokens (`bg-primary`, `text-muted-foreground`, `bg-background`), never raw colors like `bg-blue-500`. This keeps light mode, dark mode, and future family theming working.
- `className` is for layout, not for overriding component colors or typography.
- Use `flex` with `gap-*` for spacing, not `space-x-*` / `space-y-*`. Use `size-*` when width and height are equal. Use `cn()` for conditional classes.
- Do not add manual `dark:` color overrides or manual `z-index` on overlay components; tokens and components handle these.
- Forms use `FieldGroup` + `Field`, not raw `div` + `Label` and not the older shadcn `Form` wrapper. Validation uses `data-invalid` on `Field` and `aria-invalid` on the control. React Hook Form screens should prefer `CommonFormField` from `frontend/src/components/common/form/common-form-field.tsx`.
- Keep items inside their group (`SelectItem` in `SelectGroup`, `DropdownMenuItem` in `DropdownMenuGroup`). `Dialog`, `Sheet`, and `Drawer` always need a title for accessibility.
- Prefer real components over custom markup: `Alert` for callouts, `Empty` for empty states, `Badge` for status, `Skeleton` for loading, `Separator` instead of `<hr>`, and `sonner` `toast()` for toasts.
- Icons in a `Button` use `data-icon="inline-start"` / `inline-end` with no sizing classes; pass icons as objects, not string keys. Use the project's configured icon library.

See `context/ui-context.md` for detailed component selection and `context/code-standards.md` for styling standards.

## Security Requirements

- Enforce authorization on the server for every protected action.
- Do not rely on frontend role checks for security.
- Validate all request bodies, route params, query params, file uploads, and webhook payloads.
- Protect against IDOR by checking family membership and permissions for every family-scoped resource.
- Encrypt or protect sensitive secrets through environment variables and deployment secret stores.
- Do not log passwords, tokens, reset codes, MFA secrets, or full payment details.
- Sanitize user-generated content displayed in announcements, project updates, and document names.
- Use CSRF protections where browser cookie authentication is introduced.
- Use rate limiting on authentication, invitation, export, upload, and notification endpoints.
- Back up PostgreSQL and storage metadata regularly.

## Development Workflow

1. Read relevant files in `context/` before changing behavior.
2. Inspect existing code patterns before adding new patterns.
3. Make the smallest coherent change that satisfies the task.
4. Add or update tests when behavior changes.
5. Run formatting, linting, type checks, and relevant tests.
6. Update documentation when architecture, workflows, or business rules change.
7. Avoid unrelated refactors in feature work.
8. Preserve existing user changes in the working tree.

## AI Agent Responsibilities

AI agents must:

- Protect user data and financial correctness.
- Follow existing codebase patterns.
- Ask for clarification only when the request is genuinely ambiguous or risky.
- Never fabricate migrations, API behavior, financial totals, or test results.
- Keep documentation synchronized with code changes.
- Flag security, privacy, and audit risks.
- Prefer explicit domain models over generic records when money or permissions are involved.
- Avoid changing unrelated files.
- Report what was changed and what was verified.

## Examples

### Good Financial Record Behavior

When approving an expense:

- Verify the current user has permission in the family.
- Verify the expense belongs to the family.
- Verify the expense is in a submittable state.
- Use a database transaction.
- Update the expense status.
- Write an audit log entry.
- Trigger notifications asynchronously.

### Bad Financial Record Behavior

Do not:

- Update an expense by ID without checking `familyId`.
- Recalculate totals on the client and save them as trusted values.
- Delete approved financial records without audit history.
- Use JavaScript floating point arithmetic for currency totals.

## Best Practices

- Model the family as the main tenant boundary.
- Keep permissions explicit and testable.
- Treat reports as derived outputs from source records.
- Keep background jobs idempotent.
- Keep upload workflows resumable or retryable where practical.
- Design mobile forms for quick entry and later review.
- Use clear names: `familyId`, `memberId`, `createdById`, `approvedById`, `submittedAt`.
- Keep all production-impacting configuration in environment variables.

## Future Plans

- Offline-first mobile experiences.
- SMS contribution reminders.
- Push notifications.
- Advanced family analytics.
- Multi-currency support.
- Localization for Kinyarwanda, French, Swahili, and other family-selected languages.
- Family-customizable themes, logos, and brand colors.
- AI-assisted report summaries.
- OCR receipt extraction.
- Bank and mobile money integrations.
- Granular custom permission policies.
- Public API for approved integrations.

## Related Documentation

- `context/project-overview.md`
- `context/business-domain-context.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`
