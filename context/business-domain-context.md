# Business Domain Context

## Purpose

This document explains the business domain for Rwanda Family. It defines the family management concepts, financial rules, roles, workflows, examples, best practices, and future domain plans that AI agents must understand before changing product behavior.

## Scope

This document covers domain concepts and business rules for families, members, money management, contributions, projects, announcements, events, reports, notifications, and documents. It does not define exact database tables or UI components.

## Definitions

- Family Owner: The primary administrator and highest authority in a family workspace.
- Family Leader: A trusted manager with delegated permissions.
- Family Member: A regular participant with limited permissions.
- Permission: A specific ability granted to a role or member.
- Category: A label used to classify income, expenses, debts, savings, or contributions.
- Approval Workflow: The process of submitting, reviewing, approving, or rejecting a record.
- Contribution Campaign: A planned collection of money from members.
- Financial Period: A month, quarter, year, or custom date range used for reporting.
- Receipt: Supporting evidence attached to income, expense, contribution, or project spending.
- Family Project: A funded family initiative with people, budget, timeline, updates, and documents.

## Domain Architecture

The business domain is organized around the family as the central tenant. Every core object belongs to a family, and every action must be evaluated through the current user's membership and permissions in that family.

Primary domain areas:

- Identity and access.
- Family and membership.
- Money management.
- Contributions.
- Projects.
- Communication.
- Events.
- Documents.
- Reports.
- Notifications.
- Audit history.

## Architecture

The domain architecture is family-centered. A user may participate in multiple families, but permissions, financial records, projects, events, documents, announcements, and reports are evaluated within one family at a time.

Domain modules should remain cohesive:

- Identity manages user accounts and authentication.
- Membership manages family roles and participation.
- Finance manages income, expenses, savings, debts, and budgets.
- Contributions manage expected and received member payments.
- Projects manage long-running initiatives and linked records.
- Communication manages announcements, events, and notifications.
- Documents manage files, metadata, access, and versions.
- Reports summarize approved source records.
- Audit records sensitive actions.

## Workflows

Business workflows must preserve accountability. Financial, permission, document, and reporting actions should include the actor, target family, timestamp, status, and audit trail.

Primary workflows:

- Create and configure a family.
- Invite and approve members.
- Assign roles and permissions.
- Submit and approve expenses.
- Record and report income.
- Create contribution campaigns.
- Track savings goals.
- Manage debts and repayments.
- Create budgets and compare performance.
- Manage family projects.
- Publish announcements.
- Manage events and attendance.
- Upload and version documents.
- Generate and export reports.

## Roles And Responsibilities

### Family Owner

The Owner can create and configure the family, invite and approve members, assign leaders, manage permissions, view all records, approve sensitive actions, create budgets, manage savings goals, export reports, and transfer ownership where supported.

### Family Leader

Leaders can manage delegated operations. Examples include approving expenses, creating announcements, creating events, coordinating projects, and reviewing contribution progress. Leader powers must be permission-based, not hard-coded as unlimited.

### Family Member

Members can view allowed information, submit expenses and income records where permitted, participate in events, upload receipts where allowed, view announcements, and view approved reports.

## Financial Rules

- Money records require amount, currency, date, family, creator, category, and status.
- Money values must not be stored as floating point.
- Approved records must be auditable.
- Rejected records should retain rejection reason and reviewer.
- Deleted records should normally be soft deleted.
- Attachments must remain linked to the record they support.
- Reports must exclude drafts and rejected records unless explicitly requested.
- Date filters must be clear about timezone and inclusive range behavior.
- Multi-currency support is a future requirement, so currency should be explicit even if the first release uses RWF.

## Income Tracking

Income records represent money received by the family or a family-managed fund.

Examples:

- Salary.
- Business income.
- Farming income.
- Donations.
- Gifts.
- Side hustles.

Workflow:

1. A permitted user creates an income record.
2. User selects category, amount, date, source, and optional receipt.
3. System validates the record.
4. Record is saved as draft, submitted, or approved depending on permissions.
5. Reports include approved income.

Best practices:

- Allow custom categories per family.
- Preserve source details.
- Support receipt attachment.
- Keep approval configurable by family.

## Expense Tracking

Expense records represent money spent or requested from family funds.

Examples:

- Food.
- School fees.
- Rent.
- Utilities.
- Healthcare.
- Transport.
- Family support.

Workflow:

1. Member submits expense.
2. System checks required fields and receipt policy.
3. Leader or Owner reviews.
4. Reviewer approves, rejects, or asks for correction.
5. Approved expense appears in analytics and reports.

Best practices:

- Track approval status separately from payment status.
- Store rejection reason.
- Support receipt upload.
- Make category filters fast.

## Savings Management

Savings goals track progress toward planned targets.

Examples:

- Build house.
- Buy land.
- School fees.
- Emergency fund.
- Family business.

Workflow:

1. Owner or permitted Leader creates a savings goal.
2. System records target amount and target date.
3. Members contribute directly or through contribution campaigns.
4. Progress updates automatically.
5. Milestones show progress over time.

Best practices:

