import { CompactMoney } from "@/components/common/money/compact-money";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createTranslator } from "@/i18n/translate";
import type { MoneyActivity } from "./types";
import {
  formatDate,
  formatRecordType,
  formatStatus,
  getStatusBadgeVariant,
} from "./utils";

interface MoneyTableProps {
  currency: string;
  emptyDescription: string;
  emptyTitle: string;
  records: MoneyActivity[];
  showType?: boolean;
}

export function MoneyTable({
  currency,
  emptyDescription,
  emptyTitle,
  records,
  showType = true,
}: MoneyTableProps) {
  const t = createTranslator("PersonalMoney.transactionsTable");

  if (!records.length) {
    return (
      <div className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-center">
        <p className="font-medium">{emptyTitle}</p>
        <p className="max-w-md text-muted-foreground text-sm">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("record")}</TableHead>
          {showType && <TableHead>{t("type")}</TableHead>}
          <TableHead>{t("category")}</TableHead>
          <TableHead>{t("date")}</TableHead>
          <TableHead>{t("status")}</TableHead>
          <TableHead className="text-right">{t("amount")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell>
              <div className="flex min-w-48 flex-col gap-1">
                <span className="font-medium">{record.title}</span>
                <span className="text-muted-foreground text-xs">
                  {record.account}
                </span>
              </div>
            </TableCell>
            {showType && (
              <TableCell>
                <Badge variant="outline">{formatRecordType(record.type)}</Badge>
              </TableCell>
            )}
            <TableCell>{record.category}</TableCell>
            <TableCell>{formatDate(record.date)}</TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(record.status)}>
                {formatStatus(record.status)}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-mono">
              {record.direction === "in" ? "+" : "-"}
              <CompactMoney
                currency={currency}
                value={Math.abs(record.amountMinorUnits)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
