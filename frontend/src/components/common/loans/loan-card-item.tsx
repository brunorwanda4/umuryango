import { CalendarDaysIcon, MoreVerticalIcon } from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createTranslator } from "@/i18n/translate";
import { cn } from "@/lib/utils";
import type { SharedLoan } from "./types";

export function LoanCardItem({ loan }: { loan: SharedLoan }) {
  const t = createTranslator("SharedLoans");
  const isLent = loan.direction === "LENT";
  const hasProgress =
    loan.status !== "CANCELLED" &&
    BigInt(loan.originalAmountMinorUnits || "0") > BigInt(0);

  const statusVariant =
    loan.statusVariant ??
    (loan.status === "CANCELLED"
      ? "outline"
      : loan.isOverdue
        ? "destructive"
        : loan.status === "COMPLETED" || loan.status === "REPAID"
          ? "secondary"
          : "default");

  return (
    <Card className="rounded-2xl border border-border bg-card p-4 sm:p-4.5 space-y-3 transition-colors hover:border-foreground/20">
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            className={cn(
              "size-9 shrink-0 border text-xs font-bold",
              isLent
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
            )}
          >
            <AvatarFallback>{loan.counterpartyInitials}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            {loan.onCardClick ? (
              <button
                type="button"
                onClick={loan.onCardClick}
                className="text-xs sm:text-sm font-bold text-foreground truncate text-left hover:underline block max-w-full cursor-pointer"
              >
                {loan.counterpartyName}
              </button>
            ) : (
              <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">
                {loan.counterpartyName}
              </h3>
            )}
            <p className="text-[11px] text-muted-foreground truncate">
              {loan.counterpartySubtitle || loan.title}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span
            className={cn(
              "text-xs sm:text-sm font-extrabold font-mono block",
              isLent
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400",
            )}
          >
            <CompactMoney
              currency={loan.currency}
              value={loan.remainingAmountMinorUnits}
            />
          </span>
          <div className="mt-1">
            <Badge variant={statusVariant} className="text-[9px] font-semibold">
              {loan.dueLabel || loan.statusLabel}
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress Bar (Repayment Progress) */}
      {hasProgress ? (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>
              {t((m) => m.SharedLoans.repaidProgress, {
                paid: `${loan.paidAmountMinorUnits}`,
                total: `${loan.originalAmountMinorUnits}`,
              })}
            </span>
            <span
              className={cn(
                "font-semibold",
                isLent
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-foreground",
              )}
            >
              {t((m) => m.SharedLoans.percentCleared, {
                percent: loan.progressPercent,
              })}
            </span>
          </div>
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                isLent ? "bg-emerald-500" : "bg-rose-500",
              )}
              style={{ width: `${loan.progressPercent}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Bottom Row: Due Info & Actions */}
      <div className="pt-2 border-t border-border flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate min-w-0">
          <CalendarDaysIcon className="size-3 shrink-0" />
          <span className="truncate">
            {loan.dueLabel || loan.dueDate || "No due date"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {loan.primaryAction ? (
            <Button
              size="sm"
              variant="outline"
              onClick={loan.primaryAction.onClick}
              className="h-7 text-[11px] font-semibold gap-1 px-2.5"
            >
              {loan.primaryAction.icon ? (
                <loan.primaryAction.icon className="size-3" />
              ) : null}
              <span>{loan.primaryAction.label}</span>
            </Button>
          ) : null}

          {loan.menuActions && loan.menuActions.length > 0 ? (
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
                {loan.menuActions.map((action) => (
                  <DropdownMenuItem
                    key={action.label}
                    onClick={action.onClick}
                    variant={action.variant}
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
