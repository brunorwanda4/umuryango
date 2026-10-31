import { LandmarkIcon } from "lucide-react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createTranslator } from "@/i18n/translate";
import { debtRecords, moneyCurrency } from "./money-data";
import { MoneyFormDialog } from "./money-form-dialog";
import { formatDate, formatStatus, getStatusBadgeVariant } from "./utils";

export function DebtsTab() {
  const t = createTranslator("PersonalMoney.legacyTabs.debts");
  const tCommon = createTranslator("PersonalMoney");

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>
              {t((m) => m.PersonalMoney.legacyTabs.debts.title)}
            </CardTitle>
            <CardDescription>
              {t((m) => m.PersonalMoney.legacyTabs.debts.description)}
            </CardDescription>
          </div>
          <MoneyFormDialog type="debt" />
        </CardHeader>
      </Card>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {debtRecords.map((debt) => (
          <Card key={debt.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate">{debt.title}</CardTitle>
                  <CardDescription>{debt.party}</CardDescription>
                </div>
                <LandmarkIcon className="shrink-0 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {debt.kind === "borrowed"
                    ? t((m) => m.PersonalMoney.legacyTabs.debts.borrowed)
                    : t((m) => m.PersonalMoney.legacyTabs.debts.lent)}
                </Badge>
                <Badge variant={getStatusBadgeVariant(debt.status)}>
                  {formatStatus(debt.status)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground text-sm">
                    {t((m) => m.PersonalMoney.legacyTabs.debts.principal)}
                  </p>
                  <p className="font-medium">
                    <CompactMoney
                      currency={moneyCurrency}
                      value={debt.principalMinorUnits}
                    />
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {tCommon((m) => m.PersonalMoney.outstanding)}
                  </p>
                  <p className="font-medium">
                    <CompactMoney
                      currency={moneyCurrency}
                      value={debt.outstandingMinorUnits}
                    />
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                {tCommon((m) => m.PersonalMoney.due, {
                  date: formatDate(debt.dueDate),
                })}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
