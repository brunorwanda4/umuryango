# Code Standards

## Purpose

This document defines coding standards for Rwanda Family. It helps developers and AI agents write consistent, maintainable, secure, and production-ready code.

## Scope

This applies to frontend, backend, database, tests, documentation, infrastructure, and scripts. It should be followed for new code and used as the direction for refactoring existing code.

## Definitions

- Source of Truth: The authoritative place where data is stored or calculated.
- Server State: Backend data fetched by the frontend.
- Client State: Local UI state not persisted as authoritative data.
- DTO: Data Transfer Object used to validate and type external input.
- Migration: Versioned database schema change.
- Domain Service: Backend service that applies business rules.
- Unit Test: Test for one function or class in isolation.
- Integration Test: Test across modules, database, API, or important boundaries.

## General Standards

- Use TypeScript for application code.
- Prefer explicit types at public boundaries.
- Keep functions small and purpose-driven.
- Use clear names that reflect business meaning.
- Avoid unrelated refactors during feature work.
- Keep comments rare and useful.
- Do not commit secrets.
- Validate all external input.
- Handle errors intentionally.
- Keep documentation updated with behavioral changes.

## Formatting

- Use the project's configured formatter.
- Keep imports organized according to existing tooling.
- Avoid inconsistent quote, semicolon, and naming styles.
- Do not manually format generated files unless the tool requires it.

## Package Managers and Runtime

- Frontend (`frontend/`) uses Bun as the runtime and package manager. Install with `bun install`, run scripts with `bun run <script>`, and run one-off binaries with `bunx <pkg>` (for example `bunx shadcn@latest add button`). Do not use npm, pnpm, or yarn in the frontend.
- Backend (`backend/`) uses pnpm as the package manager. Install with `pnpm install`, run scripts with `pnpm <script>`, and run one-off binaries with `pnpm dlx <pkg>`. Do not use npm, yarn, or bun in the backend.
- Use the lockfile that matches the workspace: `bun.lock` for the frontend, `pnpm-lock.yaml` for the backend. Do not commit lockfiles from the wrong package manager.

## Naming Conventions

Use domain-specific names:

- `familyId`
- `memberId`
- `createdById`
- `approvedById`
- `submittedAt`
- `approvedAt`
- `rejectedAt`
- `dueDate`
- `targetAmount`
- `paidAmount`
- `outstandingAmount`

Avoid vague names:

- `data`
- `item`
- `thing`
- `record`
- `obj`

Vague names are acceptable only in very small local scopes where meaning is obvious.

## Frontend Standards

### Architecture

- Use Next.js App Router conventions.
- Keep route components focused on composition.
- Put reusable domain UI in feature folders.
- Keep shared components generic.
- Keep API calls in typed clients or hooks. Frontend calls to the Nest API should go through `frontend/src/service/api.ts`; it handles `/api/v1` URL normalization, cookie credentials, idempotency keys, JSON envelopes, and backend error messages.
- Use TanStack Query for server data.
- Use Zustand only for local UI state.
- Build user-facing UI text so it can be moved into localization files later.

### React

- Prefer functional components.
- Keep components small enough to understand.
- Avoid prop drilling through many layers; use composition or focused context where appropriate.
- Memoize only when there is a demonstrated reason.
- Keep effects minimal and dependency-correct.
- Do not duplicate server state into local state unless editing a form draft.

### Forms

- Validate on client for usability and on server for security.
- Show field-specific errors.
- Prevent duplicate submissions.
- Use currency-safe amount input handling.
- Keep form schemas close to domain DTOs when practical.
- For React Hook Form screens, use `frontend/src/hooks/use-zod-form-submit.ts` for Zod-backed mutation submission when appropriate.
- For React Hook Form fields, use `frontend/src/components/common/form/common-form-field.tsx`, which composes the local shadcn `Field` primitives. Do not use the older shadcn `Form` wrapper for new forms.

### Styling

- Use Tailwind CSS and shadcn/ui.
- Keep design tokens consistent.
- Use black and white as the default application theme.
- Support light mode and dark mode through theme tokens or CSS variables.
- Avoid hard-coded color values inside feature components when a semantic token exists.
- Prepare styling for future family-customizable branding.
- Avoid one-off arbitrary styles when a shared pattern exists.
- Do not rely on color alone for meaning.
- Test mobile layouts.

### shadcn/ui

- Add components through the CLI before importing them: `bunx shadcn@latest add <component>`. Never import a component that has not been added.
- Run `bunx shadcn@latest docs <component>` and read the returned URLs before creating, fixing, or debugging a component instead of guessing the API.
- Compose existing primitives rather than writing custom markup. Use `Alert`, `Empty`, `Badge`, `Skeleton`, `Separator`, and `sonner` toasts instead of bespoke styled elements.
- Use built-in `variant` and `size` props before adding custom classes. Keep `className` for layout, not for overriding component colors or typography.
- Use semantic tokens (`bg-background`, `text-muted-foreground`, `bg-primary`, `border`, `destructive`), never raw color values. Do not add manual `dark:` color overrides.
- Use `flex` with `gap-*` instead of `space-x-*` / `space-y-*`, `size-*` for equal dimensions, and `cn()` for conditional classes.
- Build forms with `FieldGroup` + `Field`; mark validation with `data-invalid` on `Field` and `aria-invalid` on the control. New React Hook Form fields should use the shared `CommonFormField` wrapper instead of shadcn `FormField` / `FormItem`.
- Keep items inside their group component, and give every `Dialog`, `Sheet`, and `Drawer` a title for accessibility.
- After adding any component, read the generated files and fix composition, imports, or icon-library mismatches before use.

