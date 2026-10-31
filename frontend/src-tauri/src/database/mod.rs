pub mod encryption;
pub mod migrations;

use crate::api::contracts::{
    sum_minor_unit_strings, validate_positive_minor_units, CachedCategoryView, CachedFamilyView,
    CachedTransactionView, NativeDashboardView, OutboxCommandView, SyncAuthoritativeTotals,
    SyncCommandOutcome, SyncCommandType, SyncPullResponse, SyncPushCommandItem,
    SyncPushCommandResult, SyncRecordEnvelope, SyncRecordType, SyncStatus, SyncStatusSummary,
};
use crate::database::encryption::AccountCipher;
use crate::database::migrations::{run_migrations, MIGRATIONS};
use crate::error::{AppError, AppResult};
use chrono::Utc;
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous};
use sqlx::{Row, SqlitePool};
use std::path::{Path, PathBuf};
use std::str::FromStr;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Clone)]
pub struct AccountDatabase {
    pool: SqlitePool,
    cipher: Arc<AccountCipher>,
    db_path: PathBuf,
}

#[derive(Debug, Clone)]
pub struct NewOfflineMutation {
    pub family_id: String,
    pub command_type: SyncCommandType,
    pub record_type: SyncRecordType,
    pub local_record_id: String,
    pub target_server_id: Option<String>,
    pub parent_command_id: Option<String>,
    pub base_version: Option<String>,
    pub created_by_user_id: String,
    pub device_id: String,
    pub direction: Option<String>,
    pub record_status: Option<String>,
    pub category_id: Option<String>,
    pub amount_minor_units: Option<String>,
    pub record_payload: serde_json::Value,
    pub command_payload: serde_json::Value,
}

impl AccountDatabase {
    pub async fn open_for_account(
        base_dir: &Path,
        account_id: &str,
        master_key: &[u8; 32],
    ) -> AppResult<Self> {
        let folder_name = AccountCipher::account_storage_folder_name(account_id);
        let account_dir = base_dir.join("accounts").join(folder_name);
        std::fs::create_dir_all(&account_dir).map_err(|e| {
            AppError::Database(format!("Failed to create account storage directory: {e}"))
        })?;

        let db_path = account_dir.join("umuryango_v1.sqlite3");
        Self::open_at_path(&db_path, account_id, master_key).await
    }

