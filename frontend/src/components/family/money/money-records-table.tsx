import type { ColumnDef } from "@tanstack/react-table";
import { ReceiptTextIcon } from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createTranslator } from "@/i18n/translate";
import { StatusBadge, TableEmptyState } from "./money-ui-helpers";
import type { MoneyOverview, MoneyRecordRow } from "./types";
import { formatDate, formatTitle } from "./utils";

export function MoneyRecordsTable({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const t = createTranslator("FamilyMoney");
  const records = money?.records ?? [];
  const columns: ColumnDef<MoneyRecordRow>[] = [
    {
      accessorKey: "title",
      header: t("recordColumn"),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{row.original.title}</span>
          <span className="text-muted-foreground text-xs">
            {t("byAuthor", {
              type: formatTitle(row.original.type),
              name: row.original.createdBy ?? t("unknownUser"),
            })}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: t("filterCategory"),
      cell: ({ row }) => row.original.category ?? t("uncategorized"),
    },
    {
      accessorKey: "date",
      header: t("dateColumn"),
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "status",
      header: t("filterStatus"),
      cell: ({ row }) => <StatusBadge value={row.original.status ?? "draft"} />,
    },
    {
      accessorKey: "amountMinorUnits",
      header: () => <div className="text-right">{t("amountColumn")}</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono">
          <CompactMoney
            currency={currency}
            emptyLabel="No records"
            value={row.original.amountMinorUnits}
          />
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("recentRecordsTitle")}</CardTitle>
        <CardDescription>{t("recentRecordsDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {records.length ? (
          <CommonDataTable columns={columns} data={records} />
        ) : (
          <TableEmptyState
            icon={ReceiptTextIcon}
            title={t("noRecentRecordsTitle")}
            description={t("noRecentRecordsDesc")}
          />
        )}
      </CardContent>
    </Card>
  );
}
