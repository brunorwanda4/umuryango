import React from "react";
import type { SyncStatus } from "../types/contracts";

interface SyncStatusBadgeProps {
  status: SyncStatus;
  conflictCode?: string | null;
}

const STATUS_META: Record<
  SyncStatus,
  { label: string; iconSymbol: string; ariaLabel: string; className: string }
> = {
  SYNCED: {
    label: "Synced with server",
    iconSymbol: "[OK]",
    ariaLabel: "Status: Synced with server",
    className:
      "border border-border bg-secondary text-secondary-foreground font-medium",
  },
  LOCAL_PENDING: {
    label: "Pending sync",
    iconSymbol: "[QUEUE]",
    ariaLabel: "Status: Pending synchronization in local outbox",
    className:
      "border border-dashed border-foreground bg-muted text-foreground font-medium",
  },
  SYNCING: {
    label: "Syncing now",
    iconSymbol: "[SYNC]",
    ariaLabel: "Status: Synchronizing with server",
    className: "border border-foreground bg-accent text-accent-foreground",
  },
  CONFLICT: {
    label: "Sync conflict",
    iconSymbol: "[!CONFLICT]",
    ariaLabel: "Status: Synchronization conflict requiring review",
    className:
      "border-2 border-foreground bg-primary text-primary-foreground font-semibold",
  },
  REJECTED: {
    label: "Rejected by server",
    iconSymbol: "[X-REJECTED]",
    ariaLabel: "Status: Permanently rejected by server validation",
    className:
      "border-2 border-foreground bg-destructive text-destructive-foreground font-semibold",
  },
  FAILED_RETRYABLE: {
    label: "Retry scheduled",
    iconSymbol: "[RETRY]",
    ariaLabel: "Status: Network failure, automatic retry scheduled",
    className: "border border-foreground bg-muted text-muted-foreground",
  },
};

export function SyncStatusBadge({
  status,
  conflictCode,
}: SyncStatusBadgeProps): React.ReactElement {
  const meta = STATUS_META[status] ?? STATUS_META.LOCAL_PENDING;
  return (
    <span
      role="status"
      aria-label={meta.ariaLabel}
      data-sync-status={status}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs ${meta.className}`}
    >
      <span aria-hidden="true" className="font-mono text-[11px]">
        {meta.iconSymbol}
      </span>
      <span>{meta.label}</span>
      {conflictCode ? (
        <span className="font-mono text-[10px] underline">
          ({conflictCode})
        </span>
      ) : null}
    </span>
  );
}