- Show percentage progress.
- Record every contribution.
- Avoid editing historical contribution totals without audit.

## Debt Management

Debt records track money borrowed or lent.

Workflow:

1. User creates debt record with direction, amount, party, due dates, and payment schedule.
2. System tracks paid and outstanding balance.
3. Reminders are sent before due dates.
4. Payments reduce outstanding balance.
5. Closed debts remain in history.

Best practices:

- Separate principal from payment history.
- Support due date reminders.
- Track overdue status.
- Never lose original debt terms.

## Budget Management

Budgets define expected spending or income by period and category.

Workflow:

1. Owner creates monthly, annual, or category budget.
2. Approved transactions are compared against budget lines.
3. Dashboard shows remaining budget and over-budget warnings.
4. Reports summarize budget performance.

Best practices:

- Support category-level budgets.
- Make budget periods explicit.
- Warn when budget is exceeded.
- Keep budget revisions auditable.

## Family Contributions

Contributions track money expected from members.

Types:

- Monthly contributions.
- Event contributions.
- Emergency contributions.
- Project contributions.

Workflow:

1. Owner or Leader creates a contribution campaign.
2. Members are assigned expected amounts.
3. System tracks unpaid, partially paid, paid, and overdue statuses.
4. Reminders are sent.
5. Reports show collection performance.

Best practices:

- Track expected amount and paid amount separately.
- Allow partial payments.
- Preserve payment dates and recorders.
- Make contribution reports easy to export.

## Family Projects

Projects organize large family efforts.

Examples:

- House construction.
- Land purchase.
- Family business.
- Education fund.
- Community project.

Workflow:

1. Owner or Leader creates project.
2. Project gets budget, timeline, members, and documents.
3. Updates are posted over time.
4. Expenses and contributions can be linked to the project.
5. Reports show financial and timeline progress.

Best practices:

- Link money records to project where relevant.
- Keep project documents organized.
- Record progress updates with author and date.

## Announcements

Announcements communicate important family information.

Workflow:

1. Owner or Leader creates announcement.
2. Announcement may be pinned or marked urgent.
3. Members receive notifications depending on settings.
4. Members view announcement history.

Best practices:

- Support pinned notices.
- Support emergency alerts.
- Keep edit history for important announcements.

## Event Management

Events coordinate family activities.

Examples:

- Family meetings.
- Weddings.
- Celebrations.
- Funerals.
- Community events.

Workflow:

1. Leader or Owner creates event.
2. Members RSVP.
3. Reminders are sent.
4. Attendance can be recorded.
5. Event report summarizes participation and event contributions.

Best practices:

- Track RSVP and attendance separately.
- Support event contribution links.
- Make reminders configurable.

## Reports

Reports are generated from source records.

Report types:

- Monthly financial reports.
- Annual reports.
- Savings reports.
- Debt reports.
- Budget reports.
- Contribution reports.
- Project reports.

Best practices:

- Do not trust client-calculated totals.
- Include period, generated date, and generated by.
- Support PDF, Excel, and print layouts.
- Keep exports access-controlled.

## Notifications

Channels:

- In-app.
- Email.
- SMS.
- Push notifications.

Examples:

- Expense approved.
- Contribution due.
- Event reminder.
- Budget exceeded.
- Debt payment due.

Best practices:

- Queue notifications in background jobs.
- Store notification delivery status.
- Respect user notification preferences.
- Avoid duplicate reminders.

## Documents

Documents include agreements, land documents, contracts, receipts, reports, and certificates.

Workflow:

1. User uploads document.
2. System validates file type and size.
3. Metadata is stored.
4. File is stored in secure object storage.
5. Access is controlled by family and permissions.
6. Version history is retained where enabled.

Best practices:

- Keep document visibility explicit.
- Scan for unsafe file types where possible.
- Use version history for sensitive documents.

## Best Practices

- Keep the family as the central tenant boundary.
- Make roles and permissions explicit.
- Preserve audit history for sensitive actions.
- Store financial records with safe money types.
- Keep source records separate from generated reports.
- Use approval workflows for expenses and other sensitive financial actions.
- Make contribution status easy to understand.
- Keep documents access-controlled.
- Use reminders carefully to avoid notification fatigue.
- Design every domain workflow for mobile-first users.

## Examples

### Family Contribution Example

A family creates a monthly contribution campaign for school fees. Each member is assigned an expected amount, receives reminders before the due date, and can be marked as unpaid, partially paid, paid, or overdue. The Owner exports the contribution report at the end of the month.

### Project Finance Example

A house construction project has a budget, linked contributions, linked expenses, uploaded contracts, progress updates, and monthly reports. Leaders can post updates and submit expenses, while the Owner can approve spending and export project reports.

### Debt Example

The family borrows money for emergency healthcare. The debt record stores the lender, principal amount, due dates, payment schedule, reminders, and payment history until the debt is closed.

## Future Plans

- Mobile money payment reconciliation.
- Receipt OCR and categorization.
- Family constitution and agreement workflows.
- Custom family governance rules.
- AI-assisted anomaly detection for expenses.
- Advanced permission templates.
- Localized financial education prompts.
- Multi-currency family reports.
