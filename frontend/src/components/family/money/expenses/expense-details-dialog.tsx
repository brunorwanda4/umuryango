import { FileTextIcon } from "lucide-react";
import type { ReactNode } from "react";
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
import { ExpenseStatusBadge } from "./expense-table";
import { formatPaymentMethod, getNoteLinkValue } from "./expense-utils";
import type { ExpenseTransaction } from "./types-and-schemas";

export function ExpenseDetailsDialog({
  open,
  onOpenChange,
  transaction,
  currency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: ExpenseTransaction | null;
  currency: string;
}) {
  const t = createTranslator("FamilyExpenses");
  const tCommon = createTranslator("Common");

  if (!transaction) return null;

  const budget = getNoteLinkValue(transaction.notes, "Linked budget");
  const project = getNoteLinkValue(transaction.notes, "Linked project");
  const timeline = [
    {
      label: t((m) => m.FamilyExpenses.dialogs.expenseCreated),
      value: formatDate(transaction.createdAt),
      actor: transaction.createdBy.fullName,
    },
    transaction.status === "APPROVED" && transaction.approvedAt
      ? {
          label: tCommon("status.approved"),
          value: formatDate(transaction.approvedAt),
          actor: transaction.approvedBy?.fullName ?? "Approver",
        }
      : null,
    transaction.reversedAt
      ? {
          label: t((m) => m.FamilyExpenses.dialogs.reversed),
          value: formatDate(transaction.reversedAt),
          actor: "Family audit",
        }
      : null,
    {
      label: t((m) => m.FamilyExpenses.dialogs.lastUpdated),
      value: formatDate(transaction.updatedAt),
      actor: "Family audit",
    },
  ].filter(Boolean) as { label: string; value: string; actor: string }[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {t((m) => m.FamilyExpenses.dialogs.detailsTitle)}
          </DialogTitle>
          <DialogDescription>
            {t((m) => m.FamilyExpenses.dialogs.detailsDesc)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 lg:grid-cols-[1fr_0.9fr]">
          <section className="space-y-3 text-sm">
            <DetailRow
              label={t((m) => m.FamilyExpenses.form.titleLabel)}
              value={
                transaction.description ||
                t((m) => m.FamilyExpenses.dialogs.addTitle)
              }
              strong
            />
            <DetailRow
              label={t((m) => m.FamilyExpenses.analytics.amount)}
              value={
                <CompactMoney
                  currency={currency}
                  value={transaction.amountMinorUnits}
                />
              }
              strong
              mono
            />
            <DetailRow
              label={t((m) => m.FamilyExpenses.form.categoryLabel)}
              value={transaction.category.name}
            />
            <DetailRow
              label={t((m) => m.FamilyExpenses.form.dateLabel)}
              value={formatDate(transaction.date)}
            />
            <DetailRow
              label={t((m) => m.FamilyExpenses.form.paidToLabel)}
              value={
                transaction.receivedFrom ||
                t((m) => m.FamilyExpenses.table.notRecorded)
              }
            />
            <DetailRow
              label={t((m) => m.FamilyExpenses.form.paidByLabel)}
              value={
                transaction.receivedBy ||
                t((m) => m.FamilyExpenses.table.notRecorded)
              }
            />
            <DetailRow
              label={t((m) => m.FamilyExpenses.form.paymentMethodLabel)}
              value={formatPaymentMethod(transaction.paymentMethod)}
            />
            <DetailRow
              label={t((m) => m.FamilyExpenses.form.budgetLabel)}
              value={budget || t((m) => m.FamilyExpenses.dialogs.notLinked)}
            />
            <DetailRow
              label={t((m) => m.FamilyExpenses.form.projectLabel)}
              value={project || t((m) => m.FamilyExpenses.dialogs.notLinked)}
            />
            <div className="grid grid-cols-2 border-b pb-2">
              <span className="font-medium text-muted-foreground">
                {t((m) => m.FamilyExpenses.form.statusLabel)}
              </span>
              <div className="text-right">
                <ExpenseStatusBadge status={transaction.status} />
              </div>
            </div>
            <DetailRow
              label={t((m) => m.FamilyExpenses.dialogs.createdBy)}
              value={transaction.createdBy.fullName}
            />
            <DetailRow
              label={t((m) => m.FamilyExpenses.dialogs.approvedBy)}
              value={
                transaction.approvedBy?.fullName ||
                t((m) => m.FamilyExpenses.dialogs.notApproved)
              }
            />
            {transaction.notes ? (
              <div className="border-b pb-2">
                <span className="mb-1 block font-medium text-muted-foreground">
                  {t((m) => m.FamilyExpenses.form.notesLabel)}
                </span>
                <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs leading-5">
                  {transaction.notes}
                </p>
              </div>
            ) : null}
          </section>

          <aside className="space-y-4">
            <section className="rounded-md border p-3">
              <h3 className="font-semibold text-sm">
                {t((m) => m.FamilyExpenses.dialogs.receiptSection)}
              </h3>
              {transaction.receipts?.length ? (
                <div className="mt-3 space-y-2">
                  {transaction.receipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="flex items-center justify-between gap-3 rounded-md bg-muted/60 p-2 text-xs"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium">
                          {receipt.fileName}
                        </span>
                      </div>
                      <span className="shrink-0 text-muted-foreground">
                        {formatDate(receipt.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-muted-foreground text-xs">
                  {t((m) => m.FamilyExpenses.dialogs.noReceiptAttached)}
                </p>
              )}
            </section>

            <section className="rounded-md border p-3">
              <h3 className="font-semibold text-sm">
                {t((m) => m.FamilyExpenses.dialogs.approvalTimeline)}
              </h3>
              <div className="mt-3 space-y-3">
                {timeline.map((item) => (
                  <div
                    key={`${item.label}-${item.value}`}
                    className="flex gap-3"
                  >
                    <span className="mt-1 size-2 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-muted-foreground text-xs">
                        {t((m) => m.FamilyExpenses.dialogs.byActor, {
                          date: item.value,
                          actor: item.actor,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-md border p-3">
              <h3 className="font-semibold text-sm">
                {t((m) => m.FamilyExpenses.dialogs.auditHistory)}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">TRANSACTION_CREATED</Badge>
                {transaction.updatedAt !== transaction.createdAt ? (
                  <Badge variant="outline">TRANSACTION_UPDATED</Badge>
                ) : null}
                {transaction.approvedAt ? (
                  <Badge variant="outline">TRANSACTION_APPROVED</Badge>
                ) : null}
                {transaction.reversedAt ? (
                  <Badge variant="outline">TRANSACTION_REVERSED</Badge>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  strong = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 border-b pb-2">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span
        className={`text-right ${strong ? "font-semibold" : ""} ${
          mono ? "font-mono text-primary" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
