import {
  type MoneyFormCategory,
  MoneyFormDialog,
} from "@/components/money/money-form-dialog";
import { createTranslator } from "@/i18n/translate";

export interface PersonalMoneyHeaderProps {
  familyId: string | null;
  categories: MoneyFormCategory[];
  onSuccess: () => void;
}

export function PersonalMoneyHeader({
  familyId,
  categories,
  onSuccess,
}: PersonalMoneyHeaderProps) {
  const t = createTranslator("PersonalMoney");

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="font-fraunces text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t((m) => m.PersonalMoney.pageTitle)}
        </h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          {t((m) => m.PersonalMoney.pageDescription)}
        </p>
      </div>

      {familyId ? (
        <div className="flex flex-wrap gap-2">
          <MoneyFormDialog
            categories={categories}
            familyId={familyId}
            onCategoryCreated={onSuccess}
            onSuccess={onSuccess}
            triggerClassName="rounded-full font-semibold"
            triggerSize="default"
            type="income"
          />
          <MoneyFormDialog
            categories={categories}
            familyId={familyId}
            onCategoryCreated={onSuccess}
            onSuccess={onSuccess}
            triggerClassName="rounded-full font-semibold"
            triggerSize="default"
            type="expense"
          />
        </div>
      ) : null}
    </div>
  );
}
