# AI Workflow Rules

## Purpose

This document defines how AI agents should work inside the Rwanda Family codebase. It is intended to reduce mistakes, protect user data, keep changes focused, and preserve architectural consistency.

## Scope

These rules apply to all AI-generated code, documentation, tests, migrations, scripts, and configuration changes in the Rwanda Family project.

## Definitions

- AI Agent: Any automated coding assistant making changes or recommendations.
- Task Scope: The specific user request being handled.
- Existing Pattern: A convention already used in the codebase.
- Sensitive Domain: Authentication, authorization, money, reports, documents, personal data, or audit history.
- Verification: Any check that proves a change behaves as expected, such as tests, linting, type checking, manual browser testing, or code inspection.

## Core Rules

- Read before editing.
- Preserve user changes.
- Keep changes scoped.
- Follow existing patterns.
- Do not fabricate test results.
- Do not invent financial data.
- Do not bypass authorization.
- Update documentation when behavior changes.
- Report verification honestly.

## Required Context Reading

Before major changes, AI agents should read:

- `AGENTS.md`
- `context/project-overview.md`
- Relevant domain context files.
- Existing code in the affected area.
- Existing tests for the affected area.

For small documentation-only tasks, reading this file and the target document may be enough.

## Architecture

AI work must respect the architecture:

- Frontend handles UI and interaction.
- Backend owns business rules.
- Database stores source-of-truth records.
- Queues handle slow side effects.
- Storage holds files.
- Audit logs protect accountability.
- Family boundaries protect tenant data.

## Workflows

AI agents should follow complete, verifiable workflows for implementation, sensitive domain changes, documentation updates, testing, and final reporting. A workflow is complete only when the requested change is implemented, checked against existing patterns, verified where practical, and summarized honestly.

## Workflow

### Standard Implementation Workflow

1. Understand the user request.
2. Inspect relevant files.
3. Identify existing patterns.
4. Plan the minimal safe change.
5. Edit files.
6. Run relevant verification.
7. Update docs if needed.
8. Summarize changes and checks.

### Sensitive Domain Workflow

For authentication, authorization, money, documents, reports, or audit changes:

1. Confirm the affected business rule.
2. Check permission boundaries.
3. Check database consistency.
4. Use transactions where needed.
5. Add tests for security or financial correctness.
6. Verify failure cases, not only success cases.
7. Update context documentation if behavior changed.

### Documentation Workflow

1. Keep documentation aligned with the product vision.
2. Mark future plans clearly.
3. Avoid claiming unimplemented features are complete.
4. Include examples and best practices.
5. Keep terminology consistent across files.

## File Editing Rules

- Do not overwrite unrelated files.
- Do not remove user work unless explicitly asked.
- Do not run destructive git commands.
- Use targeted edits.
- Keep generated documentation readable.
- Use ASCII unless the file already requires non-ASCII.
- Avoid unnecessary dependency changes.

## Database And Migration Rules

AI agents must:

- Inspect the current schema before adding migrations.
- Use explicit relation names where ambiguity exists.
- Add indexes for expected high-volume filters.
- Preserve data where possible.
- Include rollback strategy in notes when migration risk is high.
- Avoid destructive migrations without user approval.

AI agents must not:

- Drop tables or columns casually.
- Change money precision without a migration plan.
- Remove audit history.
- Backfill fake production data.

## API Rules

- Validate inputs.
- Enforce authentication and authorization.
- Use family-scoped routes for family data.
- Return consistent errors.
- Paginate lists.
- Do not expose internal stack traces.
- Keep API changes backward-compatible where possible.

## UI Rules

- Keep UI mobile-first.
- Use existing components and design patterns.
- Make permissions visible through available actions.
- Do not expose unauthorized data in hidden UI.
- Keep forms accessible.
- Show loading, error, empty, and success states.
- Verify responsive layout for significant UI changes.

## Testing Rules

AI agents should run the most relevant available checks:

- Type checks.
- Linting.
- Unit tests.
- Integration tests.
- UI tests.
- Manual browser verification for visual changes.

If verification cannot run, the final response must say why.

## Examples

### Good AI Change Summary

```text
Updated the expense approval service to require `expenses.approve`, added an audit log entry for approvals, and added tests for approved and rejected status transitions.

Verification: ran backend unit tests for finance module.
```

### Bad AI Change Summary

```text
Done. Everything works.
```

The bad summary does not explain what changed or how it was verified.

### Good AI Behavior

When asked to add a report export:

- Inspect existing report code.
- Add a queued export job.
- Store generated file metadata.
- Add permission checks.
- Add tests for access control.
- Update documentation.

### Bad AI Behavior

When asked to add a report export:

- Generate the file in the request handler.
- Let any family member download all reports.
- Skip tests.
- Claim verification without running it.

## Best Practices

- Treat money and permissions as high-risk code.
- Prefer explicit behavior over hidden magic.
- Keep diffs reviewable.
- Add regression tests for bugs.
- Make future assumptions visible.
- Ask for clarification when a business rule affects trust, privacy, or money.
- Keep final responses short but specific.

## Future Plans

- Add automated architecture checks.
- Add permission boundary test helpers.
- Add AI-ready OpenAPI documentation.
- Add domain decision records.
- Add generated ERD documentation.
- Add release checklist for production deployments.
