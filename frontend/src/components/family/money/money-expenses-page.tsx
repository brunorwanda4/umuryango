"use client";

import { ArrowUpIcon, PlusIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FamilyMoneyPageData } from "./family-money-page-data";
import { MoneySectionLayout } from "./money-section-layout";
import { MoneySectionRecordsTable } from "./money-section-records-table";
import type { MoneySectionHeader } from "./money-section-types";
import { filterRecordsBySection } from "./money-section-utils";
import { TableEmptyState } from "./money-ui-helpers";
import type { MoneyOverview } from "./types";
import { CreateTransactionForm } from "./forms/create-transaction-form";

const expensesHeader: MoneySectionHeader = {
  section: "expenses",
  title: "Expenses",
  eyebrow: "Money spent",
  description:
    "Track money given out or spent for the family, including small errands, food, furniture, school items, and project costs.",
  actionLabel: "Record expense",
  actionCapability: "RECORD_EXPENSE",
  actionIcon: PlusIcon,
  icon: ArrowUpIcon,
  examples: [
    "Money given to a child to buy a pen",
    "Money given to buy food",
    "New chairs or other household purchases",
  ],
};

export function MoneyExpensesPage({ familyName }: { familyName: string }) {
  return (
    <FamilyMoneyPageData familyName={familyName}>
      {({ currency, family, money, moneyMessage }) => (
        <MoneySectionLayout
          currency={currency}
          family={family}
          header={expensesHeader}
          money={money}
          moneyMessage={moneyMessage}
          actionDialog={
            <CreateTransactionForm
              familyId={family.id}
              type="EXPENSE"
              actionLabel={expensesHeader.actionLabel}
              icon={expensesHeader.actionIcon}
            />
          }
        >
          <ExpenseRecordsView currency={currency} money={money} />
        </MoneySectionLayout>
      )}
    </FamilyMoneyPageData>
  );
}

function ExpenseRecordsView({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const records = filterRecordsBySection(money?.records ?? [], "expenses");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense records</CardTitle>
        <CardDescription>
          Approved and submitted family spending records returned by the API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {records.length ? (
          <MoneySectionRecordsTable records={records} currency={currency} />
        ) : (
          <TableEmptyState
            icon={ArrowUpIcon}
            title="No expense records returned"
            description="Pens, food, furniture, transport, school supplies, and other saved expense records will appear here with amount, date, category, creator, and approval status."
          />
        )}
      </CardContent>
    </Card>
  );
}
