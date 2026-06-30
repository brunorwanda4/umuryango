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
import { useEffect, useMemo, useState } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import apiRequest from "@/service/api";
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
} from "../money/mock-finance-data";
import type { MoneyOverview, MoneyRecordRow } from "../money/types";
import {
  formatCompactMinorUnits,
  formatMinorUnits,
  formatOptionalMoney,
  formatTitle,
  normalizeMinorUnitString,
  normalizeMoneyOverview,
  toChartNumber,
} from "../money/utils";
import type { FamilyDetail } from "./types";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const chartConfig = {
  income: {
    label: "Income",
    color: "var(--chart-4)",
  },
  expenses: {
    label: "Expenses",
    color: "var(--chart-2)",
  },
  amount: {
    label: "Amount",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

type DashboardMoneyState =
  | { status: "loading" }
  | { status: "success"; money: MoneyOverview | null; message?: string };

type AmountValue = number | string | null | undefined;

type ExpenseCategoryRow = {
  name: string;
  amount: AmountValue;
  lastMonth?: AmountValue;
  count?: number;
};

type IncomeSourceRow = {
  name: string;
  amount: AmountValue;
  frequency: string;
};

type TransactionRow = {
  id: string;
  date: string;
  category: string;
  member: string;
  method: string;
  amount: AmountValue;
  type: "income" | "expense" | "other";
};

export function FamilyFinanceDashboard({ family }: { family: FamilyDetail }) {
  const [state, setState] = useState<DashboardMoneyState>({
    status: "loading",
  });

  useEffect(() => {
    let active = true;

    setState({ status: "loading" });

    (async () => {
      const response = await apiRequest<undefined, MoneyOverview>(
        "get",
        `/families/${encodeURIComponent(family.id)}/money/overview?period=month`,
      );

      if (!active) return;

      setState({
        status: "success",
        money: response.ok ? normalizeMoneyOverview(response.data) : null,
        message: response.ok
          ? undefined
          : (response.message ??
            "Money records are not available from the API yet."),
      });
    })();

    return () => {
      active = false;
    };
  }, [family.id]);

  if (state.status === "loading") {
    return <FamilyFinanceDashboardSkeleton />;
  }

  const currency = state.money?.currency ?? family.defaultCurrency;
  const isDemo = !state.money?.records || state.money.records.length === 0;

  return (
    <section className="flex flex-col gap-4" aria-label="Finance dashboard">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold text-lg tracking-tight">
            Family finance overview
          </h2>
          <p className="text-muted-foreground text-sm">
            Money, cash flow, savings, debts, contributions, and recent records
            for {family.name}.
          </p>
        </div>
        {isDemo ? (
          <Badge variant="secondary" className="w-fit gap-1.5">
            <InfoIcon className="size-4" aria-hidden="true" />
            Demo data mode
          </Badge>
        ) : null}
      </div>

      {state.message ? (
        <Alert>
          <InfoIcon aria-hidden="true" />
          <AlertTitle>Waiting for saved money records</AlertTitle>
          <AlertDescription>
            The dashboard is ready for persisted family money records. Until the
            API returns them, this section shows clearly labeled demo data.
            Detail: {state.message}
          </AlertDescription>
        </Alert>
      ) : null}

      <FamilyFinanceDashboardContent
        currency={currency}
        isDemo={isDemo}
        money={state.money}
      />
    </section>
  );
}

function FamilyFinanceDashboardContent({
  currency,
  isDemo,
  money,
}: {
  currency: string;
  isDemo: boolean;
  money: MoneyOverview | null;
}) {
  const displayCurrency = isDemo ? MOCK_CURRENCY : currency;
  const records = money?.records ?? [];

  const formatMajorMoney = useMemo(
    () => (amount: number) =>
      new Intl.NumberFormat("en", {
        style: "currency",
        currency: displayCurrency,
        maximumFractionDigits: 0,
      }).format(amount),
    [displayCurrency],
  );

  const formatAmount = useMemo(
    () => (amount: AmountValue) => {
      if (isDemo) {
        return typeof amount === "number"
          ? formatMajorMoney(amount)
          : "No records";
      }

      return formatOptionalMoney(amount, displayCurrency);
    },
    [displayCurrency, formatMajorMoney, isDemo],
  );

  const cashFlowData = useMemo(
    () =>
      isDemo
        ? MOCK_MONTHLY_CASHFLOW.map((point) => ({
            label: point.month,
            income: point.income,
            expenses: point.expenses,
          }))
        : (money?.cashFlow ?? []).map((point) => ({
            label: point.label,
            income: toChartNumber(point.incomeMinorUnits),
            expenses: toChartNumber(point.expenseMinorUnits),
          })),
    [isDemo, money],
  );

  const expenseCategoryRows = useMemo(
    () => (isDemo ? MOCK_EXPENSE_CATEGORIES : getExpenseCategories(records)),
    [isDemo, records],
  );

  const incomeSourceRows = useMemo(
    () => (isDemo ? MOCK_INCOME_SOURCES : getIncomeSources(records)),
    [isDemo, records],
  );

  const transactionRows = useMemo(
    () => (isDemo ? getDemoTransactions() : getRecentTransactions(records)),
    [isDemo, records],
  );
  const pieChartData = useMemo(
    () =>
      expenseCategoryRows.map((row) => ({
        name: row.name,
        amount:
          isDemo && typeof row.amount === "number"
            ? row.amount
            : toChartNumber(row.amount),
      })),
    [expenseCategoryRows, isDemo],
  );

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
                <Icon className="size-4 text-muted-foreground" />
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
            {formatAmount(row.original.amount)}
          </div>
        ),
      },
      {
        accessorKey: "lastMonth",
        header: () => <div className="text-right">Last Month</div>,
        cell: ({ row }) => {
          if (!isDemo) {
            return (
              <div className="text-right text-muted-foreground text-sm">
                No baseline
              </div>
            );
          }

          const amount =
            typeof row.original.amount === "number" ? row.original.amount : 0;
          const lastMonth =
            typeof row.original.lastMonth === "number"
              ? row.original.lastMonth
              : 0;
          const diff = amount - lastMonth;
          const isUp = diff > 0;
          const isDown = diff < 0;

          return (
            <div className="flex items-center justify-end gap-2 text-right font-mono">
              {formatAmount(row.original.lastMonth)}
              {isUp && <ArrowUpIcon className="size-3 text-muted-foreground" />}
              {isDown && (
                <ArrowDownIcon className="size-3 text-muted-foreground" />
              )}
            </div>
          );
        },
      },
    ],
    [formatAmount, isDemo],
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
              <div className="rounded-md bg-muted p-2">
                <Icon className="size-4 text-muted-foreground" />
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
          <div className="text-right font-mono">
            {formatAmount(row.original.amount)}
          </div>
        ),
      },
    ],
    [formatAmount],
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
              <Icon className="size-4 text-muted-foreground" />
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
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal text-xs">
            {row.original.method}
          </Badge>
        ),
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {row.original.type === "income" ? "+" : "-"}
            {formatAmount(row.original.amount)}
          </div>
        ),
      },
    ],
    [formatAmount],
  );

  const formatChartAmount = (value: unknown) =>
    isDemo
      ? formatMajorMoney(Number(value))
      : formatMinorUnits(value, displayCurrency);

  const formatCompactChartAmount = (value: unknown) =>
    isDemo
      ? new Intl.NumberFormat("en", {
          compactDisplay: "short",
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(Number(value))
      : formatCompactMinorUnits(value, displayCurrency);

  return (
    <div className="grid gap-6">
      <FinanceMetricCards
        currency={displayCurrency}
        formatAmount={formatAmount}
        isDemo={isDemo}
        money={money}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Cash flow analytics</CardTitle>
            <CardDescription>
              Income vs expenses over the current reporting window.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart
                data={cashFlowData}
                margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="label"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCompactChartAmount}
                />
                <RechartsTooltip
                  formatter={(value: unknown) => formatChartAmount(value)}
                  cursor={{ fill: "transparent" }}
                />
                <Legend iconType="circle" />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="var(--color-income)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="var(--color-expenses)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Expense breakdown</CardTitle>
            <CardDescription>Where family money was spent.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="amount"
                  nameKey="name"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: unknown) => formatChartAmount(value)}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Expense categories</CardTitle>
            <CardDescription>
              Monthly spending across categories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CommonDataTable
              columns={expenseCategoryColumns}
              data={expenseCategoryRows.slice(0, 5)}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Income sources</CardTitle>
            <CardDescription>Where family money comes from.</CardDescription>
          </CardHeader>
          <CardContent>
            <CommonDataTable
              columns={incomeSourceColumns}
              data={incomeSourceRows}
            />
          </CardContent>
        </Card>
      </div>

      {isDemo ? (
        <DemoGoalCards formatAmount={formatAmount} />
      ) : (
        <PersistedFinanceCards
          currency={displayCurrency}
          formatAmount={formatAmount}
          money={money}
        />
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
          <CardDescription>Latest family financial activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <CommonDataTable
            columns={transactionColumns}
            data={transactionRows}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function FinanceMetricCards({
  currency,
  formatAmount,
  isDemo,
  money,
}: {
  currency: string;
  formatAmount: (amount: AmountValue) => string;
  isDemo: boolean;
  money: MoneyOverview | null;
}) {
  const totals = money?.totals;
  const cards = isDemo
    ? [
        {
          title: "Total family balance",
          value: MOCK_SUMMARY.totalBalance,
          description: "Demo balance for dashboard preview",
          icon: WalletIcon,
        },
        {
          title: "Monthly income",
          value: MOCK_SUMMARY.monthlyIncome,
          description: "Across demo income sources",
          icon: ArrowUpIcon,
        },
        {
          title: "Monthly expenses",
          value: MOCK_SUMMARY.monthlyExpenses,
          description: "Demo spending snapshot",
          icon: ArrowDownIcon,
        },
        {
          title: "Total savings",
          value: MOCK_SUMMARY.totalSavings,
          description: "Demo active goals",
          icon: PiggyBankIcon,
        },
      ]
    : [
        {
          title: "Cash balance",
          value: totals?.cashBalanceMinorUnits,
          description: "Server-approved family position",
          icon: WalletIcon,
        },
        {
          title: "Income",
          value: totals?.incomeMinorUnits,
          description: "Approved money received",
          icon: ArrowUpIcon,
        },
        {
          title: "Expenses",
          value: totals?.expenseMinorUnits,
          description: "Approved money spent",
          icon: ArrowDownIcon,
        },
        {
          title: "Savings",
          value: totals?.savingsMinorUnits,
          description: `Saved in ${currency}`,
          icon: PiggyBankIcon,
        },
      ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <CardTitle className="font-medium text-sm">
                {card.title}
              </CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {formatAmount(card.value)}
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function DemoGoalCards({
  formatAmount,
}: {
  formatAmount: (amount: AmountValue) => string;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBankIcon className="size-5" /> Savings goals
          </CardTitle>
          <CardDescription>Track the family's future.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {MOCK_SAVINGS_GOALS.map((goal) => {
            const progress = (goal.saved / goal.target) * 100;
            return (
              <div key={goal.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{goal.name}</span>
                  <span className="text-muted-foreground font-mono">
                    {formatAmount(goal.saved)} / {formatAmount(goal.target)}
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
            <TrendingUpIcon className="size-5" /> Family contributions
          </CardTitle>
          <CardDescription>Active collections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {MOCK_CONTRIBUTIONS.map((contribution) => {
            const progress = (contribution.paid / contribution.target) * 100;
            return (
              <div key={contribution.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate pr-2 font-medium">
                    {contribution.name}
                  </span>
                  <span className="whitespace-nowrap text-muted-foreground font-mono">
                    {formatAmount(contribution.paid)}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-muted-foreground text-xs">
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
            <CreditCardIcon className="size-5" /> Active debts
          </CardTitle>
          <CardDescription>Loans and money lent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {MOCK_DEBTS.map((debt) => (
            <div
              key={debt.name}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="font-medium text-sm">{debt.name}</p>
                <p className="text-muted-foreground text-xs">
                  Due: {debt.dueDate}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm">{formatAmount(debt.amount)}</p>
                <Badge
                  variant={debt.type === "Borrowed" ? "destructive" : "default"}
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
  );
}

function PersistedFinanceCards({
  currency,
  formatAmount,
  money,
}: {
  currency: string;
  formatAmount: (amount: AmountValue) => string;
  money: MoneyOverview | null;
}) {
  const totals = money?.totals;
  const cards = [
    {
      title: "Savings",
      value: totals?.savingsMinorUnits,
      description: `Saved toward family goals in ${currency}.`,
      icon: PiggyBankIcon,
    },
    {
      title: "Contributions",
      value: totals?.contributionsPaidMinorUnits,
      description: "Paid family commitments from approved records.",
      icon: TrendingUpIcon,
    },
    {
      title: "Outstanding debts",
      value: totals?.debtOutstandingMinorUnits,
      description: "Borrowed or lent money still being tracked.",
      icon: CreditCardIcon,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title} className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="size-5" />
                {card.title}
              </CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-bold text-2xl">{formatAmount(card.value)}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function FamilyFinanceDashboardSkeleton() {
  return (
    <section className="flex flex-col gap-4" aria-label="Finance dashboard">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["balance", "income", "expenses", "savings"].map((item) => (
          <Skeleton key={item} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </section>
  );
}

function getExpenseCategories(records: MoneyRecordRow[]): ExpenseCategoryRow[] {
  const totals = new Map<string, { amount: string; count: number }>();

  for (const record of records) {
    if (!isRecordType(record, "expense")) continue;

    const name = record.category ?? "Uncategorized";
    const current = totals.get(name) ?? { amount: "0", count: 0 };

    totals.set(name, {
      amount: addMinorValues(current.amount, record.amountMinorUnits),
      count: current.count + 1,
    });
  }

  return Array.from(totals.entries()).map(([name, value]) => ({
    name,
    amount: value.amount,
    count: value.count,
  }));
}

function getIncomeSources(records: MoneyRecordRow[]): IncomeSourceRow[] {
  const totals = new Map<string, string>();

  for (const record of records) {
    if (!isRecordType(record, "income")) continue;

    const name = record.category ?? formatTitle(record.title);
    totals.set(
      name,
      addMinorValues(totals.get(name) ?? "0", record.amountMinorUnits),
    );
  }

  return Array.from(totals.entries()).map(([name, amount]) => ({
    name,
    amount,
    frequency: "Saved records",
  }));
}

function getRecentTransactions(records: MoneyRecordRow[]): TransactionRow[] {
  return records.slice(0, 10).map((record) => ({
    id: record.id,
    date: record.date ?? "Not dated",
    category: record.category ?? formatTitle(record.title),
    member: record.createdBy ?? "Family",
    method: record.status ?? "Saved",
    amount: record.amountMinorUnits,
    type: isRecordType(record, "income")
      ? "income"
      : isRecordType(record, "expense")
        ? "expense"
        : "other",
  }));
}

function getDemoTransactions(): TransactionRow[] {
  return MOCK_TRANSACTIONS.map((record) => ({
    id: record.id,
    date: record.date,
    category: record.category,
    member: record.member,
    method: record.method,
    amount: record.amount,
    type:
      record.type === "income"
        ? "income"
        : record.type === "expense"
          ? "expense"
          : "other",
  }));
}

function isRecordType(record: MoneyRecordRow, expected: "income" | "expense") {
  return record.type.toLowerCase().includes(expected);
}

function addMinorValues(current: string, next: AmountValue) {
  const normalized = normalizeMinorUnitString(next);

  if (!normalized) {
    return current;
  }

  return (BigInt(current) + BigInt(normalized)).toString();
}
