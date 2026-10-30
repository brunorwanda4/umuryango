# Code Standards

Use this file when writing or reviewing code.

## General

- TypeScript for app code. Prefer explicit public-boundary types.
- Follow existing patterns and keep changes scoped.
- Use domain names: `familyId`, `memberId`, `createdById`, `approvedById`, `submittedAt`, `dueDate`, `targetAmount`, `paidAmount`.
- Avoid vague names except in tiny local scopes.
- Keep comments rare and useful. Do not commit secrets.
- Validate input, handle errors intentionally, and update docs when behavior changes.

## Package Managers

- `frontend/` and `backend/`: Bun only. Use `bun install`, `bun run <script>`, and `bunx <pkg>`. Each app owns a `bun.lock`.
- Do not create wrong package-manager lockfiles.

## Frontend

- Next.js App Router; route files compose screens, feature folders own domain UI.
- Use TanStack Query for server state and mutations. Zustand only for local UI state.
- Backend calls go through `frontend/src/service/api.ts`; do not duplicate URL builders, envelope parsing, credentials, or idempotency handling.
- RHF/Zod forms should use `frontend/src/hooks/use-zod-form-submit.ts` and `frontend/src/components/common/form/common-form-field.tsx` where appropriate.
- Do not duplicate server state into local state except editable drafts.
- Keep user-facing strings localization-ready.
- Treat styling-only work as presentation changes only. Do not modify API behavior, validation, authorization, persistence, money logic, or workflow state unless the task is application work.
- Treat application work as functional product behavior. It must handle typed data, server state, validation, permissions, persistence, loading/error/empty/success states, and relevant tests or manual verification.

## Styling, shadcn, And DaisyUI

- Use Tailwind CSS and shadcn/ui with semantic tokens.
- Add shadcn components before import and read generated files.
- Fetch shadcn docs before component creation/fix/debug.
- DaisyUI is allowed for styling-only presentation helpers, layout polish, and theme-aware Tailwind classes.
- Do not replace required shadcn/ui workflow components with DaisyUI components for forms, dialogs, drawers, tables, dropdowns, alerts, badges, skeletons, toasts, or destructive confirmations.
- Use built-in variants/sizes first; `className` is for layout.
- Forms use `FieldGroup` + `Field`; mark errors with `data-invalid` and `aria-invalid`.
- Use real components for alerts, empty states, badges, skeletons, separators, dialogs/sheets/drawers, and toasts.

## Backend

- NestJS controllers stay thin. Services own business rules. Guards own auth/permission checks. DTOs validate input.
- Keep modules cohesive and avoid circular dependencies.
- Services must validate status transitions, enforce invariants, use transactions for multi-step financial changes, write audit logs for sensitive actions, and emit jobs/events for side effects.
- Do not trust client role claims without database verification.
- Do not run slow exports inside request handlers.

## Prisma And API

- Use migrations for schema changes.
- Use transactions for financial updates.
- Use `select`/`include` intentionally; avoid N+1 queries.
- Add indexes for common filters.
- Store money with integer minor units or decimal-safe types.
- API routes are versioned, consistent, paginated for lists, filterable/sortable where useful, and must not leak internals.
- Frontend expects Nest success envelopes like `{ data, message }` and standard Nest validation/error payloads.

## Security

- Backend enforces permissions.
- Check `familyId` on family-scoped resources.
- Rate-limit sensitive endpoints.
- Hash passwords securely and rotate refresh tokens.
- Sanitize user-generated content.
- Secure uploads and private downloads.
- Use environment variables for secrets.

## Testing

- Unit tests for domain logic.
- Integration/API tests for financial workflows and permission boundaries.
- UI tests/manual browser verification for important visual flows.
- High-risk test targets: auth, authorization, expense approval, contributions, reports, document access, debt status, budget calculations.
- Final responses must say what was verified or why verification was not run.
