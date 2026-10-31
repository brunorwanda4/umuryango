export type {
  ConflictCode,
  NativeAuthUser,
  NativeSessionState,
  SafeSessionSummary,
  SyncAuthoritativeTotals,
  SyncCommandOutcome,
  SyncCommandType,
  SyncRecordType,
  SyncStatus,
} from "../../../../contracts/index";

export {
  formatMinorUnits,
  NATIVE_CLIENT_HEADER_NAME,
  NATIVE_CLIENT_HEADER_VALUE,
  parseMinorUnitsToBigInt,
  SYNC_CONTRACTS_VERSION,
} from "../../../../contracts/index";

import type {
  SafeSessionSummary,
  SyncCommandType,
  SyncStatus,
} from "../../../../contracts/index";

export type ConflictResolutionStrategy =
  | "ACCEPT_SERVER"
  | "DISCARD_LOCAL"
  | "RETRY_AS_NEW_NOTES";

export type NotificationPermissionState =
  | "GRANTED"
  | "DENIED"
  | "PROMPT_REQUIRED";

export interface PlatformEnvironmentInfo {
  appIdentifier: string;
  displayName: string;
  osPlatform: string;
  defaultApiBaseUrl: string;
  supportsAndroidBackHandler: boolean;
  supportsHighDpiScaling: boolean;
}

export interface CachedFamilyView {
  familyId: string;
  slug: string;
  name: string;
  currency: string;
  role: string;
  permissions: string[];
  isActiveMember: boolean;
  lastSyncedAt: string | null;
}

export interface CachedCategoryView {
  serverId: string;
  familyId: string;
  name: string;
  code: string;
  direction: string;
  isActive: boolean;
  requiresReceiptAboveMinorUnits: string | null;
}

export interface CachedTransactionView {
  localId: string;
  serverId: string | null;
  familyId: string;
  categoryId: string;
  categoryName: string;
  direction: string;
  status: string;
  amountMinorUnits: string;
  currency: string;
  description: string;
  notes: string | null;
  transactionDate: string;
  syncStatus: SyncStatus;
  lastSyncError: string | null;
  conflictCode: string | null;
  updatedAt: string;
}

export interface OutboxCommandView {
  commandId: string;
  idempotencyKey: string;
  familyId: string;
  commandType: SyncCommandType;
  localRecordId: string;
  targetServerId: string | null;
  parentCommandId: string | null;
  syncStatus: SyncStatus;
  retryCount: number;
  nextRetryAt: string | null;
  lastError: string | null;
  conflictCode: string | null;
  serverSnapshot: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface NativeDashboardView {
  family: CachedFamilyView;
  currency: string;
  serverApprovedIncomeMinorUnits: string;
  serverApprovedExpenseMinorUnits: string;
  serverNetBalanceMinorUnits: string;
  serverPendingApprovalExpenseMinorUnits: string;
  localPendingIncomeMinorUnits: string;
  localPendingExpenseMinorUnits: string;
  pendingOutboxCount: number;
  conflictCount: number;
  failedRetryableCount: number;
  rejectedCount: number;
  lastSyncedAt: string | null;
  categories: CachedCategoryView[];
  recentTransactions: CachedTransactionView[];
}

export interface SyncStatusSummary {
  familyId: string;
  familySlug: string;
  connectivityOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  lastCursor: string | null;
  pendingCount: number;
  syncingCount: number;
  conflictCount: number;
  rejectedCount: number;
  failedRetryableCount: number;
  outboxItems: OutboxCommandView[];
}

export interface InitializeAppResponse {
  platform: PlatformEnvironmentInfo;
  session: SafeSessionSummary;
  families: CachedFamilyView[];
}

export interface StagedReceiptMetadata {
  attachmentId: string;
  familyId: string;
  localTransactionId: string;
  commandId: string;
  idempotencyKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256Checksum: string;
  syncStatus: SyncStatus;
  createdAt: string;
}

export interface ParsedDeepLink {
  rawUrl: string;
  familySlug: string | null;
  section: string;
  recordId: string | null;
}
