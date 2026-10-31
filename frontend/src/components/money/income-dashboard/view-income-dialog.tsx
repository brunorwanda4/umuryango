"use client";

import type * as React from "react";
import { ViewTransactionDialog } from "@/components/common/money/view-transaction-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { createTranslator } from "@/i18n/translate";
import { DeleteIncomeDialog } from "./delete-income-dialog";
import type {
  IncomeCategory,
  RecentIncomeRecord,
} from "./income-dashboard-data";
import { UpdateIncomeDialog } from "./update-income-dialog";

type ViewIncomeDialogProps = {
  income: RecentIncomeRecord;
  categories: IncomeCategory[];
  familyId: string;
  onSuccess?: () => void | Promise<void>;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  searchParamValue?: string;
  trigger?: React.ReactElement | null;
};

export function ViewIncomeDialog({
  categories,
  familyId,
  income,
  onOpenChange,
  onSuccess,
  open,
  searchParamValue,
  trigger,
}: ViewIncomeDialogProps) {
  const t = createTranslator("PersonalMoney.personalIncome");
  const { user: currentUser } = useCurrentUser();

  return (
    <ViewTransactionDialog
      amountLabel={t("viewDialog.amountReceived")}
      amountMinorUnits={income.amountMinorUnits}
      category={income.category}
      categoryClassName={income.categoryClassName}
      currency={income.currency}
      date={income.date}
      dateLabel={t("viewDialog.dateReceived")}
      deleteLabel={t("viewDialog.deleteIncome")}
      detailsDescription={t("viewDialog.detailsDesc")}
      detailsTitle={t("viewDialog.detailsTitle")}
      description={income.description}
      leading={
        <Avatar className="size-11 shrink-0 rounded-lg">
          <AvatarImage
            src={currentUser?.avatarUrl ?? undefined}
            alt={currentUser?.fullName ?? "Person who recorded this income"}
          />
          <AvatarFallback name={currentUser?.fullName ?? "User"} />
        </Avatar>
      }
      onOpenChange={onOpenChange}
      open={open}
      paymentIcon={income.paymentIcon}
      paymentMethod={income.paymentMethod}
      renderDelete={({ onOpenChange: setDeleteOpen, open: deleteOpen }) => (
        <DeleteIncomeDialog
          familyId={familyId}
          income={income}
          onOpenChange={setDeleteOpen}
          onSuccess={onSuccess}
          open={deleteOpen}
          trigger={null}
        />
      )}
      renderUpdate={({ onOpenChange: setUpdateOpen, open: updateOpen }) => (
        <UpdateIncomeDialog
          categories={categories}
          familyId={familyId}
          income={income}
          onOpenChange={setUpdateOpen}
          onSuccess={onSuccess}
          open={updateOpen}
          trigger={null}
        />
      )}
      searchParamValue={searchParamValue ?? `view-income-${income.id}`}
      title={income.source}
      trigger={trigger}
      updateLabel={t("viewDialog.updateIncome")}
    />
  );
}
