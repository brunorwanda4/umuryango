use crate::api::contracts::SyncStatus;
use crate::database::AccountDatabase;
use crate::error::{AppError, AppResult};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ConflictResolutionStrategy {
    AcceptServer,
    DiscardLocal,
    RetryAsNewNotes,
}

pub async fn resolve_outbox_conflict(
    db: &AccountDatabase,
    family_id: &str,
    command_id: &str,
    strategy: ConflictResolutionStrategy,
    replacement_notes: Option<String>,
) -> AppResult<()> {
    let row = sqlx::query(
        r#"
        SELECT command_id, local_record_id, command_type, sync_status,
               encrypted_payload, encrypted_server_snapshot
        FROM sync_outbox
        WHERE account_id = ? AND family_id = ? AND command_id = ?
        "#,
    )
    .bind(db.account_id())
    .bind(family_id)
    .bind(command_id)
    .fetch_optional(db.pool())
    .await?
    .ok_or_else(|| AppError::Validation(format!("Conflict command '{command_id}' not found")))?;

    let status_str: String = row.get("sync_status");
    if status_str != SyncStatus::Conflict.as_str() && status_str != SyncStatus::Rejected.as_str() {
        return Err(AppError::Validation(format!(
            "Command '{command_id}' is in status '{status_str}' and cannot be resolved as a conflict."
        )));
    }

    let local_record_id: String = row.get("local_record_id");
    let command_type_str: String = row.get("command_type");
    let encrypted_server_snapshot: Option<String> = row.get("encrypted_server_snapshot");
    let now = Utc::now().to_rfc3339();

    let mut tx = db.pool().begin().await?;

    match strategy {
        ConflictResolutionStrategy::AcceptServer => {
            if let Some(ref enc_snap) = encrypted_server_snapshot {
                let snapshot = db.cipher().decrypt_json(
                    family_id,
                    "CONFLICT_SNAPSHOT",
                    command_id,
                    enc_snap,
                )?;

                let rec_row: Option<(String,)> = sqlx::query_as(
                    "SELECT record_type FROM cached_records WHERE account_id = ? AND family_id = ? AND local_id = ?",
                )
                .bind(db.account_id())
                .bind(family_id)
                .bind(&local_record_id)
                .fetch_optional(&mut *tx)
                .await?;

                if let Some((record_type,)) = rec_row {
                    let encrypted_record = db.cipher().encrypt_json(
                        family_id,
                        &record_type,
                        &local_record_id,
                        &snapshot,
                    )?;
                    let server_version = snapshot
                        .get("updatedAt")
                        .and_then(|v| v.as_str())
                        .unwrap_or(&now)
                        .to_string();

                    sqlx::query(
                        r#"
                        UPDATE cached_records
                        SET sync_status = ?,
                            server_version = ?,
                            last_sync_error = NULL,
                            conflict_code = NULL,
                            encrypted_payload = ?,
                            updated_at = ?
                        WHERE account_id = ? AND family_id = ? AND local_id = ?
                        "#,
                    )
                    .bind(SyncStatus::Synced.as_str())
                    .bind(&server_version)
                    .bind(&encrypted_record)
                    .bind(&now)
                    .bind(db.account_id())
                    .bind(family_id)
                    .bind(&local_record_id)
                    .execute(&mut *tx)
                    .await?;
                }
            } else {
                // If there was no existing server record, mark local draft tombstone-deleted
                sqlx::query(
                    r#"
                    UPDATE cached_records
                    SET deleted_at = ?,
                        sync_status = ?,
                        last_sync_error = NULL,
                        conflict_code = NULL,
                        updated_at = ?
                    WHERE account_id = ? AND family_id = ? AND local_id = ?
                    "#,
                )
                .bind(&now)
                .bind(SyncStatus::Synced.as_str())
                .bind(&now)
                .bind(db.account_id())
                .bind(family_id)
                .bind(&local_record_id)
                .execute(&mut *tx)
                .await?;
            }

            sqlx::query(
                "DELETE FROM sync_outbox WHERE account_id = ? AND family_id = ? AND command_id = ?",
            )
            .bind(db.account_id())
            .bind(family_id)
            .bind(command_id)
            .execute(&mut *tx)
            .await?;
        }
        ConflictResolutionStrategy::DiscardLocal => {
            let has_server_id: Option<(Option<String>,)> = sqlx::query_as(
                "SELECT server_id FROM cached_records WHERE account_id = ? AND family_id = ? AND local_id = ?",
            )
            .bind(db.account_id())
            .bind(family_id)
            .bind(&local_record_id)
            .fetch_optional(&mut *tx)
            .await?;

            match has_server_id {
                Some((Some(_),)) => {
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
                    .bind(db.account_id())
                    .bind(family_id)
                    .bind(&local_record_id)
                    .execute(&mut *tx)
                    .await?;
                }
                _ => {
                    sqlx::query(
                        "DELETE FROM cached_records WHERE account_id = ? AND family_id = ? AND local_id = ?",
                    )
                    .bind(db.account_id())
                    .bind(family_id)
                    .bind(&local_record_id)
                    .execute(&mut *tx)
                    .await?;
                }
            }

            sqlx::query(
                "DELETE FROM sync_outbox WHERE account_id = ? AND family_id = ? AND command_id = ?",
            )
            .bind(db.account_id())
            .bind(family_id)
            .bind(command_id)
            .execute(&mut *tx)
            .await?;
        }
        ConflictResolutionStrategy::RetryAsNewNotes => {
            if command_type_str != "UPDATE_TRANSACTION_NOTES" {
                return Err(AppError::Validation(
                    "RetryAsNewNotes is only permitted for non-financial note edits on unapproved transactions."
                        .to_string(),
                ));
            }

            let notes = replacement_notes.ok_or_else(|| {
                AppError::Validation("Replacement notes text is required.".to_string())
            })?;

            let latest_base_version = if let Some(ref enc_snap) = encrypted_server_snapshot {
                let snap = db.cipher().decrypt_json(
                    family_id,
                    "CONFLICT_SNAPSHOT",
                    command_id,
                    enc_snap,
                )?;
                let status = snap
                    .get("status")
                    .and_then(|v| v.as_str())
                    .unwrap_or("PENDING_APPROVAL");
                if status != "PENDING_APPROVAL" {
                    return Err(AppError::Conflict {
                        code: "APPROVAL_STATE_CONFLICT".to_string(),
                        message: format!(
                            "Cannot retry note edit because server transaction status is now {status}."
                        ),
                    });
                }
                snap.get("updatedAt")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
            } else {
                None
            };

            let new_idempotency_key = Uuid::new_v4().to_string();
            let new_payload = serde_json::json!({ "notes": notes });
            let encrypted_cmd =
                db.cipher()
                    .encrypt_json(family_id, &command_type_str, command_id, &new_payload)?;

            sqlx::query(
                r#"
                UPDATE sync_outbox
                SET idempotency_key = ?,
                    base_version = ?,
                    sync_status = ?,
                    retry_count = 0,
                    next_retry_at = NULL,
                    last_error = NULL,
                    conflict_code = NULL,
                    encrypted_payload = ?,
                    updated_at = ?
                WHERE account_id = ? AND family_id = ? AND command_id = ?
                "#,
            )
            .bind(&new_idempotency_key)
            .bind(&latest_base_version)
            .bind(SyncStatus::LocalPending.as_str())
            .bind(&encrypted_cmd)
            .bind(&now)
            .bind(db.account_id())
            .bind(family_id)
            .bind(command_id)
            .execute(&mut *tx)
            .await?;

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
            .bind(SyncStatus::LocalPending.as_str())
            .bind(&now)
            .bind(db.account_id())
            .bind(family_id)
            .bind(&local_record_id)
            .execute(&mut *tx)
            .await?;
        }
    }

    tx.commit().await?;
    Ok(())
}
