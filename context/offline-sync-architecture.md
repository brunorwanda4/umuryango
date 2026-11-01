# Offline-First Native Architecture & Synchronization Specification

> [!NOTE] Architecture Migration Status
> The Umuryango Tauri desktop application has migrated to use the existing Next.js application (`frontend/src/`) as its single UI.
> The separate native React UI (`frontend/native/`), client-side token vault, native SQLite caching, and client offline synchronization panels have been intentionally removed.
> The desktop application operates as a Tauri webview wrapper loading the Next.js application, authenticates using standard Next.js flows and secure HTTP-only cookies, and requires active network connectivity (relying on standard browser/PWA caching when available).
> The backend sync models and contracts documented below remain in place for backend-authoritative data synchronization needs.

## 1. Current System Data Flows (Pre-Synchronization Baseline)

### 1.1 Web Application (`frontend/src/`)
- **Framework**: Next.js App Router (`frontend/src/app/`) using React 19, TypeScript, Tailwind CSS, shadcn/ui, and TanStack Query.
- **Client HTTP Layer**: `frontend/src/service/api.ts` centralizes browser requests to `/api/v1/*` with `credentials: "include"`, parses the `{ data, message, error, statusCode }` envelope, attaches optional `Idempotency-Key` headers, and performs single-flight `POST /api/v1/auth/refresh` recovery on HTTP `401`.
- **Server HTTP Layer**: `frontend/src/service/server-api.ts` forwards cookies from `next/headers` during SSR and redirects unauthenticated requests to `/auth/login`.
- **Next.js Proxy**: `frontend/next.config.ts` rewrites `/api/v1/:path*` to the configured NestJS backend (`http://localhost:4915` in development).

### 1.2 Backend Application (`backend/src/`)
- **Framework**: NestJS 11 + Prisma 7 + PostgreSQL (`backend/prisma/schema.prisma`).
- **Authentication (`backend/src/auth/`)**:
  - Issues short-lived JWT access tokens (15 minutes, `type: "access"`, claims: `sub`, `email`, `sessionId`) and opaque 64-byte random `base64url` refresh tokens persisted as bcrypt hashes (`refreshTokenHash`) in `AuthSession`.
  - Sets `HttpOnly` cookies (`umuryango_access_token`, `umuryango_refresh_token`) for browser clients.
  - `JwtAuthGuard` verifies both the JWT signature and the active `AuthSession` row (`revokedAt: null`, `expiresAt > now`, `user.status === ACTIVE`).
- **Tenant & Permission Boundary (`backend/src/families/`)**:
  - `Family` is the strict tenant boundary (`id`, `slug`, `personalOwnerId`).
  - `FamilyMember` binds `userId` to `familyId` with `authority` (`HEAD`, `ADMIN`, `MEMBER`), `capabilities` (`FamilyCapability[]`), and soft removal (`removedAt`).
  - `can(member, capability)` grants implicit capabilities to `HEAD` and checks explicit `capabilities` for `ADMIN`/`MEMBER`.
- **Financial & Domain Persistence**:
  - Monetary values are persisted as `BigInt` minor units (`amountMinorUnits`, `expectedAmountMinorUnits`, `targetAmountMinorUnits`) and serialized as decimal strings in JSON envelopes.
  - `FamilyTransaction` supports `FAMILY` and `PERSONAL` scopes, `INCOME` and `EXPENSE` types, `PENDING` / `APPROVED` / `REJECTED` / `REVERSED` statuses, monthly recurring tracking, and `@@unique([familyId, idempotencyKey])`.
  - `FamilyReceipt` links uploaded receipt metadata (`fileName`, `fileType`, `fileSizeBytes`, `storageKey`) to `FamilyTransaction`.
  - `FamilyContributionPlan`, `FamilyContributionCycle`, `FamilyContributionPayment` track contribution obligations and payments with `@@unique([familyId, idempotencyKey])`.
  - `FamilyProject`, `FamilyProjectContribution`, `FamilyProjectUpdate` track family projects with `@@unique([familyId, idempotencyKey])`.
  - `FamilyContact` and `FamilyContactDisplayName` store family contacts with soft deletion (`deletedAt`).
  - `FamilyLoan`, `FamilyLoanRepayment`, `FamilyLoanDocument`, `FamilyLoanAuditLog` manage borrowed/lent loans.
  - `Notification` and `FamilyInvite` manage user/family notifications with `dedupeKey` idempotency.

---

## 2. Explicit Offline Capability Matrix

