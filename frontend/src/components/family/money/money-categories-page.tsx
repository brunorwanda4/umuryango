"use client";

import { useMemo } from "react";
import { FolderTreeIcon, PieChartIcon, ArrowLeftRightIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

import { FamilyMoneyPageData } from "./family-money-page-data";
import { TableEmptyState } from "./money-ui-helpers";
import type { MoneyOverview } from "./types";
import { formatMinorUnits, normalizeMinorUnitString, getCurrencyFractionDigits } from "./utils";
import { CreateCategoryForm } from "./forms/create-category-form";

// Define a palette for charts
const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function MoneyCategoriesPage({ familyName }: { familyName: string }) {
  return (
    <FamilyMoneyPageData familyName={familyName}>
      {({ currency, family, money }) => (
        <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
              <p className="text-muted-foreground">
                Understand how your money is organized, created, and categorized.
              </p>
            </div>
            <CreateCategoryForm familyId={family.id} />
          </div>

          <CategoryDashboard currency={currency} money={money} />
        </div>
      )}
    </FamilyMoneyPageData>
  );
}

function CategoryDashboard({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const categoryStats = useMemo(() => {
    const stats = new Map<
      string,
      {
        category: string;
        recordCount: number;
        incomeMinorUnits: bigint;
        expenseMinorUnits: bigint;
        creators: Set<string>;
      }
    >();

    for (const record of money?.records ?? []) {
      const category = record.category ?? "Uncategorized";
      const existing = stats.get(category) ?? {
        category,
        recordCount: 0,
        incomeMinorUnits: BigInt(0),
        expenseMinorUnits: BigInt(0),
        creators: new Set<string>(),
      };

      const type = record.type.toLowerCase().replace(/[_-]+/g, " ");
      const normalizedAmountStr = normalizeMinorUnitString(record.amountMinorUnits);
      const amount = normalizedAmountStr ? BigInt(normalizedAmountStr) : BigInt(0);

      existing.recordCount += 1;
      if (record.createdBy) {
        existing.creators.add(record.createdBy);
      }

      if (type.includes("income")) {
        existing.incomeMinorUnits += amount;
      } else if (
        ["expense", "spend", "purchase"].some((value) => type.includes(value))
      ) {
        existing.expenseMinorUnits += amount;
      }

      stats.set(category, existing);
    }

    return Array.from(stats.values()).sort((a, b) =>
      a.category.localeCompare(b.category)
    );
  }, [money?.records]);

  const fractionDigits = getCurrencyFractionDigits(currency);
  const divisor = 10 ** fractionDigits;

  const incomeData = categoryStats
    .filter((s) => s.incomeMinorUnits > 0n)
    .map((s) => ({
      name: s.category,
      value: Number(s.incomeMinorUnits) / divisor,
    }));

  const expenseData = categoryStats
    .filter((s) => s.expenseMinorUnits > 0n)
    .map((s) => ({
      name: s.category,
      value: Number(s.expenseMinorUnits) / divisor,
    }));

  const hasData = categoryStats.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <TableEmptyState
            icon={FolderTreeIcon}
            title="No category records returned"
            description="Categories will appear here after saving income or expense records."
          />
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    value: { label: "Value" },
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRightIcon className="h-5 w-5 " />
            Income by Category
          </CardTitle>
          <CardDescription>Breakdown of income sources</CardDescription>
        </CardHeader>
        <CardContent>
          {incomeData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <PieChart>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {incomeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number) =>
                    new Intl.NumberFormat("en", {
                      style: "currency",
                      currency,
                    }).format(value)
                  }
                />
                <Legend />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              No income data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Expenses by Category
          </CardTitle>
          <CardDescription>Breakdown of spending categories</CardDescription>
        </CardHeader>
        <CardContent>
          {expenseData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number) =>
                    new Intl.NumberFormat("en", {
                      style: "currency",
                      currency,
                    }).format(value)
                  }
                />
                <Legend />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              No expense data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Category Details & Creators</CardTitle>
          <CardDescription>
            Detailed view of all categories, including who created the records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="text-right">Records</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryStats.map((summary) => (
                <TableRow key={summary.category}>
                  <TableCell className="font-medium">
                    {summary.category}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {summary.creators.size > 0
                      ? Array.from(summary.creators).join(", ")
                      : "Unknown"}
                  </TableCell>
                  <TableCell className="text-right">
                    {summary.recordCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {summary.incomeMinorUnits > 0n
                      ? formatMinorUnits(
                          summary.incomeMinorUnits.toString(),
                          currency
                        )
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {summary.expenseMinorUnits > 0n
                      ? formatMinorUnits(
                          summary.expenseMinorUnits.toString(),
                          currency
                        )
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
