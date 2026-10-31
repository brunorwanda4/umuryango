import type { LucideIcon } from "lucide-react";
import {
  CalendarPlusIcon,
  FileTextIcon,
  HandCoinsIcon,
  LandmarkIcon,
  ReceiptTextIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createTranslator } from "@/i18n/translate";

const actions: Array<{
  href: string;
  key:
    | "addIncome"
    | "addExpense"
    | "addLoan"
    | "addPlan"
    | "openDocuments"
    | "openFamilies";
  icon: LucideIcon;
}> = [
  { href: "/me/money/income", key: "addIncome", icon: LandmarkIcon },
  { href: "/me/money/expenses", key: "addExpense", icon: ReceiptTextIcon },
  { href: "/me/money/loans", key: "addLoan", icon: HandCoinsIcon },
  { href: "/me/plans", key: "addPlan", icon: CalendarPlusIcon },
  { href: "/me/documents", key: "openDocuments", icon: FileTextIcon },
  { href: "/family", key: "openFamilies", icon: UsersIcon },
];

export function QuickActionsCard() {
  const t = createTranslator("PersonalOverview.quickActionsCard");

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t((m) => m.PersonalOverview.quickActionsCard.title)}
        </CardTitle>
        <CardDescription>
          {t((m) => m.PersonalOverview.quickActionsCard.description)}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <Button
            key={action.key}
            asChild
            variant="outline"
            className="h-auto justify-start py-3"
          >
            <Link href={action.href}>
              <action.icon data-icon="inline-start" aria-hidden="true" />
              {t(action.key)}
            </Link>
          </Button>
        ))}
      </CardContent>
      <Separator />
      <CardFooter className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <FileTextIcon className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">
            {t((m) => m.PersonalOverview.quickActionsCard.documentsTitle)}
          </p>
          <p className="text-muted-foreground text-xs">
            {t((m) => m.PersonalOverview.quickActionsCard.documentsUnavailable)}
          </p>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href="/me/documents">
            {t((m) => m.PersonalOverview.quickActionsCard.open)}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
