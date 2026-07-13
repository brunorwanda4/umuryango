import { ChevronDownIcon, CirclePlusIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const actions = [
  { href: "/me/money/income", label: "Add income" },
  { href: "/me/money/expenses", label: "Add expense" },
  { href: "/me/plans", label: "Add plan" },
];

export function PersonalDashboardHeader({ firstName }: { firstName?: string }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex max-w-2xl flex-col gap-1.5">
        <p className="font-medium text-muted-foreground text-sm">
          Personal workspace
        </p>
        <h1 className="font-semibold text-2xl tracking-tight sm:text-3xl">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Here is a quick overview of your money, plans, debts, and family
          activity.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/me/money/income">
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            Add income
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <CirclePlusIcon data-icon="inline-start" aria-hidden="true" />
              Quick add
              <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Create new</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {actions.map((action) => (
                <DropdownMenuItem key={action.href} asChild>
                  <Link href={action.href}>{action.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
