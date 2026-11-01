import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MoneyDirectionShellProps
  extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function MoneyDirectionShell({
  children,
  className,
  ...props
}: MoneyDirectionShellProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 max-w-full flex-col gap-5 sm:gap-6 pb-12",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
