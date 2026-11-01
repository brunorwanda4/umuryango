import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MoneyOverviewHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden md:block">
            {description}
          </p>
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
