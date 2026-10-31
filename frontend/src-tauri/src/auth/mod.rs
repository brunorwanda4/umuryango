use crate::api::contracts::{
    NativeAuthUser, NativeSessionState, NativeSessionTokensResponse, SafeSessionSummary,
};
use crate::api::{NativeApiClient, NativeLoginPayload, NativeRefreshPayload};
use crate::database::encryption::AccountCipher;
use crate::error::{AppError, AppResult};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use chrono::{DateTime, Duration, Utc};
use ring::aead::{Aad, LessSafeKey, Nonce, UnboundKey, CHACHA20_POLY1305, NONCE_LEN};
use ring::hkdf::{Salt, HKDF_SHA256};
use ring::rand::{SecureRandom, SystemRandom};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use uuid::Uuid;
use zeroize::Zeroize;

const OFFLINE_UNLOCK_MAX_DAYS: i64 = 30;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersistedVaultRecord {
    pub user: NativeAuthUser,
    pub access_token: String,
    pub refresh_token: String,
    pub access_token_expires_at: String,
    pub refresh_token_expires_at: String,
    pub last_authenticated_online_at: String,
    pub active_family_slug: Option<String>,
    pub active_family_id: Option<String>,
    pub device_id: String,
    pub account_master_key_b64: String,
}

impl Drop for PersistedVaultRecord {
    fn drop(&mut self) {
        self.access_token.zeroize();
        self.refresh_token.zeroize();
        self.account_master_key_b64.zeroize();
    }
}

struct VaultKeyLen(usize);
impl ring::hkdf::KeyType for VaultKeyLen {
    fn len(&self) -> usize {
        self.0
    }
}

pub struct SessionManager {
    storage_dir: PathBuf,
    vault_file_path: PathBuf,
    device_key_path: PathBuf,
    current_state: NativeSessionState,
    vault: Option<PersistedVaultRecord>,
    connectivity_online: bool,
}

impl SessionManager {
    pub fn new(storage_dir: &Path) -> AppResult<Self> {
        let vault_dir = storage_dir.join("vault");
        std::fs::create_dir_all(&vault_dir).map_err(|e| {
            AppError::Platform(format!("Failed to create secure vault directory: {e}"))
        })?;

        let vault_file_path = vault_dir.join("session_vault.v1.enc");
        let device_key_path = vault_dir.join("device_keystore.v1.key");

        let mut manager = Self {
            storage_dir: storage_dir.to_path_buf(),
            vault_file_path,
            device_key_path,
            current_state: NativeSessionState::Unauthenticated,
            vault: None,
            connectivity_online: false,
        };

        manager.load_persisted_vault()?;
        Ok(manager)
    }

    fn load_or_create_device_wrapping_key(&self) -> AppResult<[u8; 32]> {
        if self.device_key_path.exists() {
            let raw = std::fs::read_to_string(&self.device_key_path).map_err(|e| {
                AppError::Encryption(format!("Failed to read device keystore file: {e}"))
            })?;
            let decoded = BASE64.decode(raw.trim()).map_err(|e| {
                AppError::Encryption(format!("Corrupted device keystore encoding: {e}"))
            })?;
            if decoded.len() == 32 {
                let mut key = [0u8; 32];
                key.copy_from_slice(&decoded);
                return Ok(key);
            }
        }

        let rng = SystemRandom::new();
        let mut seed = [0u8; 32];
        rng.fill(&mut seed)
            .map_err(|_| AppError::Encryption("RNG failed generating keystore seed".to_string()))?;

        let encoded = BASE64.encode(seed);
        std::fs::write(&self.device_key_path, encoded).map_err(|e| {
            AppError::Encryption(format!("Failed to persist device keystore seed: {e}"))
        })?;

        Ok(seed)
    }

    fn derive_vault_aead_key(&self) -> AppResult<LessSafeKey> {
        let seed = self.load_or_create_device_wrapping_key()?;
        let path_fingerprint = Sha256::digest(self.storage_dir.to_string_lossy().as_bytes());
        let salt = Salt::new(HKDF_SHA256, path_fingerprint.as_slice());
        let prk = salt.extract(&seed);
        let info = [b"umuryango-stronghold-vault-v1".as_slice()];
        let okm = prk
            .expand(&info, VaultKeyLen(32))
            .map_err(|_| AppError::Encryption("Vault HKDF expand failed".to_string()))?;

        let mut derived = [0u8; 32];
        okm.fill(&mut derived)
            .map_err(|_| AppError::Encryption("Vault HKDF fill failed".to_string()))?;

        let unbound = UnboundKey::new(&CHACHA20_POLY1305, &derived)
            .map_err(|_| AppError::Encryption("Invalid vault AEAD key".to_string()))?;
        derived.zeroize();
        Ok(LessSafeKey::new(unbound))
    }

