import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DashboardSectionCard({
  title,
  description,
  actionHref,
  actionLabel,
  actionSlot,
  footer,
  footerClassName,
  children,
  className,
  contentClassName,
}: {
  title: ReactNode;
  description?: ReactNode;
  actionHref?: string;
  actionLabel?: ReactNode;
  actionSlot?: ReactNode;
  footer?: ReactNode;
  footerClassName?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card
      className={cn(
        "min-w-0 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-shadow flex flex-col justify-between gap-0",
        className,
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-bold tracking-tight text-foreground truncate">
              {title}
            </h3>
            {description ? (
              <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                {description}
              </p>
            ) : null}
          </div>
          {actionSlot ? (
            <div className="shrink-0">{actionSlot}</div>
          ) : actionHref && actionLabel ? (
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-auto px-1.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground shrink-0"
            >
              <Link href={actionHref} className="flex items-center gap-1">
                <span>{actionLabel}</span>
                <ArrowRightIcon className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          ) : null}
        </div>

        <div
          className={cn(
            "mt-3.5 flex flex-col gap-3 sm:gap-3.5",
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>

      {footer ? (
        <div
          className={cn("mt-4 pt-3 border-t border-border/60", footerClassName)}
        >
          {footer}
        </div>
      ) : null}
    </Card>
  );
}
