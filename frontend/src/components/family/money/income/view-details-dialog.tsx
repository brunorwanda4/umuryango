import { CompactMoney } from "@/components/common/money/compact-money";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createTranslator } from "@/i18n/translate";
import { formatDate } from "../utils";
import type { IncomeTransaction } from "./types-and-schemas";

function getRemainingMinorUnits(transaction: IncomeTransaction) {
  if (!transaction.expectedAmountMinorUnits) return null;

  const remaining =
    BigInt(transaction.expectedAmountMinorUnits) -
    BigInt(transaction.amountMinorUnits);

  return remaining > BigInt(0) ? remaining.toString() : "0";
}

export function ViewDetailsDialog({
  open,
  onOpenChange,
  transaction,
  currency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: IncomeTransaction | null;
  currency: string;
}) {
  if (!transaction) return null;

  const t = createTranslator("FamilyIncome");
  const remainingMinorUnits = getRemainingMinorUnits(transaction);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[calc(100vh-2rem)] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>
            {t((m) => m.FamilyIncome.dialogs.detailsTitle)}
          </DialogTitle>
          <DialogDescription>
            {t((m) => m.FamilyIncome.dialogs.detailsDesc)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4 text-sm">
          <h2 className="text-2xl font-bold text-center mb-6">
            {transaction.description ||
              t((m) => m.FamilyIncome.details.defaultTitle)}
          </h2>

          <div className="grid grid-cols-2 border-b pb-2">
            <span className="text-muted-foreground font-medium">
              {t((m) => m.FamilyIncome.details.amount)}
            </span>
            <span className="font-mono font-semibold text-right text-primary">
              <CompactMoney
                currency={currency}
                value={transaction.amountMinorUnits}
              />
            </span>
          </div>

          {transaction.incomeRecurrence === "MONTHLY" && (
            <>
              <div className="grid grid-cols-2 border-b pb-2">
                <span className="text-muted-foreground font-medium">
                  {t((m) => m.FamilyIncome.details.expectedAmount)}
                </span>
                <span className="font-mono text-right">
                  {transaction.expectedAmountMinorUnits ? (
                    <CompactMoney
                      currency={currency}
                      value={transaction.expectedAmountMinorUnits}
                    />
                  ) : (
                    "-"
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 border-b pb-2">
                <span className="text-muted-foreground font-medium">
                  {t((m) => m.FamilyIncome.details.amountLeft)}
                </span>
                <span className="font-mono text-right">
                  {remainingMinorUnits === null ? (
                    "-"
                  ) : (
                    <CompactMoney
                      currency={currency}
                      value={remainingMinorUnits}
                    />
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 border-b pb-2">
                <span className="text-muted-foreground font-medium">
                  {t((m) => m.FamilyIncome.details.paymentStatus)}
                </span>
                <span className="text-right">
                  {transaction.paymentStatus.replace("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-2 border-b pb-2">
                <span className="text-muted-foreground font-medium">
                  {t((m) => m.FamilyIncome.details.dueDate)}
                </span>
                <span className="text-right">
                  {transaction.dueDate ? formatDate(transaction.dueDate) : "-"}
                </span>
              </div>

              <div className="grid grid-cols-2 border-b pb-2">
                <span className="text-muted-foreground font-medium">
                  {t((m) => m.FamilyIncome.details.houseOrUnit)}
                </span>
                <span className="text-right">
                  {transaction.propertyName || "-"}
                </span>
              </div>

              {(transaction.periodStart || transaction.periodEnd) && (
                <div className="grid grid-cols-2 border-b pb-2">
                  <span className="text-muted-foreground font-medium">
                    {t((m) => m.FamilyIncome.details.rentPeriod)}
                  </span>
                  <span className="text-right">
                    {t((m) => m.FamilyIncome.details.rentPeriodRange, {
                      start: transaction.periodStart
                        ? formatDate(transaction.periodStart)
                        : "-",
                      end: transaction.periodEnd
                        ? formatDate(transaction.periodEnd)
                        : "-",
                    })}
                  </span>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 border-b pb-2">
            <span className="text-muted-foreground font-medium">
              {t((m) => m.FamilyIncome.details.category)}
            </span>
            <span className="text-right">{transaction.category.name}</span>
          </div>

          <div className="grid grid-cols-2 border-b pb-2">
            <span className="text-muted-foreground font-medium">
              {t((m) => m.FamilyIncome.details.dateReceived)}
            </span>
            <span className="text-right">{formatDate(transaction.date)}</span>
          </div>

          <div className="grid grid-cols-2 border-b pb-2">
            <span className="text-muted-foreground font-medium">
              {t((m) => m.FamilyIncome.details.paymentMethod)}
            </span>
            <span className="text-right">
              {transaction.paymentMethod?.replace("_", " ")}
            </span>
          </div>

          <div className="grid grid-cols-2 border-b pb-2">
            <span className="text-muted-foreground font-medium">
              {t((m) => m.FamilyIncome.details.receivedFrom)}
            </span>
            <span className="text-right">
              {transaction.receivedFrom || "-"}
            </span>
          </div>

          <div className="grid grid-cols-2 border-b pb-2">
            <span className="text-muted-foreground font-medium">
              {t((m) => m.FamilyIncome.details.receivedBy)}
            </span>
            <span className="text-right">{transaction.receivedBy || "-"}</span>
          </div>

          <div className="grid grid-cols-2 border-b pb-2">
            <span className="text-muted-foreground font-medium">
              {t((m) => m.FamilyIncome.details.status)}
            </span>
            <div className="text-right">
              <Badge
                variant={
                  transaction.status === "APPROVED" ? "default" : "secondary"
                }
              >
                {transaction.status}
              </Badge>
            </div>
          </div>

          {transaction.notes && (
            <div className="border-b pb-2">
              <span className="text-muted-foreground font-medium block mb-1">
                {t((m) => m.FamilyIncome.details.notes)}
              </span>
              <p className="p-2 bg-muted rounded text-xs leading-5 whitespace-pre-wrap">
                {transaction.notes}
              </p>
            </div>
          )}

          {transaction.receipts && transaction.receipts.length > 0 && (
            <div className="border-b pb-2">
              <span className="text-muted-foreground font-medium block mb-1">
                {t((m) => m.FamilyIncome.details.receiptsCount, {
                  count: transaction.receipts.length,
                })}
              </span>
              <div className="flex flex-col gap-1.5 mt-1">
                {transaction.receipts.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2 bg-muted/50 border rounded text-xs"
                  >
                    <span className="font-medium truncate max-w-[200px]">
                      {r.fileName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 border-b pb-2 text-xs">
            <span className="text-muted-foreground">
              {t((m) => m.FamilyIncome.details.recordedBy)}
            </span>
            <span className="text-right font-medium">
              {transaction.createdBy.fullName}
            </span>
          </div>

          <div className="grid grid-cols-2 border-b pb-2 text-xs">
            <span className="text-muted-foreground">
              {t((m) => m.FamilyIncome.details.recordedDate)}
            </span>
            <span className="text-right font-medium">
              {formatDate(transaction.createdAt)}
            </span>
          </div>

          <div className="grid grid-cols-2 text-xs">
            <span className="text-muted-foreground">
              {t((m) => m.FamilyIncome.details.lastUpdated)}
            </span>
            <span className="text-right font-medium">
              {formatDate(transaction.updatedAt)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
