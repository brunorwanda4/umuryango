import type {
  CachedFamilyView,
  ConflictResolutionStrategy,
  InitializeAppResponse,
  NativeDashboardView,
  NotificationPermissionState,
  OutboxCommandView,
  ParsedDeepLink,
  SafeSessionSummary,
  StagedReceiptMetadata,
  SyncStatusSummary,
} from "../types/contracts";

export type TauriInvokeFn = <T>(
  cmd: string,
  args?: Record<string, unknown>,
) => Promise<T>;

let customInvokeHandler: TauriInvokeFn | null = null;

export function setTauriInvokeHandlerForTests(
  handler: TauriInvokeFn | null,
): void {
  customInvokeHandler = handler;
}

async function invokeRustCommand<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  if (customInvokeHandler) {
    return customInvokeHandler<T>(command, args);
  }

  const globalWindow = typeof window !== "undefined" ? (window as unknown as Record<string, unknown>) : {};
  const internals = globalWindow.__TAURI_INTERNALS__ as
    | { invoke?: TauriInvokeFn }
    | undefined;

  if (internals && typeof internals.invoke === "function") {
    return internals.invoke<T>(command, args);
  }

  throw new Error(
    `Native Tauri IPC bridge is required to execute '${command}'. Direct browser HTTP fallback from the native client is prohibited.`,
  );
}

export const nativeTauriClient = {
  initializeApp(): Promise<InitializeAppResponse> {
    return invokeRustCommand<InitializeAppResponse>("initialize_native_app");
  },

  getSessionState(): Promise<SafeSessionSummary> {
    return invokeRustCommand<SafeSessionSummary>("get_session_state");
  },

  setApiBaseUrl(baseUrl: string): Promise<string> {
    return invokeRustCommand<string>("set_api_base_url", { baseUrl });
  },

  signIn(input: {
    identifier: string;
    password: string;
    deviceName?: string;
  }): Promise<InitializeAppResponse> {
    return invokeRustCommand<InitializeAppResponse>("sign_in", { input });
  },

  unlockOfflineSession(): Promise<SafeSessionSummary> {
    return invokeRustCommand<SafeSessionSummary>("unlock_offline_session");
  },

  signOut(wipeLocalCache = true): Promise<SafeSessionSummary> {
    return invokeRustCommand<SafeSessionSummary>("sign_out", { wipeLocalCache });
  },

  listCachedFamilies(): Promise<CachedFamilyView[]> {
    return invokeRustCommand<CachedFamilyView[]>("list_cached_families");
  },

  selectActiveFamily(familySlug: string): Promise<NativeDashboardView> {
    return invokeRustCommand<NativeDashboardView>("select_active_family", {
      familySlug,
    });
  },

  getCachedDashboard(familySlug: string): Promise<NativeDashboardView> {
    return invokeRustCommand<NativeDashboardView>("get_cached_dashboard", {
      familySlug,
    });
  },

  createOfflineIncome(input: {
    familySlug: string;
    categoryId: string;
    categoryName?: string;
    amountMinorUnits: string;
    currency?: string;
    description: string;
    notes?: string;
    transactionDate?: string;
  }): Promise<OutboxCommandView> {
    return invokeRustCommand<OutboxCommandView>("create_offline_income", {
      input,
    });
  },

  createOfflineExpense(input: {
    familySlug: string;
    categoryId: string;
    categoryName?: string;
    amountMinorUnits: string;
    currency?: string;
    description: string;
    notes?: string;
    transactionDate?: string;
  }): Promise<OutboxCommandView> {
    return invokeRustCommand<OutboxCommandView>("create_offline_expense", {
      input,
    });
  },

  updateOfflineTransactionNotes(input: {
    familySlug: string;
    localTransactionId: string;
    targetServerId: string;
    baseVersion?: string;
    notes: string;
  }): Promise<OutboxCommandView> {
    return invokeRustCommand<OutboxCommandView>(
      "update_offline_transaction_notes",
      { input },
    );
  },

  createOfflineContributionPayment(input: {
    familySlug: string;
    groupId: string;
    contributionMemberId: string;
    amountMinorUnits: string;
    currency?: string;
    paymentDate?: string;
    reference?: string;
    notes?: string;
  }): Promise<OutboxCommandView> {
    return invokeRustCommand<OutboxCommandView>(
      "create_offline_contribution_payment",
      { input },
    );
  },

  createOfflineProject(input: {
    familySlug: string;
    name: string;
    code: string;
    description?: string;
    targetBudgetMinorUnits: string;
    currency?: string;
  }): Promise<OutboxCommandView> {
    return invokeRustCommand<OutboxCommandView>("create_offline_project", {
      input,
    });
  },

  createOfflineContact(input: {
    familySlug: string;
    fullName: string;
    phone: string;
    email?: string;
    relationship?: string;
    notes?: string;
  }): Promise<OutboxCommandView> {
    return invokeRustCommand<OutboxCommandView>("create_offline_contact", {
      input,
    });
  },

  stageOfflineReceipt(input: {
    familySlug: string;
    localTransactionId: string;
    parentCommandId?: string;
    fileName: string;
    mimeType: string;
    contentBase64: string;
  }): Promise<StagedReceiptMetadata> {
    return invokeRustCommand<StagedReceiptMetadata>("stage_offline_receipt", {
      input,
    });
  },

  getSyncStatus(familySlug: string): Promise<SyncStatusSummary> {
    return invokeRustCommand<SyncStatusSummary>("get_sync_status", {
      familySlug,
    });
  },

  syncNow(familySlug: string): Promise<SyncStatusSummary> {
    return invokeRustCommand<SyncStatusSummary>("sync_now", { familySlug });
  },

  retryFailedCommand(
    familySlug: string,
    commandId: string,
  ): Promise<SyncStatusSummary> {
    return invokeRustCommand<SyncStatusSummary>("retry_failed_command", {
      familySlug,
      commandId,
    });
  },

  resolveConflict(input: {
    familySlug: string;
    commandId: string;
    strategy: ConflictResolutionStrategy;
    replacementNotes?: string;
  }): Promise<SyncStatusSummary> {
    return invokeRustCommand<SyncStatusSummary>("resolve_conflict", { input });
  },

  getNotificationPermission(): Promise<NotificationPermissionState> {
    return invokeRustCommand<NotificationPermissionState>(
      "get_notification_permission",
    );
  },

  setNotificationPermission(
    permission: NotificationPermissionState,
  ): Promise<NotificationPermissionState> {
    return invokeRustCommand<NotificationPermissionState>(
      "set_notification_permission",
      { permission },
    );
  },

  handleDeepLink(rawUrl: string): Promise<ParsedDeepLink> {
    return invokeRustCommand<ParsedDeepLink>("handle_deep_link", { rawUrl });
  },

  openExternalUrl(rawUrl: string): Promise<string> {
    return invokeRustCommand<string>("open_external_url", { rawUrl });
  },
};
