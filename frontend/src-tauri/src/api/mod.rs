pub mod contracts;

use crate::api::contracts::{
    ApiEnvelope, NativeSessionTokensResponse, SyncPullResponse, SyncPushRequest, SyncPushResponse,
    NATIVE_CLIENT_HEADER_NAME, NATIVE_CLIENT_HEADER_VALUE,
};
use crate::error::{AppError, AppResult};
use reqwest::{Client, StatusCode};
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone)]
pub struct NativeApiClient {
    client: Client,
    base_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeLoginPayload {
    pub identifier: String,
    pub password: String,
    pub deviceId: String,
    pub deviceName: String,
    pub platform: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeRefreshPayload {
    pub refreshToken: String,
    pub deviceId: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeHealthResponse {
    pub status: String,
    pub serverTimestamp: String,
    pub contractVersion: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoteFamilySummary {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub currency: String,
    pub role: Option<String>,
}

impl NativeApiClient {
    pub fn new(base_url: impl Into<String>) -> AppResult<Self> {
        let client = Client::builder()
            .timeout(Duration::from_secs(15))
            .connect_timeout(Duration::from_secs(6))
            .build()
            .map_err(|e| AppError::Platform(format!("Failed to initialize HTTP client: {e}")))?;

        let normalized = base_url.into().trim_end_matches('/').to_string();
        Ok(Self {
            client,
            base_url: normalized,
        })
    }

    pub fn base_url(&self) -> &str {
        &self.base_url
    }

    pub fn set_base_url(&mut self, base_url: impl Into<String>) {
        self.base_url = base_url.into().trim_end_matches('/').to_string();
    }

    fn endpoint(&self, path: &str) -> String {
        if self.base_url.ends_with("/api/v1") {
            format!("{}/{}", self.base_url, path.trim_start_matches('/'))
        } else {
            format!("{}/api/v1/{}", self.base_url, path.trim_start_matches('/'))
        }
    }

    pub async fn probe_health(&self) -> AppResult<NativeHealthResponse> {
        let response = self
            .client
            .get(self.endpoint("/auth/native/health"))
            .header(NATIVE_CLIENT_HEADER_NAME, NATIVE_CLIENT_HEADER_VALUE)
            .send()
            .await?;

        self.parse_envelope(response).await
    }

    pub async fn login(
        &self,
        payload: &NativeLoginPayload,
    ) -> AppResult<NativeSessionTokensResponse> {
        let response = self
            .client
            .post(self.endpoint("/auth/native/login"))
            .header(NATIVE_CLIENT_HEADER_NAME, NATIVE_CLIENT_HEADER_VALUE)
            .json(payload)
            .send()
            .await?;

        self.parse_envelope(response).await
    }

    pub async fn refresh_tokens(
        &self,
        payload: &NativeRefreshPayload,
    ) -> AppResult<NativeSessionTokensResponse> {
        let response = self
            .client
            .post(self.endpoint("/auth/native/refresh"))
            .header(NATIVE_CLIENT_HEADER_NAME, NATIVE_CLIENT_HEADER_VALUE)
            .json(payload)
            .send()
            .await?;

        self.parse_envelope(response).await
    }

    pub async fn logout(
        &self,
        access_token: Option<&str>,
        refresh_token: Option<&str>,
        device_id: &str,
    ) -> AppResult<()> {
        let mut req = self
            .client
            .post(self.endpoint("/auth/native/logout"))
            .header(NATIVE_CLIENT_HEADER_NAME, NATIVE_CLIENT_HEADER_VALUE);

        if let Some(token) = access_token {
            req = req.bearer_auth(token);
        }

        let body = serde_json::json!({
            "refreshToken": refresh_token,
            "deviceId": device_id,
        });

        let response = req.json(&body).send().await?;
        let status = response.status();
        if status.is_success() || status == StatusCode::UNAUTHORIZED {
            return Ok(());
        }
        Err(self.classify_error_status(status, response).await)
    }

    pub async fn list_families(&self, access_token: &str) -> AppResult<Vec<RemoteFamilySummary>> {
        let response = self
            .client
            .get(self.endpoint("/families"))
            .header(NATIVE_CLIENT_HEADER_NAME, NATIVE_CLIENT_HEADER_VALUE)
            .bearer_auth(access_token)
            .send()
            .await?;

        self.parse_envelope(response).await
    }

    pub async fn sync_pull(
        &self,
        access_token: &str,
        family_slug: &str,
        cursor: Option<&str>,
        limit: u32,
    ) -> AppResult<SyncPullResponse> {
        let mut req = self
            .client
            .get(self.endpoint(&format!("/families/{family_slug}/sync/pull")))
            .header(NATIVE_CLIENT_HEADER_NAME, NATIVE_CLIENT_HEADER_VALUE)
            .bearer_auth(access_token)
            .query(&[("limit", limit.to_string())]);

        if let Some(c) = cursor {
            if !c.trim().is_empty() {
                req = req.query(&[("cursor", c)]);
            }
        }

        let response = req.send().await?;
        self.parse_envelope(response).await
    }

    pub async fn sync_push(
        &self,
        access_token: &str,
        family_slug: &str,
        payload: &SyncPushRequest,
    ) -> AppResult<SyncPushResponse> {
        let response = self
            .client
            .post(self.endpoint(&format!("/families/{family_slug}/sync/push")))
            .header(NATIVE_CLIENT_HEADER_NAME, NATIVE_CLIENT_HEADER_VALUE)
            .bearer_auth(access_token)
            .json(payload)
            .send()
            .await?;

        self.parse_envelope(response).await
    }

    async fn parse_envelope<T: DeserializeOwned>(
        &self,
        response: reqwest::Response,
    ) -> AppResult<T> {
        let status = response.status();
        if status.is_success() {
            let envelope: ApiEnvelope<T> =
                response
                    .json()
                    .await
                    .map_err(|e| AppError::ServerPermanent {
                        status: status.as_u16(),
                        code: Some("INVALID_RESPONSE_ENVELOPE".to_string()),
                        message: format!("Failed to decode server envelope: {e}"),
                    })?;
            return Ok(envelope.data);
        }

        Err(self.classify_error_status(status, response).await)
    }

    async fn classify_error_status(
        &self,
        status: StatusCode,
        response: reqwest::Response,
    ) -> AppError {
        let raw_body = response
            .json::<serde_json::Value>()
            .await
            .unwrap_or_else(|_| serde_json::json!({}));

        let message = raw_body
            .get("message")
            .and_then(|v| {
                if let Some(s) = v.as_str() {
                    Some(s.to_string())
                } else if let Some(arr) = v.as_array() {
                    Some(
                        arr.iter()
                            .filter_map(|item| item.as_str())
                            .collect::<Vec<_>>()
                            .join("; "),
                    )
                } else {
                    None
                }
            })
            .unwrap_or_else(|| format!("HTTP status {}", status.as_u16()));

        let code = raw_body
            .get("code")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        if status == StatusCode::UNAUTHORIZED {
            return AppError::SessionExpired(message);
        }

        if status == StatusCode::FORBIDDEN {
            return AppError::PermissionDenied(message);
        }

        if status.is_server_error() || status == StatusCode::TOO_MANY_REQUESTS {
            return AppError::NetworkRetryable(format!(
                "Transient server status {}: {}",
                status.as_u16(),
                message
            ));
        }

        AppError::ServerPermanent {
            status: status.as_u16(),
            code,
            message,
        }
    }
}
