use crate::api::contracts::{OutboxCommandView, SyncCommandType, SyncRecordType, SyncStatus};
use crate::database::encryption::AccountCipher;
use crate::database::{AccountDatabase, NewOfflineMutation};
use crate::error::{AppError, AppResult};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::Row;
use std::path::Path;
use uuid::Uuid;

pub const MAX_RECEIPT_SIZE_BYTES: usize = 10 * 1024 * 1024; // 10 MiB
pub const ALLOWED_RECEIPT_MIME_TYPES: &[&str] =
    &["image/jpeg", "image/png", "image/webp", "application/pdf"];

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StagedReceiptMetadata {
    pub attachmentId: String,
    pub familyId: String,
    pub localTransactionId: String,
    pub commandId: String,
    pub idempotencyKey: String,
    pub fileName: String,
    pub mimeType: String,
    pub sizeBytes: usize,
    pub sha256Checksum: String,
    pub syncStatus: SyncStatus,
    pub createdAt: String,
}

pub fn validate_receipt_input(
    file_name: &str,
    mime_type: &str,
    raw_bytes: &[u8],
) -> AppResult<String> {
    let trimmed_name = file_name.trim();
    if trimmed_name.is_empty()
        || trimmed_name.contains("..")
        || trimmed_name.contains('/')
        || trimmed_name.contains('\\')
    {
        return Err(AppError::FileError(
            "Invalid receipt file name.".to_string(),
        ));
    }

    let normalized_mime = mime_type.trim().to_ascii_lowercase();
    if !ALLOWED_RECEIPT_MIME_TYPES.contains(&normalized_mime.as_str()) {
        return Err(AppError::FileError(format!(
            "Unsupported receipt MIME type '{mime_type}'. Allowed: JPEG, PNG, WEBP, PDF."
        )));
    }

    if raw_bytes.is_empty() {
        return Err(AppError::FileError(
            "Receipt attachment file cannot be empty.".to_string(),
        ));
    }

    if raw_bytes.len() > MAX_RECEIPT_SIZE_BYTES {
        return Err(AppError::FileError(format!(
            "Receipt file size ({} bytes) exceeds 10 MiB maximum limit.",
            raw_bytes.len()
        )));
    }

    let checksum = hex::encode(Sha256::digest(raw_bytes));
    Ok(checksum)
}

pub async fn stage_offline_receipt_attachment(
    storage_dir: &Path,
    db: &AccountDatabase,
    family_id: &str,
    local_transaction_id: &str,
    parent_command_id: Option<String>,
    created_by_user_id: &str,
    device_id: &str,
    file_name: &str,
    mime_type: &str,
    raw_bytes: &[u8],
) -> AppResult<(StagedReceiptMetadata, OutboxCommandView)> {
    let checksum = validate_receipt_input(file_name, mime_type, raw_bytes)?;
    let attachment_id = Uuid::new_v4().to_string();

    let account_folder = AccountCipher::account_storage_folder_name(db.account_id());
    let attachments_dir = storage_dir
        .join("accounts")
        .join(account_folder)
        .join("attachments");
    std::fs::create_dir_all(&attachments_dir).map_err(|e| {
        AppError::FileError(format!(
            "Failed to create app-owned attachment directory: {e}"
        ))
    })?;

    // Encrypt file bytes at rest using the account's AEAD cipher
    let encrypted_file_b64 =
        db.cipher()
            .encrypt_bytes(family_id, "STAGED_RECEIPT_BYTES", &attachment_id, raw_bytes)?;

    let staged_path = attachments_dir.join(format!("{attachment_id}.enc"));
    std::fs::write(&staged_path, encrypted_file_b64.as_bytes())
        .map_err(|e| AppError::FileError(format!("Failed to persist staged attachment: {e}")))?;

    let content_b64 = BASE64.encode(raw_bytes);
    let record_payload = serde_json::json!({
        "attachmentId": attachment_id,
        "transactionId": local_transaction_id,
        "fileName": file_name,
        "mimeType": mime_type,
        "sizeBytes": raw_bytes.len(),
        "checksumSha256": checksum,
    });

    let command_payload = serde_json::json!({
        "transactionId": local_transaction_id,
        "fileName": file_name,
        "mimeType": mime_type,
        "sizeBytes": raw_bytes.len(),
        "checksumSha256": checksum,
        "contentBase64": content_b64,
        "storageKey": format!("native-receipts/{family_id}/{attachment_id}/{file_name}"),
        "fileUrl": format!("https://storage.umuryango.rw/native-receipts/{family_id}/{attachment_id}/{file_name}"),
    });

    let outbox_item = db
        .enqueue_offline_mutation(NewOfflineMutation {
            family_id: family_id.to_string(),
            command_type: SyncCommandType::AttachReceipt,
            record_type: SyncRecordType::FamilyReceipt,
            local_record_id: attachment_id.clone(),
            target_server_id: None,
            parent_command_id,
            base_version: None,
            created_by_user_id: created_by_user_id.to_string(),
            device_id: device_id.to_string(),
            direction: None,
            record_status: None,
            category_id: None,
            amount_minor_units: None,
            record_payload,
            command_payload,
        })
        .await?;

    let now = Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        INSERT INTO staged_attachments (
            attachment_id, account_id, family_id, local_transaction_id, command_id,
            idempotency_key, file_name, mime_type, size_bytes, sha256_checksum,
            staged_file_path, sync_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&attachment_id)
    .bind(db.account_id())
    .bind(family_id)
    .bind(local_transaction_id)
    .bind(&outbox_item.commandId)
    .bind(&outbox_item.idempotencyKey)
    .bind(file_name)
    .bind(mime_type)
    .bind(raw_bytes.len() as i64)
    .bind(&checksum)
    .bind(staged_path.to_string_lossy().to_string())
    .bind(SyncStatus::LocalPending.as_str())
    .bind(&now)
    .bind(&now)
    .execute(db.pool())
    .await?;

    Ok((
        StagedReceiptMetadata {
            attachmentId: attachment_id,
            familyId: family_id.to_string(),
            localTransactionId: local_transaction_id.to_string(),
            commandId: outbox_item.commandId.clone(),
            idempotencyKey: outbox_item.idempotencyKey.clone(),
            fileName: file_name.to_string(),
            mimeType: mime_type.to_string(),
            sizeBytes: raw_bytes.len(),
            sha256Checksum: checksum,
            syncStatus: SyncStatus::LocalPending,
            createdAt: now,
        },
        outbox_item,
    ))
}

pub async fn cleanup_abandoned_attachments(db: &AccountDatabase) -> AppResult<u64> {
    let rows = sqlx::query(
        r#"
        SELECT s.attachment_id, s.staged_file_path
        FROM staged_attachments s
        LEFT JOIN sync_outbox o ON o.command_id = s.command_id AND o.account_id = s.account_id
        WHERE s.account_id = ?
          AND (o.command_id IS NULL OR o.sync_status IN ('SYNCED', 'REJECTED'))
        "#,
    )
    .bind(db.account_id())
    .fetch_all(db.pool())
    .await?;

    let mut cleaned = 0_u64;
    for row in rows {
        let attachment_id: String = row.get("attachment_id");
        let staged_file_path: String = row.get("staged_file_path");
        let path = Path::new(&staged_file_path);
        if path.exists() {
            let _ = std::fs::remove_file(path);
        }
        sqlx::query("DELETE FROM staged_attachments WHERE account_id = ? AND attachment_id = ?")
            .bind(db.account_id())
            .bind(&attachment_id)
            .execute(db.pool())
            .await?;
        cleaned += 1;
    }

    Ok(cleaned)
}
