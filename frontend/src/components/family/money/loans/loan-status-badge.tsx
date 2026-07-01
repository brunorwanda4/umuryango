import { Badge } from "@/components/ui/badge";
import {
  getEffectiveLoanStatus,
  isLoanOverdue,
  loanStatusLabel,
} from "./loan-utils";
import type {
  LoanApprovalStatus,
  LoanRecord,
  LoanStatus,
} from "./types-and-schemas";

export function LoanStatusBadge({ loan }: { loan: LoanRecord }) {
  const status = getEffectiveLoanStatus(loan);
  const variant = getStatusVariant(status, isLoanOverdue(loan));

  return <Badge variant={variant}>{loanStatusLabel(status)}</Badge>;
}

export function ApprovalStatusBadge({
  status,
}: {
  status: LoanApprovalStatus;
}) {
  const variant =
    status === "APPROVED"
      ? "default"
      : status === "PENDING"
        ? "secondary"
        : status === "REJECTED"
          ? "destructive"
          : "outline";

  return <Badge variant={variant}>{loanStatusLabel(status)}</Badge>;
}

function getStatusVariant(status: LoanStatus, overdue: boolean) {
  if (overdue || status === "OVERDUE") return "destructive";
  if (status === "COMPLETED") return "default";
  if (status === "ACTIVE" || status === "PARTIALLY_PAID") return "secondary";
  return "outline";
}
