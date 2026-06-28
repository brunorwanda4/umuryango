# Rwanda Family Frontend Agent Guide

This frontend guide extends the repository-wide instructions in
[../AGENTS.md](../AGENTS.md). Before changing frontend code or documentation,
read the root guide and its required context files, then apply the additional
Next.js rule below.

## Frontend Shared Helpers

- Use `src/service/api.ts` for calls to the Nest backend. It normalizes `/api/v1` routes, includes auth cookies, supports idempotency keys, and returns a consistent `{ ok, data, message, error, statusCode }` result.
- Use `src/hooks/use-zod-form-submit.ts` for Zod + React Hook Form mutation flows when it fits the screen.
- Use `src/components/common/form/common-form-field.tsx` for React Hook Form fields. It composes shadcn `Field`, `FieldLabel`, `FieldDescription`, and `FieldError`; do not use the older shadcn `Form` wrapper for new forms.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
