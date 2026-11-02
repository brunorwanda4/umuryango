import { ArrowDownLeftIcon, ArrowUpRightIcon, LayersIcon } from "lucide-react";
import { createTranslator } from "@/i18n/translate";
import { cn } from "@/lib/utils";
import type { SharedLoanDirection } from "./types";

export function LoanSegmentedTabs({
  activeTab,
  onTabChange,
  allCount,
  lentCount,
  borrowedCount,
  isPersonal = true,
}: {
  activeTab: "all" | SharedLoanDirection;
  onTabChange: (tab: "all" | SharedLoanDirection) => void;
  allCount: number;
  lentCount: number;
  borrowedCount: number;
  isPersonal?: boolean;
}) {
  const t = createTranslator("SharedLoans");

  const lentLabel = isPersonal
    ? t((m) => m.SharedLoans.tabLentPersonal, { count: lentCount })
    : t((m) => m.SharedLoans.tabLentFamily, { count: lentCount });

  const borrowedLabel = isPersonal
    ? t((m) => m.SharedLoans.tabBorrowedPersonal, { count: borrowedCount })
    : t((m) => m.SharedLoans.tabBorrowedFamily, { count: borrowedCount });

  return (
    <div className="flex w-full overflow-x-auto no-scrollbar p-1 rounded-xl bg-muted/50 border border-border text-xs font-semibold gap-1">
      {/* All Tab */}
      <button
        type="button"
        onClick={() => onTabChange("all")}
        className={cn(
          "flex-1 min-w-fit py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs",
          activeTab === "all"
            ? "bg-card text-foreground shadow-xs border border-border/80 font-bold"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayersIcon className="size-3.5" />
        <span>{t((m) => m.SharedLoans.tabAll, { count: allCount })}</span>
      </button>

      {/* Lent Tab (Owed to You/Family) */}
      <button
        type="button"
        onClick={() => onTabChange("LENT")}
        className={cn(
          "flex-1 min-w-fit py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs",
          activeTab === "LENT"
            ? "bg-card text-foreground shadow-xs border border-border/80 font-bold"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <ArrowUpRightIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>{lentLabel}</span>
      </button>

      {/* Borrowed Tab (You/Family Owe) */}
      <button
        type="button"
        onClick={() => onTabChange("BORROWED")}
        className={cn(
          "flex-1 min-w-fit py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs",
          activeTab === "BORROWED"
            ? "bg-card text-foreground shadow-xs border border-border/80 font-bold"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <ArrowDownLeftIcon className="size-3.5 text-rose-600 dark:text-rose-400" />
        <span>{borrowedLabel}</span>
      </button>
    </div>
  );
}
