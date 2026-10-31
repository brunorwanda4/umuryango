import { PlusIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createTranslator } from "@/i18n/translate";
import type { PlanPerson } from "./types-and-schemas";

export function PersonPlansHeader({
  person,
  onAdd,
}: {
  person: PlanPerson;
  onAdd: () => void;
}) {
  const t = createTranslator("PersonalPlans");
  const firstName = person.fullName.split(" ")[0] || person.fullName;

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Image
                alt=""
                aria-hidden="true"
                height={24}
                src="/images/icons/plan.png"
                width={24}
              />
              <h1 className="truncate font-bricolage text-2xl font-bold sm:text-3xl">
                {t("personPlansTitle", { name: firstName })}
              </h1>
            </div>
          </div>
        </div>
        <Button onClick={onAdd} className="w-full sm:w-auto">
          <PlusIcon aria-hidden="true" data-icon="inline-start" />
          {t("addPlan")}
        </Button>
      </div>
    </header>
  );
}
