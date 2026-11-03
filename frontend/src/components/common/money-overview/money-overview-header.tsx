import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BackButton } from "../back-button";

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
        "sticky top-[env(safe-area-inset-top,0px)] z-30 flex flex-col gap-3 border-border/60 border-b bg-background/95 py-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between md:static md:border-0 md:bg-transparent md:py-0 md:backdrop-blur-none",
        className,
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center gap-2">
          <BackButton />
          <h1 className="font-extrabold text-foreground text-xl tracking-tight sm:text-2xl md:text-3xl">
            {title}
          </h1>
        </div>
        {description ? (
          <p className="hidden line-clamp-2 text-muted-foreground text-xs sm:text-sm md:block">
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
