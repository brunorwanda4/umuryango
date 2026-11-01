import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardHeader({
  title,
  meta,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode;
  meta?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {meta}
        </div>
        {subtitle ? (
          <div className="text-[11px] sm:text-xs font-medium text-muted-foreground flex flex-wrap items-center gap-1.5">
            {subtitle}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
