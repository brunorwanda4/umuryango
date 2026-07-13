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

const actions: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/me/money/income", label: "Add income", icon: LandmarkIcon },
  { href: "/me/money/expenses", label: "Add expense", icon: ReceiptTextIcon },
  { href: "/me/money/loans", label: "Add loan", icon: HandCoinsIcon },
  { href: "/me/plans", label: "Add plan", icon: CalendarPlusIcon },
  { href: "/me/documents", label: "Open documents", icon: FileTextIcon },
  { href: "/family", label: "Open families", icon: UsersIcon },
];

export function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
        <CardDescription>Jump into the tasks you use most.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            asChild
            variant="outline"
            className="h-auto justify-start py-3"
          >
            <Link href={action.href}>
              <action.icon data-icon="inline-start" aria-hidden="true" />
              {action.label}
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
          <p className="font-medium text-sm">Documents</p>
          <p className="text-muted-foreground text-xs">
            A personal document summary is not available yet.
          </p>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href="/me/documents">Open</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
