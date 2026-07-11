import { CompactMoney } from "@/components/common/money/compact-money";
import type { IncomeSourceDatum } from "./income-dashboard-data";

export function IncomeSourceLegend({
  data,
  totalIncomeMinorUnits,
}: {
  data: IncomeSourceDatum[];
  totalIncomeMinorUnits: string;
}) {
  const numericTotal = Number(totalIncomeMinorUnits);
  return (
    <div className="flex min-w-48 flex-col gap-4">
      {data.map((source) => {
        const percent = numericTotal
          ? ((source.amountMinorUnits * 100) / numericTotal).toFixed(1)
          : "0.0";

        return (
          <div key={source.name} className="flex items-start gap-2.5">
            <span
              className="mt-1.5 size-3 shrink-0 rounded-full"
              style={{ backgroundColor: source.color }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="font-medium text-foreground text-sm leading-5">
                {source.name}
              </p>
              <p className="text-muted-foreground text-sm leading-5">
                <CompactMoney
                  currency="RWF"
                  value={source.amountMinorUnitsValue}
                />{" "}
                ({percent}%)
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
