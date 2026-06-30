import type { ColumnDef } from "@tanstack/react-table";
import {
  ArchiveIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatOptionalMoney } from "../utils";
import { CategoryIcon } from "./category-icon";
import {
  type CategoryStatus,
  type MoneyCategory,
  formatCategoryStatus,
  formatCategoryType,
} from "./types-and-constants";

export function CategoryTable({
  apiMessage,
  categories,
  currency,
  loading,
  onArchive,
  onDelete,
  onEdit,
}: {
  apiMessage?: string;
  categories: MoneyCategory[];
  currency: string;
  loading: boolean;
  onArchive: (category: MoneyCategory, status: CategoryStatus) => void;
  onDelete: (category: MoneyCategory) => void;
  onEdit: (category: MoneyCategory) => void;
}) {
  const columns: ColumnDef<MoneyCategory>[] = [
    {
      id: "icon",
      header: "Icon",
      cell: ({ row }) => <CategoryIcon category={row.original} />,
    },
    {
      accessorKey: "name",
      header: "Category Name",
      cell: ({ row }) => (
        <div className="flex min-w-40 max-w-56 flex-col gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate font-medium">{row.original.name}</span>
            {row.original.isDefault ? (
              <Badge variant="secondary">Default</Badge>
            ) : null}
          </div>
          <span className="truncate text-muted-foreground text-xs">
            Created by {row.original.createdBy}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge
          variant={row.original.type === "INCOME" ? "secondary" : "outline"}
        >
          {formatCategoryType(row.original.type)}
        </Badge>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="block max-w-[min(24rem,65vw)] whitespace-normal text-muted-foreground text-sm leading-6">
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: "transactionsCount",
      header: () => <div className="text-right">Transactions Count</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {Intl.NumberFormat("en").format(row.original.transactionsCount)}
        </div>
      ),
    },
    {
      accessorKey: "totalMinorUnits",
      header: () => <div className="text-right">Total Amount</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {formatOptionalMoney(row.original.totalMinorUnits, currency)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === "ACTIVE" ? "outline" : "secondary"}
        >
          {formatCategoryStatus(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Last Updated",
      cell: ({ row }) => formatDate(row.original.updatedAt),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`Open actions for ${row.original.name}`}
                size="icon-sm"
                variant="ghost"
              >
                <MoreHorizontalIcon aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Category actions</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => onEdit(row.original)}>
                  <PencilIcon aria-hidden="true" data-icon="inline-start" />
                  Edit category
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    onArchive(
                      row.original,
                      row.original.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                    )
                  }
                >
                  <ArchiveIcon aria-hidden="true" data-icon="inline-start" />
                  {row.original.status === "ACTIVE" ? "Archive" : "Activate"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onDelete(row.original)}
                >
                  <Trash2Icon aria-hidden="true" data-icon="inline-start" />
                  Delete category
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Category master data</CardTitle>
        <CardDescription>
          Reusable income and expense categories selected by the transaction,
          budget, receipt, and reporting workflows.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-3">
        {apiMessage ? (
          <p className="text-muted-foreground text-sm">{apiMessage}</p>
        ) : null}
        <CommonDataTable
          columns={columns}
          data={categories}
          loading={loading}
        />
      </CardContent>
    </Card>
  );
}
