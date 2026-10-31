use crate::error::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use url::Url;

pub const APP_IDENTIFIER: &str = "rw.umuryango.app";
pub const APP_DISPLAY_NAME: &str = "Umuryango";
pub const DEEP_LINK_SCHEME: &str = "umuryango";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformEnvironmentInfo {
    pub appIdentifier: String,
    pub displayName: String,
    pub osPlatform: String,
    pub defaultApiBaseUrl: String,
    pub supportsAndroidBackHandler: bool,
    pub supportsHighDpiScaling: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParsedDeepLink {
    pub rawUrl: String,
    pub familySlug: Option<String>,
    pub section: String,
    pub recordId: Option<String>,
}

pub fn detect_platform_environment() -> PlatformEnvironmentInfo {
    let os_platform = std::env::consts::OS.to_string();
    let default_api_base_url = std::env::var("UMURYANGO_NATIVE_API_URL").unwrap_or_else(|_| {
        if os_platform == "android" {
            // Standard Android emulator host loopback for NestJS port 4915
            "http://10.0.2.2:4915/api/v1".to_string()
        } else {
            "http://localhost:4915/api/v1".to_string()
        }
    });

    PlatformEnvironmentInfo {
        appIdentifier: APP_IDENTIFIER.to_string(),
        displayName: APP_DISPLAY_NAME.to_string(),
        osPlatform: os_platform.clone(),
        defaultApiBaseUrl: default_api_base_url,
        supportsAndroidBackHandler: os_platform == "android",
        supportsHighDpiScaling: os_platform == "windows" || os_platform == "android",
    }
}

pub fn parse_deep_link(raw_url: &str) -> AppResult<ParsedDeepLink> {
    let parsed = Url::parse(raw_url.trim())
        .map_err(|e| AppError::Validation(format!("Invalid deep link URL '{raw_url}': {e}")))?;

    if parsed.scheme() != DEEP_LINK_SCHEME {
        return Err(AppError::Validation(format!(
            "Unsupported deep link scheme '{}'; expected '{DEEP_LINK_SCHEME}://'",
            parsed.scheme()
        )));
    }

    let host = parsed.host_str().unwrap_or("");
    let segments: Vec<&str> = parsed
        .path_segments()
        .map(|it| it.filter(|s| !s.is_empty()).collect())
        .unwrap_or_default();

    if host == "family" {
        let family_slug = segments.first().map(|s| (*s).to_string());
        let section = segments
            .get(1)
            .map(|s| (*s).to_string())
            .unwrap_or_else(|| "dashboard".to_string());
        let record_id = segments.get(2).map(|s| (*s).to_string());

        return Ok(ParsedDeepLink {
            rawUrl: raw_url.to_string(),
            familySlug: family_slug,
            section,
            recordId: record_id,
        });
    }

    Ok(ParsedDeepLink {
        rawUrl: raw_url.to_string(),
        familySlug: None,
        section: if host.is_empty() {
            "dashboard".to_string()
        } else {
            host.to_string()
        },
        recordId: segments.first().map(|s| (*s).to_string()),
    })
}

pub fn validate_external_https_url(raw_url: &str) -> AppResult<String> {
    let parsed = Url::parse(raw_url.trim())
        .map_err(|e| AppError::Validation(format!("Invalid external URL: {e}")))?;

    match parsed.scheme() {
        "https" | "http" => Ok(parsed.to_string()),
        other => Err(AppError::Validation(format!(
            "Refusing to open unsafe URL scheme '{other}:'"
        ))),
    }
}
