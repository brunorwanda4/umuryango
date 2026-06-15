# UI Context

## Purpose

This document defines the user experience direction for Rwanda Family. It gives AI agents and developers practical guidance for designing screens, components, flows, copy, responsive behavior, accessibility, and data presentation.

## Scope

This document applies to web and future mobile UI. It covers dashboards, family management, finance workflows, reports, announcements, events, documents, and settings. It does not define exact brand assets.

## Definitions

- Mobile First: Design must work well on small screens before desktop enhancements.
- Dashboard: The user's main overview of family status and activity.
- Data Table: A structured list of records with sorting, filtering, and actions.
- Summary Card: A compact visual block showing one important metric or status.
- Action Flow: A task sequence such as submitting an expense or approving a member.
- Empty State: A helpful state shown when no records exist.
- Permission-Aware UI: Interface that only shows actions the user can perform.

## UI Architecture

The UI should be organized around user roles and family workflows:

- Owner dashboard.
- Leader dashboard.
- Member dashboard.
- Finance workspace.
- Contribution workspace.
- Project workspace.
- Reports workspace.
- Documents workspace.
- Events and announcements workspace.
- Settings and permissions.

The frontend should use:

- Next.js App Router pages and layouts.
- shadcn/ui primitives.
- Tailwind CSS utility classes.
- TanStack Query for server state.
- Zustand for lightweight local UI state.

## shadcn/ui Components

shadcn/ui is the standard component layer for Rwanda Family. Components are not installed as a runtime dependency; the CLI copies their source into the project so they can be owned, themed, and composed. Always reach for an existing shadcn component before writing custom markup.

### CLI workflow

shadcn is a frontend tool, so run the CLI with Bun: `bunx shadcn@latest <command>`. Do not use `pnpm dlx` or `npx`.

- Initialize once if `frontend/components.json` is missing: `bunx shadcn@latest init`. Choose a black-and-white base theme so the default identity stays neutral and theming-ready.
- Add components before importing them: `bunx shadcn@latest add button card dialog table badge`. Never import a component that has not been added.
- Search before building custom UI: `bunx shadcn@latest search`.
- Fetch docs and examples before creating, fixing, or debugging a component: `bunx shadcn@latest docs <component>`, then read the returned URLs instead of guessing the API.
- After adding components, read the generated files and verify composition, imports, and icon library before using them.

### Composition rules

- Compose primitives into domain UI; do not reinvent. Expense approval is a `Dialog` (or `Sheet`) wrapping `Card`, `Field` form controls, `Badge` status, and `Button` actions. A money workspace is `Table` + filters + `DropdownMenu` row actions.
- Use built-in `variant` and `size` props before adding custom styles.
- Use semantic color tokens (`bg-background`, `bg-primary`, `text-muted-foreground`, `border`, `destructive`), never raw colors. This keeps light mode, dark mode, and future family branding working without rewrites.
- `className` is for layout only, not for overriding component colors or typography.
- Spacing uses `flex` with `gap-*`, not `space-x-*` / `space-y-*`. Use `size-*` for equal width and height. Use `cn()` for conditional classes.
- Forms use `FieldGroup` + `Field` (not raw `div` + `Label`). Validation uses `data-invalid` on `Field` and `aria-invalid` on the control, so errors stay visible without relying on color alone.
- Keep items inside their group (`SelectItem` in `SelectGroup`, `DropdownMenuItem` in `DropdownMenuGroup`). `Dialog`, `Sheet`, and `Drawer` always need a title for accessibility, visually hidden with `sr-only` when needed.
- Prefer real components over custom markup: `Alert` for callouts and emergency notices, `Empty` for empty states, `Badge` for status, `Skeleton` for loading, `Separator` instead of `<hr>`, and `sonner` `toast()` for toasts.
- Icons inside a `Button` use `data-icon="inline-start"` / `inline-end` with no sizing classes. Use the project's configured icon library.

### Component selection

Map common Rwanda Family needs to shadcn components:

- Records and money lists: `Table`, with `DropdownMenu` for row actions and `Badge` for status.
- Dashboard metrics: `Card` (`CardHeader` / `CardTitle` / `CardContent`) and `Chart` where a chart improves understanding.
- Create, edit, and approval flows: `Dialog` for modals, `Sheet` for side panels and detail drawers, `Drawer` for mobile bottom sheets, `AlertDialog` for destructive confirmations.
- Forms: `Field`, `Input`, `Select`, `Combobox`, `Switch`, `Checkbox`, `RadioGroup`, `Textarea`, and `ToggleGroup` for small option sets such as statuses or filters.
- Navigation: `Sidebar` for the main app shell, `Tabs` for workspace sections, `Breadcrumb` and `Pagination` for lists.
- Feedback and states: `Alert`, `Progress`, `Skeleton`, `Spinner`, `Empty`, and `sonner` toasts.

