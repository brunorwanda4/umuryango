#![allow(dead_code)]

use crate::api::contracts::{
    validate_positive_minor_units, CachedFamilyView, NativeDashboardView, OutboxCommandView,
    SafeSessionSummary, SyncCommandType, SyncRecordType, SyncStatusSummary,
};
use crate::api::NativeApiClient;
use crate::auth::SessionManager;
use crate::database::{AccountDatabase, NewOfflineMutation};
use crate::error::{AppError, AppResult};
use crate::files::{
    cleanup_abandoned_attachments, stage_offline_receipt_attachment, StagedReceiptMetadata,
};
use crate::notifications::{
    NativeNotificationPayload, NotificationController, NotificationPermissionState,
};
use crate::platform::{
    detect_platform_environment, parse_deep_link, validate_external_https_url, ParsedDeepLink,
    PlatformEnvironmentInfo,
};
use crate::sync::conflict::{resolve_outbox_conflict, ConflictResolutionStrategy};
use crate::sync::SyncEngine;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::Mutex;
use uuid::Uuid;

pub struct NativeAppState {
    pub storage_dir: PathBuf,
    pub api: Mutex<NativeApiClient>,
    pub session: Mutex<SessionManager>,
    pub db: Mutex<Option<AccountDatabase>>,
    pub notifications: Mutex<NotificationController>,
    pub is_syncing: Mutex<bool>,
}

impl NativeAppState {
    pub fn new(storage_dir: PathBuf) -> AppResult<Self> {
        let env_info = detect_platform_environment();
        let api = NativeApiClient::new(env_info.defaultApiBaseUrl)?;
        let session = SessionManager::new(&storage_dir)?;
        Ok(Self {
            storage_dir,
            api: Mutex::new(api),
            session: Mutex::new(session),
            db: Mutex::new(None),
            notifications: Mutex::new(NotificationController::new()),
            is_syncing: Mutex::new(false),
        })
    }

    pub async fn ensure_account_db(&self) -> AppResult<AccountDatabase> {
        {
            let guard = self.db.lock().await;
            if let Some(ref existing) = *guard {
                let session_guard = self.session.lock().await;
                if session_guard.current_user_id().as_deref() == Some(existing.account_id()) {
                    return Ok(existing.clone());
                }
            }
        }

        let (user_id, master_key) = {
            let session_guard = self.session.lock().await;
            let uid = session_guard.current_user_id().ok_or_else(|| {
                AppError::Unauthenticated("Please sign in to access family records.".to_string())
            })?;
            let key = session_guard.account_master_key()?;
            (uid, key)
        };

        let opened =
            AccountDatabase::open_for_account(&self.storage_dir, &user_id, &master_key).await?;
        let mut guard = self.db.lock().await;
        *guard = Some(opened.clone());
        Ok(opened)
    }

