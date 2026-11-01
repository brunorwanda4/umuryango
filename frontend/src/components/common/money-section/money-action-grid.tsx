import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MoneyActionGridProps, MoneyActionItem } from "./types";

export function MoneyActionGrid({
  title,
  description,
  actions,
  className,
}: MoneyActionGridProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl border border-zinc-800/80 bg-[#0f0f12] p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3",
        className,
      )}
    >
      <div>
        <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
          {title}
        </h3>
        {description ? (
          <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
            {description}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-0.5 sm:pt-1">
        {actions.map((action) => (
          <ActionTile key={action.id} action={action} />
        ))}
      </div>
    </Card>
  );
}

function ActionTile({ action }: { action: MoneyActionItem }) {
  const Icon = action.icon;
  const colorClass =
    action.iconColor === "emerald"
      ? "bg-emerald-500/10 text-emerald-400"
      : action.iconColor === "rose"
        ? "bg-rose-500/10 text-rose-400"
        : action.iconColor === "blue"
          ? "bg-blue-500/10 text-blue-400"
          : action.iconColor === "purple"
            ? "bg-purple-500/10 text-purple-400"
            : action.iconColor === "amber"
              ? "bg-amber-500/10 text-amber-400"
              : "bg-zinc-800 text-zinc-300";

  const button = (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      className={cn(
        "p-2.5 sm:p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-2.5 text-left transition group outline-none",
        action.disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-zinc-800/80 active:scale-[0.98] cursor-pointer focus-visible:ring-1 focus-visible:ring-ring",
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
          colorClass,
        )}
      >
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-white truncate">{action.label}</p>
        {action.description ? (
          <p className="text-[10px] text-zinc-400 truncate">
            {action.description}
          </p>
        ) : null}
      </div>
    </button>
  );

  if (action.tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{action.tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
