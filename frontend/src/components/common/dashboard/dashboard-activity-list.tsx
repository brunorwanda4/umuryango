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
  return <div className={cn("flex flex-col", className)}>{children}</div>;
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
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{title}</p>
        {description ? (
          <p className="truncate text-muted-foreground text-xs">
            {description}
          </p>
        ) : null}
      </div>
      <p className="shrink-0 text-muted-foreground text-xs">{timestamp}</p>
    </>
  );

  const rowClassName = cn(
    "flex items-start gap-3 border-b py-3 first:pt-0 last:border-b-0 last:pb-0",
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(rowClassName, "transition-colors hover:opacity-85")}
      >
        {content}
      </Link>
    );
  }

  return <div className={rowClassName}>{content}</div>;
}
