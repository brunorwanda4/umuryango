"use client";

import { FolderTreeIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FamilyMoneyPageData } from "./family-money-page-data";
import { MoneySectionLayout } from "./money-section-layout";
import type { MoneySectionHeader } from "./money-section-types";
import { summarizeRecordsByCategory } from "./money-section-utils";
import { TableEmptyState } from "./money-ui-helpers";
import type { MoneyOverview } from "./types";
import { formatOptionalMoney } from "./utils";

const categoriesHeader: MoneySectionHeader = {
  section: "categories",
  title: "Categories",
  eyebrow: "Money organization",
  description:
    "Keep income and expenses organized by purpose so reports can explain where money came from and where it was used.",
  actionLabel: "Manage categories",
  actionIcon: FolderTreeIcon,
  icon: FolderTreeIcon,
  examples: [
    "Food and household",
    "Rent and property",
    "School, transport, furniture, and ceremonies",
  ],
};

export function MoneyCategoriesPage({ familyName }: { familyName: string }) {
  return (
    <FamilyMoneyPageData familyName={familyName}>
      {({ currency, family, money, moneyMessage }) => (
        <MoneySectionLayout
          currency={currency}
          family={family}
          header={categoriesHeader}
          money={money}
          moneyMessage={moneyMessage}
        >
          <CategorySummaryView currency={currency} money={money} />
        </MoneySectionLayout>
      )}
    </FamilyMoneyPageData>
  );
}

function CategorySummaryView({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const summaries = summarizeRecordsByCategory(money?.records ?? []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category summary</CardTitle>
        <CardDescription>
          Category totals are calculated only from records returned by the API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {summaries.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Records</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((summary) => (
                <TableRow key={summary.category}>
                  <TableCell className="font-medium">
                    {summary.category}
                  </TableCell>
                  <TableCell>{summary.recordCount.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatOptionalMoney(summary.incomeMinorUnits, currency)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatOptionalMoney(summary.expenseMinorUnits, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <TableEmptyState
            icon={FolderTreeIcon}
            title="No category records returned"
            description="Food, rent, school, transport, furniture, ceremonies, and project categories will appear after saved records use them."
          />
        )}
      </CardContent>
    </Card>
  );
}
