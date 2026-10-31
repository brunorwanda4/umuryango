import { Progress } from "@/components/ui/progress";
import { createTranslator } from "@/i18n/translate";

export function LoanProgress({ value }: { value: number }) {
  const t = createTranslator("PersonalLoans");

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium">
          {t((m) => m.PersonalLoans.progress.label)}
        </span>
        <span className="text-muted-foreground">
          {t((m) => m.PersonalLoans.progress.percentRepaid, { value })}
        </span>
      </div>
      <Progress
        value={value}
        aria-label={t((m) => m.PersonalLoans.progress.percentRepaid, { value })}
      />
    </div>
  );
}
