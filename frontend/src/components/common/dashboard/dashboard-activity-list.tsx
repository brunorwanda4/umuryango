import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardActivityList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-2", className)}>{children}</div>;
}

export function DashboardActivityItem({
  icon,
  title,
  description,
  timestamp,
  href,
  className,
}: {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  timestamp: ReactNode;
  href?: string;
  className?: string;
}) {
  const content = (
    <>
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground truncate">
          {title}
        </p>
        {description ? (
          <p className="truncate text-[11px] text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <p className="shrink-0 text-[10px] text-muted-foreground font-mono">
        {timestamp}
      </p>
    </>
  );

  const rowClassName = cn(
    "flex items-center gap-2.5 sm:gap-3 rounded-xl border border-border/50 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={rowClassName}>
        {content}
      </Link>
    );
  }

  return <div className={rowClassName}>{content}</div>;
}
