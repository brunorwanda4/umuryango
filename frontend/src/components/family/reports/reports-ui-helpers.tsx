import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatTitle } from "./utils";

export function ReportFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 truncate font-medium text-sm">{value}</p>
    </div>
  );
}

export function StatusBadge({ value }: { value: string }) {
  return <Badge variant="outline">{formatTitle(value)}</Badge>;
}

export function ChartEmptyState({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl bg-background ring-1 ring-border">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="max-w-sm">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-muted-foreground text-sm leading-6">
          {description}
        </p>
      </div>
    </div>
  );
}

export function TableEmptyState({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl bg-background ring-1 ring-border">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="max-w-md">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-muted-foreground text-sm leading-6">
          {description}
        </p>
      </div>
    </div>
  );
}
