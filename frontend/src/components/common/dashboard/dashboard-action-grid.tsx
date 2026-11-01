import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardActionGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:gap-2.5", className)}>
      {children}
    </div>
  );
}

export function DashboardActionTile({
  href,
  label,
  icon,
  className,
}: {
  href: string;
  label: ReactNode;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className={cn(
        "h-auto justify-start py-2.5 px-3 rounded-xl border-border/80 hover:bg-muted/80 text-xs font-medium",
        className,
      )}
    >
      <Link href={href}>
        {icon}
        <span className="truncate">{label}</span>
      </Link>
    </Button>
  );
}

export function DashboardQuickAddTile({
  href,
  label,
  description,
  icon,
  iconClassName,
  className,
}: {
  href: string;
  label: ReactNode;
  description?: ReactNode;
  icon: ReactNode;
  iconClassName?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/40 p-2.5 transition-colors hover:border-border hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground transition-transform group-hover:scale-105",
            iconClassName,
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 text-left">
          <p className="truncate text-xs font-semibold text-foreground">
            {label}
          </p>
          {description ? (
            <p className="truncate text-[10px] text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <ChevronRightIcon
        className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
        aria-hidden="true"
      />
    </Link>
  );
}
