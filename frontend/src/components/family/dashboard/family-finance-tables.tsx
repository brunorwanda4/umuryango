import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useMemo } from "react";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CATEGORY_ICONS } from "../money/mock-finance-data";
import type {
  AmountValue,
  ExpenseCategoryRow,
  IncomeSourceRow,
  TransactionRow,
} from "./family-finance-helpers";

export function ExpenseCategoriesTable({
  data,
  formatAmount,
  isDemo,
}: {
  data: ExpenseCategoryRow[];
  formatAmount: (amount: AmountValue) => string;
  isDemo: boolean;
}) {
  const columns = useMemo<ColumnDef<ExpenseCategoryRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Category",
        cell: ({ row }) => {
          const Icon =
            CATEGORY_ICONS[row.original.name] || CATEGORY_ICONS.Miscellaneous;

          return (
            <div className="flex items-center gap-3 font-medium">
              <div className="rounded-md bg-muted p-2">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              {row.original.name}
            </div>
          );
        },
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">This Month</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {formatAmount(row.original.amount)}
          </div>
        ),
      },
      {
        accessorKey: "lastMonth",
        header: () => <div className="text-right">Last Month</div>,
        cell: ({ row }) => {
          if (!isDemo) {
            return (
              <div className="text-right text-muted-foreground text-sm">
                No baseline
              </div>
            );
          }

          const amount =
            typeof row.original.amount === "number" ? row.original.amount : 0;
          const lastMonth =
            typeof row.original.lastMonth === "number"
              ? row.original.lastMonth
              : 0;
          const diff = amount - lastMonth;
          const isUp = diff > 0;
          const isDown = diff < 0;

          return (
            <div className="flex items-center justify-end gap-2 text-right font-mono">
              {formatAmount(row.original.lastMonth)}
              {isUp && <ArrowUpIcon className="size-3 text-muted-foreground" />}
              {isDown && (
                <ArrowDownIcon className="size-3 text-muted-foreground" />
              )}
            </div>
          );
        },
      },
    ],
    [formatAmount, isDemo],
  );

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Expense categories</CardTitle>
        <CardDescription>Monthly spending across categories.</CardDescription>
      </CardHeader>
      <CardContent>
        <CommonDataTable columns={columns} data={data} />
      </CardContent>
    </Card>
  );
}

export function IncomeSourcesTable({
  data,
  formatAmount,
}: {
  data: IncomeSourceRow[];
  formatAmount: (amount: AmountValue) => string;
}) {
  const columns = useMemo<ColumnDef<IncomeSourceRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Source",
        cell: ({ row }) => {
          const Icon =
            CATEGORY_ICONS[row.original.name] || CATEGORY_ICONS["Other Income"];

          return (
            <div className="flex items-center gap-3 font-medium">
              <div className="rounded-md bg-muted p-2">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              {row.original.name}
            </div>
          );
        },
      },
      {
        accessorKey: "frequency",
        header: "Frequency",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.frequency}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {formatAmount(row.original.amount)}
          </div>
        ),
      },
    ],
    [formatAmount],
  );

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Income sources</CardTitle>
        <CardDescription>Where family money comes from.</CardDescription>
      </CardHeader>
      <CardContent>
        <CommonDataTable columns={columns} data={data} />
      </CardContent>
    </Card>
  );
}

export function RecentTransactionsTable({
  data,
  formatAmount,
}: {
  data: TransactionRow[];
  formatAmount: (amount: AmountValue) => string;
}) {
  const columns = useMemo<ColumnDef<TransactionRow>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.date}</span>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
          const Icon =
            CATEGORY_ICONS[row.original.category] ||
            CATEGORY_ICONS.Miscellaneous;

          return (
            <div className="flex items-center gap-2 font-medium">
              <Icon className="size-4 text-muted-foreground" />
              {row.original.category}
            </div>
          );
        },
      },
      {
        accessorKey: "member",
        header: "Member",
      },
      {
        accessorKey: "method",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal text-xs">
            {row.original.method}
          </Badge>
        ),
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {row.original.type === "income" ? "+" : "-"}
            {formatAmount(row.original.amount)}
          </div>
        ),
      },
    ],
    [formatAmount],
  );

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
        <CardDescription>Latest family financial activity.</CardDescription>
      </CardHeader>
      <CardContent>
        <CommonDataTable columns={columns} data={data} />
      </CardContent>
    </Card>
  );
}
