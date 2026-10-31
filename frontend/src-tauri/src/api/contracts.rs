use crate::error::{AppError, AppResult};
use serde::{Deserialize, Serialize};

pub const SYNC_CONTRACTS_VERSION: &str = "1.0.0";
pub const NATIVE_CLIENT_HEADER_NAME: &str = "x-umuryango-client";
pub const NATIVE_CLIENT_HEADER_VALUE: &str = "tauri-native";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SyncStatus {
    Synced,
    LocalPending,
    Syncing,
    Conflict,
    Rejected,
    FailedRetryable,
}

impl SyncStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            SyncStatus::Synced => "SYNCED",
            SyncStatus::LocalPending => "LOCAL_PENDING",
            SyncStatus::Syncing => "SYNCING",
            SyncStatus::Conflict => "CONFLICT",
            SyncStatus::Rejected => "REJECTED",
            SyncStatus::FailedRetryable => "FAILED_RETRYABLE",
        }
    }

    pub fn from_db_str(value: &str) -> Self {
        match value {
            "SYNCED" => SyncStatus::Synced,
            "LOCAL_PENDING" => SyncStatus::LocalPending,
            "SYNCING" => SyncStatus::Syncing,
            "CONFLICT" => SyncStatus::Conflict,
            "REJECTED" => SyncStatus::Rejected,
            "FAILED_RETRYABLE" => SyncStatus::FailedRetryable,
            _ => SyncStatus::LocalPending,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SyncRecordType {
    FamilyProfile,
    FamilyMembership,
    FinanceCategory,
    MoneyTransaction,
    FamilyReceipt,
    ContributionGroup,
    ContributionMember,
    ContributionPayment,
    FamilyProject,
    ProjectBudgetLine,
    ProjectMilestone,
    FamilyContact,
    NotificationItem,
}

impl SyncRecordType {
    pub fn as_str(&self) -> &'static str {
        match self {
            SyncRecordType::FamilyProfile => "FAMILY_PROFILE",
            SyncRecordType::FamilyMembership => "FAMILY_MEMBERSHIP",
            SyncRecordType::FinanceCategory => "FINANCE_CATEGORY",
            SyncRecordType::MoneyTransaction => "MONEY_TRANSACTION",
            SyncRecordType::FamilyReceipt => "FAMILY_RECEIPT",
            SyncRecordType::ContributionGroup => "CONTRIBUTION_GROUP",
            SyncRecordType::ContributionMember => "CONTRIBUTION_MEMBER",
            SyncRecordType::ContributionPayment => "CONTRIBUTION_PAYMENT",
            SyncRecordType::FamilyProject => "FAMILY_PROJECT",
            SyncRecordType::ProjectBudgetLine => "PROJECT_BUDGET_LINE",
            SyncRecordType::ProjectMilestone => "PROJECT_MILESTONE",
            SyncRecordType::FamilyContact => "FAMILY_CONTACT",
            SyncRecordType::NotificationItem => "NOTIFICATION_ITEM",
        }
    }

    pub fn from_db_str(value: &str) -> Option<Self> {
        match value {
            "FAMILY_PROFILE" => Some(SyncRecordType::FamilyProfile),
            "FAMILY_MEMBERSHIP" => Some(SyncRecordType::FamilyMembership),
            "FINANCE_CATEGORY" => Some(SyncRecordType::FinanceCategory),
            "MONEY_TRANSACTION" => Some(SyncRecordType::MoneyTransaction),
            "FAMILY_RECEIPT" => Some(SyncRecordType::FamilyReceipt),
            "CONTRIBUTION_GROUP" => Some(SyncRecordType::ContributionGroup),
            "CONTRIBUTION_MEMBER" => Some(SyncRecordType::ContributionMember),
            "CONTRIBUTION_PAYMENT" => Some(SyncRecordType::ContributionPayment),
            "FAMILY_PROJECT" => Some(SyncRecordType::FamilyProject),
            "PROJECT_BUDGET_LINE" => Some(SyncRecordType::ProjectBudgetLine),
            "PROJECT_MILESTONE" => Some(SyncRecordType::ProjectMilestone),
            "FAMILY_CONTACT" => Some(SyncRecordType::FamilyContact),
            "NOTIFICATION_ITEM" => Some(SyncRecordType::NotificationItem),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SyncCommandType {
    CreateIncome,
    CreateExpense,
    UpdateTransactionNotes,
    AttachReceipt,
    CreateContributionPayment,
    CreateProject,
    CreateProjectMilestone,
    CreateContact,
    UpdateContact,
    MarkNotificationRead,
}

impl SyncCommandType {
    pub fn as_str(&self) -> &'static str {
        match self {
            SyncCommandType::CreateIncome => "CREATE_INCOME",
            SyncCommandType::CreateExpense => "CREATE_EXPENSE",
            SyncCommandType::UpdateTransactionNotes => "UPDATE_TRANSACTION_NOTES",
            SyncCommandType::AttachReceipt => "ATTACH_RECEIPT",
            SyncCommandType::CreateContributionPayment => "CREATE_CONTRIBUTION_PAYMENT",
            SyncCommandType::CreateProject => "CREATE_PROJECT",
            SyncCommandType::CreateProjectMilestone => "CREATE_PROJECT_MILESTONE",
            SyncCommandType::CreateContact => "CREATE_CONTACT",
            SyncCommandType::UpdateContact => "UPDATE_CONTACT",
            SyncCommandType::MarkNotificationRead => "MARK_NOTIFICATION_READ",
        }
    }

    pub fn from_db_str(value: &str) -> Option<Self> {
        match value {
            "CREATE_INCOME" => Some(SyncCommandType::CreateIncome),
            "CREATE_EXPENSE" => Some(SyncCommandType::CreateExpense),
            "UPDATE_TRANSACTION_NOTES" => Some(SyncCommandType::UpdateTransactionNotes),
            "ATTACH_RECEIPT" => Some(SyncCommandType::AttachReceipt),
            "CREATE_CONTRIBUTION_PAYMENT" => Some(SyncCommandType::CreateContributionPayment),
            "CREATE_PROJECT" => Some(SyncCommandType::CreateProject),
            "CREATE_PROJECT_MILESTONE" => Some(SyncCommandType::CreateProjectMilestone),
            "CREATE_CONTACT" => Some(SyncCommandType::CreateContact),
            "UPDATE_CONTACT" => Some(SyncCommandType::UpdateContact),
            "MARK_NOTIFICATION_READ" => Some(SyncCommandType::MarkNotificationRead),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SyncCommandOutcome {
    Applied,
    DuplicateIgnored,
    Conflict,
    Rejected,
    FailedRetryable,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum NativeSessionState {
    Unauthenticated,
    AuthenticatedOnline,
    AuthenticatedOfflineUnlocked,
    SessionExpired,
    MembershipRevoked,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiEnvelope<T> {
    pub data: T,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeAuthUser {
    pub id: String,
    pub email: String,
    pub name: String,
    pub phone: Option<String>,
    pub mfaEnabled: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeSessionTokensResponse {
    pub user: NativeAuthUser,
    pub accessToken: String,
    pub refreshToken: String,
    pub accessTokenExpiresInSeconds: u64,
    pub refreshTokenExpiresInSeconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SafeSessionSummary {
    pub state: NativeSessionState,
    pub user: Option<NativeAuthUser>,
    pub activeFamilySlug: Option<String>,
    pub activeFamilyId: Option<String>,
    pub lastAuthenticatedOnlineAt: Option<String>,
    pub offlineUnlockAvailable: bool,
    pub connectivityOnline: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncRecordEnvelope {
    pub recordType: SyncRecordType,
    pub serverId: String,
    pub familyId: String,
    pub version: String,
    pub createdAt: String,
    pub updatedAt: String,
    pub deletedAt: Option<String>,
    pub createdById: Option<String>,
    pub payload: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncTombstoneRecord {
    pub recordType: SyncRecordType,
    pub serverId: String,
    pub familyId: String,
    pub deletedAt: String,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncAuthoritativeTotals {
    pub currency: String,
    pub serverApprovedIncomeMinorUnits: String,
    pub serverApprovedExpenseMinorUnits: String,
    pub serverNetBalanceMinorUnits: String,
    pub serverPendingApprovalExpenseMinorUnits: String,
    pub computedAt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncPullMemberSummary {
    pub memberId: String,
    pub userId: String,
    pub role: String,
    pub permissions: Vec<String>,
    pub isActive: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncPullResponse {
    pub contractVersion: String,
    pub familyId: String,
    pub familySlug: String,
    pub serverTimestamp: String,
    pub nextCursor: String,
    pub hasMore: bool,
    pub membership: SyncPullMemberSummary,
    pub authoritativeTotals: SyncAuthoritativeTotals,
    pub records: Vec<SyncRecordEnvelope>,
    pub tombstones: Vec<SyncTombstoneRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncPushCommandItem {
    pub commandId: String,
    pub idempotencyKey: String,
    pub familyId: String,
    pub commandType: SyncCommandType,
    pub localRecordId: String,
    pub targetServerId: Option<String>,
    pub parentCommandId: Option<String>,
    pub baseVersion: Option<String>,
    pub clientCreatedAt: String,
    pub payload: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncPushRequest {
    pub contractVersion: String,
    pub deviceId: String,
    pub commands: Vec<SyncPushCommandItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncPushCommandResult {
    pub commandId: String,
    pub idempotencyKey: String,
    pub localRecordId: String,
    pub outcome: SyncCommandOutcome,
    pub serverRecord: Option<SyncRecordEnvelope>,
    pub conflictCode: Option<String>,
    pub errorMessage: Option<String>,
    pub serverSnapshot: Option<serde_json::Value>,
    pub processedAt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncPushResponse {
    pub contractVersion: String,
    pub familyId: String,
    pub familySlug: String,
    pub serverTimestamp: String,
    pub authoritativeTotals: SyncAuthoritativeTotals,
    pub results: Vec<SyncPushCommandResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedFamilyView {
    pub familyId: String,
    pub slug: String,
    pub name: String,
    pub currency: String,
    pub role: String,
    pub permissions: Vec<String>,
    pub isActiveMember: bool,
    pub lastSyncedAt: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedTransactionView {
    pub localId: String,
    pub serverId: Option<String>,
    pub familyId: String,
    pub categoryId: String,
    pub categoryName: String,
    pub direction: String,
    pub status: String,
    pub amountMinorUnits: String,
    pub currency: String,
    pub description: String,
    pub notes: Option<String>,
    pub transactionDate: String,
    pub syncStatus: SyncStatus,
    pub lastSyncError: Option<String>,
    pub conflictCode: Option<String>,
    pub updatedAt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedCategoryView {
    pub serverId: String,
    pub familyId: String,
    pub name: String,
    pub code: String,
    pub direction: String,
    pub isActive: bool,
    pub requiresReceiptAboveMinorUnits: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OutboxCommandView {
    pub commandId: String,
    pub idempotencyKey: String,
    pub familyId: String,
    pub commandType: SyncCommandType,
    pub localRecordId: String,
    pub targetServerId: Option<String>,
    pub parentCommandId: Option<String>,
    pub syncStatus: SyncStatus,
    pub retryCount: i64,
    pub nextRetryAt: Option<String>,
    pub lastError: Option<String>,
    pub conflictCode: Option<String>,
    pub serverSnapshot: Option<serde_json::Value>,
    pub createdAt: String,
    pub updatedAt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeDashboardView {
    pub family: CachedFamilyView,
    pub currency: String,
    pub serverApprovedIncomeMinorUnits: String,
    pub serverApprovedExpenseMinorUnits: String,
    pub serverNetBalanceMinorUnits: String,
    pub serverPendingApprovalExpenseMinorUnits: String,
    pub localPendingIncomeMinorUnits: String,
    pub localPendingExpenseMinorUnits: String,
    pub pendingOutboxCount: i64,
    pub conflictCount: i64,
    pub failedRetryableCount: i64,
    pub rejectedCount: i64,
    pub lastSyncedAt: Option<String>,
    pub categories: Vec<CachedCategoryView>,
    pub recentTransactions: Vec<CachedTransactionView>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncStatusSummary {
    pub familyId: String,
    pub familySlug: String,
    pub connectivityOnline: bool,
    pub isSyncing: bool,
    pub lastSyncedAt: Option<String>,
    pub lastCursor: Option<String>,
    pub pendingCount: i64,
    pub syncingCount: i64,
    pub conflictCount: i64,
    pub rejectedCount: i64,
    pub failedRetryableCount: i64,
    pub outboxItems: Vec<OutboxCommandView>,
}

pub fn parse_minor_units(amount_str: &str) -> AppResult<i128> {
    let trimmed = amount_str.trim();
    if trimmed.is_empty() {
        return Err(AppError::Validation(
            "Amount in minor units cannot be empty.".to_string(),
        ));
    }
    trimmed.parse::<i128>().map_err(|_| {
        AppError::Validation(format!(
            "Invalid integer minor-unit amount '{}'. Floating point is not permitted.",
            amount_str
        ))
    })
}

pub fn validate_positive_minor_units(amount_str: &str) -> AppResult<String> {
    let parsed = parse_minor_units(amount_str)?;
    if parsed <= 0 {
        return Err(AppError::Validation(
            "Amount in minor units must be a positive integer greater than zero.".to_string(),
        ));
    }
    Ok(parsed.to_string())
}

pub fn sum_minor_unit_strings<'a, I>(values: I) -> AppResult<String>
where
    I: IntoIterator<Item = &'a str>,
{
    let mut acc: i128 = 0;
    for raw in values {
        let val = parse_minor_units(raw)?;
        acc = acc
            .checked_add(val)
            .ok_or_else(|| AppError::Validation("Minor-unit sum overflow".to_string()))?;
    }
    Ok(acc.to_string())
}
