"use client";

import { ListChecksIcon } from "lucide-react";
import { FamilyMoneyPageData } from "./family-money-page-data";
import { MoneyBudgetList } from "./money-budget-list";
import { MoneySectionLayout } from "./money-section-layout";
import type { MoneySectionHeader } from "./money-section-types";

const budgetsHeader: MoneySectionHeader = {
  section: "budgets",
  title: "Budgets",
  eyebrow: "Planning and limits",
  description:
    "Plan spending limits by category and compare approved source records against each budget period.",
  actionLabel: "Create budget",
  actionIcon: ListChecksIcon,
  icon: ListChecksIcon,
  examples: [
    "Monthly food budget",
    "School items and supplies",
    "Furniture or home improvement budget",
  ],
};

export function MoneyBudgetsPage({ familyName }: { familyName: string }) {
  return (
    <FamilyMoneyPageData familyName={familyName}>
      {({ currency, family, money, moneyMessage }) => (
        <MoneySectionLayout
          currency={currency}
          family={family}
          header={budgetsHeader}
          money={money}
          moneyMessage={moneyMessage}
        >
          <MoneyBudgetList currency={currency} money={money} />
        </MoneySectionLayout>
      )}
    </FamilyMoneyPageData>
  );
}
