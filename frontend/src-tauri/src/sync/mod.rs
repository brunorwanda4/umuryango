pub mod backoff;
pub mod conflict;

use crate::api::contracts::{SyncPushRequest, SyncStatusSummary, SYNC_CONTRACTS_VERSION};
use crate::api::NativeApiClient;
use crate::database::AccountDatabase;
use crate::error::{AppError, AppResult};
use crate::sync::backoff::compute_next_retry_iso;
use chrono::Utc;

pub struct SyncEngine;

impl SyncEngine {
    pub async fn synchronize_family(
        db: &AccountDatabase,
        api: &NativeApiClient,
        access_token: &str,
        device_id: &str,
        family_slug: &str,
    ) -> AppResult<SyncStatusSummary> {
        let family = db.get_cached_family_by_slug(family_slug).await?;
        let family_id = family.familyId.clone();

        // Step 1: Load dispatchable outbox commands in creation order
        let now_iso = Utc::now().to_rfc3339();
        let dispatchable = db.load_dispatchable_commands(&family_id, &now_iso).await?;

        if !dispatchable.is_empty() {
            let cmd_ids: Vec<String> = dispatchable.iter().map(|c| c.commandId.clone()).collect();
            db.mark_commands_syncing(&family_id, &cmd_ids).await?;

            let push_req = SyncPushRequest {
                contractVersion: SYNC_CONTRACTS_VERSION.to_string(),
                deviceId: device_id.to_string(),
                commands: dispatchable,
            };

            match api.sync_push(access_token, family_slug, &push_req).await {
                Ok(push_resp) => {
                    db.apply_push_results(
                        &family_id,
                        &push_resp.authoritativeTotals,
                        &push_resp.results,
                        compute_next_retry_iso,
                    )
                    .await?;
                }
                Err(AppError::NetworkRetryable(msg)) => {
                    db.mark_commands_retryable_failure(
                        &family_id,
                        &cmd_ids,
                        &msg,
                        compute_next_retry_iso,
                    )
                    .await?;
                    return Err(AppError::NetworkRetryable(msg));
                }
                Err(err) => {
                    // Revert SYNCING to FAILED_RETRYABLE so nothing stays stuck
                    db.mark_commands_retryable_failure(
                        &family_id,
                        &cmd_ids,
                        &err.to_string(),
                        compute_next_retry_iso,
                    )
                    .await?;
                    return Err(err);
                }
            }
        }

        // Step 2: Pull remote changes using server-issued cursor
        let mut pages_fetched = 0_u32;
        loop {
            let cursor = db.get_family_cursor(&family_id).await?;
            let pull_resp = api
                .sync_pull(access_token, family_slug, cursor.as_deref(), 200)
                .await?;

            db.apply_pull_batch(&pull_resp).await?;

            pages_fetched += 1;
            if !pull_resp.hasMore || pages_fetched >= 10 {
                break;
            }
        }

        db.get_sync_status(&family_id, family_slug, true, false)
            .await
    }
}
