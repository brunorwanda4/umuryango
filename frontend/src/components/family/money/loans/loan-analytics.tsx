"use client";

import { BarChart3Icon } from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartEmptyState } from "../money-ui-helpers";
import { formatCompactMinorUnits, formatMinorUnits } from "../utils";
import {
  getEffectiveLoanStatus,
  isLoanOverdue,
  loanStatusLabel,
  toMinorNumber,
} from "./loan-utils";
import type { LoanRecord } from "./types-and-schemas";

const typeConfig = {
  borrowed: { label: "Borrowed", color: "var(--chart-2)" },
  lent: { label: "Lent", color: "var(--chart-4)" },
} satisfies ChartConfig;

const amountConfig = {
  amount: { label: "Amount", color: "var(--chart-3)" },
} satisfies ChartConfig;

const balanceConfig = {
  balance: { label: "Outstanding", color: "var(--chart-5)" },
} satisfies ChartConfig;

const paidRemainingConfig = {
  paid: { label: "Paid", color: "var(--chart-4)" },
  remaining: { label: "Remaining", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function LoanAnalytics({
  currency,
  loans,
}: {
  currency: string;
  loans: LoanRecord[];
}) {
  const data = useMemo(() => buildLoanAnalyticsData(loans), [loans]);

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <BorrowedVsLentChart data={data.borrowedVsLent} currency={currency} />
      <MonthlyRepaymentsChart
        data={data.monthlyRepayments}
        currency={currency}
      />
      <OutstandingBalanceChart
        data={data.outstandingBalance}
        currency={currency}
      />
      <AmountChart
        title="Loans by Status"
        description="Current family loan count grouped by status."
        data={data.byStatus}
        valueLabel="Loans"
      />
      <OverdueLoansChart data={data.overdueLoans} currency={currency} />
      <PaidVsRemainingChart data={data.paidVsRemaining} currency={currency} />
    </section>
  );
}

function buildLoanAnalyticsData(loans: LoanRecord[]) {
  const borrowedVsLent = [
    {
      label: "Borrowed",
      borrowed: loans
        .filter((loan) => loan.type === "MONEY_BORROWED")
        .reduce(
          (total, loan) => total + toMinorNumber(loan.originalAmountMinorUnits),
          0,
        ),
      lent: 0,
    },
    {
      label: "Lent",
      borrowed: 0,
      lent: loans
        .filter((loan) => loan.type === "MONEY_LENT")
        .reduce(
          (total, loan) => total + toMinorNumber(loan.originalAmountMinorUnits),
          0,
        ),
    },
  ];

  const repaymentMap = new Map<string, number>();
  for (const loan of loans) {
    for (const repayment of loan.repayments ?? []) {
      const date = new Date(repayment.paymentDate);
      const label = Number.isNaN(date.getTime())
        ? "Unknown"
        : new Intl.DateTimeFormat("en", {
            month: "short",
            year: "2-digit",
          }).format(date);
      repaymentMap.set(
        label,
        (repaymentMap.get(label) ?? 0) +
          toMinorNumber(repayment.amountMinorUnits),
      );
    }
  }

  const outstandingBalance = loans
    .filter(
      (loan) => loan.status !== "COMPLETED" && loan.status !== "CANCELLED",
    )
    .map((loan) => ({
      label: shortLabel(loan.title),
      balance: toMinorNumber(loan.remainingBalanceMinorUnits),
    }))
    .sort((first, second) => second.balance - first.balance)
    .slice(0, 8);

  const byStatus = summarizeCount(loans, (loan) =>
    loanStatusLabel(getEffectiveLoanStatus(loan)),
  );

  const overdueLoans = loans
    .filter((loan) => isLoanOverdue(loan))
    .map((loan) => ({
      label: shortLabel(loan.title),
      amount: toMinorNumber(loan.remainingBalanceMinorUnits),
    }))
    .sort((first, second) => second.amount - first.amount)
    .slice(0, 8);

  const paidVsRemaining = loans
    .map((loan) => ({
      label: shortLabel(loan.title),
      paid: toMinorNumber(loan.paidAmountMinorUnits),
      remaining: toMinorNumber(loan.remainingBalanceMinorUnits),
    }))
    .sort((first, second) => second.remaining - first.remaining)
    .slice(0, 8);

  return {
    borrowedVsLent,
    monthlyRepayments: Array.from(repaymentMap, ([label, amount]) => ({
      label,
      amount,
    })),
    outstandingBalance,
    byStatus,
    overdueLoans,
    paidVsRemaining,
  };
}

function summarizeCount(
  loans: LoanRecord[],
  getLabel: (loan: LoanRecord) => string,
) {
  const map = new Map<string, { label: string; amount: number }>();

  for (const loan of loans) {
    const label = getLabel(loan);
    const current = map.get(label) ?? { label, amount: 0 };
    current.amount += 1;
    map.set(label, current);
  }

  return Array.from(map.values()).sort(
    (first, second) => second.amount - first.amount,
  );
}

function BorrowedVsLentChart({
  currency,
  data,
}: {
  currency: string;
  data: { label: string; borrowed: number; lent: number }[];
}) {
  const hasData = data.some((item) => item.borrowed > 0 || item.lent > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Borrowed vs Lent</CardTitle>
        <CardDescription>
          Total original loan amounts by family borrowing and lending direction.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={typeConfig} className="h-72 w-full">
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={(value) =>
                  formatCompactMinorUnits(value, currency)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <>
                        <span className="text-muted-foreground">
                          {name === "borrowed" ? "Borrowed" : "Lent"}
                        </span>
                        <span className="font-mono font-medium">
                          {formatMinorUnits(value, currency)}
                        </span>
                      </>
                    )}
                  />
                }
              />
              <Bar dataKey="borrowed" fill="var(--color-borrowed)" radius={6} />
              <Bar dataKey="lent" fill="var(--color-lent)" radius={6} />
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartEmptyState
            icon={BarChart3Icon}
            title="No borrowed or lent totals"
            description="Saved loan records will populate this comparison."
          />
        )}
      </CardContent>
    </Card>
  );
}

