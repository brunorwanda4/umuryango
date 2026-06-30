"use client";

import { ReceiptTextIcon, UploadIcon } from "lucide-react";
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
import { CreateReceiptForm } from "./forms/create-receipt-form";

const receiptsHeader: MoneySectionHeader = {
  section: "receipts",
  title: "Receipts",
  eyebrow: "Proof and documents",
  description:
    "Attach and review proof for family spending and received money so every important record can be checked later.",
  actionLabel: "Upload receipt",
  actionCapability: "RECORD_EXPENSE",
  actionIcon: UploadIcon,
  icon: ReceiptTextIcon,
  examples: [
    "Receipt for food shopping",
    "Photo proof for chairs or household items",
    "Rent payment proof or bank confirmation",
  ],
};

export function MoneyReceiptsPage({ familyName }: { familyName: string }) {
  return (
    <FamilyMoneyPageData familyName={familyName}>
      {({ currency, family, money, moneyMessage }) => (
        <MoneySectionLayout
          currency={currency}
          family={family}
          header={receiptsHeader}
          money={money}
          moneyMessage={moneyMessage}
          actionDialog={
            <CreateReceiptForm
              familyId={family.id}
              transactions={money?.records ?? []}
            />
          }
        >
          <ReceiptRecordsView currency={currency} money={money} />
        </MoneySectionLayout>
      )}
    </FamilyMoneyPageData>
  );
}

function ReceiptRecordsView({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const records = filterRecordsBySection(money?.records ?? [], "receipts");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipt-ready records</CardTitle>
        <CardDescription>
          Attachments will be linked to the money record they support after the
          receipt API is available.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {records.length ? (
          <MoneySectionRecordsTable records={records} currency={currency} />
        ) : (
          <TableEmptyState
            icon={ReceiptTextIcon}
            title="No receipt records returned"
            description="Receipts for food shopping, rent payments, furniture, school supplies, and other family purchases will show here."
          />
        )}
      </CardContent>
    </Card>
  );
}