### Localization Readiness

- English is the current application language.
- Keep labels, button text, validation messages, notification copy, empty states, report labels, and error text localization-ready.
- Avoid hard-coded strings inside deeply shared logic.
- Avoid concatenating translated fragments into sentences.
- Use date, number, currency, and percentage formatting helpers.
- Design components for longer translated text.
- Use stable message keys when an i18n library is introduced.

## Backend Standards

### NestJS

- Keep controllers thin.
- Put business logic in services.
- Use guards for authentication and authorization.
- Use DTOs for request validation.
- Use interceptors and filters for cross-cutting concerns.
- Keep modules cohesive by domain.
- Avoid circular module dependencies.

### Services

Services should:

- Validate domain state transitions.
- Enforce business invariants.
- Use transactions for multi-step financial changes.
- Write audit logs for sensitive actions.
- Emit jobs or domain events for side effects.

Services should not:

- Trust client role claims without database verification.
- Perform slow exports inside request handlers.
- Hide permission checks in unrelated helpers.

### Prisma And Database

- Use migrations for schema changes.
- Use transactions for financial updates.
- Use `include` and `select` intentionally.
- Avoid N+1 queries.
- Add indexes for common filters.
- Use soft delete where auditability matters.
- Store money safely using integer minor units or decimal types.

## API Standards

- Version API routes.
- Use consistent response shapes.
- Use clear error messages without leaking internals.
- Paginate lists.
- Support filtering and sorting where useful.
- Use idempotency for duplicate-sensitive operations.
- Return authorization errors consistently.
- Frontend clients should expect the current Nest backend to return `{ data, message }` on success and standard Nest validation/error payloads on failure. Do not hard-code old project ports or unrelated headers in frontend helpers.

Example error response:

```json
{
  "error": {
    "code": "EXPENSE_NOT_APPROVABLE",
    "message": "This expense cannot be approved in its current status."
  }
}
```

## Security Standards

- Enforce permissions on the backend.
- Validate all inputs.
- Rate-limit sensitive endpoints.
- Hash passwords securely.
- Rotate refresh tokens.
- Do not log secrets or tokens.
- Protect against IDOR by checking `familyId`.
- Sanitize user-generated content.
- Secure file uploads.
- Use environment variables for secrets.

## Testing Standards

Minimum expectations:

- Unit tests for important domain logic.
- Integration tests for financial workflows.
- API tests for permission boundaries.
- UI tests for critical flows where practical.
- Regression tests for bugs.

High-risk areas needing tests:

- Authentication.
- Authorization.
- Expense approval.
- Contribution payment tracking.
- Report totals.
- Document access control.
- Debt payment status.
- Budget calculations.

## Documentation Standards

- Update `context/` files when business rules or architecture change.
- Keep examples realistic.
- Document security-sensitive decisions.
- Keep progress tracker current.
- Do not document behavior that is not implemented unless clearly marked as planned.

## Architecture

Code should reflect the domain architecture:

- Family is the tenant boundary.
- Backend owns business rules.
- Frontend owns presentation and interaction.
- PostgreSQL owns durable data.
- Redis and queues support temporary or async work.
- Object storage owns files.
- Audit logs record sensitive action history.

## Workflows

### New Feature Workflow

1. Read relevant context documentation.
2. Inspect existing code.
3. Define data model and permissions.
4. Implement backend behavior.
5. Implement frontend workflow.
6. Add tests.
7. Run checks.
8. Update docs.

### Bug Fix Workflow

1. Reproduce or understand the failure.
2. Identify root cause.
3. Add a regression test where practical.
4. Make the smallest safe fix.
5. Run relevant checks.
6. Document important behavior if needed.

## Examples

### Good Permission Check

```ts
await permissionsService.requireFamilyPermission({
  userId,
  familyId,
  permission: 'expenses.approve',
});
```

### Bad Permission Check

```ts
if (user.role === 'leader') {
  approveExpense();
}
```

The bad example assumes role alone is enough and does not prove the user has permission in the target family.

## Best Practices

- Keep money calculations deterministic.
- Keep status transitions explicit.
- Keep records auditable.
- Keep module boundaries clear.
- Prefer readable code over clever code.
- Prefer typed contracts over implicit shapes.
- Use background jobs for slow work.
- Verify authorization in tests.

## Future Plans

- Shared API contract package.
- Generated TypeScript clients from OpenAPI.
- End-to-end test suite for critical workflows.
- Static analysis for permission checks.
- Load testing for reporting and transaction-heavy endpoints.
- Localization standards and translation file structure.
- Offline sync conflict standards.
- Theme token standards for black-and-white defaults, dark mode, and family customization.
