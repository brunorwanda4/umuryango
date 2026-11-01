import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MoneyOverviewShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-4 sm:gap-5 pb-10 px-1 sm:px-2 md:px-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MoneyOverviewTopGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 lg:grid-cols-12 items-stretch",
        className,
      )}
    >
      {children}
    </div>
  );
}
