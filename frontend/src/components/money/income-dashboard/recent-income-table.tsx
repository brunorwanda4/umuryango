"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import { DataViewToggle } from "@/components/common/table/data-view-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePersistentViewMode } from "@/hooks/use-persistent-view-mode";
import { cn } from "@/lib/utils";
import type {
  IncomeCategory,
  RecentIncomeRecord,
} from "./income-dashboard-data";
import { RecentIncomeActionsPopover } from "./recent-income-actions-popover";
import { RecentIncomeFilter } from "./recent-income-filter";
import { RecentIncomeItems } from "./recent-income-items";
import { ViewIncomeDialog } from "./view-income-dialog";

const RECENT_INCOME_VIEW_MODE_STORAGE_KEY =
  "rwanda-family-recent-income-view-mode";

function getRecentIncomeColumns({
  categories,
  familyId,
  onSuccess,
}: {
  categories: IncomeCategory[];
  familyId: string;
  onSuccess: () => void | Promise<void>;
}): ColumnDef<RecentIncomeRecord>[] {
  return [
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => {
        return (
          <div className="flex min-w-44 items-center">
            <span className="font-medium text-muted-foreground">
              {row.original.source}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="block min-w-60 text-muted-foreground">
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
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
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-bold text-chart-2">
          <CompactMoney currency="RWF" value={row.original.amountMinorUnits} />
        </span>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.date}</span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment method",
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
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <RecentIncomeActionsPopover
            categories={categories}
            familyId={familyId}
            income={row.original}
            onSuccess={onSuccess}
          />
        </div>
      ),
    },
  ];
}

export function RecentIncomeTable({
  categories,
  data,
  familyId,
  onSuccess,
}: {
  categories: IncomeCategory[];
  data: RecentIncomeRecord[];
  familyId: string;
  onSuccess: () => void | Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [viewIncomeId, setViewIncomeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = usePersistentViewMode(
    RECENT_INCOME_VIEW_MODE_STORAGE_KEY,
  );
  const filteredIncomeData = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.filter(
      (income) =>
        (category === "all" || income.categoryId === category) &&
        (paymentMethod === "all" || income.account === paymentMethod) &&
        (!query ||
          [
            income.source,
            income.description,
            income.category,
            income.date,
            income.paymentMethod,
            income.amountMinorUnits.toString(),
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)),
    );
  }, [category, data, paymentMethod, search]);
  const recentIncomeColumns = useMemo(
    () => getRecentIncomeColumns({ categories, familyId, onSuccess }),
    [categories, familyId, onSuccess],
  );
  const selectedIncome = useMemo(
    () => data.find((income) => income.id === viewIncomeId),
    [data, viewIncomeId],
  );

  return (
    <Card className="rounded-2xl border-border/80 py-0 shadow-sm">
      <CardHeader className="flex items-center justify-between px-5 pt-5 pb-2 sm:px-6">
        <CardTitle className="font-bold text-base">Recent income</CardTitle>
        <DataViewToggle value={viewMode} onValueChange={setViewMode} />
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <RecentIncomeFilter
          category={category}
          categoryOptions={categories}
          paymentMethod={paymentMethod}
          resultCount={filteredIncomeData.length}
          search={search}
          totalCount={data.length}
          onCategoryChange={setCategory}
          onPaymentMethodChange={setPaymentMethod}
          onSearchChange={setSearch}
        />
        {viewMode === "table" ? (
          <CommonDataTable
            columns={recentIncomeColumns}
            data={filteredIncomeData}
            getRowAriaLabel={(row) =>
              `View income details for ${row.original.source}`
            }
            onRowClick={(row) => setViewIncomeId(row.original.id)}
            rowClassName={() => "hover:bg-muted/50"}
            className="rounded-none border-0 [&>div:last-child]:hidden [&_table]:w-full [&_tbody_tr]:h-[4.5rem] [&_thead_tr]:bg-transparent [&_th]:h-11 [&_th]:text-muted-foreground"
          />
        ) : (
          <RecentIncomeItems
            categories={categories}
            data={filteredIncomeData}
            familyId={familyId}
            onSuccess={onSuccess}
          />
        )}
      </CardContent>
      {selectedIncome ? (
        <ViewIncomeDialog
          categories={categories}
          familyId={familyId}
          income={selectedIncome}
          open={Boolean(viewIncomeId)}
          onOpenChange={(open) => {
            if (!open) {
              setViewIncomeId(null);
            }
          }}
          trigger={null}
          onSuccess={onSuccess}
        />
      ) : null}
    </Card>
  );
}
