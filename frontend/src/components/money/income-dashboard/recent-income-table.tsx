"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  type RecentIncomeRecord,
  recentIncomeData,
} from "./income-dashboard-data";
import { RecentIncomeFilter } from "./recent-income-filter";

const recentIncomeColumns: ColumnDef<RecentIncomeRecord>[] = [
  {
    accessorKey: "source",
    header: "Source",
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
        <button
          type="button"
          aria-label={`Open actions for ${row.original.source}`}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <MoreHorizontalIcon className="size-4" />
        </button>
      </div>
    ),
  },
];

export function RecentIncomeTable() {
  const [search, setSearch] = useState("");
  const filteredIncomeData = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return recentIncomeData;
    }

    return recentIncomeData.filter((income) =>
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
        .includes(query),
    );
  }, [search]);

  return (
    <Card className="rounded-2xl border-border/80 py-0 shadow-sm">
      <CardHeader className="px-5 pt-5 pb-2 sm:px-6">
        <CardTitle className="font-bold text-base">Recent income</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <RecentIncomeFilter
          resultCount={filteredIncomeData.length}
          search={search}
          totalCount={recentIncomeData.length}
          onSearchChange={setSearch}
        />
        <CommonDataTable
          columns={recentIncomeColumns}
          data={filteredIncomeData}
          className="rounded-none border-0 [&>div:last-child]:hidden [&_table]:w-full [&_tbody_tr]:h-[4.5rem] [&_thead_tr]:bg-transparent [&_th]:h-11 [&_th]:text-muted-foreground"
        />
      </CardContent>
    </Card>
  );
}
