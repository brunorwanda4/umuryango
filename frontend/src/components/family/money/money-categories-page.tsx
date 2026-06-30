"use client";

import { useMemo } from "react";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  PiggyBankIcon,
  TrendingUpIcon,
  WalletIcon,
  CreditCardIcon,
  InfoIcon,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer } from "@/components/ui/chart";

import { FamilyMoneyPageData } from "./family-money-page-data";
import type { MoneyOverview } from "./types";
import { formatMinorUnits, normalizeMinorUnitString, getCurrencyFractionDigits } from "./utils";
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

// Chart palette
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
        <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Family Finance Overview</h1>
              <p className="text-muted-foreground mt-1">
                Manage every aspect of {family.name}&apos;s finances.
              </p>
            </div>
            {(!money?.records || money.records.length === 0) && (
              <Badge variant="secondary" className="px-3 py-1 flex items-center gap-1.5 self-start sm:self-auto text-blue-600 bg-blue-50 border-blue-200">
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

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: displayCurrency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const chartConfig = {
    value: { label: "Value" },
  };

  return (
    <div className="grid gap-6">
      {/* Top Metric Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Family Balance</CardTitle>
            <WalletIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(MOCK_SUMMARY.totalBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">+12.5% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(MOCK_SUMMARY.monthlyIncome)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across 3 income sources</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(MOCK_SUMMARY.monthlyExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">Top spend: Food</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <PiggyBankIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(MOCK_SUMMARY.totalSavings)}</div>
            <p className="text-xs text-muted-foreground mt-1">3 active goals</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Cash Flow Analytics</CardTitle>
            <CardDescription>Income vs Expenses over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={MOCK_MONTHLY_CASHFLOW} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <RechartsTooltip
                  formatter={(value: any) =>
                    new Intl.NumberFormat("en", {
                      style: "currency",
                      currency,
                    }).format(value as number)
                  }
                  cursor={{ fill: "transparent" }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: any) => formatMoney(value as number)} 
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
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
            <CardDescription>Monthly spending across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">This Month</TableHead>
                  <TableHead className="text-right">Last Month</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_EXPENSE_CATEGORIES.slice(0, 5).map((category) => {
                  const Icon = CATEGORY_ICONS[category.name] || CATEGORY_ICONS["Miscellaneous"];
                  const diff = category.amount - category.lastMonth;
                  const isUp = diff > 0;
                  const isDown = diff < 0;

                  return (
                    <TableRow key={category.name}>
                      <TableCell className="font-medium flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-md">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        {category.name}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatMoney(category.amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono flex items-center justify-end gap-2">
                        {formatMoney(category.lastMonth)}
                        {isUp && <ArrowUpIcon className="w-3 h-3 text-red-500" />}
                        {isDown && <ArrowDownIcon className="w-3 h-3 text-green-500" />}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Income Sources</CardTitle>
            <CardDescription>Where your money comes from</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_INCOME_SOURCES.map((source) => {
                  const Icon = CATEGORY_ICONS[source.name] || CATEGORY_ICONS["Other Income"];
                  return (
                    <TableRow key={source.name}>
                      <TableCell className="font-medium flex items-center gap-3">
                        <div className="p-2 bg-green-50 text-green-600 rounded-md">
                          <Icon className="w-4 h-4" />
                        </div>
                        {source.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{source.frequency}</TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        +{formatMoney(source.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
                    <span className="font-medium truncate pr-2">{contribution.name}</span>
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
              <div key={debt.name} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{debt.name}</p>
                  <p className="text-xs text-muted-foreground">Due: {debt.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">{formatMoney(debt.amount)}</p>
                  <Badge variant={debt.type === "Borrowed" ? "destructive" : "default"} className="mt-1 text-[10px]">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_TRANSACTIONS.map((tx) => {
                const isIncome = tx.type === "income";
                const Icon = CATEGORY_ICONS[tx.category] || CATEGORY_ICONS["Miscellaneous"];
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" /> {tx.category}
                    </TableCell>
                    <TableCell>{tx.member}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {tx.method}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-mono ${isIncome ? 'text-green-600' : ''}`}>
                      {isIncome ? '+' : '-'}{formatMoney(tx.amount)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
