import { CalendarIcon, MoreVerticalIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createTranslator } from "@/i18n/translate";
import { cn } from "@/lib/utils";
import type { SharedPlanItem } from "./types";

export function PlanCardItem({ item }: { item: SharedPlanItem }) {
  const t = createTranslator("SharedPlans");

  const isCompleted = item.isCompleted || item.status === "COMPLETED";
  const statusVariant =
    item.statusVariant ??
    (isCompleted
      ? "secondary"
      : item.isOverdue
        ? "destructive"
        : item.status === "CANCELLED" || item.status === "PAUSED"
          ? "outline"
          : "default");

  // Task Checkable Row
  if (item.taskCheckable) {
    return (
      <div className="p-3 sm:p-3.5 rounded-xl bg-card border border-border flex items-start gap-3 transition-colors hover:border-foreground/20">
        <Checkbox
          checked={item.taskCheckable.checked}
          onCheckedChange={item.taskCheckable.onToggle}
          className="mt-0.5 shrink-0"
          aria-label={item.title}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            {item.onCardClick ? (
              <button
                type="button"
                onClick={item.onCardClick}
                className={cn(
                  "text-xs sm:text-sm font-semibold text-left truncate hover:underline cursor-pointer",
                  item.taskCheckable.checked
                    ? "line-through text-muted-foreground"
                    : "text-foreground",
                )}
              >
                {item.title}
              </button>
            ) : (
              <p
                className={cn(
                  "text-xs sm:text-sm font-semibold truncate",
                  item.taskCheckable.checked
                    ? "line-through text-muted-foreground"
                    : "text-foreground",
                )}
              >
                {item.title}
              </p>
            )}

            <Badge
              variant={statusVariant}
              className="text-[10px] shrink-0 font-medium"
            >
              {item.statusLabel}
            </Badge>
          </div>

          {item.description || item.targetDateLabel ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-muted-foreground">
              {item.description ? (
                <span className="truncate">{item.description}</span>
              ) : null}
              {item.targetDateLabel ? (
                <span className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                  <CalendarIcon className="size-3" />
                  {item.targetDateLabel}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {item.menuActions && item.menuActions.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-muted-foreground hover:text-foreground shrink-0 -mr-1"
              >
                <MoreVerticalIcon className="size-3.5" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {item.menuActions.map((action) => (
                <DropdownMenuItem
                  key={action.label}
                  onClick={action.onClick}
                  variant={action.destructive ? "destructive" : undefined}
                  className="gap-2 text-xs"
                >
                  {action.icon ? <action.icon className="size-3.5" /> : null}
                  <span>{action.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    );
  }

  // Goal / Project Progress Card
  return (
    <Card className="rounded-2xl border border-border bg-card p-4 sm:p-4.5 space-y-3 transition-colors hover:border-foreground/20">
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-2xl bg-muted/60 text-foreground border border-border flex items-center justify-center font-bold text-base shrink-0 select-none">
            {item.iconEmoji || "🎯"}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-xs sm:text-sm font-bold text-foreground truncate hover:underline block max-w-full"
                >
                  {item.title}
                </Link>
              ) : item.onCardClick ? (
                <button
                  type="button"
                  onClick={item.onCardClick}
                  className="text-xs sm:text-sm font-bold text-foreground truncate text-left hover:underline block max-w-full cursor-pointer"
                >
                  {item.title}
                </button>
              ) : (
                <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">
                  {item.title}
                </h3>
              )}
              <Badge
                variant={statusVariant}
                className="text-[9px] font-semibold"
              >
                {item.statusLabel}
              </Badge>
            </div>

            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {item.ownerOrSubtitle ||
                item.description ||
                item.category ||
                "Plan"}
            </p>
          </div>
        </div>

        {/* Right Financial Balance */}
        <div className="text-right shrink-0">
          {item.isFinancial && item.currentAmountMinorUnits ? (
            <div>
              <span className="text-xs sm:text-sm font-extrabold font-mono text-foreground block">
                <CompactMoney
                  currency={item.currency}
                  value={item.currentAmountMinorUnits}
                />
              </span>
              {item.targetAmountMinorUnits ? (
                <span className="block text-[10px] text-muted-foreground font-mono">
                  of{" "}
                  <CompactMoney
                    currency={item.currency}
                    value={item.targetAmountMinorUnits}
                  />
                </span>
              ) : null}
            </div>
          ) : item.milestonesCount ? (
            <div>
              <span className="text-xs sm:text-sm font-extrabold font-mono text-foreground block">
                {item.milestonesCount.completed}/{item.milestonesCount.total}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                Milestones
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Progress Bar & Target Timeline */}
      {item.isFinancial || item.progressPercent > 0 ? (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>
              {t((m) => m.SharedPlans.reachedPercent, {
                percent: item.progressPercent,
              })}
            </span>
            <span className="font-semibold text-foreground">
              {item.remainingAmountMinorUnits &&
              BigInt(item.remainingAmountMinorUnits) > BigInt(0) ? (
                <span className="flex items-center gap-1">
                  <CompactMoney
                    currency={item.currency}
                    value={item.remainingAmountMinorUnits}
                  />
                  <span>remaining</span>
                </span>
              ) : item.targetDateLabel ? (
                <span>{item.targetDateLabel}</span>
              ) : null}
            </span>
          </div>
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden p-0.5 border border-border">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${item.progressPercent}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Bottom Strip: Metadata & Quick Actions */}
      <div className="pt-2 border-t border-border flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate min-w-0">
          {item.targetDateLabel ? (
            <span className="flex items-center gap-1 truncate">
              <CalendarIcon className="size-3 shrink-0" />
              <span className="truncate">{item.targetDateLabel}</span>
            </span>
          ) : item.category ? (
            <span className="truncate">{item.category}</span>
          ) : null}

          {item.memberCount != null && item.memberCount > 0 ? (
            <span className="flex items-center gap-1 shrink-0">
              <UsersIcon className="size-3" />
              <span>{item.memberCount}</span>
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {item.primaryAction ? (
            <Button
              size="sm"
              variant={item.primaryAction.variant || "default"}
              onClick={item.primaryAction.onClick}
              className="h-7 text-[11px] font-semibold gap-1 px-2.5"
            >
              {item.primaryAction.icon ? (
                <item.primaryAction.icon className="size-3" />
              ) : null}
              <span>{item.primaryAction.label}</span>
            </Button>
          ) : null}

          {item.menuActions && item.menuActions.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-muted-foreground hover:text-foreground"
                >
                  <MoreVerticalIcon className="size-3.5" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {item.menuActions.map((action) => (
                  <DropdownMenuItem
                    key={action.label}
                    onClick={action.onClick}
                    variant={action.destructive ? "destructive" : undefined}
                    className="gap-2 text-xs"
                  >
                    {action.icon ? <action.icon className="size-3.5" /> : null}
                    <span>{action.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
