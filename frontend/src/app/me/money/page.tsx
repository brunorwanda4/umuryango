import { PageTitle } from "@/components/common/pages/page-title";
import { DebtsTab } from "@/components/money/debts-tab";
import { ExpensesTab } from "@/components/money/expenses-tab";
import { IncomeTab } from "@/components/money/income-tab";
import { MoneyOverview } from "@/components/money/money-overview";
import { SavingsTab } from "@/components/money/savings-tab";
import { TransactionsTab } from "@/components/money/transactions-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const moneyTabs = [
  { label: "Overview", value: "overview" },
  { label: "Income", value: "income" },
  { label: "Expenses", value: "expenses" },
  { label: "Savings", value: "savings" },
  { label: "Debts", value: "debts" },
  { label: "Transactions", value: "transactions" },
];

export default function MyMoneyPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="My Money"
        description="Manage income, expenses, savings, debts, and recent money activity in one organized workspace."
      />
      <Tabs defaultValue="overview" syncWithHash={false}>
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6">
          {moneyTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview">
          <MoneyOverview />
        </TabsContent>
        <TabsContent value="income">
          <IncomeTab />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesTab />
        </TabsContent>
        <TabsContent value="savings">
          <SavingsTab />
        </TabsContent>
        <TabsContent value="debts">
          <DebtsTab />
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
