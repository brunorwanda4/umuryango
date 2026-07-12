import { Progress } from "@/components/ui/progress";

export function LoanProgress({ value }: { value: number }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium">Repayment progress</span>
        <span className="text-muted-foreground">{value}% repaid</span>
      </div>
      <Progress value={value} aria-label={`${value}% repaid`} />
    </div>
  );
}
