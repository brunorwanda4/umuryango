# Umuryango Agent Guide

Read this first, then open only the relevant files in `context/` for the task.

## Mission

Umuryango is a family management platform for money, contributions, expenses, income, savings, debts, projects, events, documents, reports, announcements, and communication. Build for Rwandan and broader African family patterns first, but keep the product globally scalable, mobile-first, secure, auditable, and localization-ready.

## Non-Negotiables

- Family is the tenant boundary. Every family-owned record needs authorization by `familyId`.
- Financial data must be accurate, persisted, auditable, and server-authoritative. Never invent totals, approvals, records, migrations, or test results.
- Do not use floating point for money. Use integer minor units or decimal-safe database types.
- Do not hard-delete financial, document, or permission-sensitive records in normal workflows. Prefer soft deletion or reversal records.
- Permission changes, approvals, deletes, exports, and auth-sensitive events require audit logs.
- Reports must be generated from persisted records, not client-side assumptions.
- Enforce authorization on the backend for every protected action. Frontend role checks are only UX.
- Protect against IDOR by checking family membership and permissions for every family-scoped resource.
- Validate all external input: body, params, query, uploads, webhooks.
- Never log passwords, tokens, reset codes, MFA secrets, or full payment details.

## Stack Rules

Frontend:

- App: `frontend/`, Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, DaisyUI for styling-only work, TanStack Query, Zustand only for local non-authoritative state.
- Package manager/runtime: Bun only. Use `bun install`, `bun run <script>`, and `bunx <pkg>`. Do not use npm, pnpm, or yarn in `frontend/` or `backend/`.
- API calls go through `frontend/src/service/api.ts`; it builds `/api/v1`, sends cookies, and reads the backend `{ data, message }` envelope.
- Zod/RHF forms should use `frontend/src/hooks/use-zod-form-submit.ts` and `frontend/src/components/common/form/common-form-field.tsx`.

Backend:

- App: `backend/`, NestJS, TypeScript, Prisma, PostgreSQL, Redis, BullMQ.
- Backend package manager/runtime: Bun only. Use `bun install`, `bun run <script>`, and `bunx <pkg>`.
- Keep controllers thin; put business rules in services/domain helpers.
- Use transactions for multi-step financial changes.
- Use migrations for schema changes; never edit production schema manually.

Storage and auth:

- Use Bunny Storage for private uploads, receipts, reports, and documents. Store metadata in PostgreSQL.
- Use secure downloads/signed URLs and validate file metadata.
- Use JWT access and refresh tokens with secure storage, rotation, email verification, password reset, MFA, sessions, and rate limits on auth-sensitive endpoints.

## Data And API

- Persistent entities need `createdAt` and `updatedAt`; user-generated records need `createdById`.
- Family-owned tables need `familyId` unless documented otherwise.
- Use explicit enums for roles, statuses, directions, and approval states.
- Index common filters: `familyId`, `userId`, `status`, `date`, `categoryId`, report ranges.
- API routes are REST by default, versioned under `/api/v1`, plural resources, consistent envelopes, pagination for lists, filters where useful, proper status codes, no stack traces.
- Use idempotency keys for payment-like or contribution-recording operations.
- Include request correlation IDs in logs.

## UI Rules

- Mobile first. Prioritize dashboards, tables, filters, forms, approval flows, and role-specific owner/leader/member views.
- English only for now, but keep text easy to move into translation files. Design for longer translated strings.
- Current visual identity is black and white, with light/dark mode via tokens or CSS variables.
- Styling-only work means visual polish, spacing, responsive layout, typography, theme tokens, and non-functional presentation changes. Do not change data flow, authorization, validation, persistence, API behavior, or business rules when the request is styling-only.
- Application work means building or changing functional product behavior: routes, forms, API calls, server state, persisted records, permissions, validation, workflows, reports, documents, or financial logic. Application work must follow the full frontend/backend/security rules.
- Use shadcn/ui for buttons, inputs, dialogs, dropdowns, tabs, tables, badges, forms, alerts, empty states, skeletons, separators, sheets, drawers, and toasts.
- Add shadcn components before importing them: `bunx shadcn@latest add <component>`. Fetch docs before creating/fixing/debugging a component: `bunx shadcn@latest docs <component>`.
- DaisyUI may be used for styling-only presentation helpers, layout polish, and theme-friendly Tailwind classes. Do not replace required shadcn/ui workflow components or use DaisyUI to bypass accessibility, validation, or permission-aware app behavior.
- Use semantic tokens such as `bg-background`, `bg-primary`, `text-muted-foreground`; avoid raw colors and manual `dark:` overrides.
- Forms use `FieldGroup` + `Field`; RHF screens prefer `CommonFormField`.
- Use icons for common actions. Button icons use `data-icon="inline-start"` or `inline-end`.
- Hide unauthorized actions when showing them would leak permissions.

## Workflow

1. Read relevant `context/` files before product, architecture, database, API, or UI changes.
2. Inspect existing patterns before adding new ones.
3. Make the smallest coherent change.
4. Add or update tests when behavior changes.
5. Run relevant format, lint, type checks, and tests.
6. Update docs when architecture, workflows, or business rules change.
7. Preserve existing user changes and avoid unrelated refactors.
8. Report what changed and what was verified.

## Key Context Files

- `context/project-overview.md`
- `context/business-domain-context.md`
- `context/architecture-context.md`
- `context/ui-context.md`
- `context/code-standards.md`
- `context/ai-workflow-rules.md`
- `context/progress-tracker.md`
