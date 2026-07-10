import { InfoIcon } from "lucide-react";
import type * as React from "react";
import { Card, CardContent } from "@/components/ui/card";

type IncomeSummaryCardProps = {
  description: string;
  footer: React.ReactNode;
  icon: React.ReactNode;
  value: React.ReactNode;
};

export function IncomeSummaryCard({
  description,
  footer,
  icon,
  value,
}: IncomeSummaryCardProps) {
  return (
    <Card className="rounded-2xl border-border/80 py-0 shadow-sm">
      <CardContent className="flex min-h-[13rem] flex-col justify-between p-5 sm:p-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-chart-2/10 text-chart-2">
          {icon}
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <span>{description}</span>
            <InfoIcon className="size-3.5" aria-hidden="true" />
          </div>
          <div className="font-bold font-bricolage text-3xl tracking-normal text-foreground">
            {value}
          </div>
          <div className="flex items-center gap-2 font-semibold text-chart-2 text-sm">
            {footer}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
