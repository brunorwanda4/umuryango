#![allow(non_snake_case, clippy::too_many_arguments)]

pub mod api;
pub mod auth;
pub mod commands;
pub mod database;
pub mod error;
pub mod files;
pub mod notifications;
pub mod platform;
pub mod sync;

use crate::commands::NativeAppState;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::env::temp_dir().join("rw.umuryango.app"));
            std::fs::create_dir_all(&app_data_dir)?;

            let native_state = Arc::new(
                NativeAppState::new(app_data_dir)
                    .map_err(|e| std::io::Error::other(e.to_string()))?,
            );
            app.manage(native_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::initialize_native_app,
            commands::get_session_state,
            commands::set_api_base_url,
            commands::sign_in,
            commands::unlock_offline_session,
            commands::sign_out,
            commands::list_cached_families,
            commands::select_active_family,
            commands::get_cached_dashboard,
            commands::create_offline_income,
            commands::create_offline_expense,
            commands::update_offline_transaction_notes,
            commands::create_offline_contribution_payment,
            commands::create_offline_project,
            commands::create_offline_contact,
            commands::stage_offline_receipt,
            commands::get_sync_status,
            commands::sync_now,
            commands::retry_failed_command,
            commands::resolve_conflict,
            commands::get_notification_permission,
            commands::set_notification_permission,
            commands::send_native_notification,
            commands::handle_deep_link,
            commands::open_external_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Umuryango Tauri application");
}

#[cfg(test)]
mod tests {
    use crate::api::contracts::{
        parse_minor_units, sum_minor_unit_strings, validate_positive_minor_units, NativeAuthUser,
        NativeSessionState, NativeSessionTokensResponse, SyncAuthoritativeTotals,
        SyncCommandOutcome, SyncCommandType, SyncPullMemberSummary, SyncPullResponse,
        SyncPushCommandResult, SyncRecordEnvelope, SyncRecordType, SyncTombstoneRecord,
        SYNC_CONTRACTS_VERSION,
    };
    use crate::api::NativeApiClient;
    use crate::auth::SessionManager;
    use crate::database::migrations::MIGRATIONS;
    use crate::database::{AccountDatabase, NewOfflineMutation};
    use crate::error::AppError;
    use crate::files::stage_offline_receipt_attachment;
    use crate::platform::{parse_deep_link, validate_external_https_url};
    use crate::sync::backoff::calculate_backoff_delay_ms;
    use crate::sync::conflict::{resolve_outbox_conflict, ConflictResolutionStrategy};
    use sqlx::Row;
    use tempfile::TempDir;

    fn sample_master_key(seed: u8) -> [u8; 32] {
        [seed; 32]
    }

    fn sample_totals() -> SyncAuthoritativeTotals {
        SyncAuthoritativeTotals {
            currency: "RWF".to_string(),
            serverApprovedIncomeMinorUnits: "500000".to_string(),
            serverApprovedExpenseMinorUnits: "120000".to_string(),
            serverNetBalanceMinorUnits: "380000".to_string(),
            serverPendingApprovalExpenseMinorUnits: "45000".to_string(),
            computedAt: "2026-11-01T00:00:00Z".to_string(),
        }
    }

    #[tokio::test]
    async fn test_01_local_database_migrations_are_idempotent() {
        let tmp = TempDir::new().unwrap();
        let db = AccountDatabase::open_for_account(tmp.path(), "user-1", &sample_master_key(1))
            .await
            .unwrap();

        let rows = sqlx::query("SELECT version, name FROM schema_migrations ORDER BY version ASC")
            .fetch_all(db.pool())
            .await
            .unwrap();

        assert_eq!(rows.len(), MIGRATIONS.len());
        assert_eq!(rows[0].get::<i64, _>("version"), 1);
        assert_eq!(rows[1].get::<i64, _>("version"), 2);

        // Re-opening must not duplicate migrations
        db.close().await;
        let db_reopened =
            AccountDatabase::open_for_account(tmp.path(), "user-1", &sample_master_key(1))
                .await
                .unwrap();
        let rows_after = sqlx::query("SELECT version FROM schema_migrations")
            .fetch_all(db_reopened.pool())
            .await
            .unwrap();
        assert_eq!(rows_after.len(), MIGRATIONS.len());
    }

