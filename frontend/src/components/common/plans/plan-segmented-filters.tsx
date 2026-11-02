import { SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTranslator } from "@/i18n/translate";
import { cn } from "@/lib/utils";
import type { SharedPlanFilterTab } from "./types";

export function PlanSegmentedFilters({
  tabs,
  activeTab,
  onTabChange,
  searchQuery = "",
  onSearchChange,
  searchPlaceholder,
}: {
  tabs: SharedPlanFilterTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
}) {
  const t = createTranslator("SharedPlans");
  const placeholder =
    searchPlaceholder ?? t((m) => m.SharedPlans.searchPlaceholder);

  return (
    <div className="space-y-2.5">
      {/* Segmented Filter Buttons */}
      <div className="flex w-full overflow-x-auto no-scrollbar p-1 rounded-2xl bg-muted/50 border border-border text-xs font-semibold gap-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-1 min-w-fit py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer",
                isActive
                  ? "bg-card text-foreground shadow-xs border border-border/80 font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{tab.label}</span>
              {tab.count != null ? (
                <span
                  className={cn(
                    "text-[10px] font-mono px-1.5 py-0.2 rounded-full",
                    isActive
                      ? "bg-primary/10 text-primary font-bold"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Search Bar (if onSearchChange provided) */}
      {onSearchChange ? (
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="pl-8.5 pr-8 h-9 text-xs rounded-xl bg-card border-border placeholder:text-muted-foreground/70"
          />
          {searchQuery.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onSearchChange("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 size-6 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-3" />
              <span className="sr-only">Clear search</span>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
