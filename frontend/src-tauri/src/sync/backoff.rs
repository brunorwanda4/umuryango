use chrono::{DateTime, Duration, Utc};
use ring::rand::{SecureRandom, SystemRandom};

pub const BASE_DELAY_MS: u64 = 2_000;
pub const MAX_DELAY_MS: u64 = 300_000; // 5 minutes cap
pub const MAX_JITTER_MS: u64 = 1_000;

pub fn calculate_backoff_delay_ms(retry_count: u32, jitter_seed: Option<u64>) -> u64 {
    let shift = retry_count.min(10);
    let exponential = BASE_DELAY_MS.saturating_mul(1_u64 << shift);
    let capped = exponential.min(MAX_DELAY_MS);

    let jitter = match jitter_seed {
        Some(seed) => seed % (MAX_JITTER_MS + 1),
        None => {
            let rng = SystemRandom::new();
            let mut buf = [0u8; 8];
            if rng.fill(&mut buf).is_ok() {
                u64::from_le_bytes(buf) % (MAX_JITTER_MS + 1)
            } else {
                250
            }
        }
    };

    (capped + jitter).min(MAX_DELAY_MS + MAX_JITTER_MS)
}

pub fn compute_next_retry_iso_from(
    now: DateTime<Utc>,
    retry_count: i64,
    jitter_seed: Option<u64>,
) -> String {
    let count = if retry_count < 0 {
        0_u32
    } else {
        retry_count as u32
    };
    let delay_ms = calculate_backoff_delay_ms(count, jitter_seed);
    (now + Duration::milliseconds(delay_ms as i64)).to_rfc3339()
}

pub fn compute_next_retry_iso(retry_count: i64) -> String {
    compute_next_retry_iso_from(Utc::now(), retry_count, None)
}
