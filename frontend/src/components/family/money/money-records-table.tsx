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
      header: t((m) => m.FamilyMoney.recordColumn),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{row.original.title}</span>
          <span className="text-muted-foreground text-xs">
            {t((m) => m.FamilyMoney.byAuthor, {
              type: formatTitle(row.original.type),
              name:
                row.original.createdBy ?? t((m) => m.FamilyMoney.unknownUser),
            })}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: t((m) => m.FamilyMoney.filterCategory),
      cell: ({ row }) =>
        row.original.category ?? t((m) => m.FamilyMoney.uncategorized),
    },
    {
      accessorKey: "date",
      header: t((m) => m.FamilyMoney.dateColumn),
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "status",
      header: t((m) => m.FamilyMoney.filterStatus),
      cell: ({ row }) => <StatusBadge value={row.original.status ?? "draft"} />,
    },
    {
      accessorKey: "amountMinorUnits",
      header: () => (
        <div className="text-right">{t((m) => m.FamilyMoney.amountColumn)}</div>
      ),
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
        <CardTitle>{t((m) => m.FamilyMoney.recentRecordsTitle)}</CardTitle>
        <CardDescription>
          {t((m) => m.FamilyMoney.recentRecordsDesc)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {records.length ? (
          <CommonDataTable columns={columns} data={records} />
        ) : (
          <TableEmptyState
            icon={ReceiptTextIcon}
            title={t((m) => m.FamilyMoney.noRecentRecordsTitle)}
            description={t((m) => m.FamilyMoney.noRecentRecordsDesc)}
          />
        )}
      </CardContent>
    </Card>
  );
}
