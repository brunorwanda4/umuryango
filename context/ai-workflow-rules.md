# AI Workflow Rules

Use this file for agent behavior and verification expectations.

## Core Rules

- Read before editing.
- Preserve user changes.
- Keep diffs scoped and reviewable.
- Follow existing patterns.
- Do not fabricate tests, migrations, financial data, approvals, API behavior, or totals.
- Do not bypass authorization.
- Update docs when behavior changes.
- Report verification honestly.

## Required Reading

- Always read `AGENTS.md`.
- For product, architecture, database, API, or UI changes, read the relevant `context/` file and affected code/tests.
- For small documentation-only edits, target document plus this file may be enough.

## Standard Workflow

1. Understand the request.
2. Inspect relevant files and existing patterns.
3. Plan the minimal safe change.
4. Edit files.
5. Run relevant checks.
6. Update docs if needed.
7. Summarize changes and verification.

## Styling Vs Application Classification

- Styling-only requests are limited to presentation: layout, spacing, typography, responsive polish, theme tokens, icons, animations, and visual consistency. Keep behavior, data, permissions, validation, persistence, and APIs unchanged.
- Application requests change product behavior: routes, forms, CRUD, filters, data fetching, mutations, server state, permissions, validation, approvals, reports, documents, finance workflows, or backend logic.
- When a request is ambiguous, classify it by the highest-risk affected surface. If data, auth, money, documents, reports, or persistence are touched, treat it as application work.
- DaisyUI may be used for styling-only frontend polish. It must not bypass shadcn/ui component rules, accessibility, permission-aware behavior, or backend-authoritative application logic.

## Sensitive Workflow

For auth, authorization, money, reports, documents, personal data, or audit:

1. Confirm business rule and permission boundary.
2. Check family scoping and record ownership.
3. Check status transitions and database consistency.
4. Use transactions where needed.
5. Add tests for security/financial correctness where practical.
6. Verify failure cases as well as success cases.
7. Document behavior changes.

## Editing Rules

- Do not overwrite unrelated files or remove user work unless asked.
- Do not run destructive git commands.
- Use targeted edits and ASCII unless the file already requires Unicode.
- Avoid unnecessary dependency changes.
- For migrations: inspect current schema, preserve data, add indexes where needed, and avoid destructive changes without approval.

## API And UI Rules

- API: validate input, enforce auth, use family-scoped routes for family data, paginate lists, return consistent errors, hide stack traces.
- UI: mobile-first, existing components, permission-aware actions, accessible forms, loading/error/empty/success states, responsive verification for significant changes.

## Verification

Run the most relevant available check: format, lint, type check, unit tests, integration/API tests, UI tests, or manual browser verification. If a check cannot run, say why.

## Good Summary Pattern

State what changed, where, and what was verified. Avoid vague claims like "everything works."
