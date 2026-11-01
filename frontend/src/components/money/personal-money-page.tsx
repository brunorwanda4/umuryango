"use client";

import {
  CashflowHeroCard,
  CategoryBreakdownCard,
  MoneyOverviewHeader,
  MoneyOverviewLoadingSkeleton,
  MoneyOverviewShell,
  MoneyOverviewTopGrid,
  MoneyPeriodSelector,
  TransactionLedgerCard,
} from "@/components/common/money-overview";
import { MoneyFormDialog } from "@/components/money/money-form-dialog";
import { PersonPlanForm } from "@/components/plans/person-plan-form";
import { createTranslator } from "@/i18n/translate";
import {
  PersonalMoneyDebtCard,
  PersonalMoneyEmptyWorkspace,
  PersonalMoneySavingsCard,
  usePersonalMoney,
} from "./personal-money";

export type { RealTransaction } from "./personal-money";
// Re-export subcomponents, formatters, and types for backward compatibility
export {
  formatCompactRwf,
  formatDisplayDate,
  formatFullRwf,
  PersonalMoneyDebtCard as DebtSnapshotCard,
  PersonalMoneySavingsCard as SavingsGoalSnapshot,
  PersonalMoneyTransactionsTable as TransactionsTable,
  paymentMethodLabel,
} from "./personal-money";

export function PersonalMoneyPage() {
  const t = createTranslator("PersonalMoney");
  const {
    familyId,
    currency,
    loading,
    period,
    setPeriod,
    periodOptions,
    periodLabel,
    categories,
    sharedTransactions,
    cashFlowPoints,
    incomeCategoryBreakdown,
    expenseCategoryBreakdown,
    totalIncomeMinorUnits,
    totalExpensesMinorUnits,
    balanceMinorUnits,
    incomeDashboard,
    expenseDashboard,
    nextSavingsGoal,
    activeDebt,
    moneyFormOpen,
    setMoneyFormOpen,
    moneyFormType,
    planFormOpen,
    setPlanFormOpen,
    openDebtDialog,
    openGoalDialog,
    loadData,
  } = usePersonalMoney();

  return (
    <MoneyOverviewShell>
      {/* Page Header */}
      <MoneyOverviewHeader
        title={t((m) => m.PersonalMoney.pageTitle)}
        description={t((m) => m.PersonalMoney.pageDescription)}
        actions={
          familyId ? (
            <div className="flex flex-wrap items-center gap-2">
              <MoneyFormDialog
                categories={categories}
                familyId={familyId}
                onCategoryCreated={loadData}
                onSuccess={loadData}
                triggerClassName="rounded-xl font-semibold"
                triggerSize="default"
                type="income"
              />
              <MoneyFormDialog
                categories={categories}
                familyId={familyId}
                onCategoryCreated={loadData}
                onSuccess={loadData}
                triggerClassName="rounded-xl font-semibold"
                triggerSize="default"
                type="expense"
              />
            </div>
          ) : null
        }
      />

      {/* Timeframe Pill Selector */}
      <div className="w-full sm:w-auto">
        <MoneyPeriodSelector
          options={periodOptions}
          value={period}
          onChange={(v) => setPeriod(v as typeof period)}
        />
      </div>

      {/* No Family Alert */}
      {!familyId && !loading ? <PersonalMoneyEmptyWorkspace /> : null}

      {/* Main Content */}
      {loading ? (
        <MoneyOverviewLoadingSkeleton />
      ) : (
        <>
          {/* Top Grid: Hero Card + Category Breakdown */}
          <MoneyOverviewTopGrid>
            <div className="lg:col-span-8">
              <CashflowHeroCard
                label={t((m) => m.PersonalMoney.cards.balance)}
                badgeLabel={periodLabel}
                netMinorUnits={balanceMinorUnits}
                incomeMinorUnits={totalIncomeMinorUnits}
                expenseMinorUnits={totalExpensesMinorUnits}
                currency={currency}
                incomeMeta={
                  incomeDashboard?.records?.length
                    ? `${incomeDashboard.records.length} records`
                    : undefined
                }
                expenseMeta={
                  expenseDashboard?.records?.length
                    ? `${expenseDashboard.records.length} records`
                    : undefined
                }
                cashFlowPoints={cashFlowPoints}
              />
            </div>

            <div className="lg:col-span-4">
              <CategoryBreakdownCard
                expenseCategories={expenseCategoryBreakdown}
                incomeCategories={incomeCategoryBreakdown}
                currency={currency}
              />
            </div>
          </MoneyOverviewTopGrid>

          {/* Transaction Ledger */}
          <TransactionLedgerCard
            transactions={sharedTransactions}
            currency={currency}
            limit={12}
          />

          {/* Supporting Row: Savings Goal Snapshot & Debt Snapshot */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PersonalMoneySavingsCard
              goal={nextSavingsGoal}
              currency={currency}
              onAddGoal={openGoalDialog}
            />

            <PersonalMoneyDebtCard
              loan={activeDebt}
              currency={currency}
              onAddLoan={openDebtDialog}
            />
          </div>
        </>
      )}

      {/* MoneyFormDialog for adding transactions */}
      {familyId ? (
        <MoneyFormDialog
          familyId={familyId}
          type={moneyFormType}
          open={moneyFormOpen}
          trigger={null}
          onOpenChange={setMoneyFormOpen}
          categories={categories}
          onCategoryCreated={loadData}
          onSuccess={loadData}
        />
      ) : null}

      {/* PersonPlanForm for adding savings goals */}
      <PersonPlanForm
        open={planFormOpen}
        onOpenChange={setPlanFormOpen}
        editPlan={null}
        initialType="LONG_TERM_GOAL"
        onSuccess={loadData}
      />
    </MoneyOverviewShell>
  );
}