    pub async fn open_at_path(
        db_path: &Path,
        account_id: &str,
        master_key: &[u8; 32],
    ) -> AppResult<Self> {
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| {
                AppError::Database(format!("Failed to create parent directory: {e}"))
            })?;
        }

        let cipher = Arc::new(AccountCipher::derive(master_key, account_id)?);
        let db_url = format!("sqlite://{}", db_path.to_string_lossy().replace('\\', "/"));

        let connect_options = SqliteConnectOptions::from_str(&db_url)
            .map_err(|e| AppError::Database(format!("Invalid SQLite connection string: {e}")))?
            .create_if_missing(true)
            .journal_mode(SqliteJournalMode::Wal)
            .synchronous(SqliteSynchronous::Normal)
            .foreign_keys(true);

        let pool = SqlitePoolOptions::new()
            .max_connections(4)
            .connect_with(connect_options)
            .await?;

        run_migrations(&pool).await?;

        let latest_version = MIGRATIONS.last().map(|m| m.version).unwrap_or(1);
        let existing_owner: Option<(String,)> =
            sqlx::query_as("SELECT account_id FROM account_metadata LIMIT 1")
                .fetch_optional(&pool)
                .await?;

        let now = Utc::now().to_rfc3339();
        match existing_owner {
            Some((owner_id,)) => {
                if owner_id != account_id {
                    pool.close().await;
                    return Err(AppError::PermissionDenied(
                        "Cross-account database isolation violation: database belongs to another account."
                            .to_string(),
                    ));
                }
                sqlx::query(
                    "UPDATE account_metadata SET schema_version = ?, updated_at = ? WHERE account_id = ?",
                )
                .bind(latest_version)
                .bind(&now)
                .bind(account_id)
                .execute(&pool)
                .await?;
            }
            None => {
                sqlx::query(
                    "INSERT INTO account_metadata (account_id, schema_version, created_at, updated_at) VALUES (?, ?, ?, ?)",
                )
                .bind(account_id)
                .bind(latest_version)
                .bind(&now)
                .bind(&now)
                .execute(&pool)
                .await?;
            }
        }

        // Recover any commands left in SYNCING state due to prior process crash/restart
        sqlx::query(
            "UPDATE sync_outbox SET sync_status = ? WHERE account_id = ? AND sync_status = ?",
        )
        .bind(SyncStatus::LocalPending.as_str())
        .bind(account_id)
        .bind(SyncStatus::Syncing.as_str())
        .execute(&pool)
        .await?;

        sqlx::query(
            "UPDATE cached_records SET sync_status = ? WHERE account_id = ? AND sync_status = ?",
        )
        .bind(SyncStatus::LocalPending.as_str())
        .bind(account_id)
        .bind(SyncStatus::Syncing.as_str())
        .execute(&pool)
        .await?;

        Ok(Self {
            pool,
            cipher,
            db_path: db_path.to_path_buf(),
        })
    }

    pub fn account_id(&self) -> &str {
        self.cipher.account_id()
    }

    pub fn db_path(&self) -> &Path {
        &self.db_path
    }

    pub fn cipher(&self) -> &AccountCipher {
        &self.cipher
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }

    pub async fn close(&self) {
        self.pool.close().await;
    }

    pub async fn upsert_cached_family(
        &self,
        family_id: &str,
        slug: &str,
        name: &str,
        currency: &str,
        role: &str,
        permissions: &[String],
        is_active_member: bool,
    ) -> AppResult<()> {
        let now = Utc::now().to_rfc3339();
        let perms_json = serde_json::to_string(permissions)
            .map_err(|e| AppError::Database(format!("Failed to serialize permissions: {e}")))?;

        sqlx::query(
            r#"
            INSERT INTO cached_families (
                family_id, account_id, slug, name, currency, role, permissions_json, is_active_member, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(family_id) DO UPDATE SET
                slug = excluded.slug,
                name = excluded.name,
                currency = excluded.currency,
                role = excluded.role,
                permissions_json = excluded.permissions_json,
                is_active_member = excluded.is_active_member,
                updated_at = excluded.updated_at
            WHERE cached_families.account_id = excluded.account_id
            "#,
        )
        .bind(family_id)
        .bind(self.account_id())
        .bind(slug)
        .bind(name)
        .bind(currency)
        .bind(role)
        .bind(perms_json)
        .bind(if is_active_member { 1_i64 } else { 0_i64 })
        .bind(&now)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn list_cached_families(&self) -> AppResult<Vec<CachedFamilyView>> {
        let rows = sqlx::query(
            r#"
            SELECT family_id, slug, name, currency, role, permissions_json, is_active_member, last_synced_at
            FROM cached_families
            WHERE account_id = ?
            ORDER BY name ASC
            "#,
        )
        .bind(self.account_id())
        .fetch_all(&self.pool)
        .await?;

        let mut list = Vec::with_capacity(rows.len());
        for row in rows {
            let perms_raw: String = row.get("permissions_json");
            let permissions: Vec<String> = serde_json::from_str(&perms_raw).unwrap_or_default();
            list.push(CachedFamilyView {
                familyId: row.get("family_id"),
                slug: row.get("slug"),
                name: row.get("name"),
                currency: row.get("currency"),
                role: row.get("role"),
                permissions,
                isActiveMember: row.get::<i64, _>("is_active_member") != 0,
                lastSyncedAt: row.get("last_synced_at"),
            });
        }
        Ok(list)
    }

    pub async fn get_cached_family_by_slug(
        &self,
        family_slug: &str,
    ) -> AppResult<CachedFamilyView> {
        let row = sqlx::query(
            r#"
            SELECT family_id, slug, name, currency, role, permissions_json, is_active_member, last_synced_at
            FROM cached_families
            WHERE account_id = ? AND slug = ?
            "#,
        )
        .bind(self.account_id())
        .bind(family_slug)
        .fetch_optional(&self.pool)
        .await?
        .ok_or_else(|| {
            AppError::PermissionDenied(format!(
                "Family '{family_slug}' is not available in this account's local cache."
            ))
        })?;

        let perms_raw: String = row.get("permissions_json");
        let permissions: Vec<String> = serde_json::from_str(&perms_raw).unwrap_or_default();

        Ok(CachedFamilyView {
            familyId: row.get("family_id"),
            slug: row.get("slug"),
            name: row.get("name"),
            currency: row.get("currency"),
            role: row.get("role"),
            permissions,
            isActiveMember: row.get::<i64, _>("is_active_member") != 0,
            lastSyncedAt: row.get("last_synced_at"),
        })
    }

    pub async fn get_family_cursor(&self, family_id: &str) -> AppResult<Option<String>> {
        let row: Option<(Option<String>,)> = sqlx::query_as(
            "SELECT last_cursor FROM cached_families WHERE account_id = ? AND family_id = ?",
        )
        .bind(self.account_id())
        .bind(family_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.and_then(|(c,)| c))
    }

    pub async fn enqueue_offline_mutation(
        &self,
        mutation: NewOfflineMutation,
    ) -> AppResult<OutboxCommandView> {
        // Verify family belongs to this signed-in account
        let fam_exists: Option<(i64,)> = sqlx::query_as(
            "SELECT is_active_member FROM cached_families WHERE account_id = ? AND family_id = ?",
        )
        .bind(self.account_id())
        .bind(&mutation.family_id)
        .fetch_optional(&self.pool)
        .await?;

        match fam_exists {
            None => {
                return Err(AppError::PermissionDenied(
                    "Cannot create offline record for an unauthorized family.".to_string(),
                ));
            }
            Some((0,)) => {
                return Err(AppError::PermissionDenied(
                    "Family membership is inactive. Cannot queue new offline mutations."
                        .to_string(),
                ));
            }
            Some(_) => {}
        }

        if let Some(ref amt) = mutation.amount_minor_units {
            validate_positive_minor_units(amt)?;
        }

        let now = Utc::now().to_rfc3339();
        let command_id = Uuid::new_v4().to_string();
        let idempotency_key = Uuid::new_v4().to_string();

        let encrypted_record = self.cipher.encrypt_json(
            &mutation.family_id,
            mutation.record_type.as_str(),
            &mutation.local_record_id,
            &mutation.record_payload,
        )?;

        let encrypted_command = self.cipher.encrypt_json(
            &mutation.family_id,
            mutation.command_type.as_str(),
            &command_id,
            &mutation.command_payload,
        )?;

        let mut tx = self.pool.begin().await?;

        let existing_record: Option<(String,)> = sqlx::query_as(
            "SELECT local_id FROM cached_records WHERE account_id = ? AND family_id = ? AND local_id = ?",
        )
        .bind(self.account_id())
        .bind(&mutation.family_id)
        .bind(&mutation.local_record_id)
        .fetch_optional(&mut *tx)
        .await?;

        if existing_record.is_some() {
            sqlx::query(
                r#"
                UPDATE cached_records
                SET sync_status = ?,
                    last_sync_error = NULL,
                    conflict_code = NULL,
                    idempotency_key = ?,
                    updated_at = ?,
                    encrypted_payload = ?
                WHERE account_id = ? AND family_id = ? AND local_id = ?
                "#,
            )
            .bind(SyncStatus::LocalPending.as_str())
            .bind(&idempotency_key)
            .bind(&now)
            .bind(&encrypted_record)
            .bind(self.account_id())
            .bind(&mutation.family_id)
            .bind(&mutation.local_record_id)
            .execute(&mut *tx)
            .await?;
        } else {
            sqlx::query(
                r#"
                INSERT INTO cached_records (
                    local_id, account_id, family_id, server_id, record_type, server_version,
                    created_at, updated_at, deleted_at, sync_status, last_sync_error, conflict_code,
                    idempotency_key, created_by_user_id, device_id, direction, record_status,
                    category_id, amount_minor_units, encrypted_payload
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?)
                "#,
            )
            .bind(&mutation.local_record_id)
            .bind(self.account_id())
            .bind(&mutation.family_id)
            .bind(&mutation.target_server_id)
            .bind(mutation.record_type.as_str())
            .bind(&mutation.base_version)
            .bind(&now)
            .bind(&now)
            .bind(SyncStatus::LocalPending.as_str())
            .bind(&idempotency_key)
            .bind(&mutation.created_by_user_id)
            .bind(&mutation.device_id)
            .bind(&mutation.direction)
            .bind(&mutation.record_status)
            .bind(&mutation.category_id)
            .bind(&mutation.amount_minor_units)
            .bind(&encrypted_record)
            .execute(&mut *tx)
            .await?;
        }

        sqlx::query(
            r#"
            INSERT INTO sync_outbox (
                command_id, account_id, family_id, idempotency_key, command_type,
                local_record_id, target_server_id, parent_command_id, base_version,
                sync_status, retry_count, next_retry_at, last_error, conflict_code,
                encrypted_payload, encrypted_server_snapshot, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, NULL, ?, NULL, ?, ?)
            "#,
        )
        .bind(&command_id)
        .bind(self.account_id())
        .bind(&mutation.family_id)
        .bind(&idempotency_key)
        .bind(mutation.command_type.as_str())
        .bind(&mutation.local_record_id)
        .bind(&mutation.target_server_id)
        .bind(&mutation.parent_command_id)
        .bind(&mutation.base_version)
        .bind(SyncStatus::LocalPending.as_str())
        .bind(&encrypted_command)
        .bind(&now)
        .bind(&now)
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;

        Ok(OutboxCommandView {
            commandId: command_id,
            idempotencyKey: idempotency_key,
            familyId: mutation.family_id,
            commandType: mutation.command_type,
            localRecordId: mutation.local_record_id,
            targetServerId: mutation.target_server_id,
            parentCommandId: mutation.parent_command_id,
            syncStatus: SyncStatus::LocalPending,
            retryCount: 0,
            nextRetryAt: None,
            lastError: None,
            conflictCode: None,
            serverSnapshot: None,
            createdAt: now.clone(),
            updatedAt: now,
        })
    }

    pub async fn load_dispatchable_commands(
        &self,
        family_id: &str,
        now_iso: &str,
    ) -> AppResult<Vec<SyncPushCommandItem>> {
        let rows = sqlx::query(
            r#"
            SELECT command_id, idempotency_key, family_id, command_type, local_record_id,
                   target_server_id, parent_command_id, base_version, sync_status,
                   next_retry_at, encrypted_payload, created_at
            FROM sync_outbox
            WHERE account_id = ?
              AND family_id = ?
              AND sync_status IN ('LOCAL_PENDING', 'FAILED_RETRYABLE')
            ORDER BY sequence_no ASC
            "#,
        )
        .bind(self.account_id())
        .bind(family_id)
        .fetch_all(&self.pool)
        .await?;

        let mut items = Vec::new();
        let mut blocked_parents = std::collections::HashSet::new();

        // Check if any existing commands in CONFLICT, REJECTED, or FAILED_RETRYABLE (not yet due) block children
        let failed_parents = sqlx::query(
            r#"
            SELECT command_id FROM sync_outbox
            WHERE account_id = ? AND family_id = ? AND sync_status IN ('CONFLICT', 'REJECTED')
            "#,
        )
        .bind(self.account_id())
        .bind(family_id)
        .fetch_all(&self.pool)
        .await?;

        for row in failed_parents {
            let cid: String = row.get("command_id");
            blocked_parents.insert(cid);
        }

        for row in rows {
            let command_id: String = row.get("command_id");
            let parent_command_id: Option<String> = row.get("parent_command_id");
            let next_retry_at: Option<String> = row.get("next_retry_at");
            let sync_status_str: String = row.get("sync_status");

            if let Some(ref parent_id) = parent_command_id {
                if blocked_parents.contains(parent_id) {
                    blocked_parents.insert(command_id);
                    continue;
                }
            }

            if sync_status_str == SyncStatus::FailedRetryable.as_str() {
                if let Some(ref retry_after) = next_retry_at {
                    if retry_after.as_str() > now_iso {
                        blocked_parents.insert(command_id);
                        continue;
                    }
                }
            }

            let cmd_type_str: String = row.get("command_type");
            let command_type = SyncCommandType::from_db_str(&cmd_type_str).ok_or_else(|| {
                AppError::Database(format!("Unknown outbox command_type: {cmd_type_str}"))
            })?;

            let encrypted_payload: String = row.get("encrypted_payload");
            let payload = self.cipher.decrypt_json(
                family_id,
                command_type.as_str(),
                &command_id,
                &encrypted_payload,
            )?;

            items.push(SyncPushCommandItem {
                commandId: command_id,
                idempotencyKey: row.get("idempotency_key"),
                familyId: row.get("family_id"),
                commandType: command_type,
                localRecordId: row.get("local_record_id"),
                targetServerId: row.get("target_server_id"),
                parentCommandId: parent_command_id,
                baseVersion: row.get("base_version"),
                clientCreatedAt: row.get("created_at"),
                payload,
            });
        }

        Ok(items)
    }

    pub async fn mark_commands_syncing(
        &self,
        family_id: &str,
        command_ids: &[String],
    ) -> AppResult<()> {
        if command_ids.is_empty() {
            return Ok(());
        }
        let now = Utc::now().to_rfc3339();
        let mut tx = self.pool.begin().await?;
        for cid in command_ids {
            sqlx::query(
                "UPDATE sync_outbox SET sync_status = ?, updated_at = ? WHERE account_id = ? AND family_id = ? AND command_id = ?",
            )
            .bind(SyncStatus::Syncing.as_str())
            .bind(&now)
            .bind(self.account_id())
            .bind(family_id)
            .bind(cid)
            .execute(&mut *tx)
            .await?;
        }
        tx.commit().await?;
        Ok(())
    }

    pub async fn mark_commands_retryable_failure(
        &self,
        family_id: &str,
        command_ids: &[String],
        error_msg: &str,
        next_retry_calculator: impl Fn(i64) -> String,
    ) -> AppResult<()> {
        if command_ids.is_empty() {
            return Ok(());
        }
        let now = Utc::now().to_rfc3339();
        let mut tx = self.pool.begin().await?;

        for cid in command_ids {
            let row: Option<(i64, String)> = sqlx::query_as(
                "SELECT retry_count, local_record_id FROM sync_outbox WHERE account_id = ? AND family_id = ? AND command_id = ?",
            )
            .bind(self.account_id())
            .bind(family_id)
            .bind(cid)
            .fetch_optional(&mut *tx)
            .await?;

            if let Some((retry_count, local_record_id)) = row {
                let new_retry_count = retry_count + 1;
                let next_retry_at = next_retry_calculator(new_retry_count);

                sqlx::query(
                    r#"
                    UPDATE sync_outbox
                    SET sync_status = ?,
                        retry_count = ?,
                        next_retry_at = ?,
                        last_error = ?,
                        updated_at = ?
                    WHERE account_id = ? AND family_id = ? AND command_id = ?
                    "#,
                )
                .bind(SyncStatus::FailedRetryable.as_str())
                .bind(new_retry_count)
                .bind(&next_retry_at)
                .bind(error_msg)
                .bind(&now)
                .bind(self.account_id())
                .bind(family_id)
                .bind(cid)
                .execute(&mut *tx)
                .await?;

                sqlx::query(
                    r#"
                    UPDATE cached_records
                    SET sync_status = ?,
                        last_sync_error = ?,
                        updated_at = ?
                    WHERE account_id = ? AND family_id = ? AND local_id = ?
                    "#,
                )
                .bind(SyncStatus::FailedRetryable.as_str())
                .bind(error_msg)
                .bind(&now)
                .bind(self.account_id())
                .bind(family_id)
                .bind(&local_record_id)
                .execute(&mut *tx)
                .await?;
            }
        }

        tx.commit().await?;
        Ok(())
    }

    pub async fn apply_push_results(
        &self,
        family_id: &str,
        authoritative_totals: &SyncAuthoritativeTotals,
        results: &[SyncPushCommandResult],
        next_retry_calculator: impl Fn(i64) -> String,
    ) -> AppResult<()> {
        let now = Utc::now().to_rfc3339();
        let mut tx = self.pool.begin().await?;

        self.update_authoritative_totals_tx(&mut tx, family_id, authoritative_totals, &now)
            .await?;

        for res in results {
            match res.outcome {
                SyncCommandOutcome::Applied | SyncCommandOutcome::DuplicateIgnored => {
                    sqlx::query(
                        r#"
                        UPDATE sync_outbox
                        SET sync_status = ?,
                            last_error = NULL,
                            conflict_code = NULL,
                            updated_at = ?
                        WHERE account_id = ? AND family_id = ? AND command_id = ?
                        "#,
                    )
                    .bind(SyncStatus::Synced.as_str())
                    .bind(&now)
                    .bind(self.account_id())
                    .bind(family_id)
                    .bind(&res.commandId)
                    .execute(&mut *tx)
                    .await?;

                    if let Some(ref server_rec) = res.serverRecord {
                        self.upsert_server_record_tx(&mut tx, Some(&res.localRecordId), server_rec)
                            .await?;
                    } else {
                        sqlx::query(
                            r#"
                            UPDATE cached_records
                            SET sync_status = ?,
                                last_sync_error = NULL,
                                conflict_code = NULL,
                                updated_at = ?
                            WHERE account_id = ? AND family_id = ? AND local_id = ?
                            "#,
                        )
                        .bind(SyncStatus::Synced.as_str())
                        .bind(&now)
                        .bind(self.account_id())
                        .bind(family_id)
                        .bind(&res.localRecordId)
                        .execute(&mut *tx)
                        .await?;
                    }
                }
                SyncCommandOutcome::Conflict => {
                    let encrypted_snapshot = match res.serverSnapshot {
                        Some(ref snap) => Some(self.cipher.encrypt_json(
                            family_id,
                            "CONFLICT_SNAPSHOT",
                            &res.commandId,
                            snap,
                        )?),
                        None => None,
                    };

                    sqlx::query(
                        r#"
                        UPDATE sync_outbox
                        SET sync_status = ?,
                            conflict_code = ?,
                            last_error = ?,
                            encrypted_server_snapshot = ?,
                            updated_at = ?
                        WHERE account_id = ? AND family_id = ? AND command_id = ?
                        "#,
                    )
                    .bind(SyncStatus::Conflict.as_str())
                    .bind(&res.conflictCode)
                    .bind(&res.errorMessage)
                    .bind(&encrypted_snapshot)
                    .bind(&now)
                    .bind(self.account_id())
                    .bind(family_id)
                    .bind(&res.commandId)
                    .execute(&mut *tx)
                    .await?;

                    sqlx::query(
                        r#"
                        UPDATE cached_records
                        SET sync_status = ?,
                            conflict_code = ?,
                            last_sync_error = ?,
                            updated_at = ?
                        WHERE account_id = ? AND family_id = ? AND local_id = ?
                        "#,
                    )
                    .bind(SyncStatus::Conflict.as_str())
                    .bind(&res.conflictCode)
                    .bind(&res.errorMessage)
                    .bind(&now)
                    .bind(self.account_id())
                    .bind(family_id)
                    .bind(&res.localRecordId)
                    .execute(&mut *tx)
                    .await?;
                }
                SyncCommandOutcome::Rejected => {
                    sqlx::query(
                        r#"
                        UPDATE sync_outbox
                        SET sync_status = ?,
                            conflict_code = ?,
                            last_error = ?,
                            updated_at = ?
                        WHERE account_id = ? AND family_id = ? AND command_id = ?
                        "#,
                    )
                    .bind(SyncStatus::Rejected.as_str())
                    .bind(&res.conflictCode)
                    .bind(&res.errorMessage)
                    .bind(&now)
                    .bind(self.account_id())
                    .bind(family_id)
                    .bind(&res.commandId)
                    .execute(&mut *tx)
                    .await?;

                    sqlx::query(
                        r#"
                        UPDATE cached_records
                        SET sync_status = ?,
                            conflict_code = ?,
                            last_sync_error = ?,
                            updated_at = ?
                        WHERE account_id = ? AND family_id = ? AND local_id = ?
                        "#,
                    )
                    .bind(SyncStatus::Rejected.as_str())
                    .bind(&res.conflictCode)
                    .bind(&res.errorMessage)
                    .bind(&now)
                    .bind(self.account_id())
                    .bind(family_id)
                    .bind(&res.localRecordId)
                    .execute(&mut *tx)
                    .await?;
                }
                SyncCommandOutcome::FailedRetryable => {
                    let row: Option<(i64,)> = sqlx::query_as(
                        "SELECT retry_count FROM sync_outbox WHERE account_id = ? AND family_id = ? AND command_id = ?",
                    )
                    .bind(self.account_id())
                    .bind(family_id)
                    .bind(&res.commandId)
                    .fetch_optional(&mut *tx)
                    .await?;

                    let new_retry = row.map(|(r,)| r + 1).unwrap_or(1);
                    let next_retry_at = next_retry_calculator(new_retry);

                    sqlx::query(
                        r#"
                        UPDATE sync_outbox
                        SET sync_status = ?,
                            retry_count = ?,
                            next_retry_at = ?,
                            last_error = ?,
                            updated_at = ?
                        WHERE account_id = ? AND family_id = ? AND command_id = ?
                        "#,
                    )
                    .bind(SyncStatus::FailedRetryable.as_str())
                    .bind(new_retry)
                    .bind(&next_retry_at)
                    .bind(&res.errorMessage)
                    .bind(&now)
                    .bind(self.account_id())
                    .bind(family_id)
                    .bind(&res.commandId)
                    .execute(&mut *tx)
                    .await?;

                    sqlx::query(
                        r#"
                        UPDATE cached_records
                        SET sync_status = ?,
                            last_sync_error = ?,
                            updated_at = ?
                        WHERE account_id = ? AND family_id = ? AND local_id = ?
                        "#,
                    )
                    .bind(SyncStatus::FailedRetryable.as_str())
                    .bind(&res.errorMessage)
                    .bind(&now)
                    .bind(self.account_id())
                    .bind(family_id)
                    .bind(&res.localRecordId)
                    .execute(&mut *tx)
                    .await?;
                }
            }
        }

        tx.commit().await?;
        Ok(())
    }

    pub async fn apply_pull_batch(&self, pull: &SyncPullResponse) -> AppResult<()> {
        let mut tx = self.pool.begin().await?;
        let now = Utc::now().to_rfc3339();
        let perms_json = serde_json::to_string(&pull.membership.permissions)
            .unwrap_or_else(|_| "[]".to_string());

        // Update cached family membership, totals, and store new cursor ONLY inside this transaction
        sqlx::query(
            r#"
            UPDATE cached_families
            SET role = ?,
                permissions_json = ?,
                is_active_member = ?,
                last_cursor = ?,
                last_synced_at = ?,
                currency = ?,
                server_approved_income_minor_units = ?,
                server_approved_expense_minor_units = ?,
                server_net_balance_minor_units = ?,
                server_pending_approval_expense_minor_units = ?,
                updated_at = ?
            WHERE account_id = ? AND family_id = ?
            "#,
        )
        .bind(&pull.membership.role)
        .bind(&perms_json)
        .bind(if pull.membership.isActive {
            1_i64
        } else {
            0_i64
        })
        .bind(&pull.nextCursor)
        .bind(&pull.serverTimestamp)
        .bind(&pull.authoritativeTotals.currency)
        .bind(&pull.authoritativeTotals.serverApprovedIncomeMinorUnits)
        .bind(&pull.authoritativeTotals.serverApprovedExpenseMinorUnits)
        .bind(&pull.authoritativeTotals.serverNetBalanceMinorUnits)
        .bind(
            &pull
                .authoritativeTotals
                .serverPendingApprovalExpenseMinorUnits,
        )
        .bind(&now)
        .bind(self.account_id())
        .bind(&pull.familyId)
        .execute(&mut *tx)
        .await?;

        for record in &pull.records {
            if record.familyId != pull.familyId {
                return Err(AppError::PermissionDenied(
                    "Cross-family record detected in pull payload; aborting local transaction."
                        .to_string(),
                ));
            }
            self.upsert_server_record_tx(&mut tx, None, record).await?;
        }

        for tombstone in &pull.tombstones {
            if tombstone.familyId != pull.familyId {
                return Err(AppError::PermissionDenied(
                    "Cross-family tombstone detected in pull payload; aborting local transaction."
                        .to_string(),
                ));
            }
            sqlx::query(
                r#"
                UPDATE cached_records
                SET deleted_at = ?,
                    updated_at = ?,
                    sync_status = ?
                WHERE account_id = ? AND family_id = ? AND record_type = ? AND server_id = ?
                "#,
            )
            .bind(&tombstone.deletedAt)
            .bind(&tombstone.deletedAt)
            .bind(SyncStatus::Synced.as_str())
            .bind(self.account_id())
            .bind(&tombstone.familyId)
            .bind(tombstone.recordType.as_str())
            .bind(&tombstone.serverId)
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;
        Ok(())
    }

    async fn update_authoritative_totals_tx(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
        family_id: &str,
        totals: &SyncAuthoritativeTotals,
        now: &str,
    ) -> AppResult<()> {
        sqlx::query(
            r#"
            UPDATE cached_families
            SET currency = ?,
                server_approved_income_minor_units = ?,
                server_approved_expense_minor_units = ?,
                server_net_balance_minor_units = ?,
                server_pending_approval_expense_minor_units = ?,
                updated_at = ?
            WHERE account_id = ? AND family_id = ?
            "#,
        )
        .bind(&totals.currency)
        .bind(&totals.serverApprovedIncomeMinorUnits)
        .bind(&totals.serverApprovedExpenseMinorUnits)
        .bind(&totals.serverNetBalanceMinorUnits)
        .bind(&totals.serverPendingApprovalExpenseMinorUnits)
        .bind(now)
        .bind(self.account_id())
        .bind(family_id)
        .execute(&mut **tx)
        .await?;
        Ok(())
    }

    async fn upsert_server_record_tx(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
        known_local_id: Option<&str>,
        server_rec: &SyncRecordEnvelope,
    ) -> AppResult<()> {
        let existing_local_id: Option<String> = if let Some(lid) = known_local_id {
            Some(lid.to_string())
        } else {
            let row: Option<(String, String)> = sqlx::query_as(
                r#"
                SELECT local_id, sync_status FROM cached_records
                WHERE account_id = ? AND family_id = ? AND record_type = ? AND server_id = ?
                "#,
            )
            .bind(self.account_id())
            .bind(&server_rec.familyId)
            .bind(server_rec.recordType.as_str())
            .bind(&server_rec.serverId)
            .fetch_optional(&mut **tx)
            .await?;

            if let Some((lid, status_str)) = row {
                // Do not overwrite an un-resolved local conflict with a pull unless resolved
                if status_str == SyncStatus::Conflict.as_str() {
                    return Ok(());
                }
                Some(lid)
            } else {
                None
            }
        };

        let local_id = existing_local_id.unwrap_or_else(|| server_rec.serverId.clone());
        let direction = server_rec
            .payload
            .get("direction")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let record_status = server_rec
            .payload
            .get("status")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let category_id = server_rec
            .payload
            .get("categoryId")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let amount_minor_units = server_rec
            .payload
            .get("amountMinorUnits")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        let encrypted_payload = self.cipher.encrypt_json(
            &server_rec.familyId,
            server_rec.recordType.as_str(),
            &local_id,
            &server_rec.payload,
        )?;

        sqlx::query(
            r#"
            INSERT INTO cached_records (
                local_id, account_id, family_id, server_id, record_type, server_version,
                created_at, updated_at, deleted_at, sync_status, last_sync_error, conflict_code,
                idempotency_key, created_by_user_id, device_id, direction, record_status,
                category_id, amount_minor_units, encrypted_payload
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, NULL, ?, ?, ?, ?, ?)
            ON CONFLICT(local_id) DO UPDATE SET
                server_id = excluded.server_id,
                server_version = excluded.server_version,
                updated_at = excluded.updated_at,
                deleted_at = excluded.deleted_at,
                sync_status = excluded.sync_status,
                last_sync_error = NULL,
                conflict_code = NULL,
                direction = excluded.direction,
                record_status = excluded.record_status,
                category_id = excluded.category_id,
                amount_minor_units = excluded.amount_minor_units,
                encrypted_payload = excluded.encrypted_payload
            WHERE cached_records.account_id = excluded.account_id
              AND cached_records.family_id = excluded.family_id
            "#,
        )
        .bind(&local_id)
        .bind(self.account_id())
        .bind(&server_rec.familyId)
        .bind(&server_rec.serverId)
        .bind(server_rec.recordType.as_str())
        .bind(&server_rec.version)
        .bind(&server_rec.createdAt)
        .bind(&server_rec.updatedAt)
        .bind(&server_rec.deletedAt)
        .bind(SyncStatus::Synced.as_str())
        .bind(&server_rec.createdById)
        .bind(&direction)
        .bind(&record_status)
        .bind(&category_id)
        .bind(&amount_minor_units)
        .bind(&encrypted_payload)
        .execute(&mut **tx)
        .await?;

        Ok(())
    }

    pub async fn get_cached_dashboard(&self, family_slug: &str) -> AppResult<NativeDashboardView> {
        let family = self.get_cached_family_by_slug(family_slug).await?;
        let totals_row = sqlx::query(
            r#"
            SELECT server_approved_income_minor_units,
                   server_approved_expense_minor_units,
                   server_net_balance_minor_units,
                   server_pending_approval_expense_minor_units
            FROM cached_families
            WHERE account_id = ? AND family_id = ?
            "#,
        )
        .bind(self.account_id())
        .bind(&family.familyId)
        .fetch_one(&self.pool)
        .await?;

        // Compute local pending totals strictly from unsynced local records (NEVER merged into server totals)
        let pending_income_rows = sqlx::query(
            r#"
            SELECT amount_minor_units FROM cached_records
            WHERE account_id = ?
              AND family_id = ?
              AND record_type = 'MONEY_TRANSACTION'
              AND direction = 'INCOME'
              AND deleted_at IS NULL
              AND sync_status IN ('LOCAL_PENDING', 'SYNCING', 'FAILED_RETRYABLE')
            "#,
        )
        .bind(self.account_id())
        .bind(&family.familyId)
        .fetch_all(&self.pool)
        .await?;

        let pending_income_strs: Vec<String> = pending_income_rows
            .iter()
            .filter_map(|r| r.get::<Option<String>, _>("amount_minor_units"))
            .collect();
        let local_pending_income =
            sum_minor_unit_strings(pending_income_strs.iter().map(|s| s.as_str()))?;

        let pending_expense_rows = sqlx::query(
            r#"
            SELECT amount_minor_units FROM cached_records
            WHERE account_id = ?
              AND family_id = ?
              AND record_type = 'MONEY_TRANSACTION'
              AND direction = 'EXPENSE'
              AND deleted_at IS NULL
              AND sync_status IN ('LOCAL_PENDING', 'SYNCING', 'FAILED_RETRYABLE')
            "#,
        )
        .bind(self.account_id())
        .bind(&family.familyId)
        .fetch_all(&self.pool)
        .await?;

        let pending_expense_strs: Vec<String> = pending_expense_rows
            .iter()
            .filter_map(|r| r.get::<Option<String>, _>("amount_minor_units"))
            .collect();
        let local_pending_expense =
            sum_minor_unit_strings(pending_expense_strs.iter().map(|s| s.as_str()))?;

        let categories = self.list_cached_categories(&family.familyId).await?;
        let recent_transactions = self.list_cached_transactions(&family.familyId, 50).await?;
        let status_summary = self
            .get_sync_status(&family.familyId, &family.slug, true, false)
            .await?;

        Ok(NativeDashboardView {
            currency: family.currency.clone(),
            serverApprovedIncomeMinorUnits: totals_row.get("server_approved_income_minor_units"),
            serverApprovedExpenseMinorUnits: totals_row.get("server_approved_expense_minor_units"),
            serverNetBalanceMinorUnits: totals_row.get("server_net_balance_minor_units"),
            serverPendingApprovalExpenseMinorUnits: totals_row
                .get("server_pending_approval_expense_minor_units"),
            localPendingIncomeMinorUnits: local_pending_income,
            localPendingExpenseMinorUnits: local_pending_expense,
            pendingOutboxCount: status_summary.pendingCount,
            conflictCount: status_summary.conflictCount,
            failedRetryableCount: status_summary.failedRetryableCount,
            rejectedCount: status_summary.rejectedCount,
            lastSyncedAt: family.lastSyncedAt.clone(),
            family,
            categories,
            recentTransactions: recent_transactions,
        })
    }

    pub async fn list_cached_categories(
        &self,
        family_id: &str,
    ) -> AppResult<Vec<CachedCategoryView>> {
        let rows = sqlx::query(
            r#"
            SELECT local_id, server_id, encrypted_payload
            FROM cached_records
            WHERE account_id = ? AND family_id = ? AND record_type = 'FINANCE_CATEGORY' AND deleted_at IS NULL
            ORDER BY updated_at DESC
            "#,
        )
        .bind(self.account_id())
        .bind(family_id)
        .fetch_all(&self.pool)
        .await?;

        let mut categories = Vec::with_capacity(rows.len());
        for row in rows {
            let local_id: String = row.get("local_id");
            let server_id: Option<String> = row.get("server_id");
            let encrypted: String = row.get("encrypted_payload");
            let payload = self.cipher.decrypt_json(
                family_id,
                SyncRecordType::FinanceCategory.as_str(),
                &local_id,
                &encrypted,
            )?;

            categories.push(CachedCategoryView {
                serverId: server_id.unwrap_or(local_id),
                familyId: family_id.to_string(),
                name: payload
                    .get("name")
                    .and_then(|v| v.as_str())
                    .unwrap_or("Uncategorized")
                    .to_string(),
                code: payload
                    .get("code")
                    .and_then(|v| v.as_str())
                    .unwrap_or("GENERAL")
                    .to_string(),
                direction: payload
                    .get("direction")
                    .and_then(|v| v.as_str())
                    .unwrap_or("EXPENSE")
                    .to_string(),
                isActive: payload
                    .get("isActive")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(true),
                requiresReceiptAboveMinorUnits: payload
                    .get("requiresReceiptAboveMinorUnits")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
            });
        }
        Ok(categories)
    }

    pub async fn list_cached_transactions(
        &self,
        family_id: &str,
        limit: u32,
    ) -> AppResult<Vec<CachedTransactionView>> {
        let categories = self.list_cached_categories(family_id).await?;
        let mut category_map = std::collections::HashMap::new();
        for cat in categories {
            category_map.insert(cat.serverId.clone(), cat.name);
        }

        let rows = sqlx::query(
            r#"
            SELECT local_id, server_id, sync_status, last_sync_error, conflict_code,
                   updated_at, encrypted_payload
            FROM cached_records
            WHERE account_id = ?
              AND family_id = ?
              AND record_type = 'MONEY_TRANSACTION'
              AND deleted_at IS NULL
            ORDER BY updated_at DESC
            LIMIT ?
            "#,
        )
        .bind(self.account_id())
        .bind(family_id)
        .bind(limit as i64)
        .fetch_all(&self.pool)
        .await?;

        let mut list = Vec::with_capacity(rows.len());
        for row in rows {
            let local_id: String = row.get("local_id");
            let encrypted: String = row.get("encrypted_payload");
            let payload = self.cipher.decrypt_json(
                family_id,
                SyncRecordType::MoneyTransaction.as_str(),
                &local_id,
                &encrypted,
            )?;

            let category_id = payload
                .get("categoryId")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let category_name = category_map
                .get(&category_id)
                .cloned()
                .or_else(|| {
                    payload
                        .get("categoryName")
                        .and_then(|v| v.as_str())
                        .map(|s| s.to_string())
                })
                .unwrap_or_else(|| "General".to_string());

            list.push(CachedTransactionView {
                localId: local_id,
                serverId: row.get("server_id"),
                familyId: family_id.to_string(),
                categoryId: category_id,
                categoryName: category_name,
                direction: payload
                    .get("direction")
                    .and_then(|v| v.as_str())
                    .unwrap_or("EXPENSE")
                    .to_string(),
                status: payload
                    .get("status")
                    .and_then(|v| v.as_str())
                    .unwrap_or("PENDING_APPROVAL")
                    .to_string(),
                amountMinorUnits: payload
                    .get("amountMinorUnits")
                    .and_then(|v| v.as_str())
                    .unwrap_or("0")
                    .to_string(),
                currency: payload
                    .get("currency")
                    .and_then(|v| v.as_str())
                    .unwrap_or("RWF")
                    .to_string(),
                description: payload
                    .get("description")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string(),
                notes: payload
                    .get("notes")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
                transactionDate: payload
                    .get("transactionDate")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string(),
                syncStatus: SyncStatus::from_db_str(&row.get::<String, _>("sync_status")),
                lastSyncError: row.get("last_sync_error"),
                conflictCode: row.get("conflict_code"),
                updatedAt: row.get("updated_at"),
            });
        }
        Ok(list)
    }

    pub async fn get_sync_status(
        &self,
        family_id: &str,
        family_slug: &str,
        connectivity_online: bool,
        is_syncing: bool,
    ) -> AppResult<SyncStatusSummary> {
        let fam_row: Option<(Option<String>, Option<String>)> = sqlx::query_as(
            "SELECT last_synced_at, last_cursor FROM cached_families WHERE account_id = ? AND family_id = ?",
        )
        .bind(self.account_id())
        .bind(family_id)
        .fetch_optional(&self.pool)
        .await?;

        let (last_synced_at, last_cursor) = fam_row.unwrap_or((None, None));

        let rows = sqlx::query(
            r#"
            SELECT command_id, idempotency_key, family_id, command_type, local_record_id,
                   target_server_id, parent_command_id, sync_status, retry_count,
                   next_retry_at, last_error, conflict_code, encrypted_server_snapshot,
                   created_at, updated_at
            FROM sync_outbox
            WHERE account_id = ? AND family_id = ?
            ORDER BY sequence_no DESC
            LIMIT 100
            "#,
        )
        .bind(self.account_id())
        .bind(family_id)
        .fetch_all(&self.pool)
        .await?;

        let mut pending_count = 0;
        let mut syncing_count = 0;
        let mut conflict_count = 0;
        let mut rejected_count = 0;
        let mut failed_retryable_count = 0;
        let mut outbox_items = Vec::with_capacity(rows.len());

        for row in rows {
            let command_id: String = row.get("command_id");
            let status_str: String = row.get("sync_status");
            let status = SyncStatus::from_db_str(&status_str);
            match status {
                SyncStatus::LocalPending => pending_count += 1,
                SyncStatus::Syncing => syncing_count += 1,
                SyncStatus::Conflict => conflict_count += 1,
                SyncStatus::Rejected => rejected_count += 1,
                SyncStatus::FailedRetryable => failed_retryable_count += 1,
                SyncStatus::Synced => {}
            }

            let cmd_type_str: String = row.get("command_type");
            let command_type = SyncCommandType::from_db_str(&cmd_type_str)
                .unwrap_or(SyncCommandType::CreateExpense);

            let encrypted_snapshot: Option<String> = row.get("encrypted_server_snapshot");
            let server_snapshot = match encrypted_snapshot {
                Some(ref enc) => self
                    .cipher
                    .decrypt_json(family_id, "CONFLICT_SNAPSHOT", &command_id, enc)
                    .ok(),
                None => None,
            };

            outbox_items.push(OutboxCommandView {
                commandId: command_id,
                idempotencyKey: row.get("idempotency_key"),
                familyId: row.get("family_id"),
                commandType: command_type,
                localRecordId: row.get("local_record_id"),
                targetServerId: row.get("target_server_id"),
                parentCommandId: row.get("parent_command_id"),
                syncStatus: status,
                retryCount: row.get("retry_count"),
                nextRetryAt: row.get("next_retry_at"),
                lastError: row.get("last_error"),
                conflictCode: row.get("conflict_code"),
                serverSnapshot: server_snapshot,
                createdAt: row.get("created_at"),
                updatedAt: row.get("updated_at"),
            });
        }

        Ok(SyncStatusSummary {
            familyId: family_id.to_string(),
            familySlug: family_slug.to_string(),
            connectivityOnline: connectivity_online,
            isSyncing: is_syncing,
            lastSyncedAt: last_synced_at,
            lastCursor: last_cursor,
            pendingCount: pending_count,
            syncingCount: syncing_count,
            conflictCount: conflict_count,
            rejectedCount: rejected_count,
            failedRetryableCount: failed_retryable_count,
            outboxItems: outbox_items,
        })
    }

    pub async fn retry_failed_command(&self, family_id: &str, command_id: &str) -> AppResult<()> {
        let now = Utc::now().to_rfc3339();
        let row: Option<(String, String)> = sqlx::query_as(
            r#"
            SELECT sync_status, local_record_id
            FROM sync_outbox
            WHERE account_id = ? AND family_id = ? AND command_id = ?
            "#,
        )
        .bind(self.account_id())
        .bind(family_id)
        .bind(command_id)
        .fetch_optional(&self.pool)
        .await?;

        let (status_str, local_record_id) = row.ok_or_else(|| {
            AppError::Validation(format!("Outbox command '{command_id}' not found"))
        })?;

        if status_str != SyncStatus::FailedRetryable.as_str() {
            return Err(AppError::Validation(format!(
                "Only FAILED_RETRYABLE commands can be retried directly (current state: {status_str})"
            )));
        }

        let mut tx = self.pool.begin().await?;
        // Preserve original idempotency_key so backend deduplication works safely!
        sqlx::query(
            r#"
            UPDATE sync_outbox
            SET sync_status = ?,
                next_retry_at = NULL,
                updated_at = ?
            WHERE account_id = ? AND family_id = ? AND command_id = ?
            "#,
        )
        .bind(SyncStatus::LocalPending.as_str())
        .bind(&now)
        .bind(self.account_id())
        .bind(family_id)
        .bind(command_id)
        .execute(&mut *tx)
        .await?;

        sqlx::query(
            r#"
            UPDATE cached_records
            SET sync_status = ?,
                updated_at = ?
            WHERE account_id = ? AND family_id = ? AND local_id = ?
            "#,
        )
        .bind(SyncStatus::LocalPending.as_str())
        .bind(&now)
        .bind(self.account_id())
        .bind(family_id)
        .bind(&local_record_id)
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;
        Ok(())
    }
}
