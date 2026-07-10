# UI Context

Use this file for screens, flows, components, responsive behavior, accessibility, and visual decisions.

## Direction

- Mobile first, operational, calm, and trustworthy.
- Prioritize dashboards, tables, filters, forms, approval flows, reports, and role-specific owner/leader/member views.
- English only for now, but layout and copy must be localization-ready.
- Default identity is black and white with light/dark mode through tokens. Future family themes should not require component rewrites.

## Styling Work Vs Application Work

- Styling-only work covers visual presentation: spacing, sizing, responsive layout, typography, visual hierarchy, theme tokens, color usage, icons, animations, and polish for existing UI.
- Styling-only work must not change API calls, server state, validation, permissions, database behavior, financial calculations, reports, document access, or business workflow rules.
- Application work covers functional product behavior: new or changed routes, forms, CRUD flows, filters, tables, server mutations, persisted data, auth-sensitive actions, approval flows, document workflows, reports, and finance logic.
- Application work must include the full state model: loading, empty, error, success, duplicate-submit prevention, permission-aware actions, backend authorization, validation, persistence, and relevant verification.

## shadcn/ui

- shadcn/ui is the required component layer.
- Run CLI from `frontend/` with Bun: `bunx shadcn@latest <command>`.
- Add before importing: `bunx shadcn@latest add <component>`.
- Fetch docs before creating/fixing/debugging: `bunx shadcn@latest docs <component>`.
- Read generated files after adding components.

## DaisyUI

- DaisyUI may be used only as a styling aid for presentation-focused work, layout polish, and theme-friendly utility classes.
- Do not use DaisyUI as the primary app component system for workflow controls that are already covered by shadcn/ui, including forms, dialogs, drawers, tables, dropdowns, alerts, badges, skeletons, toasts, and destructive confirmations.
- DaisyUI styling must still use semantic tokens where possible, preserve light/dark behavior, remain accessible, and support longer localization-ready text.

## Component Rules

- Use existing primitives before custom markup.
- Common mappings: `Table` for records, `DropdownMenu` row actions, `Badge` status, `Card` summary metrics, `Chart` when useful, `Dialog`/`Sheet`/`Drawer` for create/edit/detail, `AlertDialog` for destructive confirmation, `Tabs` for workspace sections, `Sidebar` for app shell, `Empty` for empty states, `Skeleton`/`Spinner` for loading, `sonner` for toasts.
- Forms use `FieldGroup` + `Field`; React Hook Form fields prefer `frontend/src/components/common/form/common-form-field.tsx`.
- Keep items inside groups and give every `Dialog`, `Sheet`, and `Drawer` an accessible title.
- Button icons use `data-icon="inline-start"` or `inline-end`.

## Styling Rules

- Use semantic tokens: `bg-background`, `text-muted-foreground`, `bg-primary`, `border`, `destructive`.
- Avoid raw colors, manual `dark:` overrides, and one-off arbitrary styles where a token/pattern exists.
- `className` is for layout; use built-in `variant` and `size` first.
- Use `flex` + `gap-*`, not `space-x-*` / `space-y-*`; use `size-*` for square controls; use `cn()` for conditional classes.
- Status must not rely on color alone.

## Core Screens

- Dashboard: income, expenses, savings, debts, projects, upcoming events, recent activity, contributions, alerts.
- Money: filters by date/category/status/member/project; amount/date/category/status/creator/approval; receipt preview; detail history.
- Contributions: campaign, type, due date, expected/paid totals, overdue count, member payment status, reminders.
- Projects: overview, budget, timeline, members, linked contributions/expenses, documents, updates.
- Announcements/events: priority, pinned/urgent, author/date/read state, RSVP, attendance, reminders.
- Documents: search, filters, upload/download, version history, uploader, visibility/access level.
- Reports: type, date range, filters, preview, PDF, Excel, print, generated date.

## Workflow States

Every significant flow needs permission-aware actions, validation, loading, empty, error, success, duplicate-submit prevention, and mobile usability. Hide unauthorized actions when showing them leaks permissions.

## Accessibility And Localization

- Use semantic HTML, labels, keyboard navigation, focus states, contrast, meaningful button names/aria labels.
- Keep strings extractable, avoid translated sentence fragments, and use formatters for date, number, currency, and percentage.
- Design buttons, tables, cards, dialogs, and mobile screens for longer translated text.
