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
      <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono text-lg font-semibold tabular-nums",
          valueClassName,
        )}
      >
        {value}
      </p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "rounded-xl border bg-muted/40 p-2.5 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          className,
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-muted/40 p-2.5", className)}>
      {content}
    </div>
  );
}

export function DashboardStatTile({
  label,
  value,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 rounded-xl bg-muted p-3", className)}>
      <div className="truncate font-semibold text-lg tabular-nums">{value}</div>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}
