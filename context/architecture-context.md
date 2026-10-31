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


## Offline-First Tauri v2 Native Architecture (Android & Windows)

- **Web Preservation**: `frontend/src/` remains the standard Next.js 15 App Router web application communicating directly with `/api/v1` via HTTP-only cookies (`rf_access_token`, `rf_refresh_token`). No `output: "export"` is used on the web build.
- **Native UI Layer (`frontend/native/`)**: Separately bundled local React + TypeScript thin presentation layer (`frontend/native/dist/`) loaded by Tauri on Android and Windows. It never accesses tokens, never writes `localStorage` tokens, never executes direct HTTP calls, and invokes narrow typed Rust commands (`frontend/src-tauri/src/commands/mod.rs`).
- **Rust Core (`frontend/src-tauri/src/`)**:
  - `auth/`: Manages native sessions (`UNAUTHENTICATED`, `AUTHENTICATED_ONLINE`, `AUTHENTICATED_OFFLINE_UNLOCKED`, `SESSION_EXPIRED`, `MEMBERSHIP_REVOKED`) and stores access/refresh tokens in an encrypted Stronghold-equivalent AEAD vault (`ChaCha20-Poly1305` via `ring::aead` + `HKDF-SHA256`).
  - `database/`: Per-account SQLite database (`accounts/<sha256(user_id)>/umuryango_v1.sqlite3`) with versioned migrations, strict account + `familyId` isolation, `ChaCha20-Poly1305` AEAD payload encryption with associated data (`account_id | family_id | record_type | local_id`), and `i128` minor-unit financial aggregation.
  - `sync/`: Outbox-based synchronization engine with `UUID v4` idempotency keys, parent-child command dependency halting, bounded exponential backoff with jitter, transactional cursor-based pull, tombstones, and explicit conflict resolution (`ACCEPT_SERVER`, `DISCARD_LOCAL`, `RETRY_AS_NEW_NOTES`).
  - `files/`: App-owned encrypted staging for offline receipts/documents (`<= 10 MiB`, `JPEG/PNG/WEBP/PDF`) with `SHA-256` checksum verification.
- **Backend Synchronization (`backend/src/sync/` & `backend/src/auth/`)**:
  - Native auth endpoints under `/api/v1/auth/native/{login,refresh,logout,health}` requiring `x-umuryango-client: tauri-native`.
  - Family-scoped sync endpoints `GET /api/v1/families/:familySlug/sync/pull` and `POST /api/v1/families/:familySlug/sync/push` enforcing live membership/permission revalidation, idempotency deduplication (`FamilySyncMutation`), conflict codes, and audit logs.
- **Detailed Reference**: See `context/offline-sync-architecture.md` and `contracts/sync-contracts.v1.json`.