    fn save_vault_record(&self, record: &PersistedVaultRecord) -> AppResult<()> {
        let key = self.derive_vault_aead_key()?;
        let rng = SystemRandom::new();
        let mut nonce_bytes = [0u8; NONCE_LEN];
        rng.fill(&mut nonce_bytes)
            .map_err(|_| AppError::Encryption("Vault nonce RNG failure".to_string()))?;

        let plaintext = serde_json::to_vec(record)
            .map_err(|e| AppError::Encryption(format!("Vault serialize error: {e}")))?;

        let mut in_out = plaintext;
        key.seal_in_place_append_tag(
            Nonce::assume_unique_for_key(nonce_bytes),
            Aad::from(b"umuryango-session-vault-v1"),
            &mut in_out,
        )
        .map_err(|_| AppError::Encryption("Vault seal failure".to_string()))?;

        let mut combined = Vec::with_capacity(NONCE_LEN + in_out.len());
        combined.extend_from_slice(&nonce_bytes);
        combined.extend_from_slice(&in_out);

        std::fs::write(&self.vault_file_path, BASE64.encode(combined)).map_err(|e| {
            AppError::Encryption(format!("Failed to write encrypted session vault: {e}"))
        })?;

        Ok(())
    }

    pub fn load_persisted_vault(&mut self) -> AppResult<()> {
        if !self.vault_file_path.exists() {
            self.vault = None;
            self.current_state = NativeSessionState::Unauthenticated;
            return Ok(());
        }

        let encoded = std::fs::read_to_string(&self.vault_file_path).map_err(|e| {
            AppError::Encryption(format!("Failed to read encrypted session vault: {e}"))
        })?;

        let combined = BASE64
            .decode(encoded.trim())
            .map_err(|e| AppError::Encryption(format!("Corrupted session vault base64: {e}")))?;

        if combined.len() < NONCE_LEN + CHACHA20_POLY1305.tag_len() {
            return Err(AppError::Encryption(
                "Encrypted session vault is truncated".to_string(),
            ));
        }

        let (nonce_slice, cipher_slice) = combined.split_at(NONCE_LEN);
        let mut nonce_bytes = [0u8; NONCE_LEN];
        nonce_bytes.copy_from_slice(nonce_slice);

        let key = self.derive_vault_aead_key()?;
        let mut in_out = cipher_slice.to_vec();
        let decrypted = key
            .open_in_place(
                Nonce::assume_unique_for_key(nonce_bytes),
                Aad::from(b"umuryango-session-vault-v1"),
                &mut in_out,
            )
            .map_err(|_| {
                AppError::Encryption(
                    "Session vault authentication tag verification failed".to_string(),
                )
            })?;

        let record: PersistedVaultRecord = serde_json::from_slice(decrypted).map_err(|e| {
            AppError::Encryption(format!("Failed to decode decrypted session vault: {e}"))
        })?;

        let within_offline_window = Self::is_within_offline_grace_window(
            &record.last_authenticated_online_at,
            &record.refresh_token_expires_at,
        );

        self.vault = Some(record);
        self.current_state = if within_offline_window {
            NativeSessionState::AuthenticatedOfflineUnlocked
        } else {
            NativeSessionState::SessionExpired
        };

        Ok(())
    }

    fn is_within_offline_grace_window(last_online_iso: &str, refresh_expires_iso: &str) -> bool {
        let now = Utc::now();
        let last_online_ok = DateTime::parse_from_rfc3339(last_online_iso)
            .map(|dt| (now - dt.with_timezone(&Utc)) <= Duration::days(OFFLINE_UNLOCK_MAX_DAYS))
            .unwrap_or(false);

        let refresh_ok = DateTime::parse_from_rfc3339(refresh_expires_iso)
            .map(|dt| dt.with_timezone(&Utc) > now)
            .unwrap_or(false);

        last_online_ok && refresh_ok
    }

    pub fn set_connectivity(&mut self, online: bool) {
        self.connectivity_online = online;
        if online
            && self.current_state == NativeSessionState::AuthenticatedOfflineUnlocked
            && self.vault.is_some()
        {
            self.current_state = NativeSessionState::AuthenticatedOnline;
        } else if !online
            && self.current_state == NativeSessionState::AuthenticatedOnline
            && self.vault.is_some()
        {
            self.current_state = NativeSessionState::AuthenticatedOfflineUnlocked;
        }
    }

