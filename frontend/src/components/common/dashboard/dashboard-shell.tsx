import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DashboardGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid min-w-0 gap-4 lg:grid-cols-2", className)}>
      {children}
    </div>
  );
}
