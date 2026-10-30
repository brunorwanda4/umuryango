import { LandmarkIcon, PlusIcon } from "lucide-react";
import { SidebarIcon } from "@/components/app-shell/sidebar-icon";
import { PageTitle } from "@/components/common/pages/page-title";
import { Button } from "@/components/ui/button";

export function LoanPageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <PageTitle
      title="Loans"
      icon={
        <SidebarIcon
          className="size-6"
          icon={{
            image: { src: "/images/icons/loan.png" },
            line: LandmarkIcon,
          }}
        />
      }
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