| Workflow / Domain Action | Offline Support | Offline Behavior & Local State | Server Reconciliation & Security Policy |
| --- | --- | --- | --- |
| **Read cached families, members, categories, transactions, projects, contributions, contacts, notifications** | **Allowed Offline** | Read from account-scoped encrypted SQLite cache. Displays `lastSyncedAt` and staleness banner. | Scoped strictly by `accountId` and `familyId`. Cleared on logout or membership revocation. |
| **Family Dashboard & Money Overview** | **Allowed Offline (Read-Only + Separated Pending Totals)** | Shows last synced server-authoritative totals alongside separate Rust-computed `localPendingIncomeMinorUnits` and `localPendingExpenseMinorUnits` (`i128` minor units). | Never merges unapproved local pending items into server-authoritative totals. |
| **Create Family Expense (`CREATE_EXPENSE`)** | **Allowed Offline** | Saved locally with `syncStatus = LOCAL_PENDING` and stable UUID v4 `idempotencyKey`. Shown with text + icon badge `"Pending sync"`. | Revalidates active membership, `RECORD_EXPENSE` capability, active `FAMILY` category, and positive minor units. Deduplicates via `(familyId, idempotencyKey)`. Creates `PENDING` transaction + audit event. |
| **Create Family Income (`CREATE_INCOME`)** | **Allowed Offline** | Saved locally with `syncStatus = LOCAL_PENDING` and `idempotencyKey`. Supports `ONE_TIME` and `MONTHLY` recurrence fields. | Revalidates active membership, `RECORD_INCOME` capability, active `FAMILY` category, and recurrence rules. Deduplicates via `(familyId, idempotencyKey)`. |
| **Create Personal Income / Expense (`CREATE_PERSONAL_TRANSACTION`)** | **Allowed Offline** | Saved locally with `syncStatus = LOCAL_PENDING` and `idempotencyKey`. | Revalidates membership and owner-scoped `PERSONAL` category. Auto-approved for personal scope. |
| **Edit Unapproved Transaction Notes / Description (`UPDATE_TRANSACTION_NOTES`)** | **Allowed Offline** | Queued with `baseUpdatedAt` / `baseVersion` from the cached server record. | Version check on server: if record was modified on server (`updatedAt !== baseUpdatedAt`) or already `APPROVED`/`REJECTED`/`REVERSED`, returns explicit `VERSION_CONFLICT` or `APPROVAL_STATE_CONFLICT`. |
| **Record Contribution Payment (`RECORD_CONTRIBUTION_PAYMENT`)** | **Allowed Offline** | Saved locally as `LOCAL_PENDING` with `idempotencyKey`. | Revalidates `MANAGE_CONTRIBUTIONS` capability, plan/cycle membership, and deduplicates via `(familyId, idempotencyKey)`. |
| **Create Family Project (`CREATE_PROJECT`)** | **Allowed Offline** | Saved locally as `LOCAL_PENDING` with `idempotencyKey`. | Revalidates `MANAGE_PROJECTS` capability and deduplicates via `(familyId, idempotencyKey)`. |
| **Create / Edit Family Contact (`CREATE_CONTACT`, `UPDATE_CONTACT`)** | **Allowed Offline** | Saved locally as `LOCAL_PENDING` with `idempotencyKey` and `baseUpdatedAt`. | Revalidates membership / contact permissions and checks `baseUpdatedAt` on updates. |
| **Select Receipt / Attachment Offline (`ATTACH_RECEIPT`)** | **Allowed Offline (Staged)** | File copied into Rust app-owned vault directory, SHA-256 checksum + size/MIME validated, linked to parent transaction command. | Dependent on parent transaction command succeeding first. Uploaded and persisted only when online; local file retained until server confirmation. |
| **Transaction / Loan / Contribution Approvals & Rejections** | **Online Only** | Blocked while offline with explicit explanation. | Server state wins; approvals require live capability verification and immediate audit logging. |
| **Role, Authority, or Capability Changes & Member Removal** | **Online Only** | Blocked while offline. | Permission changes must be immediately authoritative and audited on the server. |
| **Invitation Send / Accept / Decline** | **Online Only** | Blocked while offline. | Membership transitions require live server verification. |
| **First-Time Login, Registration, Email Verification, Password Reset, MFA** | **Online Only** | Blocked while offline. Previously authenticated accounts may unlock local cache offline only if non-expired encrypted session policy permits. | Tokens are held in Rust secure storage and never exposed to the WebView. |
| **Financial Reversals & Authoritative Exports/Reports** | **Online Only** | Blocked while offline. | Reversals and exports require live server transactions. |

---

## 3. Local Database & At-Rest Encryption Design

### 3.1 Per-Account Database Isolation
- Each authenticated user account receives a dedicated SQLite database file inside the platform app-data directory:
  `<app_data_dir>/accounts/<sha256(user_id)>/umuryango_v1.sqlite3`
