"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import { DataViewToggle } from "@/components/common/table/data-view-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePersistentViewMode } from "@/hooks/use-persistent-view-mode";
import { createTranslator } from "@/i18n/translate";
import { cn } from "@/lib/utils";
import type {
  ExpenseCategory,
  RecentExpenseRecord,
} from "./expense-dashboard-data";
import { RecentExpenseActionsPopover } from "./recent-expense-actions-popover";
import { RecentExpenseFilter } from "./recent-expense-filter";
import { RecentExpenseItems } from "./recent-expense-items";
import { ViewExpenseDialog } from "./view-expense-dialog";

const RECENT_EXPENSE_VIEW_MODE_STORAGE_KEY =
  "umuryango-recent-expense-view-mode";

function getRecentExpenseColumns({
  categories,
  familyId,
  onSuccess,
}: {
  categories: ExpenseCategory[];
  familyId: string;
  onSuccess: () => void | Promise<void>;
}): ColumnDef<RecentExpenseRecord>[] {
  const t = createTranslator("PersonalMoney.personalExpenses");

  return [
    {
      accessorKey: "source",
      header: t((m) => m.PersonalMoney.personalExpenses.table.source),
      cell: ({ row }) => {
        const SourceIcon = row.original.icon;

        return (
          <div className="flex min-w-44 items-center gap-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full",
                row.original.sourceClassName,
              )}
            >
              <SourceIcon className="size-4" aria-hidden="true" />
            </span>
            <span className="font-medium text-muted-foreground">
              {row.original.source}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: t((m) => m.PersonalMoney.personalExpenses.table.description),
      cell: ({ row }) => (
        <span className="block min-w-60 text-muted-foreground">
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: "category",
      header: t((m) => m.PersonalMoney.personalExpenses.table.category),
      cell: ({ row }) => (
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 font-medium text-xs",
            row.original.categoryClassName,
          )}
        >
          {row.original.category}
        </span>
      ),
    },
    {
      accessorKey: "amountMinorUnits",
      header: t((m) => m.PersonalMoney.personalExpenses.table.amount),
      cell: ({ row }) => (
        <span className="font-bold text-chart-1">
          <CompactMoney currency="RWF" value={row.original.amountMinorUnits} />
        </span>
      ),
    },
    {
      accessorKey: "date",
      header: t((m) => m.PersonalMoney.personalExpenses.table.date),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.date}</span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: t((m) => m.PersonalMoney.personalExpenses.table.paymentMethod),
      cell: ({ row }) => {
        const PaymentIcon = row.original.paymentIcon;

        return (
          <div className="flex min-w-44 items-center gap-2.5 text-muted-foreground">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-md",
                row.original.paymentClassName,
              )}
            >
              <PaymentIcon className="size-4" aria-hidden="true" />
            </span>
            {row.original.paymentMethod}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => (
        <div className="text-right">
          {t((m) => m.PersonalMoney.personalExpenses.table.actions)}
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-end">
          <RecentExpenseActionsPopover
            categories={categories}
            familyId={familyId}
            expense={row.original}
            onSuccess={onSuccess}
          />
        </div>
      ),
    },
  ];
}

export function RecentExpenseTable({
  categories,
  data,
  familyId,
  onSuccess,
}: {
  categories: ExpenseCategory[];
  data: RecentExpenseRecord[];
  familyId: string;
  onSuccess: () => void | Promise<void>;
}) {
  const t = createTranslator("PersonalMoney.personalExpenses");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [viewExpenseId, setViewExpenseId] = useState<string | null>(null);
  const [viewMode, setViewMode] = usePersistentViewMode(
    RECENT_EXPENSE_VIEW_MODE_STORAGE_KEY,
  );
  const filteredExpenseData = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.filter(
      (expense) =>
        (category === "all" || expense.categoryId === category) &&
        (paymentMethod === "all" || expense.account === paymentMethod) &&
        (!query ||
          [
            expense.source,
            expense.description,
            expense.category,
            expense.date,
            expense.paymentMethod,
            expense.amountMinorUnits.toString(),
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)),
    );
  }, [category, data, paymentMethod, search]);
  const recentExpenseColumns = useMemo(
    () => getRecentExpenseColumns({ categories, familyId, onSuccess }),
    [categories, familyId, onSuccess],
  );
  const selectedExpense = useMemo(
    () => data.find((expense) => expense.id === viewExpenseId),
    [data, viewExpenseId],
  );

  return (
    <Card className="rounded-2xl border border-zinc-800/80 bg-[#0f0f12] py-0 shadow-xs">
      <CardHeader className="flex items-center justify-between px-5 pt-5 pb-2 sm:px-6">
        <CardTitle className="font-bold text-base">
          {t((m) => m.PersonalMoney.personalExpenses.table.recentExpenses)}
        </CardTitle>
        <DataViewToggle value={viewMode} onValueChange={setViewMode} />
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <RecentExpenseFilter
          category={category}
          categoryOptions={categories}
          paymentMethod={paymentMethod}
          resultCount={filteredExpenseData.length}
          search={search}
          totalCount={data.length}
          onCategoryChange={setCategory}
          onPaymentMethodChange={setPaymentMethod}
          onSearchChange={setSearch}
        />
        {viewMode === "table" ? (
          <CommonDataTable
            columns={recentExpenseColumns}
            data={filteredExpenseData}
            getRowAriaLabel={(row) =>
              t((m) => m.PersonalMoney.personalExpenses.table.viewExpenseAria, {
                source: row.original.source,
              })
            }
            onRowClick={(row) => setViewExpenseId(row.original.id)}
            rowClassName={() => "hover:bg-muted/50"}
            className="rounded-none border-0 [&>div:last-child]:hidden [&_table]:w-full [&_tbody_tr]:h-[4.5rem] [&_thead_tr]:bg-transparent [&_th]:h-11 [&_th]:text-muted-foreground"
          />
        ) : (
          <RecentExpenseItems
            categories={categories}
            data={filteredExpenseData}
            familyId={familyId}
            onSuccess={onSuccess}
          />
        )}
      </CardContent>
      {selectedExpense ? (
        <ViewExpenseDialog
          categories={categories}
          familyId={familyId}
          expense={selectedExpense}
          open={Boolean(viewExpenseId)}
          onOpenChange={(open) => {
            if (!open) {
              setViewExpenseId(null);
            }
          }}
          trigger={null}
          onSuccess={onSuccess}
        />
      ) : null}
    </Card>
  );
}
