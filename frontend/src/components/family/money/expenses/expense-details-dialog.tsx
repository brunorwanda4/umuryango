import { FileTextIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, formatMinorUnits } from "../utils";
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
  if (!transaction) return null;

  const budget = getNoteLinkValue(transaction.notes, "Linked budget");
  const project = getNoteLinkValue(transaction.notes, "Linked project");
  const timeline = [
    {
      label: "Expense created",
      value: formatDate(transaction.createdAt),
      actor: transaction.createdBy.fullName,
    },
    transaction.status === "APPROVED" && transaction.approvedAt
      ? {
          label: "Approved",
          value: formatDate(transaction.approvedAt),
          actor: transaction.approvedBy?.fullName ?? "Approver",
        }
      : null,
    transaction.reversedAt
      ? {
          label: "Reversed",
          value: formatDate(transaction.reversedAt),
          actor: "Family audit",
        }
      : null,
    {
      label: "Last updated",
      value: formatDate(transaction.updatedAt),
      actor: "Family audit",
    },
  ].filter(Boolean) as { label: string; value: string; actor: string }[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Expense Details</DialogTitle>
          <DialogDescription>
            Full record, receipt, approval timeline, and audit history.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 lg:grid-cols-[1fr_0.9fr]">
          <section className="space-y-3 text-sm">
            <DetailRow
              label="Title"
              value={transaction.description || "Expense Transaction"}
              strong
            />
            <DetailRow
              label="Amount"
              value={formatMinorUnits(transaction.amountMinorUnits, currency)}
              strong
              mono
            />
            <DetailRow label="Category" value={transaction.category.name} />
            <DetailRow label="Date" value={formatDate(transaction.date)} />
            <DetailRow
              label="Paid To"
              value={transaction.receivedFrom || "Not recorded"}
            />
            <DetailRow
              label="Paid By"
              value={transaction.receivedBy || "Not recorded"}
            />
            <DetailRow
              label="Payment Method"
              value={formatPaymentMethod(transaction.paymentMethod)}
            />
            <DetailRow label="Budget" value={budget || "Not linked"} />
            <DetailRow label="Project" value={project || "Not linked"} />
            <div className="grid grid-cols-2 border-b pb-2">
              <span className="font-medium text-muted-foreground">Status</span>
              <div className="text-right">
                <ExpenseStatusBadge status={transaction.status} />
              </div>
            </div>
            <DetailRow
              label="Created By"
              value={transaction.createdBy.fullName}
            />
            <DetailRow
              label="Approved By"
              value={transaction.approvedBy?.fullName || "Not approved"}
            />
            {transaction.notes ? (
              <div className="border-b pb-2">
                <span className="mb-1 block font-medium text-muted-foreground">
                  Notes
                </span>
                <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs leading-5">
                  {transaction.notes}
                </p>
              </div>
            ) : null}
          </section>

          <aside className="space-y-4">
            <section className="rounded-md border p-3">
              <h3 className="font-semibold text-sm">Receipt</h3>
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
                  No receipt has been attached yet.
                </p>
              )}
            </section>

            <section className="rounded-md border p-3">
              <h3 className="font-semibold text-sm">Approval Timeline</h3>
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
                        {item.value} by {item.actor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-md border p-3">
              <h3 className="font-semibold text-sm">Audit History</h3>
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
  value: string;
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
