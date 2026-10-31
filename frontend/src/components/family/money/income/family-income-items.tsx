"use client";

import { SearchIcon } from "lucide-react";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { createTranslator } from "@/i18n/translate";
import { FamilyIncomeItem } from "./family-income-item";
import type { IncomeAction } from "./income-actions-dropdown";
import type { IncomeTransaction } from "./types-and-schemas";

export type FamilyIncomeItemsProps = {
  data: IncomeTransaction[];
  currency: string;
  isAdmin: boolean;
  family: FamilyDetail;
  handleActionClick: (tx: IncomeTransaction, action: IncomeAction) => void;
  handleSendApproval: (tx: IncomeTransaction) => void;
};

export function FamilyIncomeItems({
  data,
  currency,
  isAdmin,
  family,
  handleActionClick,
  handleSendApproval,
}: FamilyIncomeItemsProps) {
  const t = createTranslator("FamilyIncome");

  if (data.length === 0) {
    return (
      <div className="px-5 pb-5 sm:px-6">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t("panels.noIncomeFound")}</EmptyTitle>
            <EmptyDescription>{t("panels.noIncomeFoundDesc")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <ul className="flex w-full flex-col gap-4 px-5 pb-5 sm:px-6">
      {data.map((tx) => (
        <FamilyIncomeItem
          key={tx.id}
          tx={tx}
          currency={currency}
          isAdmin={isAdmin}
          family={family}
          handleActionClick={handleActionClick}
          handleSendApproval={handleSendApproval}
        />
      ))}
    </ul>
  );
}
