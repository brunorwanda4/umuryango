import contractSpec from "./sync-contracts.v1.json";

export const SYNC_CONTRACT_VERSION = contractSpec.version;
export const SYNC_CONTRACTS_VERSION = contractSpec.version;
export const NATIVE_CLIENT_HEADER = contractSpec.clientHeader.name;
export const NATIVE_CLIENT_HEADER_NAME = contractSpec.clientHeader.name;
export const NATIVE_CLIENT_IDENTIFIER = contractSpec.clientHeader.nativeValue;
export const NATIVE_CLIENT_HEADER_VALUE = contractSpec.clientHeader.nativeValue;

export const SYNC_STATUSES = [
  "SYNCED",
  "LOCAL_PENDING",
  "SYNCING",
  "CONFLICT",
  "REJECTED",
  "FAILED_RETRYABLE",
] as const;
export type SyncStatus = (typeof SYNC_STATUSES)[number];

export const SYNC_RECORD_TYPES = [
  "FAMILY",
  "MEMBER",
  "CATEGORY",
  "TRANSACTION",
  "RECEIPT",
  "CONTRIBUTION_PLAN",
  "CONTRIBUTION_CYCLE",
  "CONTRIBUTION_PAYMENT",
  "PROJECT",
  "CONTACT",
  "NOTIFICATION",
] as const;
export type SyncRecordType = (typeof SYNC_RECORD_TYPES)[number];

export const SYNC_COMMAND_TYPES = [
  "CREATE_EXPENSE",
  "CREATE_INCOME",
  "CREATE_PERSONAL_TRANSACTION",
  "UPDATE_TRANSACTION_NOTES",
  "RECORD_CONTRIBUTION_PAYMENT",
  "CREATE_CONTRIBUTION_PAYMENT",
  "CREATE_PROJECT",
  "CREATE_PROJECT_MILESTONE",
  "CREATE_CONTACT",
  "UPDATE_CONTACT",
  "ATTACH_RECEIPT",
  "MARK_NOTIFICATION_READ",
] as const;
export type SyncCommandType = (typeof SYNC_COMMAND_TYPES)[number];

export const SYNC_COMMAND_OUTCOMES = [
  "APPLIED",
  "DUPLICATE_IGNORED",
  "CONFLICT",
  "REJECTED",
  "FAILED_RETRYABLE",
] as const;
export type SyncCommandOutcome = (typeof SYNC_COMMAND_OUTCOMES)[number];

export const SYNC_CONFLICT_CODES = [
  "VERSION_CONFLICT",
  "APPROVAL_STATE_CONFLICT",
  "PERMISSION_DENIED",
  "MEMBERSHIP_REVOKED",
  "CATEGORY_INACTIVE",
  "IDEMPOTENCY_KEY_REUSED",
  "TARGET_NOT_FOUND",
  "PARENT_COMMAND_FAILED",
  "ATTACHMENT_CHECKSUM_MISMATCH",
  "VALIDATION_FAILED",
] as const;
export type SyncConflictCode = (typeof SYNC_CONFLICT_CODES)[number];
export type ConflictCode = SyncConflictCode;

export const SYNC_CONFLICT_RESOLUTIONS = [
  "ACCEPT_SERVER",
  "DISCARD_LOCAL",
  "RETRY_AS_NEW_NOTES",
] as const;
export type SyncConflictResolution = (typeof SYNC_CONFLICT_RESOLUTIONS)[number];

export const CONNECTIVITY_STATES = ["ONLINE", "OFFLINE", "DEGRADED"] as const;
export type ConnectivityState = (typeof CONNECTIVITY_STATES)[number];

export type NativeSessionState =
  | "UNAUTHENTICATED"
  | "AUTHENTICATED_ONLINE"
  | "AUTHENTICATED_OFFLINE_UNLOCKED"
  | "SESSION_EXPIRED"
  | "MEMBERSHIP_REVOKED";

export interface NativeAuthUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  mfaEnabled: boolean;
}

export interface SafeSessionSummary {
  state: NativeSessionState;
  user: NativeAuthUser | null;
  activeFamilySlug: string | null;
  activeFamilyId: string | null;
  lastAuthenticatedOnlineAt: string | null;
  offlineUnlockAvailable: boolean;
  connectivityOnline: boolean;
}

export interface SyncAuthoritativeTotals {
  currency: string;
  serverApprovedIncomeMinorUnits: string;
  serverApprovedExpenseMinorUnits: string;
  serverNetBalanceMinorUnits: string;
  serverPendingApprovalExpenseMinorUnits: string;
  computedAt: string;
}

export interface SyncPushCommandPayload {
  idempotencyKey: string;
  localRecordId: string;
  commandType: SyncCommandType;
  dependsOnLocalId?: string | null;
  baseVersion?: string | null;
  clientCreatedAt: string;
  payload: Record<string, unknown>;
}

export interface SyncPushRequestContract {
  contractVersion: string;
  deviceId: string;
  commands: SyncPushCommandPayload[];
}

export interface SyncPushCommandResultContract {
  idempotencyKey: string;
  localRecordId: string;
  commandType: SyncCommandType;
  outcome: SyncCommandOutcome;
  serverRecordId?: string | null;
  serverVersion?: string | null;
  conflictCode?: SyncConflictCode | null;
  message: string;
  serverRecord?: Record<string, unknown> | null;
}

export interface SyncPushResponseContract {
  contractVersion: string;
  familyId: string;
  familySlug: string;
  serverTimestamp: string;
  results: SyncPushCommandResultContract[];
}

export interface SyncTombstoneContract {
  recordType: SyncRecordType;
  serverId: string;
  familyId: string;
  deletedAt: string;
  reason: string;
}

export interface SyncPullEntityContract {
  recordType: SyncRecordType;
  serverId: string;
  familyId: string;
  serverVersion: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  createdById?: string | null;
  data: Record<string, unknown>;
}

export interface SyncPullResponseContract {
  contractVersion: string;
  familyId: string;
  familySlug: string;
  serverTimestamp: string;
  nextCursor: string;
  hasMore: boolean;
  membership: {
    memberId: string;
    userId: string;
    authority: string;
    capabilities: string[];
    removedAt?: string | null;
  };
  entities: SyncPullEntityContract[];
  tombstones: SyncTombstoneContract[];
}

export function isValidMinorUnitsString(value: unknown): value is string {
  return typeof value === "string" && /^\d+$/.test(value);
}

export function parseMinorUnitsToBigInt(value: string): bigint {
  const trimmed = value.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    throw new Error(
      `Invalid integer minor-unit amount '${value}'. Floating point is not permitted.`,
    );
  }
  return BigInt(trimmed);
}

export function formatMinorUnits(
  amountMinorUnits: string,
  currency = "RWF",
): string {
  const parsed = parseMinorUnitsToBigInt(amountMinorUnits);
  const formatted = parsed.toLocaleString("en-US");
  return `${currency} ${formatted}`;
}
