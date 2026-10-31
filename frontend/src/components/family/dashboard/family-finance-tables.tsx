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
import { createTranslator } from "@/i18n/translate";
import { CATEGORY_ICONS } from "../money/mock-finance-data";
import type {
  AmountValue,
  ExpenseCategoryRow,
  IncomeSourceRow,
  TransactionRow,
} from "./family-finance-helpers";

const t = createTranslator("FamilyDashboard");
const tCommon = createTranslator("Common");

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
        header: tCommon("category"),
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
        header: () => <div className="text-right">{t("thisMonth")}</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {formatAmount(row.original.amount)}
          </div>
        ),
      },
      {
        accessorKey: "lastMonth",
        header: () => <div className="text-right">{t("lastMonth")}</div>,
        cell: ({ row }) => {
          if (!isDemo) {
            return (
              <div className="text-right text-muted-foreground text-sm">
                {t("noBaseline")}
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
        <CardTitle>{t("expenseCategoriesTitle")}</CardTitle>
        <CardDescription>{t("expenseCategoriesDesc")}</CardDescription>
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
        header: t("source"),
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
        header: t("frequency"),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.frequency}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">{tCommon("amount")}</div>,
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
        <CardTitle>{t("incomeSourcesTitle")}</CardTitle>
        <CardDescription>{t("incomeSourcesDesc")}</CardDescription>
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
        header: tCommon("date"),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.date}</span>
        ),
      },
      {
        accessorKey: "category",
        header: tCommon("category"),
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
        header: t("member"),
      },
      {
        accessorKey: "method",
        header: tCommon("status"),
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal text-xs">
            {row.original.method}
          </Badge>
        ),
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">{tCommon("amount")}</div>,
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
        <CardTitle>{t("recentTransactionsTitle")}</CardTitle>
        <CardDescription>{t("recentTransactionsDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <CommonDataTable columns={columns} data={data} />
      </CardContent>
    </Card>
  );
}
