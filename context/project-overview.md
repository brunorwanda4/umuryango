# Project Overview

Rwanda Family is a secure, mobile-first family management platform for finances, contributions, projects, events, documents, reports, announcements, and communication.

## Product Goal

- Replace notebooks, WhatsApp records, spreadsheets, paper receipts, and memory-based family administration.
- Serve Rwandan and African extended-family patterns first: monthly contributions, emergency support, ceremonies, funerals, education funds, land, house construction, and family businesses.
- Keep the product globally scalable and localization-ready. English is the only active language for now.

## Users

- Owner: creates the family, manages members, roles, permissions, budgets, goals, exports, and full reports.
- Leader: delegated trusted manager for approvals, announcements, events, projects, and contribution progress.
- Member: views allowed information, submits records, participates in events, and accesses approved reports.

## Core Areas

- Auth: registration, login, email verification, password reset, MFA, sessions.
- Family: create, invite, join, approve, roles, permissions, profile, settings.
- Money: income, expenses, budgets, savings, debts, contributions.
- Projects: budget, timeline, members, updates, documents, linked money records.
- Communication: announcements, emergency alerts, notices, events, reminders.
- Documents: receipts, contracts, agreements, land documents, reports, certificates.
- Reports: monthly, annual, savings, debt, budget, contribution, and project reports with PDF/Excel/print support.

## Product Rules

- Family workspace is the tenant boundary.
- Backend owns authentication, authorization, validation, business rules, persistence, audit logging, and background jobs.
- Reports come from persisted records.
- Financial entry must be fast, auditable, and inspectable from source records.
- User-facing text should remain easy to extract for future Kinyarwanda, French, Swahili, and other languages.

## Typical Workflows

- Family setup: register, verify, create family, configure settings, invite members.
- Expense: submit amount/category/date/notes/receipt, review, approve/reject, audit, notify, report.
- Contribution: create campaign, assign expected amounts, remind, record payments, report paid/unpaid/overdue totals.
- Report: verify permission, query source records, calculate totals, optionally queue PDF/Excel export.

## Future Direction

PWA/native mobile, offline-first entry, SMS and mobile money, multilingual UI, OCR receipts, AI report summaries, anomaly detection, advanced project dashboards, reusable family templates.
