import { CalendarDaysIcon, EyeIcon, HandCoinsIcon } from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { formatDate } from "@/components/family/money/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { createTranslator } from "@/i18n/translate";
import { LoanProgress } from "./loan-progress";
import { getLoanProgress, type PersonalLoan } from "./types-and-schemas";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function LoanItem({
  loan,
  onPayment,
  onView,
}: {
  loan: PersonalLoan;
  onPayment: (loan: PersonalLoan) => void;
  onView: (loan: PersonalLoan) => void;
}) {
  const t = createTranslator("PersonalLoans");
  const progress = getLoanProgress(loan);
  const canPay = loan.status === "ACTIVE" || loan.status === "OVERDUE";

  const statusLabel =
    loan.status === "REPAID"
      ? t("filters.repaid")
      : loan.status === "ACTIVE"
        ? t("filters.active")
        : loan.status === "OVERDUE"
          ? t("filters.overdue")
          : t("filters.cancelled");

  return (
    <Item variant="outline" className="items-start gap-4 bg-card p-4 sm:p-5">
      <ItemHeader>
        <div className="flex min-w-0 items-center gap-3">
          <ItemMedia>
            <Avatar className="size-11">
              <AvatarFallback>{initials(loan.person.name)}</AvatarFallback>
            </Avatar>
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle className="line-clamp-1 text-base">
              {loan.title}
            </ItemTitle>
            <ItemDescription>
              {loan.type === "BORROWED"
                ? t("item.borrowedFrom", { name: loan.person.name })
                : t("item.lentTo", { name: loan.person.name })}
              {loan.person.relationship ? ` · ${loan.person.relationship}` : ""}
            </ItemDescription>
          </ItemContent>
        </div>
        <Badge
          variant={
            loan.status === "CANCELLED"
              ? "outline"
              : loan.status === "OVERDUE"
                ? "destructive"
                : loan.status === "REPAID"
                  ? "secondary"
                  : "default"
          }
        >
          {statusLabel}
        </Badge>
      </ItemHeader>

      <ItemContent className="basis-full gap-4">
        <div className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-5">
          <div>
            <p className="text-muted-foreground">{t("item.loanAmount")}</p>
            <p className="font-semibold">
              <CompactMoney
                currency={loan.currency}
                value={loan.originalAmountMinorUnits}
              />
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("item.paid")}</p>
            <p className="font-semibold">
              <CompactMoney
                currency={loan.currency}
                value={loan.paidAmountMinorUnits}
              />
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("item.remaining")}</p>
            <p className="font-semibold text-primary">
              <CompactMoney
                currency={loan.currency}
                value={loan.remainingBalanceMinorUnits}
              />
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("item.startDate")}</p>
            <p className="font-medium">{formatDate(loan.startDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("item.dueDate")}</p>
            <p className="font-medium">{formatDate(loan.dueDate)}</p>
          </div>
        </div>
        <LoanProgress value={progress} />
      </ItemContent>

      <ItemFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDaysIcon className="size-4" aria-hidden="true" />
          {loan.person.name}
        </div>
        <ItemActions className="grid grid-cols-2 sm:flex">
          <Button variant="outline" size="sm" onClick={() => onView(loan)}>
            <EyeIcon aria-hidden="true" data-icon="inline-start" />
            {t("item.viewDetails")}
          </Button>
          {canPay ? (
            <Button size="sm" onClick={() => onPayment(loan)}>
              <HandCoinsIcon aria-hidden="true" data-icon="inline-start" />
              {t("item.recordPayment")}
            </Button>
          ) : null}
        </ItemActions>
      </ItemFooter>
    </Item>
  );
}
