"use client";

import { MoneyFormDialog } from "@/components/money/money-form-dialog";
import { PersonPlanForm } from "@/components/plans/person-plan-form";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PersonalMoneyDebtCard,
  PersonalMoneyEmptyWorkspace,
  PersonalMoneyHeader,
  PersonalMoneyOverviewCards,
  PersonalMoneyRecentTransactions,
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
  const {
    familyId,
    currency,
    loading,
    categories,
    allTransactions,
    totalIncome,
    totalExpenses,
    balance,
    totalSavings,
    totalDebt,
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
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <PersonalMoneyHeader
        familyId={familyId}
        categories={categories}
        onSuccess={loadData}
      />

      {/* No Family Alert */}
      {!familyId && !loading ? <PersonalMoneyEmptyWorkspace /> : null}

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col gap-4">
          <PersonalMoneyOverviewCards
            loading={true}
            currency={currency}
            totalIncome={0}
            totalExpenses={0}
            balance={0}
            totalSavings={0}
            totalDebt={0}
          />
          <Skeleton className="h-64 rounded-[20px]" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <PersonalMoneyOverviewCards
            currency={currency}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            balance={balance}
            totalSavings={totalSavings}
            totalDebt={totalDebt}
          />

          {/* Recent Transactions Card */}
          <PersonalMoneyRecentTransactions
            transactions={allTransactions}
            currency={currency}
            limit={8}
          />

          {/* Bottom 2 Cards Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Next Savings Goal */}
            <PersonalMoneySavingsCard
              goal={nextSavingsGoal}
              currency={currency}
              onAddGoal={openGoalDialog}
            />

            {/* Debt Snapshot */}
            <PersonalMoneyDebtCard
              loan={activeDebt}
              currency={currency}
              onAddLoan={openDebtDialog}
            />
          </div>
        </div>
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
    </div>
  );
}