    pub fn is_online(&self) -> bool {
        self.connectivity_online
    }

    pub fn mark_session_expired(&mut self) {
        self.current_state = NativeSessionState::SessionExpired;
    }

    pub fn mark_membership_revoked(&mut self) {
        self.current_state = NativeSessionState::MembershipRevoked;
    }

    pub fn current_user_id(&self) -> Option<String> {
        self.vault.as_ref().map(|v| v.user.id.clone())
    }

    pub fn device_id(&self) -> String {
        self.vault
            .as_ref()
            .map(|v| v.device_id.clone())
            .unwrap_or_else(|| Uuid::new_v4().to_string())
    }

    pub fn account_master_key(&self) -> AppResult<[u8; 32]> {
        let vault = self.vault.as_ref().ok_or_else(|| {
            AppError::Unauthenticated("No active account session in vault".to_string())
        })?;

        let decoded = BASE64
            .decode(&vault.account_master_key_b64)
            .map_err(|e| AppError::Encryption(format!("Invalid account master key: {e}")))?;

        if decoded.len() != 32 {
            return Err(AppError::Encryption(
                "Account master key has invalid length".to_string(),
            ));
        }

        let mut key = [0u8; 32];
        key.copy_from_slice(&decoded);
        Ok(key)
    }

    pub fn set_active_family(&mut self, family_slug: String, family_id: String) -> AppResult<()> {
        if let Some(ref mut v) = self.vault {
            v.active_family_slug = Some(family_slug);
            v.active_family_id = Some(family_id);
            let cloned = v.clone();
            self.save_vault_record(&cloned)?;
        }
        Ok(())
    }

    pub fn safe_summary(&self) -> SafeSessionSummary {
        match self.vault {
            Some(ref v) => SafeSessionSummary {
                state: self.current_state,
                user: Some(v.user.clone()),
                activeFamilySlug: v.active_family_slug.clone(),
                activeFamilyId: v.active_family_id.clone(),
                lastAuthenticatedOnlineAt: Some(v.last_authenticated_online_at.clone()),
                offlineUnlockAvailable: Self::is_within_offline_grace_window(
                    &v.last_authenticated_online_at,
                    &v.refresh_token_expires_at,
                ),
                connectivityOnline: self.connectivity_online,
            },
            None => SafeSessionSummary {
                state: NativeSessionState::Unauthenticated,
                user: None,
                activeFamilySlug: None,
                activeFamilyId: None,
                lastAuthenticatedOnlineAt: None,
                offlineUnlockAvailable: false,
                connectivityOnline: self.connectivity_online,
            },
        }
    }

    pub fn establish_authenticated_session(
        &mut self,
        tokens: NativeSessionTokensResponse,
        device_id: Option<String>,
    ) -> AppResult<SafeSessionSummary> {
        let now = Utc::now();
        let access_exp =
            (now + Duration::seconds(tokens.accessTokenExpiresInSeconds as i64)).to_rfc3339();
        let refresh_exp =
            (now + Duration::seconds(tokens.refreshTokenExpiresInSeconds as i64)).to_rfc3339();

        // Preserve existing account master key if signing into the same account on the same device
        let existing_master_key_b64 = self
            .vault
            .as_ref()
            .filter(|v| v.user.id == tokens.user.id)
            .map(|v| v.account_master_key_b64.clone());

        let account_master_key_b64 = match existing_master_key_b64 {
            Some(k) => k,
            None => {
                // Deterministically derive from device wrapping key + user ID so re-login after logout
                // or token expiry can still open any retained local database for the same user, while
                // remaining cryptographically isolated from any other user ID.
                let device_seed = self.load_or_create_device_wrapping_key()?;
                let salt_hash =
                    Sha256::digest(format!("umuryango-user-db-key:{}", tokens.user.id).as_bytes());
                let salt = Salt::new(HKDF_SHA256, salt_hash.as_slice());
                let prk = salt.extract(&device_seed);
                let info = [b"umuryango-account-master-v1".as_slice()];
                let okm = prk
                    .expand(&info, VaultKeyLen(32))
                    .map_err(|_| AppError::Encryption("Master key HKDF failed".to_string()))?;
                let mut key = [0u8; 32];
                okm.fill(&mut key)
                    .map_err(|_| AppError::Encryption("Master key fill failed".to_string()))?;
                BASE64.encode(key)
            }
        };

        let preserved_slug = self
            .vault
            .as_ref()
            .filter(|v| v.user.id == tokens.user.id)
            .and_then(|v| v.active_family_slug.clone());
        let preserved_id = self
            .vault
            .as_ref()
            .filter(|v| v.user.id == tokens.user.id)
            .and_then(|v| v.active_family_id.clone());

        let record = PersistedVaultRecord {
            user: tokens.user,
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
            access_token_expires_at: access_exp,
            refresh_token_expires_at: refresh_exp,
            last_authenticated_online_at: now.to_rfc3339(),
            active_family_slug: preserved_slug,
            active_family_id: preserved_id,
            device_id: device_id.unwrap_or_else(|| self.device_id()),
            account_master_key_b64,
        };

        self.save_vault_record(&record)?;
        self.vault = Some(record);
        self.connectivity_online = true;
        self.current_state = NativeSessionState::AuthenticatedOnline;

        Ok(self.safe_summary())
    }

