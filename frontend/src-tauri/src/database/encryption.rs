use crate::error::{AppError, AppResult};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use ring::aead::{Aad, LessSafeKey, Nonce, UnboundKey, CHACHA20_POLY1305, NONCE_LEN};
use ring::hkdf::{Salt, HKDF_SHA256};
use ring::rand::{SecureRandom, SystemRandom};
use sha2::{Digest, Sha256};
use zeroize::Zeroize;

pub struct AccountCipher {
    account_id: String,
    key_bytes: [u8; 32],
    rng: SystemRandom,
}

impl Drop for AccountCipher {
    fn drop(&mut self) {
        self.key_bytes.zeroize();
    }
}

struct HkdfKeyLen(usize);
impl ring::hkdf::KeyType for HkdfKeyLen {
    fn len(&self) -> usize {
        self.0
    }
}

impl AccountCipher {
    pub fn derive(master_key: &[u8; 32], account_id: &str) -> AppResult<Self> {
        let salt_digest =
            Sha256::digest(format!("umuryango-account-salt:v1:{account_id}").as_bytes());
        let salt = Salt::new(HKDF_SHA256, salt_digest.as_slice());
        let prk = salt.extract(master_key);
        let info = [b"umuryango-sqlite-aead-v1".as_slice()];
        let okm = prk
            .expand(&info, HkdfKeyLen(32))
            .map_err(|_| AppError::Encryption("HKDF expand failed".to_string()))?;

        let mut derived = [0u8; 32];
        okm.fill(&mut derived)
            .map_err(|_| AppError::Encryption("HKDF fill failed".to_string()))?;

        Ok(Self {
            account_id: account_id.to_string(),
            key_bytes: derived,
            rng: SystemRandom::new(),
        })
    }

    pub fn account_id(&self) -> &str {
        &self.account_id
    }

    pub fn account_storage_folder_name(account_id: &str) -> String {
        let digest = Sha256::digest(format!("umuryango-account-dir:{account_id}").as_bytes());
        hex::encode(digest)
    }

    fn build_aad(&self, family_id: &str, context: &str, record_id: &str) -> Vec<u8> {
        format!(
            "v1|acct={}|fam={}|ctx={}|rec={}",
            self.account_id, family_id, context, record_id
        )
        .into_bytes()
    }

    pub fn encrypt_json(
        &self,
        family_id: &str,
        context: &str,
        record_id: &str,
        value: &serde_json::Value,
    ) -> AppResult<String> {
        let plaintext = serde_json::to_vec(value)
            .map_err(|e| AppError::Encryption(format!("Failed to serialize payload: {e}")))?;
        self.encrypt_bytes(family_id, context, record_id, &plaintext)
    }

    pub fn decrypt_json(
        &self,
        family_id: &str,
        context: &str,
        record_id: &str,
        ciphertext_b64: &str,
    ) -> AppResult<serde_json::Value> {
        let plaintext = self.decrypt_bytes(family_id, context, record_id, ciphertext_b64)?;
        serde_json::from_slice(&plaintext)
            .map_err(|e| AppError::Encryption(format!("Failed to deserialize decrypted JSON: {e}")))
    }

    pub fn encrypt_bytes(
        &self,
        family_id: &str,
        context: &str,
        record_id: &str,
        plaintext: &[u8],
    ) -> AppResult<String> {
        let unbound = UnboundKey::new(&CHACHA20_POLY1305, &self.key_bytes)
            .map_err(|_| AppError::Encryption("Invalid AEAD key".to_string()))?;
        let key = LessSafeKey::new(unbound);

        let mut nonce_bytes = [0u8; NONCE_LEN];
        self.rng
            .fill(&mut nonce_bytes)
            .map_err(|_| AppError::Encryption("RNG failure generating AEAD nonce".to_string()))?;

        let nonce = Nonce::assume_unique_for_key(nonce_bytes);
        let aad_bytes = self.build_aad(family_id, context, record_id);

        let mut in_out = plaintext.to_vec();
        key.seal_in_place_append_tag(nonce, Aad::from(&aad_bytes), &mut in_out)
            .map_err(|_| AppError::Encryption("AEAD seal failed".to_string()))?;

        let mut combined = Vec::with_capacity(NONCE_LEN + in_out.len());
        combined.extend_from_slice(&nonce_bytes);
        combined.extend_from_slice(&in_out);

        Ok(BASE64.encode(combined))
    }

    pub fn decrypt_bytes(
        &self,
        family_id: &str,
        context: &str,
        record_id: &str,
        ciphertext_b64: &str,
    ) -> AppResult<Vec<u8>> {
        let combined = BASE64
            .decode(ciphertext_b64)
            .map_err(|e| AppError::Encryption(format!("Invalid base64 ciphertext: {e}")))?;

        if combined.len() < NONCE_LEN + CHACHA20_POLY1305.tag_len() {
            return Err(AppError::Encryption(
                "Ciphertext shorter than minimum nonce + tag length".to_string(),
            ));
        }

        let (nonce_slice, encrypted_slice) = combined.split_at(NONCE_LEN);
        let mut nonce_bytes = [0u8; NONCE_LEN];
        nonce_bytes.copy_from_slice(nonce_slice);

        let unbound = UnboundKey::new(&CHACHA20_POLY1305, &self.key_bytes)
            .map_err(|_| AppError::Encryption("Invalid AEAD key".to_string()))?;
        let key = LessSafeKey::new(unbound);

        let aad_bytes = self.build_aad(family_id, context, record_id);
        let mut in_out = encrypted_slice.to_vec();

        let decrypted = key
            .open_in_place(
                Nonce::assume_unique_for_key(nonce_bytes),
                Aad::from(&aad_bytes),
                &mut in_out,
            )
            .map_err(|_| {
                AppError::Encryption(
                    "AEAD authentication failed (wrong account key, tampered ciphertext, or mismatched family/record AAD)"
                        .to_string(),
                )
            })?;

        Ok(decrypted.to_vec())
    }
}