    #[tokio::test]
    async fn test_02_account_scoped_storage_and_cipher_isolation() {
        let tmp = TempDir::new().unwrap();
        let db_path = tmp.path().join("shared_attempt.sqlite3");

        let db_user_a = AccountDatabase::open_at_path(&db_path, "user-a", &sample_master_key(11))
            .await
            .unwrap();
        db_user_a.close().await;

        // Opening user-a's SQLite file as user-b must be rejected immediately
        let res_user_b =
            AccountDatabase::open_at_path(&db_path, "user-b", &sample_master_key(22)).await;
        assert!(matches!(res_user_b, Err(AppError::PermissionDenied(_))));
    }

    #[tokio::test]
    async fn test_03_family_scoped_query_isolation_and_separated_totals() {
        let tmp = TempDir::new().unwrap();
        let db = AccountDatabase::open_for_account(tmp.path(), "user-1", &sample_master_key(7))
            .await
            .unwrap();

        db.upsert_cached_family(
            "fam-1",
            "gasabo-family",
            "Gasabo Family",
            "RWF",
            "OWNER",
            &["CREATE_TRANSACTIONS".to_string()],
            true,
        )
        .await
        .unwrap();

        db.upsert_cached_family(
            "fam-2",
            "nyarugenge-family",
            "Nyarugenge Family",
            "RWF",
            "MEMBER",
            &["CREATE_TRANSACTIONS".to_string()],
            true,
        )
        .await
        .unwrap();

        // Queue offline expense in fam-1
        db.enqueue_offline_mutation(NewOfflineMutation {
            family_id: "fam-1".to_string(),
            command_type: SyncCommandType::CreateExpense,
            record_type: SyncRecordType::MoneyTransaction,
            local_record_id: "tx-local-1".to_string(),
            target_server_id: None,
            parent_command_id: None,
            base_version: None,
            created_by_user_id: "user-1".to_string(),
            device_id: "dev-1".to_string(),
            direction: Some("EXPENSE".to_string()),
            record_status: Some("PENDING_APPROVAL".to_string()),
            category_id: Some("cat-1".to_string()),
            amount_minor_units: Some("25000".to_string()),
            record_payload: serde_json::json!({
                "categoryId": "cat-1",
                "direction": "EXPENSE",
                "status": "PENDING_APPROVAL",
                "amountMinorUnits": "25000",
                "currency": "RWF",
                "description": "School supplies",
                "transactionDate": "2026-11-01T00:00:00Z"
            }),
            command_payload: serde_json::json!({ "amountMinorUnits": "25000" }),
        })
        .await
        .unwrap();

        let dash_fam_1 = db.get_cached_dashboard("gasabo-family").await.unwrap();
        let dash_fam_2 = db.get_cached_dashboard("nyarugenge-family").await.unwrap();

        // fam-1 has local pending expense = 25000, while server approved expense remains 0
        assert_eq!(dash_fam_1.localPendingExpenseMinorUnits, "25000");
        assert_eq!(dash_fam_1.serverApprovedExpenseMinorUnits, "0");
        assert_eq!(dash_fam_1.recentTransactions.len(), 1);

        // fam-2 must not see fam-1's records or pending totals
        assert_eq!(dash_fam_2.localPendingExpenseMinorUnits, "0");
        assert_eq!(dash_fam_2.recentTransactions.len(), 0);
    }