- One signed-in user can never query or open another user's SQLite file.
- Signing out securely wipes the active session secret, closes the account database pool, and purges the account's cached SQLite database and staged attachment files (unless offline pending mutations exist and the user cancels sign-out).

### 3.2 SQLCipher Evaluation vs. Authenticated Payload Encryption (AEAD)
- **Evaluation**: Linking SQLCipher from C sources across both Windows MSVC (`x86_64-pc-windows-msvc`) and Android NDK (`aarch64-linux-android`, `armv7-linux-androideabi`, `x86_64-linux-android`) introduces OpenSSL C cross-compilation dependencies that frequently break reproducible offline builds.
- **Implemented Defense-in-Depth Design**:
  1. **Standard SQLite (via `sqlx` / bundled `libsqlite3-sys`)** manages relational indexing (`family_id`, `record_type`, `local_id`, `server_id`, `sync_status`, `server_version`, timestamps, tombstones) so cursor queries and outbox ordering remain fast and transactional.
  2. **Authenticated Encryption (AEAD `ChaCha20-Poly1305` via `ring::aead::CHACHA20_POLY1305`)** encrypts all sensitive financial, personal, and session payloads at rest (`encrypted_payload` columns in `cached_records`, `outbox_commands`, and `staged_attachments`, plus the encrypted session vault file `session.vault`).
  3. **Additional Authenticated Data (AAD)**: Every encrypted blob binds `account_id || family_id || record_type || local_id` as AAD so ciphertext cannot be transplanted across accounts, families, or record rows.
  4. **Key Management**: A 256-bit master key is generated via `ring::rand::SystemRandom`, derived per-account via `HKDF-SHA256` (`ring::hkdf`), and persisted in the OS-protected key vault (`StrongholdVault` backed by Windows DPAPI / Android Keystore app-private key wrapping).
  5. **What is encrypted vs. unencrypted**:
     - **Encrypted (`ChaCha20-Poly1305` + AAD)**: Access tokens, refresh tokens, transaction amounts, descriptions, notes, payer/payee details, categories, dashboard financial summaries, project details, contribution payments, contact PII (phone/email/notes), and staged receipt file contents.
     - **Unencrypted relational metadata**: Opaque UUIDs/CUIDs (`local_id`, `server_id`, `family_id`), `record_type` enum, `sync_status` enum, `server_version` integer, ISO timestamps (`created_at`, `updated_at`, `deleted_at`), and outbox retry counters. Passwords are **never** stored anywhere.

---

## 4. Synchronization Protocol & Conflict Policy

### 4.1 Outbox Push Protocol
1. Pending commands (`LOCAL_PENDING` or `FAILED_RETRYABLE` whose `next_retry_at <= now`) are loaded in deterministic `seq ASC` (creation) order for the active family.
2. Each command carries a stable UUID v4 `idempotencyKey`, `familyId`, `commandType`, `localRecordId`, optional `dependsOnLocalId` (e.g. a receipt upload depends on its transaction creation), and optional `baseVersion` (`expectedUpdatedAt`).
3. If a parent command fails or enters `CONFLICT` / `REJECTED`, all dependent child commands are immediately halted (`DEPENDENT_ON_FAILED_COMMAND`) without being sent to the server.
4. Push requests are sent to `POST /api/v1/families/:familySlug/sync/push`.
5. Per-command results update the local SQLite database inside a transaction:
   - `APPLIED` / `DUPLICATE_IGNORED`: Outbox command is marked `SYNCED`, local cached record is updated with authoritative `serverId`, `serverVersion`, `updatedAt`, and server-computed fields.
   - `CONFLICT`: Outbox command and local record are marked `CONFLICT` with the server's conflict code and authoritative server record snapshot so the user can inspect and resolve it.
   - `REJECTED`: Outbox command and local record are marked `REJECTED` (permanent validation or permission error; never auto-retried).
   - Network / HTTP `5xx` / `429`: Marked `FAILED_RETRYABLE` with bounded exponential backoff and cryptographic jitter (`base = 2s`, `max = 300s`, full jitter).

### 4.2 Incremental Cursor Pull Protocol
1. Rust calls `GET /api/v1/families/:familySlug/sync/pull?cursor=<last_cursor>`.
2. Server verifies active family membership, queries all family-scoped entities modified after the cursor, collects soft-delete/removal/archive/reversal tombstones, and issues an authoritative `nextCursor`.
3. Rust applies all upserts and tombstones inside a single SQLite transaction, preserving any unsynced local drafts (`LOCAL_PENDING` / `CONFLICT`), and persists `nextCursor` **only** if the transaction commits.
