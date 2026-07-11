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
        iconImage={"/images/icons/income.png"}
        description="Track money received from work, business, contributions, gifts, and family support."
        actions={
          <div className="mt-4 flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:mt-0">
            <Button
              type="button"
              variant="outline"
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
            />
          </div>
        }
      />
      <IncomeDashboard />
    </div>
  );
};

export default IncomeName;
