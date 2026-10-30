import {
  type MoneyFormCategory,
  MoneyFormDialog,
} from "@/components/money/money-form-dialog";

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
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="font-fraunces text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          My Money
        </h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Manage income, expenses, savings, debts, and recent money activity in
          one place.
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
