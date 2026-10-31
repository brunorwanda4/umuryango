import { LandmarkIcon, PlusIcon } from "lucide-react";
import { SidebarIcon } from "@/components/app-shell/sidebar-icon";
import { PageTitle } from "@/components/common/pages/page-title";
import { Button } from "@/components/ui/button";
import { createTranslator } from "@/i18n/translate";

export function LoanPageHeader({ onAdd }: { onAdd: () => void }) {
  const t = createTranslator("PersonalLoans");

  return (
    <PageTitle
      title={t((m) => m.PersonalLoans.title)}
      icon={
        <SidebarIcon
          className="size-6"
          icon={{
            image: { src: "/images/icons/loan.png" },
            line: LandmarkIcon,
          }}
        />
      }
      description={t((m) => m.PersonalLoans.description)}
      actions={
        <Button className="mt-4 w-full sm:w-auto lg:mt-0" onClick={onAdd}>
          <PlusIcon aria-hidden="true" data-icon="inline-start" />
          {t((m) => m.PersonalLoans.addLoan)}
        </Button>
      }
    />
  );
}
