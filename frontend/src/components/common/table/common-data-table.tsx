"use client";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  type Row,
  type Table as TanStackTable,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  table?: TanStackTable<TData>;
  rowClassName?: (row: Row<TData>) => string;
  serverMode?: boolean;
  pageIndex?: number;
  setPageIndex?: (i: number) => void;
  pageSize?: number;
  noFooter?: boolean;
  loading?: boolean;
  className?: string;
}

export function CommonDataTable<TData, TValue>({
  columns,
  data,
  table: externalTable,
  rowClassName,
  serverMode,
  pageIndex,
  setPageIndex,
  noFooter = true,
  pageSize = 10,
  loading = false,
  className,
}: DataTableProps<TData, TValue>) {
  const internalTable = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });
  const table = externalTable ?? internalTable;

  return (
    <div className="flex min-w-0 w-full flex-col gap-4">
      <div
        className={cn(
          "min-w-0 max-w-full overflow-hidden rounded-md border transition-all duration-300",
          className,
        )}
      >
        <Table className="min-w-max table-auto border-collapse">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="relative h-10 border-t select-none"
                      aria-sort={
                        header.column.getIsSorted() === "asc"
                          ? "ascending"
                          : header.column.getIsSorted() === "desc"
                            ? "descending"
                            : "none"
                      }
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          className={cn(
                            header.column.getCanSort() &&
                              "flex h-full w-full cursor-pointer appearance-none items-center justify-between gap-2 border-0 bg-transparent p-0 text-left select-none",
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            // Enhanced keyboard handling for sorting
                            if (
                              header.column.getCanSort() &&
                              (e.key === "Enter" || e.key === " ")
                            ) {
                              e.preventDefault();
                              header.column.getToggleSortingHandler()?.(e);
                            }
                          }}
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {{
                            asc: (
                              <ChevronUpIcon
                                className="shrink-0 opacity-60"
                                size={16}
                                aria-hidden="true"
                              />
                            ),
                            desc: (
                              <ChevronDownIcon
                                className="shrink-0 opacity-60"
                                size={16}
                                aria-hidden="true"
                              />
                            ),
                          }[header.column.getIsSorted() as string] ?? (
                            <span className="size-4" aria-hidden="true" />
                          )}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground text-sm"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={rowClassName ? rowClassName(row) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground text-sm"
                >
                  No items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!noFooter && (
        <div className="flex flex-wrap items-center justify-start gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (serverMode && setPageIndex) {
                setPageIndex(Math.max((pageIndex ?? 0) - 1, 0));
                return;
              }

              table.previousPage();
            }}
            disabled={
              serverMode ? (pageIndex ?? 0) === 0 : !table.getCanPreviousPage()
            }
          >
            <ChevronLeftIcon aria-hidden="true" data-icon="inline-start" />
            Previous
          </Button>

          <span className="text-sm">
            {/* Page {table.getState().pagination.pageIndex + 1} */}
            Page{" "}
            {serverMode
              ? (pageIndex ?? 0) + 1
              : table.getState().pagination.pageIndex + 1}{" "}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (serverMode && setPageIndex) {
                setPageIndex((pageIndex ?? 0) + 1);
                return;
              }

              table.nextPage();
            }}
            disabled={
              serverMode ? data.length < pageSize : !table.getCanNextPage()
            }
          >
            Next
            <ChevronRightIcon aria-hidden="true" data-icon="inline-end" />
          </Button>
        </div>
      )}
    </div>
  );
}