    pub async fn refresh_connectivity(&self) -> bool {
        let api = self.api.lock().await.clone();
        let online = api.probe_health().await.is_ok();
        let mut session = self.session.lock().await;
        session.set_connectivity(online);
        online
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InitializeAppResponse {
    pub platform: PlatformEnvironmentInfo,
    pub session: SafeSessionSummary,
    pub families: Vec<CachedFamilyView>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SignInInput {
    pub identifier: String,
    pub password: String,
    pub deviceName: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateOfflineTransactionInput {
    pub familySlug: String,
    pub categoryId: String,
    pub categoryName: Option<String>,
    pub amountMinorUnits: String,
    pub currency: Option<String>,
    pub description: String,
    pub notes: Option<String>,
    pub transactionDate: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateOfflineNotesInput {
    pub familySlug: String,
    pub localTransactionId: String,
    pub targetServerId: String,
    pub baseVersion: Option<String>,
    pub notes: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateOfflineContributionInput {
    pub familySlug: String,
    pub groupId: String,
    pub contributionMemberId: String,
    pub amountMinorUnits: String,
    pub currency: Option<String>,
    pub paymentDate: Option<String>,
    pub reference: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateOfflineProjectInput {
    pub familySlug: String,
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub targetBudgetMinorUnits: String,
    pub currency: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateOfflineContactInput {
    pub familySlug: String,
    pub fullName: String,
    pub phone: String,
    pub email: Option<String>,
    pub relationship: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StageOfflineReceiptInput {
    pub familySlug: String,
    pub localTransactionId: String,
    pub parentCommandId: Option<String>,
    pub fileName: String,
    pub mimeType: String,
    pub contentBase64: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolveConflictInput {
    pub familySlug: String,
    pub commandId: String,
    pub strategy: ConflictResolutionStrategy,
    pub replacementNotes: Option<String>,
}

#[tauri::command]
pub async fn initialize_native_app(
    state: State<'_, Arc<NativeAppState>>,
) -> AppResult<InitializeAppResponse> {
    let platform = detect_platform_environment();
    let _ = state.refresh_connectivity().await;

    let session_summary = {
        let session = state.session.lock().await;
        session.safe_summary()
    };

    let mut families = Vec::new();
    if session_summary.user.is_some() {
        if let Ok(db) = state.ensure_account_db().await {
            families = db.list_cached_families().await.unwrap_or_default();
        }
    }

    Ok(InitializeAppResponse {
        platform,
        session: session_summary,
        families,
    })
}

#[tauri::command]
pub async fn get_session_state(
    state: State<'_, Arc<NativeAppState>>,
) -> AppResult<SafeSessionSummary> {
    let _ = state.refresh_connectivity().await;
    let session = state.session.lock().await;
    Ok(session.safe_summary())
}

#[tauri::command]
pub async fn set_api_base_url(
    state: State<'_, Arc<NativeAppState>>,
    base_url: String,
) -> AppResult<String> {
    let validated = validate_external_https_url(&base_url)?;
    let mut api = state.api.lock().await;
    api.set_base_url(validated.clone());
    Ok(api.base_url().to_string())
}

#[tauri::command]
pub async fn sign_in(
    app: AppHandle,
    state: State<'_, Arc<NativeAppState>>,
    input: SignInInput,
) -> AppResult<InitializeAppResponse> {
    let platform = detect_platform_environment();
    let api = state.api.lock().await.clone();
    let device_name = input
        .deviceName
        .unwrap_or_else(|| format!("Umuryango {}", platform.osPlatform));

    let (_, access_token, device_id) = {
        let mut session = state.session.lock().await;
        let summary = session
            .sign_in_online(
                &api,
                &input.identifier,
                &input.password,
                &device_name,
                &platform.osPlatform,
            )
            .await?;
        let token = session.valid_access_token(&api).await?;
        let dev_id = session.device_id();
        (summary, token, dev_id)
    };

    let db = state.ensure_account_db().await?;

    if let Ok(remote_families) = api.list_families(&access_token).await {
        for fam in &remote_families {
            let role = fam.role.as_deref().unwrap_or("MEMBER");
            let _ = db
                .upsert_cached_family(
                    &fam.id,
                    &fam.slug,
                    &fam.name,
                    &fam.currency,
                    role,
                    &[],
                    true,
                )
                .await;
        }

        if let Some(first) = remote_families.first() {
            {
                let mut session = state.session.lock().await;
                let _ = session.set_active_family(first.slug.clone(), first.id.clone());
            }
            let _ =
                SyncEngine::synchronize_family(&db, &api, &access_token, &device_id, &first.slug)
                    .await;
        }
    }

    let families = db.list_cached_families().await.unwrap_or_default();
    let final_summary = {
        let session = state.session.lock().await;
        session.safe_summary()
    };

    let _ = app.emit("umuryango://session-updated", &final_summary);

    Ok(InitializeAppResponse {
        platform,
        session: final_summary,
        families,
    })
}

#[tauri::command]
pub async fn unlock_offline_session(
    state: State<'_, Arc<NativeAppState>>,
) -> AppResult<SafeSessionSummary> {
    let summary = {
        let mut session = state.session.lock().await;
        session.unlock_offline_session()?
    };
    let _ = state.ensure_account_db().await?;
    Ok(summary)
}

#[tauri::command]
pub async fn sign_out(
    app: AppHandle,
    state: State<'_, Arc<NativeAppState>>,
    wipe_local_cache: Option<bool>,
) -> AppResult<SafeSessionSummary> {
    {
        let mut db_guard = state.db.lock().await;
        if let Some(db) = db_guard.take() {
            db.close().await;
        }
    }

    let api = state.api.lock().await.clone();
    let summary = {
        let mut session = state.session.lock().await;
        session
            .sign_out(&api, wipe_local_cache.unwrap_or(true))
            .await?
    };

    let _ = app.emit("umuryango://session-updated", &summary);
    Ok(summary)
}

#[tauri::command]
pub async fn list_cached_families(
    state: State<'_, Arc<NativeAppState>>,
) -> AppResult<Vec<CachedFamilyView>> {
    let db = state.ensure_account_db().await?;
    db.list_cached_families().await
}

#[tauri::command]
pub async fn select_active_family(
    state: State<'_, Arc<NativeAppState>>,
    family_slug: String,
) -> AppResult<NativeDashboardView> {
    let db = state.ensure_account_db().await?;
    let family = db.get_cached_family_by_slug(&family_slug).await?;
    {
        let mut session = state.session.lock().await;
        session.set_active_family(family.slug.clone(), family.familyId.clone())?;
    }
    db.get_cached_dashboard(&family_slug).await
}

#[tauri::command]
pub async fn get_cached_dashboard(
    state: State<'_, Arc<NativeAppState>>,
    family_slug: String,
) -> AppResult<NativeDashboardView> {
    let db = state.ensure_account_db().await?;
    db.get_cached_dashboard(&family_slug).await
}

#[tauri::command]
pub async fn create_offline_income(
    app: AppHandle,
    state: State<'_, Arc<NativeAppState>>,
    input: CreateOfflineTransactionInput,
) -> AppResult<OutboxCommandView> {
    enqueue_transaction_command(app, state, input, "INCOME", SyncCommandType::CreateIncome).await
}

#[tauri::command]
pub async fn create_offline_expense(
    app: AppHandle,
    state: State<'_, Arc<NativeAppState>>,
    input: CreateOfflineTransactionInput,
) -> AppResult<OutboxCommandView> {
    enqueue_transaction_command(app, state, input, "EXPENSE", SyncCommandType::CreateExpense).await
}

async fn enqueue_transaction_command(
    app: AppHandle,
    state: State<'_, Arc<NativeAppState>>,
    input: CreateOfflineTransactionInput,
    direction: &str,
    command_type: SyncCommandType,
) -> AppResult<OutboxCommandView> {
    if input.description.trim().is_empty() {
        return Err(AppError::Validation(
            "Transaction description is required.".to_string(),
        ));
    }

    let amount_minor = validate_positive_minor_units(&input.amountMinorUnits)?;
    let db = state.ensure_account_db().await?;
    let family = db.get_cached_family_by_slug(&input.familySlug).await?;

    let (user_id, device_id) = {
        let session = state.session.lock().await;
        let uid = session
            .current_user_id()
            .ok_or_else(|| AppError::Unauthenticated("No active user session".to_string()))?;
        (uid, session.device_id())
    };

    let local_record_id = Uuid::new_v4().to_string();
    let tx_date = input
        .transactionDate
        .unwrap_or_else(|| Utc::now().to_rfc3339());
    let currency = input.currency.unwrap_or_else(|| family.currency.clone());

    let record_payload = serde_json::json!({
        "categoryId": input.categoryId,
        "categoryName": input.categoryName,
        "direction": direction,
        "status": "PENDING_APPROVAL",
        "amountMinorUnits": amount_minor,
        "currency": currency,
        "description": input.description.trim(),
        "notes": input.notes,
        "transactionDate": tx_date,
    });

    let command_payload = serde_json::json!({
        "categoryId": input.categoryId,
        "amountMinorUnits": amount_minor,
        "currency": currency,
        "description": input.description.trim(),
        "notes": input.notes,
        "transactionDate": tx_date,
    });

    let outbox = db
        .enqueue_offline_mutation(NewOfflineMutation {
            family_id: family.familyId.clone(),
            command_type,
            record_type: SyncRecordType::MoneyTransaction,
            local_record_id,
            target_server_id: None,
            parent_command_id: None,
            base_version: None,
            created_by_user_id: user_id,
            device_id,
            direction: Some(direction.to_string()),
            record_status: Some("PENDING_APPROVAL".to_string()),
            category_id: Some(input.categoryId),
            amount_minor_units: Some(amount_minor),
            record_payload,
            command_payload,
        })
        .await?;

    let _ = app.emit("umuryango://outbox-updated", &outbox);
    Ok(outbox)
}

#[tauri::command]
pub async fn update_offline_transaction_notes(
    app: AppHandle,
    state: State<'_, Arc<NativeAppState>>,
    input: UpdateOfflineNotesInput,
) -> AppResult<OutboxCommandView> {
    let db = state.ensure_account_db().await?;
    let family = db.get_cached_family_by_slug(&input.familySlug).await?;
    let (user_id, device_id) = {
        let session = state.session.lock().await;
        let uid = session
            .current_user_id()
            .ok_or_else(|| AppError::Unauthenticated("No active user session".to_string()))?;
        (uid, session.device_id())
    };

    let payload = serde_json::json!({
        "notes": input.notes.trim(),
    });

    let outbox = db
        .enqueue_offline_mutation(NewOfflineMutation {
            family_id: family.familyId,
            command_type: SyncCommandType::UpdateTransactionNotes,
            record_type: SyncRecordType::MoneyTransaction,
            local_record_id: input.localTransactionId,
            target_server_id: Some(input.targetServerId),
            parent_command_id: None,
            base_version: input.baseVersion,
            created_by_user_id: user_id,
            device_id,
            direction: None,
            record_status: None,
            category_id: None,
            amount_minor_units: None,
            record_payload: payload.clone(),
            command_payload: payload,
        })
        .await?;

    let _ = app.emit("umuryango://outbox-updated", &outbox);
    Ok(outbox)
}

#[tauri::command]
pub async fn create_offline_contribution_payment(
    app: AppHandle,
    state: State<'_, Arc<NativeAppState>>,
    input: CreateOfflineContributionInput,
) -> AppResult<OutboxCommandView> {
    let amount_minor = validate_positive_minor_units(&input.amountMinorUnits)?;
    let db = state.ensure_account_db().await?;
    let family = db.get_cached_family_by_slug(&input.familySlug).await?;
    let (user_id, device_id) = {
        let session = state.session.lock().await;
        let uid = session
            .current_user_id()
            .ok_or_else(|| AppError::Unauthenticated("No active user session".to_string()))?;
        (uid, session.device_id())
    };

    let local_record_id = Uuid::new_v4().to_string();
    let payment_date = input.paymentDate.unwrap_or_else(|| Utc::now().to_rfc3339());
    let currency = input.currency.unwrap_or_else(|| family.currency.clone());

    let payload = serde_json::json!({
        "groupId": input.groupId,
        "contributionMemberId": input.contributionMemberId,
        "amountMinorUnits": amount_minor,
        "currency": currency,
        "paymentDate": payment_date,
        "reference": input.reference,
        "notes": input.notes,
        "status": "PENDING",
    });

    let outbox = db
        .enqueue_offline_mutation(NewOfflineMutation {
            family_id: family.familyId,
            command_type: SyncCommandType::CreateContributionPayment,
            record_type: SyncRecordType::ContributionPayment,
            local_record_id,
            target_server_id: None,
            parent_command_id: None,
            base_version: None,
            created_by_user_id: user_id,
            device_id,
            direction: None,
            record_status: Some("PENDING".to_string()),
            category_id: None,
            amount_minor_units: Some(amount_minor),
            record_payload: payload.clone(),
            command_payload: payload,
        })
        .await?;

    let _ = app.emit("umuryango://outbox-updated", &outbox);
    Ok(outbox)
}

#[tauri::command]
pub async fn create_offline_project(
    app: AppHandle,
    state: State<'_, Arc<NativeAppState>>,
    input: CreateOfflineProjectInput,
) -> AppResult<OutboxCommandView> {
    if input.name.trim().is_empty() || input.code.trim().is_empty() {
        return Err(AppError::Validation(
            "Project name and code are required.".to_string(),
        ));
    }
    let budget_minor = validate_positive_minor_units(&input.targetBudgetMinorUnits)?;
    let db = state.ensure_account_db().await?;
    let family = db.get_cached_family_by_slug(&input.familySlug).await?;
    let (user_id, device_id) = {
        let session = state.session.lock().await;
        let uid = session
            .current_user_id()
            .ok_or_else(|| AppError::Unauthenticated("No active user session".to_string()))?;
        (uid, session.device_id())
    };

    let local_record_id = Uuid::new_v4().to_string();
    let currency = input.currency.unwrap_or_else(|| family.currency.clone());

    let payload = serde_json::json!({
        "name": input.name.trim(),
        "code": input.code.trim(),
        "description": input.description,
        "targetBudgetMinorUnits": budget_minor,
        "currency": currency,
        "status": "PLANNING",
    });

    let outbox = db
        .enqueue_offline_mutation(NewOfflineMutation {
            family_id: family.familyId,
            command_type: SyncCommandType::CreateProject,
            record_type: SyncRecordType::FamilyProject,
            local_record_id,
            target_server_id: None,
            parent_command_id: None,
            base_version: None,
            created_by_user_id: user_id,
            device_id,
            direction: None,
            record_status: Some("PLANNING".to_string()),
            category_id: None,
            amount_minor_units: Some(budget_minor),
            record_payload: payload.clone(),
            command_payload: payload,
        })
        .await?;

    let _ = app.emit("umuryango://outbox-updated", &outbox);
    Ok(outbox)
}

#[tauri::command]
pub async fn create_offline_contact(
    app: AppHandle,
    state: State<'_, Arc<NativeAppState>>,
    input: CreateOfflineContactInput,
) -> AppResult<OutboxCommandView> {
    if input.fullName.trim().is_empty() || input.phone.trim().is_empty() {
        return Err(AppError::Validation(
            "Contact full name and phone number are required.".to_string(),
        ));
    }

    let db = state.ensure_account_db().await?;
    let family = db.get_cached_family_by_slug(&input.familySlug).await?;
    let (user_id, device_id) = {
        let session = state.session.lock().await;
        let uid = session
            .current_user_id()
            .ok_or_else(|| AppError::Unauthenticated("No active user session".to_string()))?;
        (uid, session.device_id())
    };

    let local_record_id = Uuid::new_v4().to_string();
    let payload = serde_json::json!({
        "fullName": input.fullName.trim(),
        "phone": input.phone.trim(),
        "email": input.email,
        "relationship": input.relationship,
        "notes": input.notes,
    });

    let outbox = db
        .enqueue_offline_mutation(NewOfflineMutation {
            family_id: family.familyId,
            command_type: SyncCommandType::CreateContact,
            record_type: SyncRecordType::FamilyContact,
            local_record_id,
            target_server_id: None,
            parent_command_id: None,
            base_version: None,
            created_by_user_id: user_id,
            device_id,
            direction: None,
            record_status: None,
            category_id: None,
            amount_minor_units: None,
            record_payload: payload.clone(),
            command_payload: payload,
        })
        .await?;

    let _ = app.emit("umuryango://outbox-updated", &outbox);
    Ok(outbox)
}

#[tauri::command]
pub async fn stage_offline_receipt(
    app: AppHandle,
    state: State<'_, Arc<NativeAppState>>,
    input: StageOfflineReceiptInput,
) -> AppResult<StagedReceiptMetadata> {
    let raw_bytes = BASE64
        .decode(input.contentBase64.trim())
        .map_err(|e| AppError::FileError(format!("Invalid base64 receipt content: {e}")))?;

    let db = state.ensure_account_db().await?;
    let family = db.get_cached_family_by_slug(&input.familySlug).await?;
    let (user_id, device_id) = {
        let session = state.session.lock().await;
        let uid = session
            .current_user_id()
            .ok_or_else(|| AppError::Unauthenticated("No active user session".to_string()))?;
        (uid, session.device_id())
    };

    let (metadata, outbox) = stage_offline_receipt_attachment(
        &state.storage_dir,
        &db,
        &family.familyId,
        &input.localTransactionId,
        input.parentCommandId,
        &user_id,
        &device_id,
        &input.fileName,
        &input.mimeType,
        &raw_bytes,
    )
    .await?;

    let _ = app.emit("umuryango://outbox-updated", &outbox);
    Ok(metadata)
}

#[tauri::command]
pub async fn get_sync_status(
    state: State<'_, Arc<NativeAppState>>,
    family_slug: String,
) -> AppResult<SyncStatusSummary> {
    let online = state.refresh_connectivity().await;
    let is_syncing = *state.is_syncing.lock().await;
    let db = state.ensure_account_db().await?;
    let family = db.get_cached_family_by_slug(&family_slug).await?;
    db.get_sync_status(&family.familyId, &family.slug, online, is_syncing)
        .await
}

#[tauri::command]
pub async fn sync_now(
    app: AppHandle,
    state: State<'_, Arc<NativeAppState>>,
    family_slug: String,
) -> AppResult<SyncStatusSummary> {
    let online = state.refresh_connectivity().await;
    let db = state.ensure_account_db().await?;
    let family = db.get_cached_family_by_slug(&family_slug).await?;

    if !online {
        return db
            .get_sync_status(&family.familyId, &family.slug, false, false)
            .await;
    }

    {
        let mut syncing_guard = state.is_syncing.lock().await;
        if *syncing_guard {
            return db
                .get_sync_status(&family.familyId, &family.slug, true, true)
                .await;
        }
        *syncing_guard = true;
    }

    let api = state.api.lock().await.clone();
    let token_res = {
        let mut session = state.session.lock().await;
        let token = session.valid_access_token(&api).await;
        let dev_id = session.device_id();
        (token, dev_id)
    };

    let result = match token_res {
        (Ok(access_token), device_id) => {
            let sync_res =
                SyncEngine::synchronize_family(&db, &api, &access_token, &device_id, &family_slug)
                    .await;
            let _ = cleanup_abandoned_attachments(&db).await;
            sync_res
        }
        (Err(err), _) => Err(err),
    };

    {
        let mut syncing_guard = state.is_syncing.lock().await;
        *syncing_guard = false;
    }

    match result {
        Ok(summary) => {
            let _ = app.emit("umuryango://sync-status-updated", &summary);
            Ok(summary)
        }
        Err(AppError::PermissionDenied(msg)) => {
            let mut session = state.session.lock().await;
            session.mark_membership_revoked();
            Err(AppError::PermissionDenied(msg))
        }
        Err(AppError::SessionExpired(msg)) => {
            let mut session = state.session.lock().await;
            session.mark_session_expired();
            Err(AppError::SessionExpired(msg))
        }
        Err(err) => Err(err),
    }
}

#[tauri::command]
pub async fn retry_failed_command(
    state: State<'_, Arc<NativeAppState>>,
    family_slug: String,
    command_id: String,
) -> AppResult<SyncStatusSummary> {
    let db = state.ensure_account_db().await?;
    let family = db.get_cached_family_by_slug(&family_slug).await?;
    db.retry_failed_command(&family.familyId, &command_id)
        .await?;
    let online = state.refresh_connectivity().await;
    db.get_sync_status(&family.familyId, &family.slug, online, false)
        .await
}

#[tauri::command]
pub async fn resolve_conflict(
    state: State<'_, Arc<NativeAppState>>,
    input: ResolveConflictInput,
) -> AppResult<SyncStatusSummary> {
    let db = state.ensure_account_db().await?;
    let family = db.get_cached_family_by_slug(&input.familySlug).await?;
    resolve_outbox_conflict(
        &db,
        &family.familyId,
        &input.commandId,
        input.strategy,
        input.replacementNotes,
    )
    .await?;
    let online = state.refresh_connectivity().await;
    db.get_sync_status(&family.familyId, &family.slug, online, false)
        .await
}

#[tauri::command]
pub async fn get_notification_permission(
    state: State<'_, Arc<NativeAppState>>,
) -> AppResult<NotificationPermissionState> {
    let guard = state.notifications.lock().await;
    Ok(guard.permission_state())
}

#[tauri::command]
pub async fn set_notification_permission(
    state: State<'_, Arc<NativeAppState>>,
    permission: NotificationPermissionState,
) -> AppResult<NotificationPermissionState> {
    let mut guard = state.notifications.lock().await;
    guard.set_permission_state(permission);
    Ok(guard.permission_state())
}

#[tauri::command]
pub async fn send_native_notification(
    app: AppHandle,
    state: State<'_, Arc<NativeAppState>>,
    payload: NativeNotificationPayload,
) -> AppResult<()> {
    {
        let guard = state.notifications.lock().await;
        guard.validate_notification(&payload)?;
    }
    let _ = app.emit("umuryango://notification-dispatched", &payload);
    Ok(())
}

#[tauri::command]
pub async fn handle_deep_link(raw_url: String) -> AppResult<ParsedDeepLink> {
    parse_deep_link(&raw_url)
}

#[tauri::command]
pub async fn open_external_url(raw_url: String) -> AppResult<String> {
    validate_external_https_url(&raw_url)
}
