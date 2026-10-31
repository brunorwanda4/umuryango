import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createTranslator } from "@/i18n/translate";
import type { MoneyCategory } from "./types-and-constants";

export function CategoryDeleteDialog({
  category,
  onConfirm,
  onOpenChange,
}: {
  category: MoneyCategory | null;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const t = createTranslator("FamilyCategories");
  const isUsed = Boolean(category && category.transactionsCount > 0);

  return (
    <AlertDialog
      open={Boolean(category)}
      onOpenChange={onOpenChange}
      searchParamValue={`delete-category-${category?.id}`}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isUsed ? t("archiveConfirmTitle") : t("deletePromptTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isUsed
              ? t("archiveUsedDesc", {
                  name: category?.name ?? "",
                  count: category?.transactionsCount ?? 0,
                })
              : t("deleteUnusedDesc", { name: category?.name ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {isUsed ? t("archiveCategoryBtn") : t("deleteCategoryBtn")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
