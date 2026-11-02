import {
  CheckCircle2Icon,
  EyeIcon,
  HandCoinsIcon,
  HistoryIcon,
  PencilIcon,
  SendIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import {
  formatDueTimeline,
  getInitials,
} from "@/components/common/loans/loan-calculations";
import type {
  SharedLoan,
  SharedLoanAction,
} from "@/components/common/loans/types";
import { createTranslator } from "@/i18n/translate";
import type { LoanAction } from "./loan-table";
import {
  formatPaymentMethod,
  getLoanProgress,
  isLoanOverdue,
  loanStatusLabel,
} from "./loan-utils";
import type { LoanRecord } from "./types-and-schemas";

export function mapFamilyLoanToSharedLoan(
  loan: LoanRecord,
  canManageLoans: boolean,
  onAction: (loan: LoanRecord, action: LoanAction) => void,
): SharedLoan {
  const t = createTranslator("FamilyLoans");
  const isSettled = loan.status === "COMPLETED" || loan.status === "CANCELLED";
  const overdue = isLoanOverdue(loan);
  const dueInfo = formatDueTimeline(loan.dueDate, isSettled);

  const isLent = loan.type === "MONEY_LENT";
  const counterpartyName = isLent ? loan.borrower : loan.lender;
  const counterpartyContactId = isLent
    ? loan.borrowerContactId
    : loan.lenderContactId;

  const subtitleParts = [
    loan.category,
    loan.paymentMethod ? formatPaymentMethod(loan.paymentMethod) : null,
  ].filter(Boolean);

  const canRepay =
    canManageLoans &&
    !isSettled &&
    (loan.status === "ACTIVE" || loan.status === "PARTIALLY_PAID" || overdue);

  const primaryAction: SharedLoanAction = canRepay
    ? {
        label: t((m) => m.FamilyLoans.addRepaymentAction),
        icon: HandCoinsIcon,
        onClick: () => onAction(loan, "repayment"),
      }
    : {
        label: t((m) => m.FamilyLoans.viewAction),
        icon: EyeIcon,
        onClick: () => onAction(loan, "view"),
      };

  const menuActions: SharedLoanAction[] = [
    {
      label: t((m) => m.FamilyLoans.viewAction),
      icon: EyeIcon,
      onClick: () => onAction(loan, "view"),
    },
  ];

  if (canManageLoans) {
    if (canRepay) {
      menuActions.push({
        label: t((m) => m.FamilyLoans.addRepaymentAction),
        icon: HandCoinsIcon,
        onClick: () => onAction(loan, "repayment"),
      });
    }

    if (!isSettled) {
      menuActions.push({
        label: t((m) => m.FamilyLoans.editAction),
        icon: PencilIcon,
        onClick: () => onAction(loan, "edit"),
      });
    }

    menuActions.push({
      label: t((m) => m.FamilyLoans.historyAction),
      icon: HistoryIcon,
      onClick: () => onAction(loan, "history"),
    });

    menuActions.push({
      label: t((m) => m.FamilyLoans.documentAction),
      icon: UploadIcon,
      onClick: () => onAction(loan, "document"),
    });

    if (
      loan.approvalStatus === "PENDING" ||
      loan.approvalStatus === "NOT_REQUIRED"
    ) {
      menuActions.push({
        label: t((m) => m.FamilyLoans.approvalAction),
        icon: SendIcon,
        onClick: () => onAction(loan, "approval"),
      });
    }

    if (!isSettled) {
      menuActions.push({
        label: t((m) => m.FamilyLoans.completeAction),
        icon: CheckCircle2Icon,
        onClick: () => onAction(loan, "complete"),
      });
    }

    if (loan.status === "DRAFT" || loan.status === "CANCELLED") {
      menuActions.push({
        label: t((m) => m.FamilyLoans.deleteAction),
        icon: Trash2Icon,
        onClick: () => onAction(loan, "delete"),
        variant: "destructive",
      });
    }
  }

  let statusLabel = loanStatusLabel(loan.status);
  if (overdue) statusLabel = "Overdue";

  return {
    id: loan.id,
    title: loan.title,
    direction: isLent ? "LENT" : "BORROWED",
    counterpartyName,
    counterpartySubtitle: subtitleParts.join(" · ") || null,
    counterpartyInitials: getInitials(counterpartyName),
    counterpartyContactId: counterpartyContactId ?? null,
    originalAmountMinorUnits: String(loan.originalAmountMinorUnits ?? "0"),
    paidAmountMinorUnits: String(loan.paidAmountMinorUnits ?? "0"),
    remainingAmountMinorUnits: String(loan.remainingBalanceMinorUnits ?? "0"),
    currency: loan.currency,
    dueDate: loan.dueDate,
    startDate: loan.startDate,
    status: loan.status,
    statusLabel,
    progressPercent: getLoanProgress(loan),
    isOverdue: overdue,
    dueLabel: dueInfo.label,
    categoryName: loan.category ?? null,
    notes: loan.notes ?? null,
    primaryAction,
    menuActions,
    onCardClick: () => onAction(loan, "view"),
  };
}
