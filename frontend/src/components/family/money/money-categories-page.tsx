"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CreditCardIcon,
  InfoIcon,
  PiggyBankIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CommonDataTable } from "@/components/common/table/common-data-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";

import { FamilyMoneyPageData } from "./family-money-page-data";
import {
  CATEGORY_ICONS,
  MOCK_CONTRIBUTIONS,
  MOCK_CURRENCY,
  MOCK_DEBTS,
  MOCK_EXPENSE_CATEGORIES,
  MOCK_INCOME_SOURCES,
  MOCK_MONTHLY_CASHFLOW,
  MOCK_SAVINGS_GOALS,
  MOCK_SUMMARY,
  MOCK_TRANSACTIONS,
} from "./mock-finance-data";
import type { MoneyOverview } from "./types";

// Chart palette
const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type ExpenseCategoryRow = (typeof MOCK_EXPENSE_CATEGORIES)[number];
type IncomeSourceRow = (typeof MOCK_INCOME_SOURCES)[number];
type TransactionRow = (typeof MOCK_TRANSACTIONS)[number];

export function MoneyCategoriesPage({ familyName }: { familyName: string }) {
  return (
    <FamilyMoneyPageData familyName={familyName}>
      {({ currency, family, money }) => (
        <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Family Finance Overview
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage every aspect of {family.name}&apos;s finances.
              </p>
            </div>
            {(!money?.records || money.records.length === 0) && (
              <Badge
                variant="secondary"
                className="px-3 py-1 flex items-center gap-1.5 self-start sm:self-auto text-blue-600 bg-blue-50 border-blue-200"
              >
                <InfoIcon className="w-4 h-4" /> Demo Data Mode
              </Badge>
            )}
          </div>

          <FamilyFinanceDashboard currency={currency} money={money} />
        </div>
      )}
    </FamilyMoneyPageData>
  );
}