## Design Principles

- Clear over decorative.
- Dense enough for repeated operational use.
- Mobile-first without hiding core tasks.
- English is the only active language for the current product.
- UI must be localization-ready because many future users may prefer Kinyarwanda, French, Swahili, or another language.
- Current default branding is black and white.
- Light mode and dark mode must both be supported.
- Future family-customizable themes must be possible without redesigning the application.
- Financial information must be easy to scan.
- Status must be obvious.
- Actions must be permission-aware.
- Forms must be fast and forgiving.
- Reports must be readable on screen and printable.
- Avoid visual clutter and decorative layouts that reduce trust.

## Theme And Branding

The current Rwanda Family interface should use a black-and-white visual system. White backgrounds, black text, neutral borders, and restrained grayscale surfaces should be the default in light mode. Dark mode should invert the experience with black or near-black backgrounds, white or near-white text, and clear neutral borders.

Theme requirements:

- Default light mode: white base, black primary text, neutral gray borders and muted surfaces.
- Default dark mode: black or near-black base, white primary text, neutral gray borders and elevated surfaces.
- Use semantic tokens such as `background`, `foreground`, `primary`, `muted`, `border`, `card`, `success`, `warning`, and `destructive`.
- Do not hard-code black and white directly into every component.
- Keep status colors limited and accessible.
- Ensure charts, badges, tables, forms, dialogs, and reports work in both light and dark mode.
- Store future family branding as configuration, not as component-specific styling.

Future family customization should allow a family to configure brand colors, logo, preferred theme mode, report appearance, and possibly custom dashboard accents. Custom themes must never reduce accessibility, hide statuses, or make financial records difficult to read.

## Language And Localization

The current Rwanda Family UI should be written in English. Even while English is the only active language, the interface should be built as if localization will be added.

Localization requirements:

- Keep user-facing strings easy to extract into translation files.
- Avoid mixing business logic with display text.
- Avoid building layouts that only work for short English labels.
- Use formatting helpers for dates, numbers, percentages, and currencies.
- Keep notification text and report labels template-friendly.
- Avoid string concatenation that would be difficult to translate later.
- Allow future family or user language preference settings.
- Make forms and buttons resilient to longer translated text.

Future language examples:

- Kinyarwanda for Rwanda-first families.
- French for Francophone families.
- Swahili for East African families.
- English as the default and fallback language.

## Navigation

Recommended main navigation:

- Dashboard.
- Money.
- Contributions.
- Projects.
- Reports.
- Events.
- Announcements.
- Documents.
- Members.
- Settings.

Mobile navigation should prioritize the most common tasks:

- Dashboard.
- Add record.
- Contributions.
- Reports.
- More.

## Dashboard

The dashboard should show:

- Total income.
- Total expenses.
- Savings balance.
- Debt summary.
- Active projects.
- Upcoming events.
- Recent activities.
- Contribution status.
- Alerts such as budget exceeded or overdue debt.

Best practices:

- Put the highest-value financial summaries at the top.
- Use compact cards for metrics.
- Show recent activity with dates, actor, and action.
- Use role-specific action buttons.
- Keep sensitive totals hidden from users without permission.

## Money Management UI

Income, expenses, savings, debts, and budgets should share consistent patterns:

- Filter by date, category, status, member, and project.
- Show amount, date, category, status, created by, and approval state.
- Provide clear create, edit, approve, reject, export, and view actions.
- Use detail drawers or pages for full record history.
- Use receipt previews where available.

Expense approval should show:

- Submitted amount.
- Category.
- Notes.
- Receipt.
- Submitted by.
- Submission date.
- Approve and reject actions.
- Rejection reason input.

## Contribution UI

Contribution screens should show:

- Campaign name.
- Contribution type.
- Due date.
- Expected total.
- Paid total.
- Overdue count.
- Member payment statuses.
- Reminder actions.

Statuses:

- Not paid.
- Partially paid.
- Paid.
- Overdue.
- Waived, if the business rules support it.

## Project UI

Project pages should include:

