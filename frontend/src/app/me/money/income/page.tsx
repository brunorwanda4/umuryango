import { ArrowDownIcon, CalendarDaysIcon } from "lucide-react";
import { PageTitle } from "@/components/common/pages/page-title";
import { IncomeDashboard } from "@/components/money/income-dashboard";
import { MoneyFormDialog } from "@/components/money/money-form-dialog";
import { Button } from "@/components/ui/button";

const IncomeName = () => {
  return (
    <div className="flex flex-col gap-5">
      <PageTitle
        title="Income"
        description="Track money received from work, business, contributions, gifts, and family support."
        icon={
          <span className="flex size-10 items-center justify-center rounded-full bg-chart-2 text-background shadow-sm">
            <ArrowDownIcon className="size-5" aria-hidden="true" />
          </span>
        }
        actions={
          <div className="mt-4 flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:mt-0">
            <Button
              type="button"
              variant="outline"
              className="h-11 justify-between gap-6 rounded-lg px-4 text-muted-foreground sm:min-w-64"
            >
              <span>Jul 1 - Jul 31, 2026</span>
              <CalendarDaysIcon
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </Button>
            <MoneyFormDialog
              type="income"
              triggerSize="default"
              triggerClassName="h-11 rounded-lg bg-chart-2 px-5 text-background hover:bg-chart-2/90"
            />
          </div>
        }
      />
      <IncomeDashboard />
    </div>
  );
};

export default IncomeName;
