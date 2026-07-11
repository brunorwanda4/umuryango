import { CompactMoney } from "@/components/common/money/compact-money";
import {
  incomeSourceData,
  totalIncomeMinorUnits,
} from "./income-dashboard-data";

export function IncomeSourceLegend() {
  return (
    <div className="flex min-w-48 flex-col gap-4">
      {incomeSourceData.map((source) => {
        const percent = totalIncomeMinorUnits
          ? ((source.amountMinorUnits * 100) / totalIncomeMinorUnits).toFixed(1)
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
                <CompactMoney currency="RWF" value={source.amountMinorUnits} />{" "}
                ({percent}%)
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
