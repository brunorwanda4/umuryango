import type { ColumnDef } from "@tanstack/react-table";
import { ReceiptTextIcon } from "lucide-react";
import { useMemo } from "react";
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
import { StatusBadge, TableEmptyState } from "./reports-ui-helpers";
import type {
  MoneyOverview,
  ReportSourceRecordRow,
  ReportsOverview,
} from "./types";
import { formatDate, formatTitle, getSourceRecords } from "./utils";

export function SourceRecordsTable({
  currency,
  money,
  reports,
}: {
  currency: string;
  money: MoneyOverview | null;
  reports: ReportsOverview | null;
}) {
  const t = createTranslator("FamilyReports");
  const records = useMemo(
    () => getSourceRecords(reports, money),
    [reports, money],
  );
  const columns: ColumnDef<ReportSourceRecordRow>[] = [
    {
      accessorKey: "title",
      header: t("recordColumn"),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{row.original.title}</span>
          <span className="text-muted-foreground text-xs">
            {t("createdBy", {
              name: row.original.createdBy ?? t("unknownUser"),
            })}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "module",
      header: t("moduleColumn"),
      cell: ({ row }) => formatTitle(row.original.module),
    },
    {
      accessorKey: "date",
      header: t("dateColumn"),
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "status",
      header: t("statusColumn"),
      cell: ({ row }) => (
        <StatusBadge value={row.original.status ?? "recorded"} />
      ),
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
        <CardTitle>{t("sourceRecordsTitle")}</CardTitle>
        <CardDescription>{t("sourceRecordsDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {records.length ? (
          <CommonDataTable columns={columns} data={records} />
        ) : (
          <TableEmptyState
            description={t("noSourceRecordsDesc")}
            icon={ReceiptTextIcon}
            title={t("noSourceRecordsTitle")}
          />
        )}
      </CardContent>
    </Card>
  );
}
