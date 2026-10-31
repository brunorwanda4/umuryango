use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Authentication required: {0}")]
    Unauthenticated(String),

    #[error("Session expired: {0}")]
    SessionExpired(String),

    #[error("Family membership or permission denied: {0}")]
    PermissionDenied(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Storage encryption error: {0}")]
    Encryption(String),

    #[error("Local database error: {0}")]
    Database(String),

    #[error("Network unreachable or transient failure: {0}")]
    NetworkRetryable(String),

    #[error("Server rejected request ({status}): {message}")]
    ServerPermanent {
        status: u16,
        code: Option<String>,
        message: String,
    },

    #[error("Synchronization conflict ({code}): {message}")]
    Conflict { code: String, message: String },

    #[error("Attachment error: {0}")]
    FileError(String),

    #[error("Platform error: {0}")]
    Platform(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SerializedAppError {
    pub code: String,
    pub message: String,
    pub retryable: bool,
}

impl AppError {
    pub fn is_retryable(&self) -> bool {
        matches!(self, AppError::NetworkRetryable(_))
    }

    pub fn error_code(&self) -> String {
        match self {
            AppError::Unauthenticated(_) => "UNAUTHENTICATED".to_string(),
            AppError::SessionExpired(_) => "SESSION_EXPIRED".to_string(),
            AppError::PermissionDenied(_) => "PERMISSION_DENIED".to_string(),
            AppError::Validation(_) => "VALIDATION_FAILED".to_string(),
            AppError::Encryption(_) => "ENCRYPTION_ERROR".to_string(),
            AppError::Database(_) => "DATABASE_ERROR".to_string(),
            AppError::NetworkRetryable(_) => "NETWORK_RETRYABLE".to_string(),
            AppError::ServerPermanent { code, .. } => code
                .clone()
                .unwrap_or_else(|| "SERVER_REJECTED".to_string()),
            AppError::Conflict { code, .. } => code.clone(),
            AppError::FileError(_) => "FILE_ERROR".to_string(),
            AppError::Platform(_) => "PLATFORM_ERROR".to_string(),
        }
    }

    pub fn to_serialized(&self) -> SerializedAppError {
        SerializedAppError {
            code: self.error_code(),
            message: self.to_string(),
            retryable: self.is_retryable(),
        }
    }
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.to_serialized().serialize(serializer)
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::Database(err.to_string())
    }
}

impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> Self {
        if err.is_timeout() || err.is_connect() || err.is_request() {
            AppError::NetworkRetryable(
                "Unable to reach Umuryango server. Changes remain safely queued offline."
                    .to_string(),
            )
        } else {
            AppError::NetworkRetryable(format!("Network transport error: {}", err.without_url()))
        }
    }
}

pub type AppResult<T> = Result<T, AppError>;
