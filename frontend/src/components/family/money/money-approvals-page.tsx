"use client";

import { FileClockIcon, ShieldCheckIcon } from "lucide-react";
import { FamilyMoneyPageData } from "./family-money-page-data";
import { MoneyApprovalTable } from "./money-approval-table";
import { MoneySectionLayout } from "./money-section-layout";
import type { MoneySectionHeader } from "./money-section-types";

const approvalsHeader: MoneySectionHeader = {
  section: "approvals",
  title: "Approvals",
  eyebrow: "Review queue",
  description:
    "Review submitted money records before they affect official family reports, balances, and budgets.",
  actionLabel: "Review approvals",
  actionCapability: "APPROVE_EXPENSE",
  actionIcon: ShieldCheckIcon,
  icon: FileClockIcon,
  examples: [
    "Approve an expense with a receipt",
    "Reject a record with a correction reason",
    "Keep the reviewer and decision history auditable",
  ],
};

export function MoneyApprovalsPage({ familyName }: { familyName: string }) {
  return (
    <FamilyMoneyPageData familyName={familyName}>
      {({ currency, family, money, moneyMessage }) => (
        <MoneySectionLayout
          currency={currency}
          family={family}
          header={approvalsHeader}
          money={money}
          moneyMessage={moneyMessage}
        >
          <MoneyApprovalTable
            currency={currency}
            money={money}
            familyId={family.id}
          />
        </MoneySectionLayout>
      )}
    </FamilyMoneyPageData>
  );
}