    pub fn unlock_offline_session(&mut self) -> AppResult<SafeSessionSummary> {
        let vault = self.vault.as_ref().ok_or_else(|| {
            AppError::Unauthenticated(
                "No cached native session found on this device. Connect to the internet to sign in first."
                    .to_string(),
            )
        })?;

        if !Self::is_within_offline_grace_window(
            &vault.last_authenticated_online_at,
            &vault.refresh_token_expires_at,
        ) {
            self.current_state = NativeSessionState::SessionExpired;
            return Err(AppError::SessionExpired(
                "Offline session grace period has expired. Please reconnect and sign in again."
                    .to_string(),
            ));
        }

        self.current_state = if self.connectivity_online {
            NativeSessionState::AuthenticatedOnline
        } else {
            NativeSessionState::AuthenticatedOfflineUnlocked
        };

        Ok(self.safe_summary())
    }

    pub async fn valid_access_token(&mut self, api: &NativeApiClient) -> AppResult<String> {
        let (access_token, refresh_token, device_id, needs_refresh) = {
            let vault = self.vault.as_ref().ok_or_else(|| {
                AppError::Unauthenticated("Sign in is required to contact the server.".to_string())
            })?;

            let now = Utc::now();
            let needs_refresh = DateTime::parse_from_rfc3339(&vault.access_token_expires_at)
                .map(|dt| dt.with_timezone(&Utc) <= (now + Duration::seconds(45)))
                .unwrap_or(true);

            (
                vault.access_token.clone(),
                vault.refresh_token.clone(),
                vault.device_id.clone(),
                needs_refresh,
            )
        };

        if !needs_refresh {
            return Ok(access_token);
        }

        match api
            .refresh_tokens(&NativeRefreshPayload {
                refreshToken: refresh_token,
                deviceId: device_id.clone(),
            })
            .await
        {
            Ok(rotated) => {
                self.establish_authenticated_session(rotated.clone(), Some(device_id))?;
                Ok(rotated.accessToken)
            }
            Err(AppError::SessionExpired(msg)) => {
                self.current_state = NativeSessionState::SessionExpired;
                Err(AppError::SessionExpired(msg))
            }
            Err(err) => Err(err),
        }
    }

    pub async fn sign_in_online(
        &mut self,
        api: &NativeApiClient,
        identifier: &str,
        password: &str,
        device_name: &str,
        platform: &str,
    ) -> AppResult<SafeSessionSummary> {
        let device_id = self.device_id();
        let tokens = api
            .login(&NativeLoginPayload {
                identifier: identifier.trim().to_string(),
                password: password.to_string(),
                deviceId: device_id.clone(),
                deviceName: device_name.to_string(),
                platform: platform.to_string(),
            })
            .await?;

        self.establish_authenticated_session(tokens, Some(device_id))
    }

    pub async fn sign_out(
        &mut self,
        api: &NativeApiClient,
        wipe_local_cache: bool,
    ) -> AppResult<SafeSessionSummary> {
        let existing_vault = self.vault.take();

        if let Some(ref v) = existing_vault {
            let _ = api
                .logout(Some(&v.access_token), Some(&v.refresh_token), &v.device_id)
                .await;

            if wipe_local_cache {
                let folder_name = AccountCipher::account_storage_folder_name(&v.user.id);
                let account_dir = self.storage_dir.join("accounts").join(folder_name);
                if account_dir.exists() {
                    let _ = std::fs::remove_dir_all(&account_dir);
                }
            }
        }

        if self.vault_file_path.exists() {
            let _ = std::fs::remove_file(&self.vault_file_path);
        }

        self.current_state = NativeSessionState::Unauthenticated;
        Ok(self.safe_summary())
    }
}
