# Project Overview

## Purpose

This document gives AI agents and developers a complete product-level understanding of Rwanda Family. It explains what the platform is, who it serves, why it exists, what problems it solves, and how success should be measured.

## Scope

This overview covers the product vision, user groups, feature areas, expected scale, product values, operating assumptions, examples, best practices, and future plans. It is not a database schema or API specification.

## Vision

Rwanda Family is a secure family management platform that helps families manage finances, responsibilities, projects, events, documents, announcements, and communication from one digital place.

The platform starts with Rwandan and African family needs, including extended-family contributions, family leaders, emergency support, land purchases, house construction, education funds, ceremonies, funerals, and family businesses. The long-term goal is a global platform for transparent family administration.

The first application language is English. Because many target families include members who do not speak English fluently, the product must be built so additional languages can be added later without redesigning the application or rewriting business logic.

## Core Problem

Many families rely on notebooks, WhatsApp messages, memory, scattered spreadsheets, and informal conversations to manage money and responsibilities. This creates missing records, poor transparency, forgotten contributions, untracked spending, weak savings discipline, and limited historical reporting.

Rwanda Family solves this by centralizing records, approvals, reports, reminders, documents, and communication.

## Definitions

- Platform: The complete Rwanda Family product, including web app, backend API, storage, background jobs, and notifications.
- Family Workspace: A private digital space for one family.
- Financial Activity: Any income, expense, savings, debt, contribution, or budget record.
- Family Activity: Any event, announcement, responsibility, project update, or document action.
- Report: A generated summary based on persisted records.
- Member Visibility: The level of information a user is allowed to see based on family role and permissions.

## Primary Users

### Family Owner

The Family Owner is the main administrator. This user creates the family, invites members, approves members, manages permissions, creates budgets, creates savings goals, and views all reports.

### Family Leaders

Family Leaders are trusted representatives. They manage family activities, approve expenses, create announcements, create events, and track family projects.

### Family Members

Family Members are normal users. They view allowed family information, submit income or expense records, view announcements, participate in events, and access approved reports.

## Core Features

### Authentication

- Register.
- Login.
- Email verification.
- Password reset.
- Multi-factor authentication.
- Session management.

### Family Management

- Create family.
- Invite members.
- Join family.
- Manage roles.
- Manage permissions.
- Update family profile.
- Configure family settings.

### Money Management

- Income tracking.
- Expense tracking.
- Savings goals.
- Debt records.
- Monthly and annual budgets.
- Family contributions.

### Family Projects

Projects track initiatives such as house construction, land purchase, family business, education fund, and community projects. Each project can have a budget, timeline, members, progress updates, and documents.

### Communication

- Announcements.
- Emergency alerts.
- Pinned notices.
- Event invitations.
- Reminders.

### Documents

Families can store agreements, land documents, contracts, receipts, reports, and certificates with controlled access.

### Reports

Reports include monthly financial reports, annual reports, savings reports, debt reports, budget reports, contribution reports, and project reports. Reports should support PDF export, Excel export, and printing.

### Language Readiness

Current version:

- English only.

Future versions:

- Kinyarwanda.
- French.
- Swahili.
- Other family-selected languages.

The product should keep user-facing text, validation messages, notification templates, report labels, date formatting, number formatting, and currency formatting ready for future localization.

## Architecture

At the product level, Rwanda Family is organized around families as tenant boundaries. Users interact through a mobile-first web interface. The frontend calls a backend API. The backend enforces authentication, authorization, validation, business rules, persistence, audit logging, and background jobs.

The expected stack is:

- Frontend: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand.
- Backend: NestJS, TypeScript, PostgreSQL, Prisma ORM, Redis, BullMQ.
- Storage: Bunny Storage.
- Authentication: JWT and refresh tokens.
- Deployment: Docker, VPS, CI/CD.

## Workflows

### Family Setup

1. User registers and verifies email.
2. User creates a family.
3. User becomes Family Owner.
4. Owner configures family profile, currency, contribution settings, and permissions.
5. Owner invites members.
6. Invited users accept and join.

### Expense Submission

1. Member creates an expense with amount, category, date, notes, and optional receipt.
2. System saves the record as draft or submitted.
3. Leader or Owner reviews the expense.
4. Reviewer approves or rejects.
5. System writes audit history.
6. Notifications are sent.
7. Approved expenses appear in reports.

### Contribution Tracking

1. Owner or Leader creates a contribution campaign.
2. System assigns expected contributions to selected members.
3. Members receive reminders.
4. Payments are recorded.
5. Contribution status updates.
6. Reports show paid, unpaid, overdue, and total contributions.

### Report Generation

1. User selects report type and period.
2. Backend verifies permission.
3. Backend queries source records.
4. System generates totals, charts, and summaries.
5. Optional PDF or Excel export is queued.
6. Export is stored and made available for download.

## Examples

### Typical Family Use Case

A family wants to collect monthly contributions for school fees and a house construction project. The Owner creates a family workspace, adds members, creates contribution schedules, adds a savings goal, uploads project documents, and invites Leaders to approve expenses. Members submit payments and view progress.

### Emergency Use Case

A family needs emergency healthcare support. A Leader creates an emergency contribution, pins an announcement, and schedules reminders. Members contribute, and the Owner exports a contribution report after the emergency is resolved.

## Best Practices

- Keep the family workspace simple for new users.
- Make financial entry fast and reliable.
- Show clear totals, but let users inspect source records.
- Keep permissions understandable.
- Use audit history for all sensitive actions.
- Design reports for printing and sharing.
- Support low-bandwidth and mobile-first usage.

## Future Plans

- Native mobile app or installable PWA.
- Offline-first financial entry.
- SMS and mobile money integrations.
- Multi-language support for Kinyarwanda, French, Swahili, and other languages.
- AI report summaries and anomaly detection.
- OCR for receipts.
- Advanced project dashboards.
- Cross-family templates for budgets, contribution types, and events.
