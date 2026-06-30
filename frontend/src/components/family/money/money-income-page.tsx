"use client";

import { ArrowDownIcon, PlusIcon } from "lucide-react";
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

const incomeHeader: MoneySectionHeader = {
  section: "income",
  title: "Income",
  eyebrow: "Money received",
  description:
    "Record family money that comes in, such as rent payments, support from relatives, project income, or contribution transfers.",
  actionLabel: "Record income",
  actionCapability: "RECORD_INCOME",
  actionIcon: PlusIcon,
  icon: ArrowDownIcon,
  examples: [
    "Rent paid by a tenant",
    "Money sent for a family event",
    "Project or family business income",
  ],
};

export function MoneyIncomePage({ familyName }: { familyName: string }) {
  return (
    <FamilyMoneyPageData familyName={familyName}>
      {({ currency, family, money, moneyMessage }) => (
        <MoneySectionLayout
          currency={currency}
          family={family}
          header={incomeHeader}
          money={money}
          moneyMessage={moneyMessage}
        >
          <IncomeRecordsView currency={currency} money={money} />
        </MoneySectionLayout>
      )}
    </FamilyMoneyPageData>
  );
}

function IncomeRecordsView({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const records = filterRecordsBySection(money?.records ?? [], "income");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income records</CardTitle>
        <CardDescription>
          Approved and submitted family income records returned by the API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {records.length ? (
          <MoneySectionRecordsTable records={records} currency={currency} />
        ) : (
          <TableEmptyState
            icon={ArrowDownIcon}
            title="No income records returned"
            description="Rent payments, family support, project income, and other saved income records will appear here with amount, date, category, creator, and approval status."
          />
        )}
      </CardContent>
    </Card>
  );
}