    #[test]
    fn test_04_and_05_minor_unit_parsing_and_rejecting_floating_point() {
        assert_eq!(parse_minor_units("150000").unwrap(), 150000_i128);
        assert_eq!(
            validate_positive_minor_units("999999999999").unwrap(),
            "999999999999"
        );
        assert_eq!(
            sum_minor_unit_strings(["1000", "2500", "500"]).unwrap(),
            "4000"
        );

        // Reject floating point, negative, zero, and non-numeric strings
        assert!(validate_positive_minor_units("150.50").is_err());
        assert!(validate_positive_minor_units("0").is_err());
        assert!(validate_positive_minor_units("-500").is_err());
        assert!(validate_positive_minor_units("NaN").is_err());
        assert!(validate_positive_minor_units("").is_err());
    }

    #[tokio::test]
    async fn test_06_and_07_outbox_ordering_and_idempotency_preservation_across_retries() {
        let tmp = TempDir::new().unwrap();
        let db = AccountDatabase::open_for_account(tmp.path(), "user-1", &sample_master_key(3))
            .await
            .unwrap();

        db.upsert_cached_family("fam-1", "fam-1-slug", "Family 1", "RWF", "OWNER", &[], true)
            .await
            .unwrap();

        let first = db
            .enqueue_offline_mutation(NewOfflineMutation {
                family_id: "fam-1".to_string(),
                command_type: SyncCommandType::CreateIncome,
                record_type: SyncRecordType::MoneyTransaction,
                local_record_id: "rec-1".to_string(),
                target_server_id: None,
                parent_command_id: None,
                base_version: None,
                created_by_user_id: "user-1".to_string(),
                device_id: "dev-1".to_string(),
                direction: Some("INCOME".to_string()),
                record_status: Some("PENDING_APPROVAL".to_string()),
                category_id: Some("cat-1".to_string()),
                amount_minor_units: Some("10000".to_string()),
                record_payload: serde_json::json!({"amountMinorUnits": "10000"}),
                command_payload: serde_json::json!({"amountMinorUnits": "10000"}),
            })
            .await
            .unwrap();

        let second = db
            .enqueue_offline_mutation(NewOfflineMutation {
                family_id: "fam-1".to_string(),
                command_type: SyncCommandType::CreateExpense,
                record_type: SyncRecordType::MoneyTransaction,
                local_record_id: "rec-2".to_string(),
                target_server_id: None,
                parent_command_id: None,
                base_version: None,
                created_by_user_id: "user-1".to_string(),
                device_id: "dev-1".to_string(),
                direction: Some("EXPENSE".to_string()),
                record_status: Some("PENDING_APPROVAL".to_string()),
                category_id: Some("cat-2".to_string()),
                amount_minor_units: Some("4000".to_string()),
                record_payload: serde_json::json!({"amountMinorUnits": "4000"}),
                command_payload: serde_json::json!({"amountMinorUnits": "4000"}),
            })
            .await
            .unwrap();

        let dispatchable = db
            .load_dispatchable_commands("fam-1", "2099-01-01T00:00:00Z")
            .await
            .unwrap();
        assert_eq!(dispatchable.len(), 2);
        assert_eq!(dispatchable[0].commandId, first.commandId);
        assert_eq!(dispatchable[1].commandId, second.commandId);

        let original_key = first.idempotencyKey.clone();

        // Simulate transient network failure and manual retry
        db.mark_commands_retryable_failure(
            "fam-1",
            std::slice::from_ref(&first.commandId),
            "Connection timed out",
            |_| "2099-01-01T00:00:00Z".to_string(),
        )
        .await
        .unwrap();

        db.retry_failed_command("fam-1", &first.commandId)
            .await
            .unwrap();

        let after_retry = db
            .load_dispatchable_commands("fam-1", "2026-11-01T00:00:00Z")
            .await
            .unwrap();
        assert_eq!(after_retry[0].idempotencyKey, original_key);
    }

