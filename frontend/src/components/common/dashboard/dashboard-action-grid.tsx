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
    <div className={cn("grid grid-cols-2 gap-2", className)}>{children}</div>
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
      className={cn("h-auto justify-start py-3", className)}
    >
      <Link href={href}>
        {icon}
        {label}
      </Link>
    </Button>
  );
}

export function DashboardQuickAddTile({
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
    <Link
      href={href}
      className={cn(
        "flex min-h-[74px] flex-col items-start gap-2.5 rounded-[14px] border p-3.5 transition-colors hover:bg-muted",
        className,
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-[10px] bg-muted">
        {icon}
      </span>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}
