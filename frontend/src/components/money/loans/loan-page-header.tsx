import { PlusIcon } from "lucide-react";
import { PageTitle } from "@/components/common/pages/page-title";
import { Button } from "@/components/ui/button";

export function LoanPageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <PageTitle
      title="Loans"
      iconImage="/images/icons/loan.png"
      description="Manage money borrowed from or lent to family and trusted people."
      actions={
        <Button className="mt-4 w-full sm:w-auto lg:mt-0" onClick={onAdd}>
          <PlusIcon aria-hidden="true" data-icon="inline-start" />
          Add new loan
        </Button>
      }
    />
  );
}
