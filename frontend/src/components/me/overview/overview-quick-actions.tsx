"use client";

import {
  CalendarPlusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { MoneyFormCategory } from "@/components/money/money-form-dialog";
import { MoneyFormDialog } from "@/components/money/money-form-dialog";
import { PersonPlanForm } from "@/components/plans/person-plan-form";
import { Button } from "@/components/ui/button";
import { createTranslator } from "@/i18n/translate";
import apiRequest from "@/service/api";

export default function OverviewQuickActions({
  familyId,
  onSuccess,
}: {
  familyId?: string;
  onSuccess?: () => void;
}) {
  const t = createTranslator("PersonalOverview.quickActionsCard");
  const [planFormOpen, setPlanFormOpen] = useState(false);
  const [categories, setCategories] = useState<MoneyFormCategory[]>([]);

  const fetchCategories = useCallback(async () => {
    if (!familyId) return;
    const response = await apiRequest<undefined, MoneyFormCategory[]>(
      "get",
      `/families/${encodeURIComponent(familyId)}/money/categories/mine`,
    );
    if (response.ok && response.data) {
      setCategories(response.data);
    }
  }, [familyId]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-3">
        {/* Income Card */}
        <MoneyFormDialog
          type="income"
          familyId={familyId}
          categories={categories}
          onCategoryCreated={fetchCategories}
          onSuccess={onSuccess}
          trigger={
            <Button variant={"ghost"} className=" flex flex-col w-fit h-fit">
              <div className="flex size-10 [&_svg:not([class*='size-'])]:size-10 p-2 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-all duration-300 group-hover:scale-110">
                <TrendingUpIcon className="size-5" />
              </div>
              <span className="font-medium">{t("addIncome")}</span>
            </Button>
          }
        />

        {/* Expense Card */}
        <MoneyFormDialog
          type="expense"
          familyId={familyId}
          categories={categories}
          onCategoryCreated={fetchCategories}
          onSuccess={onSuccess}
          trigger={
            <Button variant={"ghost"} className=" flex flex-col w-fit h-fit">
              <div className="flex size-10 [&_svg:not([class*='size-'])]:size-10 p-2 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-all duration-300 group-hover:scale-110">
                <TrendingDownIcon className="size-5" />
              </div>
              <span className="font-medium">{t("addExpense")}</span>
            </Button>
          }
        />

        {/* Plan Card */}
        <Button
          type="button"
          onClick={() => setPlanFormOpen(true)}
          variant={"ghost"}
          className=" flex flex-col w-fit h-fit"
        >
          <div className="flex size-10 [&_svg:not([class*='size-'])]:size-10 p-2 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 transition-all duration-300 group-hover:scale-110">
            <CalendarPlusIcon className="size-5" />
          </div>
          <span className="font-medium">{t("createPlan")}</span>
        </Button>
      </div>

      <PersonPlanForm
        open={planFormOpen}
        onOpenChange={setPlanFormOpen}
        editPlan={null}
        initialType="TASK"
        onSuccess={() => onSuccess?.()}
      />
    </div>
  );
}
