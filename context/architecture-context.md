# Architecture Context

Use this file for system design, module boundaries, database, API, jobs, storage, auth, observability, and scalability decisions.

## System Shape

- Frontend renders workflows and calls the API.
- Backend validates requests, enforces auth/permissions, applies business rules, persists data, writes audit logs, and emits jobs/events.
- PostgreSQL stores source-of-truth transactional data.
- Redis supports queues, cache, rate limits, sessions/temporary state where appropriate.
- BullMQ runs slow or retryable work.
- Bunny Storage stores uploads and generated exports; PostgreSQL stores metadata.

## Frontend

- `frontend/`: Bun only, Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand for local UI state only.
- Use `bun install`, `bun run <script>`, `bunx <pkg>`.
- Keep API calls typed and centralized through `frontend/src/service/api.ts`.
- Use server components where useful; client components for interactive workflows.
- Use URL query params for shareable filters where useful.

## Backend

- `backend/`: Bun, NestJS, TypeScript, Prisma, PostgreSQL, Redis, BullMQ.
- Use `bun install`, `bun run <script>`, and `bunx <pkg>`.
- Modules should be domain-based: auth, users, families, members, permissions, finance, contributions, savings, debts, budgets, projects, announcements, events, documents, reports, notifications, audit, common.
- Controllers map HTTP only. Services enforce rules. Guards enforce auth. DTOs validate input. Events/jobs handle side effects.

## Database

- PostgreSQL is source of truth.
- Family-scoped tables need `familyId`.
- Use FKs, explicit enums, indexes for common filters, migrations for schema changes, transactions for financial mutations, append-only audit logs.
- Avoid N+1 queries and unbounded report queries.

## API

- REST by default under `/api/v1`.
- Prefer path-level family scoping: `/api/v1/families/:familyId/...`.
- Validate membership and permission on every family-scoped route.
- Paginate high-volume resources, return consistent envelopes/errors, hide internals, support useful filters/sorts.
- Use idempotency keys for duplicate-sensitive contribution/payment-like actions.

## Auth And Authorization

- Layers: authentication guard, family membership guard, permission guard, service-level record/status checks.
- Example permissions: `family.manage_settings`, `members.invite`, `members.approve`, `expenses.create`, `expenses.approve`, `income.create`, `reports.view_all`, `documents.upload`, `documents.view_private`, `projects.manage`.

## Jobs, Storage, Reports

- Jobs: email, SMS, push, PDF/Excel exports, document processing, reminders, session cleanup. Jobs must be idempotent, retry-safe, and observable.
- Storage workflow: check permission, validate metadata/file, upload, persist metadata, audit, generate secure link.
- Reports workflow: verify permission, fetch approved source records, calculate totals server-side, return JSON or queue export.

## Observability And Scale

- Use structured logs, request correlation IDs, error tracking, queue failure monitoring, API/database metrics, auth/storage alerts.
- Do not log secrets or private file contents.
- Scale with pagination, indexes, efficient reports, safe caching, queues, and avoiding N+1 queries.


## Tauri v2 Desktop Architecture (Windows & Android)

- **Single UI Architecture**: `frontend/src/` is the sole application UI for both regular browsers and the Tauri desktop application. The separate native React UI (`frontend/native/`) has been removed. Both web and desktop load the identical Next.js routes, layouts, and components.
- **Authentication**: The same Next.js forms are used on web and Tauri. Online browser requests continue using secure HTTP-only cookies. A successful password login prepares a device-local PBKDF2 verifier: Tauri stores it with tokens/account keys in the encrypted Rust vault, while the PWA stores only the verifier and encrypted cache in IndexedDB. Passwords are never stored. First login, registration, verification, MFA, recovery, and Google login remain online-only.
- **Offline behavior**: `frontend/src/service/api.ts` is the shared online/offline gateway. Successful account-scoped reads seed an encrypted IndexedDB cache for the PWA, while Tauri financial outbox writes use the encrypted Rust/SQLite engine. Previously loaded routes/assets are available through the service worker. Only explicitly allow-listed, idempotent mutations can be queued; approvals, permissions, invitations, reversals, and authoritative exports remain online-only.
- **Synchronization**: Browser outbox entries replay in creation order after the `online` event using their original idempotency key. Tauri invokes the Rust synchronization engine for every cached family. The backend remains authoritative and revalidates membership, permissions, versions, and financial rules before applying commands.
- **Tauri Integration & Security**:
  - Development mode starts the Next.js development server on port 4914 (`bun run dev`) and sets Tauri's dev URL to `http://localhost:4914`, opening `/auth/login` directly by default to bypass public web marketing pages on desktop.
  - In production, Tauri is intended to load the hosted HTTPS Next.js deployment. No localhost is used in production, and `output: "export"` remains disabled to support Next.js server features.
  - Offline/session/sync Rust IPC commands are registered only for the application window. Tauri capabilities remain least-privilege for OS plugins; production must load trusted bundled or first-party HTTPS Next.js content only.
- **Backend & Contracts**: Backend sync endpoints and shared synchronization contracts (`contracts/sync-contracts.v1.json`) are preserved for future headless or mobile sync capabilities without native UI coupling.
