use crate::error::{AppError, AppResult};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum NotificationPermissionState {
    Granted,
    Denied,
    PromptRequired,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeNotificationPayload {
    pub title: String,
    pub body: String,
    pub familySlug: Option<String>,
    pub deepLinkRoute: Option<String>,
}

#[derive(Debug, Clone)]
pub struct NotificationController {
    permission_state: NotificationPermissionState,
}

impl Default for NotificationController {
    fn default() -> Self {
        Self::new()
    }
}

impl NotificationController {
    pub fn new() -> Self {
        Self {
            permission_state: NotificationPermissionState::PromptRequired,
        }
    }

    pub fn permission_state(&self) -> NotificationPermissionState {
        self.permission_state
    }

    pub fn set_permission_state(&mut self, state: NotificationPermissionState) {
        self.permission_state = state;
    }

    pub fn validate_notification(&self, payload: &NativeNotificationPayload) -> AppResult<()> {
        if self.permission_state != NotificationPermissionState::Granted {
            return Err(AppError::PermissionDenied(
                "Notification permission has not been granted by the user.".to_string(),
            ));
        }

        if payload.title.trim().is_empty() || payload.body.trim().is_empty() {
            return Err(AppError::Validation(
                "Notification title and body cannot be empty.".to_string(),
            ));
        }

        Ok(())
    }
}