    #[test]
    fn test_08_09_and_10_error_classification_and_exponential_backoff() {
        let net_err = AppError::NetworkRetryable("Connection reset".to_string());
        assert!(net_err.is_retryable());
        assert_eq!(net_err.error_code(), "NETWORK_RETRYABLE");

        let val_err = AppError::ServerPermanent {
            status: 400,
            code: Some("VALIDATION_FAILED".to_string()),
            message: "Invalid category".to_string(),
        };
        assert!(!val_err.is_retryable());
        assert_eq!(val_err.error_code(), "VALIDATION_FAILED");

        // Exponential backoff with deterministic jitter
        let d0 = calculate_backoff_delay_ms(0, Some(150));
        let d1 = calculate_backoff_delay_ms(1, Some(150));
        let d2 = calculate_backoff_delay_ms(2, Some(150));
        let d20 = calculate_backoff_delay_ms(20, Some(150));
        assert_eq!(d0, 2150);
        assert_eq!(d1, 4150);
        assert_eq!(d2, 8150);
        assert_eq!(d20, 300_150); // Capped at 300_000 + jitter
    }

    #[tokio::test]
    async fn test_11_cursor_advancement_only_after_transaction_commit() {
        let tmp = TempDir::new().unwrap();
        let db = AccountDatabase::open_for_account(tmp.path(), "user-1", &sample_master_key(5))
            .await
            .unwrap();

        db.upsert_cached_family("fam-1", "fam-1-slug", "Family 1", "RWF", "OWNER", &[], true)
            .await
            .unwrap();

        assert_eq!(db.get_family_cursor("fam-1").await.unwrap(), None);

        // If a pull batch contains a cross-family record violation, transaction aborts and cursor stays None
        let bad_pull = SyncPullResponse {
            contractVersion: SYNC_CONTRACTS_VERSION.to_string(),
            familyId: "fam-1".to_string(),
            familySlug: "fam-1-slug".to_string(),
            serverTimestamp: "2026-11-01T01:00:00Z".to_string(),
            nextCursor: "cursor-should-not-commit".to_string(),
            hasMore: false,
            membership: SyncPullMemberSummary {
                memberId: "m-1".to_string(),
                userId: "user-1".to_string(),
                role: "OWNER".to_string(),
                permissions: vec![],
                isActive: true,
            },
            authoritativeTotals: sample_totals(),
            records: vec![SyncRecordEnvelope {
                recordType: SyncRecordType::FinanceCategory,
                serverId: "cat-99".to_string(),
                familyId: "other-family-id".to_string(),
                version: "2026-11-01T01:00:00Z".to_string(),
                createdAt: "2026-11-01T01:00:00Z".to_string(),
                updatedAt: "2026-11-01T01:00:00Z".to_string(),
                deletedAt: None,
                createdById: None,
                payload: serde_json::json!({"name": "Intruder"}),
            }],
            tombstones: vec![],
        };

        assert!(db.apply_pull_batch(&bad_pull).await.is_err());
        assert_eq!(db.get_family_cursor("fam-1").await.unwrap(), None);

        // Valid pull commits both records, tombstones, and the new cursor
        let good_pull = SyncPullResponse {
            familyId: "fam-1".to_string(),
            nextCursor: "cursor-valid-001".to_string(),
            records: vec![SyncRecordEnvelope {
                recordType: SyncRecordType::FinanceCategory,
                serverId: "cat-1".to_string(),
                familyId: "fam-1".to_string(),
                version: "2026-11-01T01:00:00Z".to_string(),
                createdAt: "2026-11-01T01:00:00Z".to_string(),
                updatedAt: "2026-11-01T01:00:00Z".to_string(),
                deletedAt: None,
                createdById: None,
                payload: serde_json::json!({
                    "name": "Education",
                    "code": "EDU",
                    "direction": "EXPENSE",
                    "isActive": true
                }),
            }],
            tombstones: vec![SyncTombstoneRecord {
                recordType: SyncRecordType::FinanceCategory,
                serverId: "cat-deleted".to_string(),
                familyId: "fam-1".to_string(),
                deletedAt: "2026-11-01T01:00:00Z".to_string(),
                reason: "CATEGORY_ARCHIVED".to_string(),
            }],
            ..bad_pull
        };

        db.apply_pull_batch(&good_pull).await.unwrap();
        assert_eq!(
            db.get_family_cursor("fam-1").await.unwrap().as_deref(),
            Some("cursor-valid-001")
        );
    }

