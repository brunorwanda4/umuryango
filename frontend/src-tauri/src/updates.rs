use crate::error::{AppError, AppResult};
use semver::Version;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use url::Url;

const LATEST_RELEASE_URL: &str =
    "https://api.github.com/repos/brunorwanda4/umuryango/releases/latest";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeUpdateContext {
    pub platform: String,
    pub current_version: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AndroidUpdateMetadata {
    pub current_version: String,
    pub version: String,
    pub notes: Option<String>,
    pub download_url: String,
    pub published_at: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
struct GithubRelease {
    tag_name: String,
    body: Option<String>,
    published_at: Option<String>,
    draft: bool,
    prerelease: bool,
    assets: Vec<GithubAsset>,
}

#[derive(Debug, Clone, Deserialize)]
struct GithubAsset {
    name: String,
    browser_download_url: String,
}

pub async fn check_android_update(
    current_version: &str,
) -> AppResult<Option<AndroidUpdateMetadata>> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .user_agent("Umuryango-Android-Updater")
        .build()?;
    let response = client.get(LATEST_RELEASE_URL).send().await?;

    if !response.status().is_success() {
        return Err(AppError::ServerPermanent {
            status: response.status().as_u16(),
            code: Some("UPDATE_CHECK_FAILED".to_string()),
            message: "GitHub could not provide the latest app release.".to_string(),
        });
    }

    let release = response.json::<GithubRelease>().await?;
    resolve_android_update(current_version, &release)
}

fn resolve_android_update(
    current_version: &str,
    release: &GithubRelease,
) -> AppResult<Option<AndroidUpdateMetadata>> {
    if release.draft || release.prerelease {
        return Ok(None);
    }

    let current = parse_version(current_version)?;
    let available = parse_version(&release.tag_name)?;
    if available <= current {
        return Ok(None);
    }

    let asset = release
        .assets
        .iter()
        .filter(|asset| asset.name.to_ascii_lowercase().ends_with(".apk"))
        .min_by_key(|asset| {
            let name = asset.name.to_ascii_lowercase();
            if name.contains("universal") {
                0
            } else {
                1
            }
        });

    let Some(asset) = asset else {
        return Ok(None);
    };
    validate_github_download_url(&asset.browser_download_url)?;

    Ok(Some(AndroidUpdateMetadata {
        current_version: current.to_string(),
        version: available.to_string(),
        notes: release
            .body
            .clone()
            .filter(|notes| !notes.trim().is_empty()),
        download_url: asset.browser_download_url.clone(),
        published_at: release.published_at.clone(),
    }))
}

fn parse_version(value: &str) -> AppResult<Version> {
    Version::parse(value.trim().trim_start_matches(['v', 'V'])).map_err(|_| {
        AppError::Validation("The app release has an invalid semantic version.".to_string())
    })
}

fn validate_github_download_url(value: &str) -> AppResult<()> {
    let url = Url::parse(value)
        .map_err(|_| AppError::Validation("The APK download URL is invalid.".to_string()))?;

    if url.scheme() != "https" || url.host_str() != Some("github.com") {
        return Err(AppError::Validation(
            "The APK download URL is not an approved GitHub URL.".to_string(),
        ));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn release(version: &str, assets: Vec<GithubAsset>) -> GithubRelease {
        GithubRelease {
            tag_name: version.to_string(),
            body: Some("Improvements".to_string()),
            published_at: Some("2026-11-03T00:00:00Z".to_string()),
            draft: false,
            prerelease: false,
            assets,
        }
    }

    fn asset(name: &str, url: &str) -> GithubAsset {
        GithubAsset {
            name: name.to_string(),
            browser_download_url: url.to_string(),
        }
    }

    #[test]
    fn selects_the_universal_apk_for_a_newer_release() {
        let metadata = resolve_android_update(
            "0.1.1",
            &release(
                "v0.2.0",
                vec![
                    asset(
                        "app-arm64.apk",
                        "https://github.com/brunorwanda4/umuryango/releases/download/v0.2.0/app-arm64.apk",
                    ),
                    asset(
                        "app-universal-release.apk",
                        "https://github.com/brunorwanda4/umuryango/releases/download/v0.2.0/app-universal-release.apk",
                    ),
                ],
            ),
        )
        .unwrap()
        .unwrap();

        assert_eq!(metadata.version, "0.2.0");
        assert!(metadata.download_url.ends_with("app-universal-release.apk"));
    }

    #[test]
    fn ignores_releases_that_are_not_newer() {
        let metadata = resolve_android_update(
            "0.2.0",
            &release(
                "0.2.0",
                vec![asset(
                    "app.apk",
                    "https://github.com/brunorwanda4/umuryango/releases/download/v0.2.0/app.apk",
                )],
            ),
        )
        .unwrap();

        assert_eq!(metadata, None);
    }

    #[test]
    fn rejects_apk_downloads_outside_github() {
        let result = resolve_android_update(
            "0.1.1",
            &release(
                "0.2.0",
                vec![asset("app.apk", "https://example.com/app.apk")],
            ),
        );

        assert!(matches!(result, Err(AppError::Validation(_))));
    }
}
