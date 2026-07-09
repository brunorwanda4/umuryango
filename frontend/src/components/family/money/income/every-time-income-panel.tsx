"use client";

import {
  AlertCircleIcon,
  CalendarClockIcon,
  CoinsIcon,
  HomeIcon,
  PlusIcon,
  WalletIcon,
} from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FamilyDetail } from "../../dashboard/types";
import { formatDate, formatMinorUnits } from "../utils";
import { IncomeTable } from "./income-table";
import type { IncomeTransaction } from "./types-and-schemas";

type EveryTimeIncomePanelProps = {
  transactions: IncomeTransaction[];
  currency: string;
  isAdmin: boolean;
  family: FamilyDetail;
  handleActionClick: (
    tx: IncomeTransaction,
    action: "view" | "edit" | "delete" | "receipt",
  ) => void;
  handleSendApproval: (tx: IncomeTransaction) => void;
  setOpenCreate: (open: boolean) => void;
};

type SourceSummary = {
  key: string;
  title: string;
  category: string;
  payer: string;
  recordCount: number;
  expectedMinorUnits: bigint;
  paidMinorUnits: bigint;
  leftMinorUnits: bigint;
  nextDueDate: string | null;
  statuses: Set<IncomeTransaction["paymentStatus"]>;
};

function toBigInt(value: string | null | undefined) {
  if (!value) return BigInt(0);
  return BigInt(value);
}

function getLeftMinorUnits(transaction: IncomeTransaction) {
  const expected = toBigInt(transaction.expectedAmountMinorUnits);
  const paid = toBigInt(transaction.amountMinorUnits);
  const left = expected - paid;

  return left > BigInt(0) ? left : BigInt(0);
}

function getSourceKey(transaction: IncomeTransaction) {
  return [
    transaction.propertyName,
    transaction.receivedFromContactId,
    transaction.receivedFrom,
    transaction.description,
    transaction.category.name,
  ]
    .filter(Boolean)
    .join("|");
}

function getSourceTitle(transaction: IncomeTransaction) {
  return (
    transaction.propertyName ||
    transaction.description ||
    transaction.category.name ||
    "Recurring income"
  );
}

function isBeforeToday(dateValue: string | null) {
  if (!dateValue) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);

  return date < today;
}

export function EveryTimeIncomePanel({
  transactions,
  currency,
  isAdmin,
  family,
  handleActionClick,
  handleSendApproval,
  setOpenCreate,
}: EveryTimeIncomePanelProps) {
  const summary = useMemo(() => {
    let expectedMinorUnits = BigInt(0);
    let paidMinorUnits = BigInt(0);
    let leftMinorUnits = BigInt(0);
    let overdueCount = 0;
    const sources = new Map<string, SourceSummary>();

    for (const transaction of transactions) {
      const expected = toBigInt(transaction.expectedAmountMinorUnits);
      const paid = toBigInt(transaction.amountMinorUnits);
      const left = getLeftMinorUnits(transaction);

      expectedMinorUnits += expected;
      paidMinorUnits += paid;
      leftMinorUnits += left;

      if (left > BigInt(0) && isBeforeToday(transaction.dueDate)) {
        overdueCount += 1;
      }

      const key = getSourceKey(transaction) || transaction.id;
      const existing = sources.get(key);

      if (existing) {
        existing.recordCount += 1;
        existing.expectedMinorUnits += expected;
        existing.paidMinorUnits += paid;
        existing.leftMinorUnits += left;
        existing.statuses.add(transaction.paymentStatus);

        if (
          transaction.dueDate &&
          (!existing.nextDueDate ||
            new Date(transaction.dueDate) < new Date(existing.nextDueDate))
        ) {
          existing.nextDueDate = transaction.dueDate;
        }
      } else {
        sources.set(key, {
          key,
          title: getSourceTitle(transaction),
          category: transaction.category.name,
          payer: transaction.receivedFrom || "Not recorded",
          recordCount: 1,
          expectedMinorUnits: expected,
          paidMinorUnits: paid,
          leftMinorUnits: left,
          nextDueDate: transaction.dueDate,
          statuses: new Set([transaction.paymentStatus]),
        });
      }
    }

    return {
      expectedMinorUnits,
      paidMinorUnits,
      leftMinorUnits,
      overdueCount,
      sources: [...sources.values()].sort((a, b) =>
        a.title.localeCompare(b.title),
      ),
    };
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
            <CalendarClockIcon className="size-6 text-muted-foreground" />
          </span>
          <h3 className="font-semibold text-lg">No every-time income yet</h3>
          <p className="mt-1 mb-6 max-w-sm text-muted-foreground text-sm">
            Add monthly rent, salary, business income, or other money the family
            expects again and again.
          </p>
          <Button size="sm" onClick={() => setOpenCreate(true)}>
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
            Add Every-Time Income
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider">
              Expected
            </CardTitle>
            <WalletIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="truncate font-bold text-xl">
              {formatMinorUnits(
                summary.expectedMinorUnits.toString(),
                currency,
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider">
              Paid
            </CardTitle>
            <CoinsIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="truncate font-bold text-xl">
              {formatMinorUnits(summary.paidMinorUnits.toString(), currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider">
              Left
            </CardTitle>
            <AlertCircleIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="truncate font-bold text-xl">
              {formatMinorUnits(summary.leftMinorUnits.toString(), currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider">
              Overdue
            </CardTitle>
            <CalendarClockIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="truncate font-bold text-xl">
              {summary.overdueCount}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {summary.sources.map((source) => (
          <Card key={source.key}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate text-base">
                    {source.title}
                  </CardTitle>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {source.category} - {source.payer}
                  </p>
                </div>
                <HomeIcon className="size-4 shrink-0 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-muted-foreground text-xs">Expected</div>
                  <div className="font-mono">
                    {formatMinorUnits(
                      source.expectedMinorUnits.toString(),
                      currency,
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Paid</div>
                  <div className="font-mono">
                    {formatMinorUnits(
                      source.paidMinorUnits.toString(),
                      currency,
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Left</div>
                  <div className="font-mono">
                    {formatMinorUnits(
                      source.leftMinorUnits.toString(),
                      currency,
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs">
                  {source.recordCount} record
                  {source.recordCount === 1 ? "" : "s"}
                  {source.nextDueDate
                    ? ` - next due ${formatDate(source.nextDueDate)}`
                    : ""}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[...source.statuses].map((status) => (
                    <Badge key={status} variant="secondary">
                      {status.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <IncomeTable
        filteredTransactions={transactions}
        currency={currency}
        isAdmin={isAdmin}
        family={family}
        handleActionClick={handleActionClick}
        handleSendApproval={handleSendApproval}
        setOpenCreate={setOpenCreate}
      />
    </div>
  );
}
