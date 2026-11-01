import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon, ReceiptTextIcon } from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import { DataViewToggle } from "@/components/common/table/data-view-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePersistentViewMode } from "@/hooks/use-persistent-view-mode";
import { createTranslator } from "@/i18n/translate";
import { hasCapability } from "@/lib/family-access";
import { cn } from "@/lib/utils";
import type { FamilyDetail } from "../../dashboard/types";
import { formatDate } from "../utils";
import {
  type ExpenseAction,
  ExpenseActionsDropdown,
} from "./expense-actions-dropdown";
import { ExpenseFilters } from "./expense-filters";
import { formatPaymentMethod } from "./expense-utils";
import { FamilyExpenseItems } from "./family-expense-items";
import type { Category, ExpenseTransaction } from "./types-and-schemas";

const FAMILY_EXPENSES_VIEW_MODE_STORAGE_KEY =
  "umuryango-family-expenses-view-mode";

export function ExpenseTable({
  filteredTransactions,
  currency,
  isAdmin,
  family,
  handleActionClick,
  handleSendApproval,
  handleDuplicate,
  handleDownloadReceipt,
  setOpenCreate,
  search,
  setSearch,
  filterCategory,
  setFilterCategory,
  filterPaymentMethod,
  setFilterPaymentMethod,
  filterStatus,
  setFilterStatus,
  filterMember,
  setFilterMember,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  minAmount,
  setMinAmount,
  maxAmount,
  setMaxAmount,
  resetFilters,
  categories,
}: {
  filteredTransactions: ExpenseTransaction[];
  currency: string;
  isAdmin: boolean;
  family: FamilyDetail;
  handleActionClick: (
    transaction: ExpenseTransaction,
    action: ExpenseAction,
  ) => void;
  handleSendApproval: (transaction: ExpenseTransaction) => void;
  handleDuplicate: (transaction: ExpenseTransaction) => void;
  handleDownloadReceipt: (transaction: ExpenseTransaction) => void;
  setOpenCreate: (open: boolean) => void;
  search: string;
  setSearch: (value: string) => void;
  filterCategory: string;
  setFilterCategory: (value: string) => void;
  filterPaymentMethod: string;
  setFilterPaymentMethod: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterMember: string;
  setFilterMember: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  minAmount: string;
  setMinAmount: (value: string) => void;
  maxAmount: string;
  setMaxAmount: (value: string) => void;
  resetFilters: () => void;
  categories: Category[];
}) {
  const t = createTranslator("FamilyExpenses");
  const [viewMode, setViewMode] = usePersistentViewMode(
    FAMILY_EXPENSES_VIEW_MODE_STORAGE_KEY,
  );

  const columns: ColumnDef<ExpenseTransaction>[] = [
    {
      accessorKey: "date",
      header: t((m) => m.FamilyExpenses.table.columnDate),
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {formatDate(row.original.date)}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: t((m) => m.FamilyExpenses.table.columnTitle),
      cell: ({ row }) => (
        <span className="block max-w-[220px] truncate font-medium">
          {row.original.description ||
            t((m) => m.FamilyExpenses.dialogs.addTitle)}
        </span>
      ),
    },
    {
      id: "category",
      header: t((m) => m.FamilyExpenses.table.columnCategory),
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{row.original.category.name}</span>
      ),
    },
    {
      accessorKey: "amountMinorUnits",
      header: t((m) => m.FamilyExpenses.table.columnAmount),
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-mono">
          <CompactMoney
            currency={currency}
            value={row.original.amountMinorUnits}
          />
        </span>
      ),
    },
    {
      accessorKey: "receivedFrom",
      header: t((m) => m.FamilyExpenses.table.columnPaidTo),
      cell: ({ row }) => (
        <span className="block max-w-[160px] truncate">
          {row.original.receivedFrom ||
            t((m) => m.FamilyExpenses.table.notRecorded)}
        </span>
      ),
    },
    {
      accessorKey: "receivedBy",
      header: t((m) => m.FamilyExpenses.table.columnPaidBy),
      cell: ({ row }) => (
        <span className="block max-w-[160px] truncate">
          {row.original.receivedBy ||
            t((m) => m.FamilyExpenses.table.notRecorded)}
        </span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: t((m) => m.FamilyExpenses.table.columnPaymentMethod),
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {formatPaymentMethod(row.original.paymentMethod)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: t((m) => m.FamilyExpenses.table.columnStatus),
      cell: ({ row }) => <ExpenseStatusBadge status={row.original.status} />,
    },
    {
      id: "receipt",
      header: t((m) => m.FamilyExpenses.table.columnReceipt),
      cell: ({ row }) => {
        const firstReceipt = row.original.receipts?.[0];
        return firstReceipt ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadReceipt(row.original)}
            className="max-w-[150px]"
          >
            <ReceiptTextIcon aria-hidden="true" data-icon="inline-start" />
            <span className="truncate">{firstReceipt.fileName}</span>
          </Button>
        ) : (
          <Badge variant="outline">
            {t((m) => m.FamilyExpenses.table.noReceipt)}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => (
        <span className="flex justify-end">
          {t((m) => m.FamilyExpenses.table.columnActions)}
        </span>
      ),
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ExpenseActionsDropdown
            tx={row.original}
            isAdmin={isAdmin}
            handleActionClick={handleActionClick}
            handleSendApproval={handleSendApproval}
            handleDuplicate={handleDuplicate}
            handleDownloadReceipt={handleDownloadReceipt}
          />
        </div>
      ),
    },
  ];

  return (
    <Card className="rounded-2xl border border-zinc-800/80 bg-[#0f0f12] py-0 shadow-xs min-w-0 gap-2">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>{t((m) => m.FamilyExpenses.table.historyTitle)}</CardTitle>
          <CardDescription>
            {t((m) => m.FamilyExpenses.table.historyDesc)}
          </CardDescription>
        </div>
        <DataViewToggle value={viewMode} onValueChange={setViewMode} />
      </CardHeader>
      <ExpenseFilters
        search={search}
        setSearch={setSearch}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterPaymentMethod={filterPaymentMethod}
        setFilterPaymentMethod={setFilterPaymentMethod}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterMember={filterMember}
        setFilterMember={setFilterMember}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        minAmount={minAmount}
        setMinAmount={setMinAmount}
        maxAmount={maxAmount}
        setMaxAmount={setMaxAmount}
        resetFilters={resetFilters}
        categories={categories}
        family={family}
      />
      <CardContent className={cn(viewMode === "items" && "px-0 pb-0")}>
        {filteredTransactions.length ? (
          viewMode === "table" ? (
            <CommonDataTable
              columns={columns}
              data={filteredTransactions}
              getRowAriaLabel={(row) =>
                t((m) => m.FamilyExpenses.table.viewDetailsAria, {
                  title:
                    row.original.description ||
                    t((m) => m.FamilyExpenses.dialogs.addTitle),
                })
              }
              onRowClick={(row) => handleActionClick(row.original, "view")}
              rowClassName={() => "hover:bg-muted/50 cursor-pointer"}
            />
          ) : (
            <FamilyExpenseItems
              data={filteredTransactions}
              currency={currency}
              isAdmin={isAdmin}
              handleActionClick={handleActionClick}
              handleSendApproval={handleSendApproval}
              handleDuplicate={handleDuplicate}
              handleDownloadReceipt={handleDownloadReceipt}
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
              <ReceiptTextIcon className="size-6 text-muted-foreground" />
            </span>
            <h3 className="font-semibold text-lg">
              {t((m) => m.FamilyExpenses.table.emptyTitle)}
            </h3>
            <p className="mt-1 mb-6 max-w-sm text-muted-foreground text-sm">
              {t((m) => m.FamilyExpenses.table.emptyDesc)}
            </p>
            {hasCapability(family, "RECORD_EXPENSE") ? (
              <Button size="sm" onClick={() => setOpenCreate(true)}>
                <PlusIcon aria-hidden="true" data-icon="inline-start" />
                {t((m) => m.FamilyExpenses.addExpense)}
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ExpenseStatusBadge({ status }: { status: string }) {
  const variant =
    status === "APPROVED"
      ? "default"
      : status === "PENDING"
        ? "secondary"
        : status === "REJECTED"
          ? "destructive"
          : "outline";

  return <Badge variant={variant}>{status}</Badge>;
}