function FamilyFinanceDashboard({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const isDemo = !money?.records || money.records.length === 0;
  const displayCurrency = isDemo ? MOCK_CURRENCY : currency;

  const formatMoney = useMemo(
    () => (amount: number) =>
      new Intl.NumberFormat("en", {
        style: "currency",
        currency: displayCurrency,
        maximumFractionDigits: 0,
      }).format(amount),
    [displayCurrency],
  );

  const chartConfig = {
    value: { label: "Value" },
  };

  const expenseCategoryColumns = useMemo<ColumnDef<ExpenseCategoryRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Category",
        cell: ({ row }) => {
          const Icon =
            CATEGORY_ICONS[row.original.name] || CATEGORY_ICONS.Miscellaneous;

          return (
            <div className="flex items-center gap-3 font-medium">
              <div className="rounded-md bg-muted p-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              {row.original.name}
            </div>
          );
        },
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">This Month</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {formatMoney(row.original.amount)}
          </div>
        ),
      },
      {
        accessorKey: "lastMonth",
        header: () => <div className="text-right">Last Month</div>,
        cell: ({ row }) => {
          const diff = row.original.amount - row.original.lastMonth;
          const isUp = diff > 0;
          const isDown = diff < 0;

          return (
            <div className="flex items-center justify-end gap-2 text-right font-mono">
              {formatMoney(row.original.lastMonth)}
              {isUp && <ArrowUpIcon className="h-3 w-3 text-red-500" />}
              {isDown && <ArrowDownIcon className="h-3 w-3 text-green-500" />}
            </div>
          );
        },
      },
    ],
    [formatMoney],
  );

  const incomeSourceColumns = useMemo<ColumnDef<IncomeSourceRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Source",
        cell: ({ row }) => {
          const Icon =
            CATEGORY_ICONS[row.original.name] || CATEGORY_ICONS["Other Income"];

          return (
            <div className="flex items-center gap-3 font-medium">
              <div className="rounded-md bg-green-50 p-2 text-green-600">
                <Icon className="h-4 w-4" />
              </div>
              {row.original.name}
            </div>
          );
        },
      },
      {
        accessorKey: "frequency",
        header: "Frequency",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.frequency}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono text-green-600">
            +{formatMoney(row.original.amount)}
          </div>
        ),
      },
    ],
    [formatMoney],
  );

  const transactionColumns = useMemo<ColumnDef<TransactionRow>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.date}</span>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
          const Icon =
            CATEGORY_ICONS[row.original.category] ||
            CATEGORY_ICONS.Miscellaneous;

          return (
            <div className="flex items-center gap-2 font-medium">
              <Icon className="h-4 w-4 text-muted-foreground" />
              {row.original.category}
            </div>
          );
        },
      },
      {
        accessorKey: "member",
        header: "Member",
      },
      {
        accessorKey: "method",
        header: "Method",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs font-normal">
            {row.original.method}
          </Badge>
        ),
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => {
          const isIncome = row.original.type === "income";

          return (
            <div
              className={`text-right font-mono ${
                isIncome ? "text-green-600" : ""
              }`}
            >
              {isIncome ? "+" : "-"}
              {formatMoney(row.original.amount)}
            </div>
          );
        },
      },
    ],
    [formatMoney],
  );

  return (
    <div className="grid gap-6">
      {/* Top Metric Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Family Balance
            </CardTitle>
            <WalletIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(MOCK_SUMMARY.totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Income
            </CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(MOCK_SUMMARY.monthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across 3 income sources
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Expenses
            </CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(MOCK_SUMMARY.monthlyExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Top spend: Food
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <PiggyBankIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(MOCK_SUMMARY.totalSavings)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">3 active goals</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Cash Flow Analytics</CardTitle>
            <CardDescription>
              Income vs Expenses over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart
                data={MOCK_MONTHLY_CASHFLOW}
                margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="month"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <RechartsTooltip
                  formatter={(value: unknown) =>
                    new Intl.NumberFormat("en", {
                      style: "currency",
                      currency,
                    }).format(Number(value))
                  }
                  cursor={{ fill: "transparent" }}
                />
                <Legend iconType="circle" />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Where your money goes</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={MOCK_EXPENSE_CATEGORIES}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="amount"
                >
                  {MOCK_EXPENSE_CATEGORIES.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: unknown) => formatMoney(Number(value))}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Rich Tables Section: Expenses and Income */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>
              Monthly spending across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CommonDataTable
              columns={expenseCategoryColumns}
              data={MOCK_EXPENSE_CATEGORIES.slice(0, 5)}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Income Sources</CardTitle>
            <CardDescription>Where your money comes from</CardDescription>
          </CardHeader>
          <CardContent>
            <CommonDataTable
              columns={incomeSourceColumns}
              data={MOCK_INCOME_SOURCES}
            />
          </CardContent>
        </Card>
      </div>

      {/* Goals, Contributions and Debts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBankIcon className="w-5 h-5" /> Savings Goals
            </CardTitle>
            <CardDescription>Track your family's future</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {MOCK_SAVINGS_GOALS.map((goal) => {
              const progress = (goal.saved / goal.target) * 100;
              return (
                <div key={goal.name} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{goal.name}</span>
                    <span className="text-muted-foreground font-mono">
                      {formatMoney(goal.saved)} / {formatMoney(goal.target)}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="w-5 h-5" /> Family Contributions
            </CardTitle>
            <CardDescription>Active collections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {MOCK_CONTRIBUTIONS.map((contribution) => {
              const progress = (contribution.paid / contribution.target) * 100;
              return (
                <div key={contribution.name} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium truncate pr-2">
                      {contribution.name}
                    </span>
                    <span className="text-muted-foreground font-mono whitespace-nowrap">
                      {formatMoney(contribution.paid)}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2 bg-blue-100" />
                  <p className="text-xs text-muted-foreground">
                    Contributed by: {contribution.members.join(", ")}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCardIcon className="w-5 h-5" /> Active Debts
            </CardTitle>
            <CardDescription>Loans and money lent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_DEBTS.map((debt) => (
              <div
                key={debt.name}
                className="flex justify-between items-center p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{debt.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Due: {debt.dueDate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">
                    {formatMoney(debt.amount)}
                  </p>
                  <Badge
                    variant={
                      debt.type === "Borrowed" ? "destructive" : "default"
                    }
                    className="mt-1 text-[10px]"
                  >
                    {debt.type}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest family financial activity</CardDescription>
        </CardHeader>
        <CardContent>
          <CommonDataTable
            columns={transactionColumns}
            data={MOCK_TRANSACTIONS}
          />
        </CardContent>
      </Card>
    </div>
  );
}
