import React, { useCallback, useEffect, useState } from "react";
import { nativeTauriClient } from "./api/tauri-client";
import { OfflineMutationForms } from "./components/OfflineMutationForms";
import { SyncInspectorPanel } from "./components/SyncInspectorPanel";
import { SyncStatusBadge } from "./components/SyncStatusBadge";
import {
  type CachedFamilyView,
  type ConflictResolutionStrategy,
  formatMinorUnits,
  type NativeDashboardView,
  type PlatformEnvironmentInfo,
  type SafeSessionSummary,
  type SyncStatusSummary,
} from "./types/contracts";

export function NativeApp(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(true);
  const [platform, setPlatform] = useState<PlatformEnvironmentInfo | null>(
    null,
  );
  const [session, setSession] = useState<SafeSessionSummary | null>(null);
  const [families, setFamilies] = useState<CachedFamilyView[]>([]);
  const [dashboard, setDashboard] = useState<NativeDashboardView | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatusSummary | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [signingIn, setSigningIn] = useState<boolean>(false);

  const loadFamilyWorkspace = useCallback(async (familySlug: string) => {
    const [dash, status] = await Promise.all([
      nativeTauriClient.getCachedDashboard(familySlug),
      nativeTauriClient.getSyncStatus(familySlug),
    ]);
    setDashboard(dash);
    setSyncStatus(status);
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setErrorBanner(null);
    try {
      const init = await nativeTauriClient.initializeApp();
      setPlatform(init.platform);
      setSession(init.session);
      setFamilies(init.families);

      const targetSlug =
        init.session.activeFamilySlug ?? init.families[0]?.slug ?? null;
      if (
        targetSlug &&
        (init.session.state === "AUTHENTICATED_ONLINE" ||
          init.session.state === "AUTHENTICATED_OFFLINE_UNLOCKED" ||
          init.session.state === "SESSION_EXPIRED")
      ) {
        await loadFamilyWorkspace(targetSlug);
      }
    } catch (err) {
      setErrorBanner(
        err instanceof Error
          ? err.message
          : "Failed to initialize native Umuryango workspace.",
      );
    } finally {
      setLoading(false);
    }
  }, [loadFamilyWorkspace]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    setSigningIn(true);
    try {
      const res = await nativeTauriClient.signIn({
        identifier: identifier.trim(),
        password,
      });
      setPlatform(res.platform);
      setSession(res.session);
      setFamilies(res.families);
      setPassword("");

      const slug =
        res.session.activeFamilySlug ?? res.families[0]?.slug ?? null;
      if (slug) {
        await loadFamilyWorkspace(slug);
      }
    } catch (err) {
      setErrorBanner(
        err instanceof Error ? err.message : "Authentication failed.",
      );
    } finally {
      setSigningIn(false);
    }
  };

  const handleUnlockOffline = async () => {
    setErrorBanner(null);
    try {
      const unlocked = await nativeTauriClient.unlockOfflineSession();
      setSession(unlocked);
      const cachedFams = await nativeTauriClient.listCachedFamilies();
      setFamilies(cachedFams);
      const slug = unlocked.activeFamilySlug ?? cachedFams[0]?.slug ?? null;
      if (slug) {
        await loadFamilyWorkspace(slug);
      }
    } catch (err) {
      setErrorBanner(
        err instanceof Error ? err.message : "Offline unlock failed.",
      );
    }
  };

  const handleSignOut = async () => {
    setErrorBanner(null);
    try {
      const signedOut = await nativeTauriClient.signOut(true);
      setSession(signedOut);
      setFamilies([]);
      setDashboard(null);
      setSyncStatus(null);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : "Sign out failed.");
    }
  };

  const handleSelectFamily = async (slug: string) => {
    setErrorBanner(null);
    try {
      const dash = await nativeTauriClient.selectActiveFamily(slug);
      const status = await nativeTauriClient.getSyncStatus(slug);
      setDashboard(dash);
      setSyncStatus(status);
      setSession((prev) =>
        prev
          ? {
              ...prev,
              activeFamilySlug: dash.family.slug,
              activeFamilyId: dash.family.familyId,
            }
          : prev,
      );
    } catch (err) {
      setErrorBanner(
        err instanceof Error ? err.message : "Failed to switch family.",
      );
    }
  };

  const handleSyncNow = async () => {
    if (!dashboard) return;
    setErrorBanner(null);
    try {
      const updatedStatus = await nativeTauriClient.syncNow(
        dashboard.family.slug,
      );
      setSyncStatus(updatedStatus);
      const refreshedDash = await nativeTauriClient.getCachedDashboard(
        dashboard.family.slug,
      );
      setDashboard(refreshedDash);
    } catch (err) {
      const refreshedSession = await nativeTauriClient
        .getSessionState()
        .catch(() => null);
      if (refreshedSession) {
        setSession(refreshedSession);
      }
      setErrorBanner(
        err instanceof Error ? err.message : "Synchronization failed.",
      );
    }
  };

  const handleRetryCommand = async (commandId: string) => {
    if (!dashboard) return;
    const updatedStatus = await nativeTauriClient.retryFailedCommand(
      dashboard.family.slug,
      commandId,
    );
    setSyncStatus(updatedStatus);
    const refreshedDash = await nativeTauriClient.getCachedDashboard(
      dashboard.family.slug,
    );
    setDashboard(refreshedDash);
  };

  const handleResolveConflict = async (
    commandId: string,
    strategy: ConflictResolutionStrategy,
    replacementNotes?: string,
  ) => {
    if (!dashboard) return;
    const updatedStatus = await nativeTauriClient.resolveConflict({
      familySlug: dashboard.family.slug,
      commandId,
      strategy,
      replacementNotes,
    });
    setSyncStatus(updatedStatus);
    const refreshedDash = await nativeTauriClient.getCachedDashboard(
      dashboard.family.slug,
    );
    setDashboard(refreshedDash);
  };

  const handleCreateTransaction = async (input: {
    direction: "INCOME" | "EXPENSE";
    categoryId: string;
    categoryName?: string;
    amountMinorUnits: string;
    description: string;
    notes?: string;
    receiptFile?: {
      fileName: string;
      mimeType: string;
      contentBase64: string;
    } | null;
  }) => {
    if (!dashboard) return;
    const slug = dashboard.family.slug;
    const outboxCmd =
      input.direction === "INCOME"
        ? await nativeTauriClient.createOfflineIncome({
            familySlug: slug,
            categoryId: input.categoryId,
            categoryName: input.categoryName,
            amountMinorUnits: input.amountMinorUnits,
            currency: dashboard.currency,
            description: input.description,
            notes: input.notes,
          })
        : await nativeTauriClient.createOfflineExpense({
            familySlug: slug,
            categoryId: input.categoryId,
            categoryName: input.categoryName,
            amountMinorUnits: input.amountMinorUnits,
            currency: dashboard.currency,
            description: input.description,
            notes: input.notes,
          });

    if (input.receiptFile) {
      await nativeTauriClient.stageOfflineReceipt({
        familySlug: slug,
        localTransactionId: outboxCmd.localRecordId,
        parentCommandId: outboxCmd.commandId,
        fileName: input.receiptFile.fileName,
        mimeType: input.receiptFile.mimeType,
        contentBase64: input.receiptFile.contentBase64,
      });
    }

    await loadFamilyWorkspace(slug);
  };

  const handleCreateProject = async (input: {
    name: string;
    code: string;
    description?: string;
    targetBudgetMinorUnits: string;
  }) => {
    if (!dashboard) return;
    await nativeTauriClient.createOfflineProject({
      familySlug: dashboard.family.slug,
      name: input.name,
      code: input.code,
      description: input.description,
      targetBudgetMinorUnits: input.targetBudgetMinorUnits,
      currency: dashboard.currency,
    });
    await loadFamilyWorkspace(dashboard.family.slug);
  };

  const handleCreateContact = async (input: {
    fullName: string;
    phone: string;
    email?: string;
    relationship?: string;
  }) => {
    if (!dashboard) return;
    await nativeTauriClient.createOfflineContact({
      familySlug: dashboard.family.slug,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      relationship: input.relationship,
    });
    await loadFamilyWorkspace(dashboard.family.slug);
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-6 text-sm">
        <div
          role="status"
          data-testid="native-loading-state"
          className="rounded-lg border border-border bg-card p-6 font-mono"
        >
          [BOOT] Loading Umuryango encrypted local database...
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded border border-foreground bg-primary px-2 py-1 font-mono text-xs font-bold text-primary-foreground">
              UMURYANGO
            </span>
            <div>
              <h1 className="text-sm font-bold tracking-tight">
                {platform?.displayName ?? "Umuryango"} Native (
                {platform?.osPlatform ?? "desktop"})
              </h1>
              <p className="text-[11px] text-muted-foreground">
                App ID: {platform?.appIdentifier ?? "rw.umuryango.app"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              data-testid="connectivity-badge"
              className="inline-flex items-center gap-1.5 rounded-md border border-foreground px-2.5 py-1 font-mono text-xs font-semibold"
            >
              {session?.connectivityOnline
                ? "[ONLINE] Server Connected"
                : "[OFFLINE] Local Cache Active"}
            </span>

            {families.length > 0 ? (
              <select
                aria-label="Select active family"
                data-testid="family-switcher-select"
                value={dashboard?.family.slug ?? families[0]?.slug ?? ""}
                onChange={(e) => void handleSelectFamily(e.target.value)}
                className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium"
              >
                {families.map((fam) => (
                  <option key={fam.familyId} value={fam.slug}>
                    {fam.name} ({fam.role})
                  </option>
                ))}
              </select>
            ) : null}

            {session?.user ? (
              <button
                type="button"
                data-testid="sign-out-button"
                onClick={() => void handleSignOut()}
                className="rounded-md border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
              >
                [EXIT] Sign out &amp; wipe cache
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 p-4">
        {errorBanner ? (
          <div
            role="alert"
            data-testid="native-error-banner"
            className="rounded-md border-2 border-foreground bg-muted p-3 text-xs font-medium"
          >
            [ERROR] {errorBanner}
          </div>
        ) : null}

        {session?.state === "SESSION_EXPIRED" ? (
          <div
            role="alert"
            data-testid="session-expired-banner"
            className="rounded-md border-2 border-foreground bg-secondary p-4 text-xs"
          >
            <div className="font-bold">
              [SESSION EXPIRED] Re-authentication required to synchronize with
              server
            </div>
            <p className="mt-1 text-muted-foreground">
              Your local pending drafts remain safely encrypted on this device.
              Sign in below to resume synchronization.
            </p>
          </div>
        ) : null}

        {session?.state === "MEMBERSHIP_REVOKED" ? (
          <div
            role="alert"
            data-testid="membership-revoked-banner"
            className="rounded-md border-2 border-foreground bg-destructive p-4 text-xs text-destructive-foreground"
          >
            <div className="font-bold">
              [ACCESS REVOKED] Family membership is no longer active
            </div>
            <p className="mt-1">
              The server reported that your membership in this family was
              revoked. Further family synchronization is disabled.
            </p>
          </div>
        ) : null}

        {!session ||
        session.state === "UNAUTHENTICATED" ||
        session.state === "SESSION_EXPIRED" ? (
          <section
            aria-labelledby="native-login-heading"
            data-testid="native-login-screen"
            className="mx-auto max-w-md rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm"
          >
            <h2 id="native-login-heading" className="text-base font-bold">
              Sign in to Umuryango Native
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Tokens are stored exclusively in the Rust Stronghold/AEAD vault
              and are never exposed to the WebView or localStorage.
            </p>

            <form
              onSubmit={(e) => void handleSignIn(e)}
              className="mt-4 space-y-3 text-xs"
            >
              <label className="block">
                <span className="font-medium">Email or Phone Identifier</span>
                <input
                  type="text"
                  data-testid="login-identifier-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="member@umuryango.rw"
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
                />
              </label>

              <label className="block">
                <span className="font-medium">Password</span>
                <input
                  type="password"
                  data-testid="login-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
                />
              </label>

              <button
                type="submit"
                data-testid="login-submit-button"
                disabled={signingIn}
                className="w-full rounded-md border border-foreground bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              >
                {signingIn ? "Authenticating..." : "[AUTH] Sign in online"}
              </button>
            </form>

            {session?.offlineUnlockAvailable ? (
              <div className="mt-4 border-t border-border pt-3">
                <button
                  type="button"
                  data-testid="unlock-offline-button"
                  onClick={() => void handleUnlockOffline()}
                  className="w-full rounded-md border border-border bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground"
                >
                  [OFFLINE UNLOCK] Open cached family workspace
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {session &&
        (session.state === "AUTHENTICATED_ONLINE" ||
          session.state === "AUTHENTICATED_OFFLINE_UNLOCKED") &&
        families.length === 0 ? (
          <section
            data-testid="empty-family-cache-state"
            className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-xs"
          >
            <div className="font-mono text-sm font-bold">
              [EMPTY CACHE] No family workspace cached on this device yet
            </div>
            <p className="mt-1 text-muted-foreground">
              Connect to the Umuryango server and synchronize to download your
              authorized family records for offline access.
            </p>
          </section>
        ) : null}

        {dashboard ? (
          <>
            {/* Staleness & Offline Cache Indicator */}
            <div
              data-testid="staleness-indicator-banner"
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted px-3.5 py-2 text-xs"
            >
              <div>
                <span className="font-mono font-semibold">
                  {session?.connectivityOnline
                    ? "[SERVER AUTHORITATIVE]"
                    : "[OFFLINE CACHED SNAPSHOT]"}
                </span>{" "}
                Last verified server sync:{" "}
                <span className="font-mono font-medium">
                  {dashboard.lastSyncedAt ?? "Not yet synchronized"}
                </span>
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                Family ID: {dashboard.family.familyId} | Role:{" "}
                {dashboard.family.role}
              </div>
            </div>

            {/* Strictly Separated Server-Authoritative Totals vs Local Pending Totals */}
            <section
              aria-label="Financial Summary"
              className="grid grid-cols-1 gap-3 md:grid-cols-2"
            >
              <div
                data-testid="server-authoritative-totals-card"
                className="rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold">
                    Server-Authoritative Totals (Approved)
                  </h2>
                  <span className="rounded border border-border bg-secondary px-2 py-0.5 font-mono text-[10px]">
                    [SERVER VERIFIED]
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded border border-border bg-background p-2.5">
                    <div className="text-muted-foreground">Approved Income</div>
                    <div
                      data-testid="server-approved-income"
                      className="mt-1 font-mono text-sm font-bold"
                    >
                      {formatMinorUnits(
                        dashboard.serverApprovedIncomeMinorUnits,
                        dashboard.currency,
                      )}
                    </div>
                  </div>
                  <div className="rounded border border-border bg-background p-2.5">
                    <div className="text-muted-foreground">
                      Approved Expense
                    </div>
                    <div
                      data-testid="server-approved-expense"
                      className="mt-1 font-mono text-sm font-bold"
                    >
                      {formatMinorUnits(
                        dashboard.serverApprovedExpenseMinorUnits,
                        dashboard.currency,
                      )}
                    </div>
                  </div>
                  <div className="rounded border border-border bg-background p-2.5">
                    <div className="text-muted-foreground">Net Balance</div>
                    <div
                      data-testid="server-net-balance"
                      className="mt-1 font-mono text-sm font-bold"
                    >
                      {formatMinorUnits(
                        dashboard.serverNetBalanceMinorUnits,
                        dashboard.currency,
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                data-testid="local-pending-totals-card"
                className="rounded-lg border border-dashed border-foreground bg-card p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold">
                    Local Unsynced Queue (Not Server-Approved)
                  </h2>
                  <span className="rounded border border-dashed border-foreground bg-muted px-2 py-0.5 font-mono text-[10px]">
                    [LOCAL PENDING]
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Kept strictly separate from server-authoritative balances
                  until accepted and approved by the backend.
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-border bg-background p-2.5">
                    <div className="text-muted-foreground">
                      Local Pending Income
                    </div>
                    <div
                      data-testid="local-pending-income"
                      className="mt-1 font-mono text-sm font-bold"
                    >
                      {formatMinorUnits(
                        dashboard.localPendingIncomeMinorUnits,
                        dashboard.currency,
                      )}
                    </div>
                  </div>
                  <div className="rounded border border-border bg-background p-2.5">
                    <div className="text-muted-foreground">
                      Local Pending Expense
                    </div>
                    <div
                      data-testid="local-pending-expense"
                      className="mt-1 font-mono text-sm font-bold"
                    >
                      {formatMinorUnits(
                        dashboard.localPendingExpenseMinorUnits,
                        dashboard.currency,
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Offline Mutation Forms */}
            <OfflineMutationForms
              familySlug={dashboard.family.slug}
              currency={dashboard.currency}
              categories={dashboard.categories}
              connectivityOnline={Boolean(session?.connectivityOnline)}
              onCreateTransaction={handleCreateTransaction}
              onCreateProject={handleCreateProject}
              onCreateContact={handleCreateContact}
            />

            {/* Recent Cached + Local Pending Transactions */}
            <section
              aria-labelledby="recent-transactions-heading"
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <h2
                id="recent-transactions-heading"
                className="text-base font-semibold"
              >
                Family Money Ledger (Cached &amp; Pending Sync)
              </h2>

              {dashboard.recentTransactions.length === 0 ? (
                <p
                  data-testid="no-cached-transactions"
                  className="mt-3 rounded border border-dashed border-border p-4 text-center text-xs text-muted-foreground"
                >
                  No cached or local pending transactions for this family yet.
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table
                    data-testid="cached-transactions-table"
                    className="w-full border-collapse text-left text-xs"
                  >
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="py-2 pr-3">Description</th>
                        <th className="py-2 pr-3">Category</th>
                        <th className="py-2 pr-3">Direction</th>
                        <th className="py-2 pr-3">Amount</th>
                        <th className="py-2 pr-3">Approval State</th>
                        <th className="py-2">Sync State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentTransactions.map((tx) => (
                        <tr
                          key={tx.localId}
                          data-testid={`tx-row-${tx.localId}`}
                          className="border-b border-border"
                        >
                          <td className="py-2.5 pr-3 font-medium">
                            <div>{tx.description}</div>
                            {tx.lastSyncError ? (
                              <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                                Error: {tx.lastSyncError}
                              </div>
                            ) : null}
                          </td>
                          <td className="py-2.5 pr-3">{tx.categoryName}</td>
                          <td className="py-2.5 pr-3 font-mono">
                            {tx.direction}
                          </td>
                          <td className="py-2.5 pr-3 font-mono font-semibold">
                            {formatMinorUnits(tx.amountMinorUnits, tx.currency)}
                          </td>
                          <td className="py-2.5 pr-3 font-mono">{tx.status}</td>
                          <td className="py-2.5">
                            <SyncStatusBadge
                              status={tx.syncStatus}
                              conflictCode={tx.conflictCode}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Sync Inspector Panel */}
            {syncStatus ? (
              <SyncInspectorPanel
                status={syncStatus}
                onSyncNow={handleSyncNow}
                onRetryCommand={handleRetryCommand}
                onResolveConflict={handleResolveConflict}
              />
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
export default NativeApp;
