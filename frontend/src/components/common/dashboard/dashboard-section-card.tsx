import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className={cn("min-w-0", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {actionSlot ? (
          <CardAction>{actionSlot}</CardAction>
        ) : actionHref && actionLabel ? (
          <CardAction>
            <Button asChild size="sm" variant="ghost">
              <Link href={actionHref}>
                {actionLabel}
                <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
              </Link>
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className={cn("flex flex-col gap-5", contentClassName)}>
        {children}
      </CardContent>
      {footer ? (
        <CardFooter className={cn("border-t", footerClassName)}>
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}
