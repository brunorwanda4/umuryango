"use client";

import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { MoneyMobileTransactionRow } from "@/components/common/money-section/money-mobile-transaction-row";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { createTranslator } from "@/i18n/translate";
import type {
  IncomeCategory,
  RecentIncomeRecord,
} from "./income-dashboard-data";
import { RecentIncomeActionsPopover } from "./recent-income-actions-popover";
import { ViewIncomeDialog } from "./view-income-dialog";

type RecentIncomeItemsProps = {
  data: RecentIncomeRecord[];
  categories: IncomeCategory[];
  familyId: string;
  onSuccess: () => void | Promise<void>;
};

export function RecentIncomeItems({
  categories,
  data,
  familyId,
  onSuccess,
}: RecentIncomeItemsProps) {
  const t = createTranslator("PersonalMoney.personalIncome");

  if (data.length === 0) {
    return (
      <div className="px-5 pb-5 sm:px-6">
        <Empty className="border border-zinc-800 bg-zinc-900/40">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon aria-hidden="true" className="text-zinc-500" />
            </EmptyMedia>
            <EmptyTitle className="text-zinc-300">
              {t((m) => m.PersonalMoney.personalIncome.items.noIncomeTitle)}
            </EmptyTitle>
            <EmptyDescription className="text-zinc-500 text-xs">
              {t((m) => m.PersonalMoney.personalIncome.items.noIncomeDesc)}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <ul className="flex w-full flex-col gap-2.5 px-4 pb-4 sm:px-6">
      {data.map((income) => (
        <RecentIncomeItem
          categories={categories}
          familyId={familyId}
          income={income}
          key={income.id}
          onSuccess={onSuccess}
        />
      ))}
    </ul>
  );
}

function RecentIncomeItem({
  categories,
  familyId,
  income,
  onSuccess,
}: {
  categories: IncomeCategory[];
  familyId: string;
  income: RecentIncomeRecord;
  onSuccess: () => void | Promise<void>;
}) {
  const [isViewOpen, setIsViewOpen] = useState(false);

  return (
    <>
      <li className="list-none">
        <MoneyMobileTransactionRow
          direction="income"
          title={income.source}
          subtitle={
            income.description !== "No additional notes"
              ? income.description
              : null
          }
          category={income.category}
          categoryClassName={income.categoryClassName}
          paymentMethod={income.paymentMethod}
          paymentIcon={income.paymentIcon}
          date={income.date}
          amountMinorUnits={income.amountMinorUnits}
          currency={income.currency}
          status={income.status}
          icon={income.icon}
          iconClassName={income.sourceClassName}
          onView={() => setIsViewOpen(true)}
          actions={
            <RecentIncomeActionsPopover
              categories={categories}
              familyId={familyId}
              income={income}
              onSuccess={onSuccess}
            />
          }
        />
      </li>
      <ViewIncomeDialog
        categories={categories}
        familyId={familyId}
        income={income}
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        trigger={null}
        onSuccess={onSuccess}
      />
    </>
  );
}