    #[tokio::test]
    async fn test_12_13_and_17_conflict_and_rejection_states_and_parent_child_dependency() {
        let tmp = TempDir::new().unwrap();
        let db = AccountDatabase::open_for_account(tmp.path(), "user-1", &sample_master_key(9))
            .await
            .unwrap();

        db.upsert_cached_family("fam-1", "fam-1-slug", "Family 1", "RWF", "OWNER", &[], true)
            .await
            .unwrap();

        let parent_cmd = db
            .enqueue_offline_mutation(NewOfflineMutation {
                family_id: "fam-1".to_string(),
                command_type: SyncCommandType::CreateExpense,
                record_type: SyncRecordType::MoneyTransaction,
                local_record_id: "tx-parent".to_string(),
                target_server_id: None,
                parent_command_id: None,
                base_version: None,
                created_by_user_id: "user-1".to_string(),
                device_id: "dev-1".to_string(),
                direction: Some("EXPENSE".to_string()),
                record_status: Some("PENDING_APPROVAL".to_string()),
                category_id: Some("cat-1".to_string()),
                amount_minor_units: Some("50000".to_string()),
                record_payload: serde_json::json!({"amountMinorUnits": "50000"}),
                command_payload: serde_json::json!({"amountMinorUnits": "50000"}),
            })
            .await
            .unwrap();

        // Stage receipt attachment linked to parent_cmd
        let (receipt_meta, child_cmd) = stage_offline_receipt_attachment(
            tmp.path(),
            &db,
            "fam-1",
            "tx-parent",
            Some(parent_cmd.commandId.clone()),
            "user-1",
            "dev-1",
            "receipt.png",
            "image/png",
            b"fake-png-binary-content",
        )
        .await
        .unwrap();

        assert_eq!(receipt_meta.sizeBytes, 23);
        assert!(!receipt_meta.sha256Checksum.is_empty());

        // Simulate server returning CONFLICT on parent command
        db.apply_push_results(
            "fam-1",
            &sample_totals(),
            &[SyncPushCommandResult {
                commandId: parent_cmd.commandId.clone(),
                idempotencyKey: parent_cmd.idempotencyKey.clone(),
                localRecordId: "tx-parent".to_string(),
                outcome: SyncCommandOutcome::Conflict,
                serverRecord: None,
                conflictCode: Some("APPROVAL_STATE_CONFLICT".to_string()),
                errorMessage: Some("Transaction already approved on server".to_string()),
                serverSnapshot: Some(serde_json::json!({
                    "status": "APPROVED",
                    "amountMinorUnits": "50000",
                    "updatedAt": "2026-11-01T02:00:00Z"
                })),
                processedAt: "2026-11-01T02:00:00Z".to_string(),
            }],
            |_| "2099-01-01T00:00:00Z".to_string(),
        )
        .await
        .unwrap();

        // Child command (ATTACH_RECEIPT) must be halted while parent is in CONFLICT
        let dispatchable = db
            .load_dispatchable_commands("fam-1", "2099-01-01T00:00:00Z")
            .await
            .unwrap();
        assert!(
            dispatchable
                .iter()
                .all(|c| c.commandId != child_cmd.commandId),
            "Dependent child command must not dispatch when parent command is in CONFLICT"
        );

        // Resolve parent conflict by accepting server version
        resolve_outbox_conflict(
            &db,
            "fam-1",
            &parent_cmd.commandId,
            ConflictResolutionStrategy::AcceptServer,
            None,
        )
        .await
        .unwrap();

        let status = db
            .get_sync_status("fam-1", "fam-1-slug", true, false)
            .await
            .unwrap();
        assert_eq!(status.conflictCount, 0);
    }