- Overview.
- Budget.
- Timeline.
- Members.
- Linked contributions.
- Linked expenses.
- Documents.
- Progress updates.

Best practices:

- Show project progress clearly.
- Keep financial and timeline progress separate.
- Make document access obvious.
- Use activity history for accountability.

## Announcements UI

Announcements should support:

- Title.
- Body.
- Priority.
- Pinned state.
- Author.
- Created date.
- Read status.

Emergency alerts should be visually distinct but not visually overwhelming.

## Event UI

Event screens should include:

- Event title.
- Date and time.
- Location.
- Description.
- RSVP status.
- Attendance status.
- Linked contribution, if any.
- Reminders.

Best practices:

- Make RSVP easy on mobile.
- Show upcoming events first.
- Keep past event reports accessible.

## Documents UI

Document screens should include:

- Search.
- Filters by type, project, date, and visibility.
- Upload action.
- Download action.
- Version history.
- Owner or uploader.
- Access level.

Best practices:

- Use clear icons for file types.
- Show file size and upload date.
- Confirm destructive actions.
- Hide private documents from unauthorized members.

## Reports UI

Reports should support:

- Report type selection.
- Date range.
- Filters.
- Preview.
- Export PDF.
- Export Excel.
- Print.

Best practices:

- Show report generation date.
- Show selected filters.
- Use tables for detailed sections.
- Use charts only where they improve understanding.
- Make exported reports clean and professional.

## Workflows

UI workflows must guide users through complete tasks with clear permissions, validation, loading states, success states, and error states.

Primary UI workflows:

- Register, verify email, and log in.
- Create a family and invite members.
- Review and approve members.
- Submit income, expenses, and receipts.
- Approve or reject expenses.
- Create contribution campaigns and record payments.
- Create savings goals and track progress.
- Create debts and record repayments.
- Create budgets and inspect performance.
- Create projects and post updates.
- Publish announcements and emergency alerts.
- Create events and collect RSVPs.
- Upload, search, and download documents.
- Generate, export, and print reports.

Each workflow should be usable on mobile, should prevent duplicate submissions, and should avoid exposing actions that the current user cannot perform.

## Forms

Form best practices:

- Validate required fields before submission.
- Show server validation errors near the relevant field.
- Use currency-aware amount inputs.
- Use date pickers that work well on mobile.
- Save drafts where useful.
- Prevent duplicate submissions.
- Show upload progress for receipts and documents.

## Accessibility

- Use semantic HTML.
- Ensure keyboard navigation works.
- Use labels for inputs.
- Maintain sufficient contrast.
- Do not rely on color alone for status.
- Use focus states.
- Provide meaningful button names and aria labels where needed.

## Architecture

UI components should be layered:

- Page components for route-level composition.
- Feature components for domain flows.
- Shared UI components for reusable primitives.
- Hooks for feature-specific data fetching and mutations.
- Utility functions for formatting currency, dates, and statuses.
- Theme tokens for default black-and-white styling, dark mode, and future family customization.
- Localization helpers for future labels, messages, reports, notifications, dates, numbers, and currency.

Example:

```text
features/finance/
  components/
    expense-form.tsx
    expense-table.tsx
    expense-approval-dialog.tsx
  hooks/
    use-expenses.ts
    use-approve-expense.ts
  utils/
    finance-formatters.ts
```

## Examples

### Good Dashboard Metric

Use a compact summary card with:

- Label: Total Expenses.
- Value: RWF 245,000.
- Period: June 2026.
- Status: 82 percent of budget.

### Good Empty State

For no savings goals:

- State what is missing.
- Offer one primary action to create a savings goal.
- Avoid long explanations.

### Good Permission-Aware Action

If a member cannot approve expenses, do not show the approve button. If the member can submit expenses, show a clear submit action.

## Best Practices

- Keep financial screens calm and trustworthy.
- Use consistent status badges.
- Keep tables responsive with mobile-friendly layouts.
- Keep destructive actions behind confirmation.
- Show loading and error states.
- Refresh relevant queries after mutations.
- Make report export progress visible.

## Future Plans

- Full Kinyarwanda and French UI.
- Swahili and additional family-selected languages.
- Dark mode.
- Family-customizable themes, logos, report branding, and dashboard accent colors.
- Offline-first record entry.
- Mobile app UI.
- Push notification preference center.
- AI-assisted report explanations.
- Receipt OCR review screen.
- Advanced analytics charts.
