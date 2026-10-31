import React, { useState } from "react";
import type {
  ConflictResolutionStrategy,
  OutboxCommandView,
  SyncStatusSummary,
} from "../types/contracts";
import { SyncStatusBadge } from "./SyncStatusBadge";

interface SyncInspectorPanelProps {
  status: SyncStatusSummary;
  onSyncNow: () => Promise<void>;
  onRetryCommand: (commandId: string) => Promise<void>;
  onResolveConflict: (
    commandId: string,
    strategy: ConflictResolutionStrategy,
    replacementNotes?: string,
  ) => Promise<void>;
}

export function SyncInspectorPanel({
  status,
  onSyncNow,
  onRetryCommand,
  onResolveConflict,
}: SyncInspectorPanelProps): React.ReactElement {
  const [replacementNotesMap, setReplacementNotesMap] = useState<
    Record<string, string>
  >({});
  const [busyCommandId, setBusyCommandId] = useState<string | null>(null);

  const handleRetry = async (commandId: string) => {
    setBusyCommandId(commandId);
    try {
      await onRetryCommand(commandId);
    } finally {
      setBusyCommandId(null);
    }
  };

  const handleResolve = async (
    item: OutboxCommandView,
    strategy: ConflictResolutionStrategy,
  ) => {
    setBusyCommandId(item.commandId);
    try {
      await onResolveConflict(
        item.commandId,
        strategy,
        replacementNotesMap[item.commandId],
      );
    } finally {
      setBusyCommandId(null);
    }
  };

  return (
    <section
      aria-labelledby="sync-inspector-heading"
      data-testid="sync-inspector-panel"
      className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h2
            id="sync-inspector-heading"
            className="text-base font-semibold tracking-tight"
          >
            Synchronization &amp; Outbox Inspector
          </h2>
          <p className="text-xs text-muted-foreground">
            Last server sync:{" "}
            <span data-testid="sync-last-timestamp" className="font-mono">
              {status.lastSyncedAt ?? "Never synchronized"}
            </span>{" "}
            | Cursor:{" "}
            <span className="font-mono">
              {status.lastCursor ? status.lastCursor.slice(0, 16) : "initial"}
            </span>
          </p>
        </div>

        <button
          type="button"
          data-testid="sync-now-button"
          disabled={status.isSyncing}
          onClick={() => void onSyncNow()}
          className="inline-flex items-center gap-2 rounded-md border border-foreground bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          <span aria-hidden="true" data-icon="inline-start">
            [SYNC]
          </span>
          <span>{status.isSyncing ? "Syncing..." : "Sync now"}</span>
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-md border border-border bg-background p-2.5">
          <div className="text-xs text-muted-foreground">Pending outbox</div>
          <div
            data-testid="sync-pending-count"
            className="mt-1 font-mono text-lg font-bold"
          >
            {status.pendingCount}
          </div>
        </div>
        <div className="rounded-md border border-border bg-background p-2.5">
          <div className="text-xs text-muted-foreground">Retryable failed</div>
          <div
            data-testid="sync-failed-count"
            className="mt-1 font-mono text-lg font-bold"
          >
            {status.failedRetryableCount}
          </div>
        </div>
        <div className="rounded-md border border-border bg-background p-2.5">
          <div className="text-xs text-muted-foreground">Conflicts</div>
          <div
            data-testid="sync-conflict-count"
            className="mt-1 font-mono text-lg font-bold"
          >
            {status.conflictCount}
          </div>
        </div>
        <div className="rounded-md border border-border bg-background p-2.5">
          <div className="text-xs text-muted-foreground">Rejected</div>
          <div
            data-testid="sync-rejected-count"
            className="mt-1 font-mono text-lg font-bold"
          >
            {status.rejectedCount}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {status.outboxItems.length === 0 ? (
          <p
            data-testid="sync-outbox-empty"
            className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground"
          >
            Outbox is clean. All local family mutations have been reconciled
            with the server.
          </p>
        ) : (
          status.outboxItems.map((item) => (
            <div
              key={item.commandId}
              data-testid={`outbox-item-${item.commandId}`}
              className="rounded-md border border-border bg-background p-3 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-mono font-semibold">
                  {item.commandType} (Local ID: {item.localRecordId.slice(0, 8)}
                  )
                </div>
                <SyncStatusBadge
                  status={item.syncStatus}
                  conflictCode={item.conflictCode}
                />
              </div>

              <div className="mt-1 text-[11px] text-muted-foreground">
                Idempotency Key:{" "}
                <span className="font-mono">{item.idempotencyKey}</span> |
                Retries: {item.retryCount}
              </div>

              {item.lastError ? (
                <div
                  role="alert"
                  className="mt-2 rounded border border-foreground bg-muted p-2 font-mono text-[11px] text-foreground"
                >
                  Server / Sync Reason: {item.lastError}
                </div>
              ) : null}

              {item.serverSnapshot ? (
                <div className="mt-2 rounded border border-border bg-secondary p-2">
                  <div className="font-semibold">
                    Authoritative Server Snapshot:
                  </div>
                  <pre className="mt-1 overflow-x-auto font-mono text-[10px]">
                    {JSON.stringify(item.serverSnapshot, null, 2)}
                  </pre>
                </div>
              ) : null}

              {item.syncStatus === "FAILED_RETRYABLE" ? (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    data-testid={`retry-command-${item.commandId}`}
                    disabled={busyCommandId === item.commandId}
                    onClick={() => void handleRetry(item.commandId)}
                    className="rounded border border-foreground bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                  >
                    [RETRY] Retry command (preserve idempotency key)
                  </button>
                </div>
              ) : null}

              {item.syncStatus === "CONFLICT" ||
              item.syncStatus === "REJECTED" ? (
                <div className="mt-2.5 space-y-2 border-t border-border pt-2">
                  <div className="font-medium">
                    Explicit Resolution Required (No silent overwrite):
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      data-testid={`resolve-accept-server-${item.commandId}`}
                      disabled={busyCommandId === item.commandId}
                      onClick={() => void handleResolve(item, "ACCEPT_SERVER")}
                      className="rounded border border-foreground bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                    >
                      Accept server version
                    </button>
                    <button
                      type="button"
                      data-testid={`resolve-discard-local-${item.commandId}`}
                      disabled={busyCommandId === item.commandId}
                      onClick={() => void handleResolve(item, "DISCARD_LOCAL")}
                      className="rounded border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                    >
                      Discard local draft
                    </button>
                  </div>

                  {item.commandType === "UPDATE_TRANSACTION_NOTES" ? (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Updated notes to resubmit..."
                        value={replacementNotesMap[item.commandId] ?? ""}
                        onChange={(e) =>
                          setReplacementNotesMap((prev) => ({
                            ...prev,
                            [item.commandId]: e.target.value,
                          }))
                        }
                        className="rounded border border-border bg-background px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        data-testid={`resolve-retry-notes-${item.commandId}`}
                        disabled={busyCommandId === item.commandId}
                        onClick={() =>
                          void handleResolve(item, "RETRY_AS_NEW_NOTES")
                        }
                        className="rounded border border-foreground bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                      >
                        Retry note edit against current server version
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
