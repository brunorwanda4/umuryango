import { Badge } from "@/components/ui/badge";
import { formatTitle } from "../utils";
import type { ApprovalPriority, ApprovalStatus, ApprovalType } from "./types";

export function TypeBadge({ type }: { type: ApprovalType }) {
  return <Badge variant="outline">{formatTitle(type)}</Badge>;
}

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const variant =
    status === "APPROVED"
      ? "default"
      : status === "REJECTED"
        ? "destructive"
        : status === "PENDING"
          ? "secondary"
          : "outline";

  return <Badge variant={variant}>{formatTitle(status)}</Badge>;
}

export function PriorityBadge({ priority }: { priority: ApprovalPriority }) {
  const variant =
    priority === "URGENT" || priority === "HIGH" ? "destructive" : "outline";

  return <Badge variant={variant}>{formatTitle(priority)}</Badge>;
}
