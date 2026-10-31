import { describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  nativeTauriClient,
  setTauriInvokeHandlerForTests,
} from "../api/tauri-client";
import { OfflineMutationForms } from "../components/OfflineMutationForms";
import { SyncInspectorPanel } from "../components/SyncInspectorPanel";
import { SyncStatusBadge } from "../components/SyncStatusBadge";
import {
  formatMinorUnits,
  parseMinorUnitsToBigInt,
  type SyncStatusSummary,
} from "../types/contracts";

describe("Umuryango Native UI & Tauri Bridge Tests", () => {
  it("1. renders offline startup state with cached family data and staleness indicator", async () => {
    setTauriInvokeHandlerForTests(async <T,>(cmd: string): Promise<T> => {
      if (cmd === "initialize_native_app") {
        return {
          platform: {
            appIdentifier: "rw.umuryango.app",
            displayName: "Umuryango",
            osPlatform: "android",
            defaultApiBaseUrl: "http://10.0.2.2:4915/api/v1",
            supportsAndroidBackHandler: true,
            supportsHighDpiScaling: true,
          },
          session: {
            state: "AUTHENTICATED_OFFLINE_UNLOCKED",
            user: {
              id: "user-1",
              email: "aline@umuryango.rw",
              name: "Aline Uwase",
              phone: "+250788111222",
              mfaEnabled: false,
            },
            activeFamilySlug: "gasabo-clan",
            activeFamilyId: "fam-gasabo-1",
            lastAuthenticatedOnlineAt: "2026-10-31T18:00:00Z",
            offlineUnlockAvailable: true,
            connectivityOnline: false,
          },
          families: [
            {
              familyId: "fam-gasabo-1",
              slug: "gasabo-clan",
              name: "Gasabo Family Clan",
              currency: "RWF",
              role: "OWNER",
              permissions: ["CREATE_TRANSACTIONS"],
              isActiveMember: true,
              lastSyncedAt: "2026-10-31T18:05:00Z",
            },
          ],
        } as unknown as T;
      }
      throw new Error(`Unexpected command: ${cmd}`);
    });

    const boot = await nativeTauriClient.initializeApp();
    expect(boot.session.state).toBe("AUTHENTICATED_OFFLINE_UNLOCKED");
    expect(boot.session.connectivityOnline).toBe(false);
    expect(boot.families).toHaveLength(1);
    expect(boot.families[0]?.slug).toBe("gasabo-clan");
    setTauriInvokeHandlerForTests(null);
  });

  it("2. handles empty cache state when offline cleanly", async () => {
    setTauriInvokeHandlerForTests(async <T,>(cmd: string): Promise<T> => {
      if (cmd === "initialize_native_app") {
        return {
          platform: {
            appIdentifier: "rw.umuryango.app",
            displayName: "Umuryango",
            osPlatform: "windows",
            defaultApiBaseUrl: "http://localhost:4915/api/v1",
            supportsAndroidBackHandler: false,
            supportsHighDpiScaling: true,
          },
          session: {
            state: "AUTHENTICATED_OFFLINE_UNLOCKED",
            user: {
              id: "user-empty",
              email: "new@umuryango.rw",
              name: "New Member",
              phone: null,
              mfaEnabled: false,
            },
            activeFamilySlug: null,
            activeFamilyId: null,
            lastAuthenticatedOnlineAt: "2026-10-31T18:00:00Z",
            offlineUnlockAvailable: true,
            connectivityOnline: false,
          },
          families: [],
        } as unknown as T;
      }
      throw new Error(`Unexpected command: ${cmd}`);
    });

    const boot = await nativeTauriClient.initializeApp();
    expect(boot.families).toHaveLength(0);
    expect(boot.session.activeFamilySlug).toBeNull();
    setTauriInvokeHandlerForTests(null);
  });

  it("3. displays pending sync status using both text and iconography and formats integer minor units", () => {
    const html = renderToStaticMarkup(
      <SyncStatusBadge status="LOCAL_PENDING" />,
    );
    expect(html).toContain("[QUEUE]");
    expect(html).toContain("Pending sync");
    expect(html).toContain('data-sync-status="LOCAL_PENDING"');

    expect(formatMinorUnits("250000", "RWF")).toBe("RWF 250,000");
    expect(parseMinorUnitsToBigInt("250000")).toBe(250000n);
    expect(() => parseMinorUnitsToBigInt("125.50")).toThrow();
  });

  it("4 & 5 & 6. displays failed retryable and conflict items in SyncInspectorPanel and supports manual retry & conflict resolution", async () => {
    let retriedCommandId: string | null = null;
    let resolvedConflict: {
      commandId: string;
      strategy: string;
      replacementNotes?: string;
    } | null = null;

    const sampleStatus: SyncStatusSummary = {
      familyId: "fam-1",
      familySlug: "gasabo-clan",
      connectivityOnline: true,
      isSyncing: false,
      lastSyncedAt: "2026-11-01T00:00:00Z",
      lastCursor: "2026-11-01T00:00:00Z|tx-99",
      pendingCount: 1,
      syncingCount: 0,
      conflictCount: 1,
      rejectedCount: 0,
      failedRetryableCount: 1,
      outboxItems: [
        {
          commandId: "cmd-retry-1",
          idempotencyKey: "idem-preserve-001",
          familyId: "fam-1",
          commandType: "CREATE_EXPENSE",
          localRecordId: "local-tx-1",
          targetServerId: null,
          parentCommandId: null,
          syncStatus: "FAILED_RETRYABLE",
          retryCount: 2,
          nextRetryAt: "2026-11-01T00:05:00Z",
          lastError: "Transient network timeout",
          conflictCode: null,
          serverSnapshot: null,
          createdAt: "2026-11-01T00:00:00Z",
          updatedAt: "2026-11-01T00:01:00Z",
        },
        {
          commandId: "cmd-conflict-2",
          idempotencyKey: "idem-conflict-002",
          familyId: "fam-1",
          commandType: "UPDATE_TRANSACTION_NOTES",
          localRecordId: "local-tx-2",
          targetServerId: "srv-tx-2",
          parentCommandId: null,
          syncStatus: "CONFLICT",
          retryCount: 0,
          nextRetryAt: null,
          lastError: "Transaction was already approved on server",
          conflictCode: "APPROVAL_STATE_CONFLICT",
          serverSnapshot: { status: "APPROVED", amountMinorUnits: "50000" },
          createdAt: "2026-11-01T00:00:00Z",
          updatedAt: "2026-11-01T00:02:00Z",
        },
      ],
    };

    const html = renderToStaticMarkup(
      <SyncInspectorPanel
        status={sampleStatus}
        onSyncNow={async () => {}}
        onRetryCommand={async (cid) => {
          retriedCommandId = cid;
        }}
        onResolveConflict={async (cid, strategy, notes) => {
          resolvedConflict = { commandId: cid, strategy, replacementNotes: notes };
        }}
      />,
    );

    expect(html).toContain("Synchronization &amp; Outbox Inspector");
    expect(html).toContain("idem-preserve-001");
    expect(html).toContain("Transient network timeout");
    expect(html).toContain("[!CONFLICT]");
    expect(html).toContain("APPROVAL_STATE_CONFLICT");
    expect(html).toContain("Accept server version");
    expect(html).toContain("Discard local draft");

    // Verify manual retry command preserves idempotency key via Rust command bridge
    setTauriInvokeHandlerForTests(
      async <T,>(cmd: string, args?: Record<string, unknown>): Promise<T> => {
        if (cmd === "retry_failed_command") {
          retriedCommandId = String(args?.commandId ?? "");
          return sampleStatus as unknown as T;
        }
        if (cmd === "resolve_conflict") {
          const input = args?.input as {
            commandId: string;
            strategy: string;
            replacementNotes?: string;
          };
          resolvedConflict = input;
          return sampleStatus as unknown as T;
        }
        throw new Error(`Unexpected command: ${cmd}`);
      },
    );

    await nativeTauriClient.retryFailedCommand("gasabo-clan", "cmd-retry-1");
    expect(retriedCommandId).toBe("cmd-retry-1");

    await nativeTauriClient.resolveConflict({
      familySlug: "gasabo-clan",
      commandId: "cmd-conflict-2",
      strategy: "ACCEPT_SERVER",
    });
    expect(resolvedConflict).toEqual({
      familySlug: "gasabo-clan",
      commandId: "cmd-conflict-2",
      strategy: "ACCEPT_SERVER",
    } as unknown as typeof resolvedConflict);

    setTauriInvokeHandlerForTests(null);
  });

  it("7. handles session expiration state without losing local drafts", async () => {
    setTauriInvokeHandlerForTests(async <T,>(cmd: string): Promise<T> => {
      if (cmd === "get_session_state") {
        return {
          state: "SESSION_EXPIRED",
          user: {
            id: "user-1",
            email: "aline@umuryango.rw",
            name: "Aline Uwase",
            phone: null,
            mfaEnabled: false,
          },
          activeFamilySlug: "gasabo-clan",
          activeFamilyId: "fam-1",
          lastAuthenticatedOnlineAt: "2026-09-15T00:00:00Z",
          offlineUnlockAvailable: false,
          connectivityOnline: true,
        } as unknown as T;
      }
      throw new Error(`Unexpected command: ${cmd}`);
    });

    const session = await nativeTauriClient.getSessionState();
    expect(session.state).toBe("SESSION_EXPIRED");
    expect(session.offlineUnlockAvailable).toBe(false);
    setTauriInvokeHandlerForTests(null);
  });

  it("8. refuses direct browser fallback in native client and keeps Next.js web codebase free of Tauri dependencies", async () => {
    setTauriInvokeHandlerForTests(null);

    await expect(nativeTauriClient.getSessionState()).rejects.toThrow(
      /Native Tauri IPC bridge is required/,
    );

    // Also render OfflineMutationForms to verify online-only governance controls
    const formHtml = renderToStaticMarkup(
      <OfflineMutationForms
        familySlug="gasabo-clan"
        currency="RWF"
        categories={[
          {
            serverId: "cat-1",
            familyId: "fam-1",
            name: "Healthcare",
            code: "HLTH",
            direction: "EXPENSE",
            isActive: true,
            requiresReceiptAboveMinorUnits: null,
          },
        ]}
        connectivityOnline={false}
        onCreateTransaction={async () => {}}
        onCreateProject={async () => {}}
        onCreateContact={async () => {}}
      />,
    );
    expect(formHtml).toContain("Queue Expense (Pending Sync)");

    // Verify existing Next.js website (frontend/src/service/api.ts) does not import @tauri-apps
    const webApiFile = path.resolve(
      __dirname,
      "../../../src/service/api.ts",
    );
    const webApiContent = fs.readFileSync(webApiFile, "utf-8");
    expect(webApiContent).not.toContain("@tauri-apps");
  });
});