function MonthlyRepaymentsChart({
  currency,
  data,
}: {
  currency: string;
  data: { label: string; amount: number }[];
}) {
  return (
    <AmountTrendCard
      title="Monthly Repayments"
      description="Repayments grouped by month from saved repayment history."
      data={data}
      currency={currency}
    />
  );
}

function OutstandingBalanceChart({
  currency,
  data,
}: {
  currency: string;
  data: { label: string; balance: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Outstanding Loan Balance</CardTitle>
        <CardDescription>
          Remaining balances for open loans, highest first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer config={balanceConfig} className="h-72 w-full">
            <BarChart accessibilityLayer data={data} layout="vertical">
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  formatCompactMinorUnits(value, currency)
                }
              />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                axisLine={false}
                width={112}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <>
                        <span className="text-muted-foreground">
                          Outstanding
                        </span>
                        <span className="font-mono font-medium">
                          {formatMinorUnits(value, currency)}
                        </span>
                      </>
                    )}
                  />
                }
              />
              <Bar
                dataKey="balance"
                fill="var(--color-balance)"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartEmptyState
            icon={BarChart3Icon}
            title="No outstanding balances"
            description="Active loan balances will appear here."
          />
        )}
      </CardContent>
    </Card>
  );
}

function AmountChart({
  data,
  description,
  title,
  valueLabel,
}: {
  data: { label: string; amount: number }[];
  description: string;
  title: string;
  valueLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer config={amountConfig} className="h-72 w-full">
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <>
                        <span className="text-muted-foreground">
                          {valueLabel}
                        </span>
                        <span className="font-mono font-medium">
                          {String(value)}
                        </span>
                      </>
                    )}
                  />
                }
              />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={6} />
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartEmptyState
            icon={BarChart3Icon}
            title="No status counts"
            description="Saved loan records will populate this chart."
          />
        )}
      </CardContent>
    </Card>
  );
}

function OverdueLoansChart({
  currency,
  data,
}: {
  currency: string;
  data: { label: string; amount: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overdue Loans</CardTitle>
        <CardDescription>
          Loans past their due date, ordered by remaining balance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer config={amountConfig} className="h-72 w-full">
            <BarChart accessibilityLayer data={data} layout="vertical">
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  formatCompactMinorUnits(value, currency)
                }
              />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                axisLine={false}
                width={112}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <>
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-mono font-medium">
                          {formatMinorUnits(value, currency)}
                        </span>
                      </>
                    )}
                  />
                }
              />
              <Bar
                dataKey="amount"
                fill="var(--color-amount)"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartEmptyState
            icon={BarChart3Icon}
            title="No overdue loans"
            description="Overdue balances will be highlighted here."
          />
        )}
      </CardContent>
    </Card>
  );
}

function PaidVsRemainingChart({
  currency,
  data,
}: {
  currency: string;
  data: { label: string; paid: number; remaining: number }[];
}) {
  const hasData = data.some((item) => item.paid > 0 || item.remaining > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paid vs Remaining</CardTitle>
        <CardDescription>
          Repayment progress across tracked loans.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={paidRemainingConfig} className="h-72 w-full">
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={(value) =>
                  formatCompactMinorUnits(value, currency)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <>
                        <span className="text-muted-foreground">
                          {name === "paid" ? "Paid" : "Remaining"}
                        </span>
                        <span className="font-mono font-medium">
                          {formatMinorUnits(value, currency)}
                        </span>
                      </>
                    )}
                  />
                }
              />
              <Bar
                dataKey="paid"
                stackId="loan"
                fill="var(--color-paid)"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="remaining"
                stackId="loan"
                fill="var(--color-remaining)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartEmptyState
            icon={BarChart3Icon}
            title="No repayment split"
            description="Paid and remaining balances will appear after loan records are saved."
          />
        )}
      </CardContent>
    </Card>
  );
}

function AmountTrendCard({
  currency,
  data,
  description,
  title,
}: {
  currency: string;
  data: { label: string; amount: number }[];
  description: string;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer config={amountConfig} className="h-72 w-full">
            <AreaChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={(value) =>
                  formatCompactMinorUnits(value, currency)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <>
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-mono font-medium">
                          {formatMinorUnits(value, currency)}
                        </span>
                      </>
                    )}
                  />
                }
              />
              <Area
                dataKey="amount"
                type="monotone"
                fill="var(--color-amount)"
                fillOpacity={0.16}
                stroke="var(--color-amount)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <ChartEmptyState
            icon={BarChart3Icon}
            title="No repayment history"
            description="Recorded repayments will draw this trend."
          />
        )}
      </CardContent>
    </Card>
  );
}

function shortLabel(value: string) {
  return value.length > 18 ? `${value.slice(0, 17)}...` : value;
}
