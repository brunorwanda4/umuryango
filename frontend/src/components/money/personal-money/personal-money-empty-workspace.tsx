import { UsersIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createTranslator } from "@/i18n/translate";

export function PersonalMoneyEmptyWorkspace() {
  const t = createTranslator("PersonalMoney");

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-border bg-card p-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <UsersIcon className="size-5 flex-none text-foreground" />
        <span>{t((m) => m.PersonalMoney.emptyWorkspace)}</span>
      </div>
      <Button asChild size="sm">
        <Link href="/family">
          {t((m) => m.PersonalMoney.openFamilyWorkspaces)}
        </Link>
      </Button>
    </div>
  );
}
