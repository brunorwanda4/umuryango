import { ReceiptTextIcon } from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { formatPaymentMethod } from "@/components/family/money/loans/loan-utils";
import { formatDate } from "@/components/family/money/utils";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { createTranslator } from "@/i18n/translate";
import type { LoanPayment } from "./types-and-schemas";

export function LoanPaymentHistory({
  currency,
  payments,
}: {
  currency: string;
  payments: LoanPayment[];
}) {
  const t = createTranslator("PersonalLoans");

  if (payments.length === 0)
    return (
      <p className="text-sm text-muted-foreground">{t("details.noPayments")}</p>
    );
  return (
    <ItemGroup>
      {payments.map((payment) => (
        <Item key={payment.id} variant="muted" size="sm">
          <ItemMedia variant="icon">
            <ReceiptTextIcon aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              <CompactMoney
                currency={currency}
                value={payment.amountMinorUnits}
              />
            </ItemTitle>
            <ItemDescription>
              {formatDate(payment.paymentDate)} ·{" "}
              {formatPaymentMethod(payment.paymentMethod)}
            </ItemDescription>
            {payment.notes ? (
              <p className="text-xs text-muted-foreground">{payment.notes}</p>
            ) : null}
            {payment.createdByName ? (
              <p className="text-xs text-muted-foreground">
                {t("details.recordedBy", { name: payment.createdByName })}
              </p>
            ) : null}
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  );
}
