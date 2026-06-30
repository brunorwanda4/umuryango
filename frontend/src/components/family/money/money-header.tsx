import { DownloadIcon, PlusIcon, ReceiptTextIcon } from "lucide-react";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AUTHORITY_LABELS } from "@/lib/family-access";

export function MoneyHeader({
  canExportReports,
  canRecordExpense,
  canRecordIncome,
  currency,
  family,
  hasSourceRecords,
}: {
  canExportReports: boolean;
  canRecordExpense: boolean;
  canRecordIncome: boolean;
  currency: string;
  family: FamilyDetail;
  hasSourceRecords: boolean;
}) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
              Family money
            </h1>
            <Badge variant="secondary">
              {AUTHORITY_LABELS[family.authority]}
            </Badge>
            <Badge variant={hasSourceRecords ? "outline" : "secondary"}>
              {hasSourceRecords ? "Source records loaded" : "No source records"}
            </Badge>
          </div>
          <p className="max-w-4xl text-muted-foreground text-sm leading-6">
            Manage {family.name} income, expenses, contributions, savings,
            debts, budgets, and approval work from one audited family workspace.
            Totals and charts are shown only from persisted records returned by
            the API.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {canRecordIncome ? (
            <Button
              disabled
              size="sm"
              title="Income recording needs the backend money write workflow."
            >
              <PlusIcon aria-hidden="true" data-icon="inline-start" />
              Record income
            </Button>
          ) : null}
          {canRecordExpense ? (
            <Button
              disabled
              size="sm"
              title="Expense recording needs the backend money write workflow."
              variant="outline"
            >
              <ReceiptTextIcon aria-hidden="true" data-icon="inline-start" />
              Record expense
            </Button>
          ) : null}
          {canExportReports ? (
            <Button
              href={`/family/${encodeURIComponent(family.slug)}/reports`}
              size="sm"
              variant="outline"
            >
              <DownloadIcon aria-hidden="true" data-icon="inline-start" />
              Reports
            </Button>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{family.name}</Badge>
        <Badge variant="outline">{family.country}</Badge>
        <Badge variant="outline">{currency}</Badge>
        <Badge variant="outline">{family.contributionCadence}</Badge>
      </div>
    </header>
  );
}
