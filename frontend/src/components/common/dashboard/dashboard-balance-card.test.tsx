import assert from "node:assert/strict";
import test from "node:test";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DashboardBalanceCard,
  DashboardBalanceStat,
} from "./dashboard-balance-card";

function renderWithTooltip(node: ReactNode) {
  return renderToString(<TooltipProvider>{node}</TooltipProvider>);
}

test("DashboardBalanceCard renders total balance and retains currency for confirmed zero", () => {
  const html = renderWithTooltip(
    <DashboardBalanceCard currency="RWF" label="Total Balance" value={0} />,
  );

  assert.ok(html.includes("Total Balance"), "should render balance label");
  assert.ok(html.includes("self-start"), "should contain self-start class");
  assert.ok(
    html.includes("family-balance-card"),
    "should contain family-balance-card utility class",
  );
  // Confirmed zero must show '0' and 'RWF'
  assert.ok(html.includes(">0<"), "should show 0 for confirmed zero balance");
  assert.ok(html.includes(">RWF<"), "should retain currency beside 0");
  assert.ok(
    !html.includes(">—<"),
    "should not render em-dash for confirmed zero balance",
  );
});

test("DashboardBalanceCard renders unavailable state distinctly from zero", () => {
  const html = renderWithTooltip(
    <DashboardBalanceCard
      currency="RWF"
      label="Total Balance"
      unavailable={true}
      unavailableLabel="Syncing financial data"
      value={null}
    />,
  );

  assert.ok(
    html.includes("—"),
    "should render em dash for unavailable balance",
  );
  assert.ok(
    html.includes("Syncing financial data"),
    "should render unavailable label message",
  );
  assert.ok(html.includes("RWF"), "should retain currency tag");
});

test("DashboardBalanceCard wraps balance in Link when href is provided", () => {
  const htmlWithLink = renderWithTooltip(
    <DashboardBalanceCard
      currency="RWF"
      href="/me/money"
      label="Total Balance"
      value={1500000}
    />,
  );
  assert.ok(
    htmlWithLink.includes('href="/me/money"'),
    "should wrap balance in link when href is supplied",
  );

  const htmlWithoutLink = renderWithTooltip(
    <DashboardBalanceCard
      currency="RWF"
      label="Total Balance"
      value={1500000}
    />,
  );
  assert.ok(
    !htmlWithoutLink.includes('href="/me/money"'),
    "should not render link when href is omitted",
  );
});

test("DashboardBalanceStat formats positive income with '+' and emerald styling", () => {
  const html = renderWithTooltip(
    <DashboardBalanceStat
      currency="RWF"
      label="Income this month"
      value={450000}
      variant="income"
    />,
  );

  assert.ok(
    html.includes("Income this month"),
    "should render income stat label",
  );
  assert.ok(html.includes("+"), "positive income must have '+' prefix");
  assert.ok(
    html.includes("text-emerald-400"),
    "income stat value should use emerald color token",
  );
  assert.ok(
    html.includes("bg-emerald-500"),
    "income stat should render emerald indicator dot",
  );
  assert.ok(
    html.includes("RWF"),
    "should display currency suffix beside the amount",
  );
});

test("DashboardBalanceStat formats positive expense with '−' and rose styling", () => {
  const html = renderWithTooltip(
    <DashboardBalanceStat
      currency="RWF"
      label="Spent this month"
      value={230000}
      variant="expense"
    />,
  );

  assert.ok(
    html.includes("Spent this month"),
    "should render expense stat label",
  );
  assert.ok(html.includes("−"), "positive expense must have '−' prefix");
  assert.ok(
    html.includes("text-rose-400"),
    "expense stat value should use rose color token",
  );
  assert.ok(
    html.includes("bg-rose-500"),
    "expense stat should render rose indicator dot",
  );
});

test("DashboardBalanceStat formats zero income and zero expense without sign prefix", () => {
  const incomeHtml = renderWithTooltip(
    <DashboardBalanceStat
      currency="RWF"
      label="Income this month"
      value={0}
      variant="income"
    />,
  );
  assert.ok(!incomeHtml.includes("+0"), "zero income must NOT have '+' prefix");
  assert.ok(incomeHtml.includes(">0<"), "should render '0'");

  const expenseHtml = renderWithTooltip(
    <DashboardBalanceStat
      currency="RWF"
      label="Spent this month"
      value={0}
      variant="expense"
    />,
  );
  assert.ok(
    !expenseHtml.includes("−0"),
    "zero expense must NOT have '−' prefix",
  );
  assert.ok(expenseHtml.includes(">0<"), "should render '0'");
});

test("DashboardBalanceStat handles description only when supplied", () => {
  const withDesc = renderWithTooltip(
    <DashboardBalanceStat
      currency="RWF"
      description="42% of monthly target"
      label="Income this month"
      value={450000}
      variant="income"
    />,
  );
  assert.ok(
    withDesc.includes("42% of monthly target"),
    "should render description when provided",
  );

  const withoutDesc = renderWithTooltip(
    <DashboardBalanceStat
      currency="RWF"
      label="Income this month"
      value={450000}
      variant="income"
    />,
  );
  assert.ok(
    !withoutDesc.includes("monthly target"),
    "should not render description when omitted",
  );
});
