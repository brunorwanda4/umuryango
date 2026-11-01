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
      className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}
    >
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-fraunces text-4xl font-semibold tracking-tight sm:text-5xl">
            {title}
          </h1>
          {meta}
        </div>
        {subtitle ? <p className="max-w-3xl text-muted-foreground text-sm">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
