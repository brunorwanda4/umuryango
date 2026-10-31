"use client";

import { CoinsIcon, PlusIcon, ReceiptTextIcon, WalletIcon } from "lucide-react";
import { useMemo } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTranslator } from "@/i18n/translate";
import type { FamilyDetail } from "../../dashboard/types";
import type { IncomeFiltersProps } from "./income-filters";
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
} & IncomeFiltersProps;

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
  search,
  setSearch,
  filterCategory,
  setFilterCategory,
  filterPaymentMethod,
  setFilterPaymentMethod,
  filterStatus,
  setFilterStatus,
  filterMember,
  setFilterMember,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  resetFilters,
  categories,
}: OneTimeIncomePanelProps) {
  const t = createTranslator("FamilyIncome");
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

  const hasActiveFilters =
    Boolean(search) ||
    filterCategory !== "all" ||
    filterPaymentMethod !== "all" ||
    filterStatus !== "all" ||
    filterMember !== "all" ||
    Boolean(startDate) ||
    Boolean(endDate);

  if (transactions.length === 0 && !hasActiveFilters) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
            <CoinsIcon className="size-6 text-muted-foreground" />
          </span>
          <h3 className="font-semibold text-lg">
            {t((m) => m.FamilyIncome.panels.noOneTime)}
          </h3>
          <p className="mt-1 mb-6 max-w-sm text-muted-foreground text-sm">
            {t((m) => m.FamilyIncome.panels.noOneTimeDesc)}
          </p>
          <Button size="sm" onClick={() => setOpenCreate(true)}>
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
            {t((m) => m.FamilyIncome.panels.addOneTime)}
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
              {t((m) => m.FamilyIncome.panels.totalOneTime)}
            </CardTitle>
            <WalletIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="truncate font-bold text-xl">
              <CompactMoney
                currency={currency}
                value={summary.totalMinorUnits.toString()}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider">
              {t((m) => m.FamilyIncome.panels.approved)}
            </CardTitle>
            <CoinsIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="truncate font-bold text-xl">
              <CompactMoney
                currency={currency}
                value={summary.approvedMinorUnits.toString()}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider">
              {t((m) => m.FamilyIncome.panels.pending)}
            </CardTitle>
            <ReceiptTextIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="truncate font-bold text-xl">
              <CompactMoney
                currency={currency}
                value={summary.pendingMinorUnits.toString()}
              />
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
        search={search}
        setSearch={setSearch}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterPaymentMethod={filterPaymentMethod}
        setFilterPaymentMethod={setFilterPaymentMethod}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterMember={filterMember}
        setFilterMember={setFilterMember}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        resetFilters={resetFilters}
        categories={categories}
      />
    </div>
  );
}
