import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardSummaryMetric({
  href,
  label,
  value,
  valueClassName,
  className,
}: {
  href?: string;
  label: ReactNode;
  value: ReactNode;
  valueClassName?: string;
  className?: string;
}) {
  const content = (
    <>
      <p className="truncate text-[10px] sm:text-[11px] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-mono text-base sm:text-lg font-bold tabular-nums text-foreground",
          valueClassName,
        )}
      >
        {value}
      </p>
    </>
  );

  const containerClassName = cn(
    "min-w-0 rounded-xl border border-border/70 bg-muted/40 p-2.5 text-left transition-colors",
    href &&
      "hover:border-border hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={containerClassName}>
        {content}
      </Link>
    );
  }

  return <div className={containerClassName}>{content}</div>;
}

export function DashboardStatTile({
  label,
  value,
  valueClassName,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border border-border/70 bg-muted/30 p-2.5 sm:p-3 transition-colors",
        className,
      )}
    >
      <div
        className={cn(
          "truncate font-mono text-base sm:text-lg font-bold tabular-nums text-foreground",
          valueClassName,
        )}
      >
        {value}
      </div>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
