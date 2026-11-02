import { EyeIcon, HandCoinsIcon } from "lucide-react";
import {
  formatDueTimeline,
  getInitials,
} from "@/components/common/loans/loan-calculations";
import type { SharedLoan } from "@/components/common/loans/types";
import { createTranslator } from "@/i18n/translate";
import { getLoanProgress, type PersonalLoan } from "./types-and-schemas";

export function mapPersonalLoanToSharedLoan(
  loan: PersonalLoan,
  onPayment: (loan: PersonalLoan) => void,
  onView: (loan: PersonalLoan) => void,
): SharedLoan {
  const t = createTranslator("SharedLoans");
  const isSettled = loan.status === "REPAID" || loan.status === "CANCELLED";
  const dueInfo = formatDueTimeline(loan.dueDate, isSettled);
  const isOverdue = loan.status === "OVERDUE" || dueInfo.isOverdue;

  let statusLabel = t((m) => m.SharedLoans.statusActive);
  if (loan.status === "REPAID") {
    statusLabel = t((m) => m.SharedLoans.statusRepaid);
  } else if (loan.status === "CANCELLED") {
    statusLabel = "Cancelled";
  } else if (isOverdue) {
    statusLabel = t((m) => m.SharedLoans.statusOverdue);
  }

  const canPay =
    loan.status === "ACTIVE" || loan.status === "OVERDUE" || isOverdue;

  const subtitle = [
    loan.person.relationship,
    loan.person.phoneNumber,
    loan.category?.name,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    id: loan.id,
    title: loan.title,
    direction: loan.type === "BORROWED" ? "BORROWED" : "LENT",
    counterpartyName: loan.person.name,
    counterpartySubtitle: subtitle || null,
    counterpartyInitials: getInitials(loan.person.name),
    counterpartyContactId: loan.person.id,
    originalAmountMinorUnits: loan.originalAmountMinorUnits,
    paidAmountMinorUnits: loan.paidAmountMinorUnits,
    remainingAmountMinorUnits: loan.remainingBalanceMinorUnits,
    currency: loan.currency,
    dueDate: loan.dueDate,
    startDate: loan.startDate,
    status: loan.status,
    statusLabel,
    progressPercent: getLoanProgress(loan),
    isOverdue,
    dueLabel: dueInfo.label,
    categoryName: loan.category?.name ?? null,
    notes: loan.notes,
    primaryAction: canPay
      ? {
          label: t((m) => m.SharedLoans.recordPayment),
          icon: HandCoinsIcon,
          onClick: () => onPayment(loan),
        }
      : {
          label: t((m) => m.SharedLoans.viewDetails),
          icon: EyeIcon,
          onClick: () => onView(loan),
        },
    menuActions: [
      {
        label: t((m) => m.SharedLoans.viewDetails),
        icon: EyeIcon,
        onClick: () => onView(loan),
      },
      ...(canPay
        ? [
            {
              label: t((m) => m.SharedLoans.recordPayment),
              icon: HandCoinsIcon,
              onClick: () => onPayment(loan),
            },
          ]
        : []),
    ],
    onCardClick: () => onView(loan),
  };
}