    #[tokio::test]
    async fn test_14_and_15_restart_recovery_and_logout_cleanup() {
        let tmp = TempDir::new().unwrap();
        let api = NativeApiClient::new("http://127.0.0.1:59999").unwrap();

        let mut session = SessionManager::new(tmp.path()).unwrap();
        session
            .establish_authenticated_session(
                NativeSessionTokensResponse {
                    user: NativeAuthUser {
                        id: "user-restart-1".to_string(),
                        email: "aline@umuryango.rw".to_string(),
                        name: "Aline Uwase".to_string(),
                        phone: None,
                        mfaEnabled: Some(false),
                    },
                    accessToken: "secret-access-token".to_string(),
                    refreshToken: "secret-refresh-token".to_string(),
                    accessTokenExpiresInSeconds: 900,
                    refreshTokenExpiresInSeconds: 86400 * 14,
                },
                Some("device-restart-1".to_string()),
            )
            .unwrap();

        let master_key = session.account_master_key().unwrap();
        let db = AccountDatabase::open_for_account(tmp.path(), "user-restart-1", &master_key)
            .await
            .unwrap();

        db.upsert_cached_family("fam-1", "fam-1-slug", "Family 1", "RWF", "OWNER", &[], true)
            .await
            .unwrap();

        let cmd = db
            .enqueue_offline_mutation(NewOfflineMutation {
                family_id: "fam-1".to_string(),
                command_type: SyncCommandType::CreateExpense,
                record_type: SyncRecordType::MoneyTransaction,
                local_record_id: "tx-crash-1".to_string(),
                target_server_id: None,
                parent_command_id: None,
                base_version: None,
                created_by_user_id: "user-restart-1".to_string(),
                device_id: "device-restart-1".to_string(),
                direction: Some("EXPENSE".to_string()),
                record_status: Some("PENDING_APPROVAL".to_string()),
                category_id: Some("cat-1".to_string()),
                amount_minor_units: Some("12000".to_string()),
                record_payload: serde_json::json!({"amountMinorUnits": "12000"}),
                command_payload: serde_json::json!({"amountMinorUnits": "12000"}),
            })
            .await
            .unwrap();

        // Mark as SYNCING then simulate unexpected process termination
        db.mark_commands_syncing("fam-1", std::slice::from_ref(&cmd.commandId))
            .await
            .unwrap();
        let db_file_path = db.db_path().to_path_buf();
        db.close().await;

        // Restart SessionManager offline and reopen AccountDatabase
        let mut restarted_session = SessionManager::new(tmp.path()).unwrap();
        let unlocked = restarted_session.unlock_offline_session().unwrap();
        assert_eq!(
            unlocked.state,
            NativeSessionState::AuthenticatedOfflineUnlocked
        );

        let reopened_db =
            AccountDatabase::open_for_account(tmp.path(), "user-restart-1", &master_key)
                .await
                .unwrap();

        let recovered = reopened_db
            .load_dispatchable_commands("fam-1", "2099-01-01T00:00:00Z")
            .await
            .unwrap();
        assert_eq!(recovered.len(), 1);
        assert_eq!(recovered[0].commandId, cmd.commandId);
        reopened_db.close().await;

        // Sign out with wipe_local_cache = true must remove the account directory and vault
        assert!(db_file_path.exists());
        let signed_out = restarted_session.sign_out(&api, true).await.unwrap();
        assert_eq!(signed_out.state, NativeSessionState::Unauthenticated);
        assert!(!db_file_path.exists());
    }

    #[test]
    fn test_16_deep_link_and_external_url_validation() {
        let link = parse_deep_link("umuryango://family/gasabo-clan/transactions/tx-100").unwrap();
        assert_eq!(link.familySlug.as_deref(), Some("gasabo-clan"));
        assert_eq!(link.section, "transactions");
        assert_eq!(link.recordId.as_deref(), Some("tx-100"));

        assert!(parse_deep_link("javascript://alert(1)").is_err());
        assert!(validate_external_https_url("https://umuryango.rw/docs").is_ok());
        assert!(validate_external_https_url("javascript:alert(1)").is_err());
        assert!(validate_external_https_url("file:///C:/Windows/System32").is_err());
    }
}
