import { PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function LoanHeader({
  title,
  subtitle,
  badge,
  onAdd,
  addLabel = "Record Loan",
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {badge ? (
            <Badge variant="secondary" className="text-[10px] font-medium">
              {badge}
            </Badge>
          ) : null}
        </div>
        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {onAdd ? (
        <Button
          onClick={onAdd}
          size="sm"
          className="gap-1.5 self-start sm:self-auto font-semibold"
        >
          <PlusIcon className="size-4" />
          <span>{addLabel}</span>
        </Button>
      ) : null}
    </div>
  );
}
