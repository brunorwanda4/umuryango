"use client";

import { CoinsIcon, PlusIcon, ReceiptTextIcon, WalletIcon } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FamilyDetail } from "../../dashboard/types";
import { formatMinorUnits } from "../utils";
import { IncomeTable } from "./income-table";
import type { IncomeTransaction } from "./types-and-schemas";

type OneTimeIncomePanelProps = {
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

function toBigInt(value: string | null | undefined) {
  if (!value) return BigInt(0);
  return BigInt(value);
}

export function OneTimeIncomePanel({
  transactions,
  currency,
  isAdmin,
  family,
  handleActionClick,
  handleSendApproval,
  setOpenCreate,
}: OneTimeIncomePanelProps) {
  const summary = useMemo(() => {
    let totalMinorUnits = BigInt(0);
    let approvedMinorUnits = BigInt(0);
    let pendingMinorUnits = BigInt(0);

    for (const transaction of transactions) {
      const amount = toBigInt(transaction.amountMinorUnits);
      totalMinorUnits += amount;

      if (transaction.status === "APPROVED") {
        approvedMinorUnits += amount;
      }

      if (transaction.status === "PENDING") {
        pendingMinorUnits += amount;
      }
    }

    return {
      totalMinorUnits,
      approvedMinorUnits,
      pendingMinorUnits,
    };
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
            <CoinsIcon className="size-6 text-muted-foreground" />
          </span>
          <h3 className="font-semibold text-lg">No one-time income yet</h3>
          <p className="mt-1 mb-6 max-w-sm text-muted-foreground text-sm">
            Add gifts, donations, one-off business payments, or any money that
            does not repeat.
          </p>
          <Button size="sm" onClick={() => setOpenCreate(true)}>
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
            Add One-Time Income
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider">
              Total One-Time
            </CardTitle>
            <WalletIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="truncate font-bold text-xl">
              {formatMinorUnits(summary.totalMinorUnits.toString(), currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider">
              Approved
            </CardTitle>
            <CoinsIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="truncate font-bold text-xl">
              {formatMinorUnits(
                summary.approvedMinorUnits.toString(),
                currency,
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider">
              Pending
            </CardTitle>
            <ReceiptTextIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="truncate font-bold text-xl">
              {formatMinorUnits(summary.pendingMinorUnits.toString(), currency)}
            </div>
          </CardContent>
        </Card>
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
