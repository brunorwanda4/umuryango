use crate::error::AppResult;
use chrono::Utc;
use sqlx::SqlitePool;

pub struct MigrationStep {
    pub version: i64,
    pub name: &'static str,
    pub sql: &'static str,
}

pub const MIGRATIONS: &[MigrationStep] = &[
    MigrationStep {
        version: 1,
        name: "001_initial_offline_first_schema",
        sql: r#"
CREATE TABLE IF NOT EXISTS account_metadata (
    account_id TEXT PRIMARY KEY NOT NULL,
    schema_version INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cached_families (
    family_id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT NOT NULL,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'RWF',
    role TEXT NOT NULL DEFAULT 'MEMBER',
    permissions_json TEXT NOT NULL DEFAULT '[]',
    is_active_member INTEGER NOT NULL DEFAULT 1,
    last_cursor TEXT,
    last_synced_at TEXT,
    server_approved_income_minor_units TEXT NOT NULL DEFAULT '0',
    server_approved_expense_minor_units TEXT NOT NULL DEFAULT '0',
    server_net_balance_minor_units TEXT NOT NULL DEFAULT '0',
    server_pending_approval_expense_minor_units TEXT NOT NULL DEFAULT '0',
    updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cached_families_slug
    ON cached_families(account_id, slug);

CREATE TABLE IF NOT EXISTS cached_records (
    local_id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT NOT NULL,
    family_id TEXT NOT NULL,
    server_id TEXT,
    record_type TEXT NOT NULL,
    server_version TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_status TEXT NOT NULL,
    last_sync_error TEXT,
    conflict_code TEXT,
    idempotency_key TEXT,
    created_by_user_id TEXT,
    device_id TEXT,
    direction TEXT,
    record_status TEXT,
    category_id TEXT,
    amount_minor_units TEXT,
    encrypted_payload TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cached_records_server_identity
    ON cached_records(account_id, family_id, record_type, server_id)
    WHERE server_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cached_records_family_type
    ON cached_records(account_id, family_id, record_type, deleted_at, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_cached_records_sync_status
    ON cached_records(account_id, family_id, sync_status);

CREATE TABLE IF NOT EXISTS sync_outbox (
    sequence_no INTEGER PRIMARY KEY AUTOINCREMENT,
    command_id TEXT NOT NULL UNIQUE,
    account_id TEXT NOT NULL,
    family_id TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    command_type TEXT NOT NULL,
    local_record_id TEXT NOT NULL,
    target_server_id TEXT,
    parent_command_id TEXT,
    base_version TEXT,
    sync_status TEXT NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    next_retry_at TEXT,
    last_error TEXT,
    conflict_code TEXT,
    encrypted_payload TEXT NOT NULL,
    encrypted_server_snapshot TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_outbox_pending
    ON sync_outbox(account_id, family_id, sync_status, sequence_no ASC);

CREATE INDEX IF NOT EXISTS idx_sync_outbox_parent
    ON sync_outbox(account_id, parent_command_id);

CREATE TABLE IF NOT EXISTS staged_attachments (
    attachment_id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT NOT NULL,
    family_id TEXT NOT NULL,
    local_transaction_id TEXT NOT NULL,
    command_id TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    sha256_checksum TEXT NOT NULL,
    staged_file_path TEXT NOT NULL,
    sync_status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_staged_attachments_family
    ON staged_attachments(account_id, family_id, sync_status);
"#,
    },
    MigrationStep {
        version: 2,
        name: "002_add_sync_diagnostics_log",
        sql: r#"
CREATE TABLE IF NOT EXISTS sync_diagnostics_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL,
    family_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_diagnostics_family
    ON sync_diagnostics_log(account_id, family_id, id DESC);
"#,
    },
];

pub async fn run_migrations(pool: &SqlitePool) -> AppResult<Vec<i64>> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL
        );
        "#,
    )
    .execute(pool)
    .await?;

    let mut applied_versions = Vec::new();

    for step in MIGRATIONS {
        let existing: Option<(i64,)> =
            sqlx::query_as("SELECT version FROM schema_migrations WHERE version = ?")
                .bind(step.version)
                .fetch_optional(pool)
                .await?;

        if existing.is_none() {
            let mut tx = pool.begin().await?;
            for statement in step.sql.split(';') {
                let trimmed = statement.trim();
                if !trimmed.is_empty() {
                    sqlx::query(trimmed).execute(&mut *tx).await?;
                }
            }

            let now = Utc::now().to_rfc3339();
            sqlx::query(
                "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
            )
            .bind(step.version)
            .bind(step.name)
            .bind(now)
            .execute(&mut *tx)
            .await?;

            tx.commit().await?;
            applied_versions.push(step.version);
        }
    }

    Ok(applied_versions)
}
