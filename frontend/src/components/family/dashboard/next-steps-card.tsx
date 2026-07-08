import {
  CalendarDaysIcon,
  FolderKanbanIcon,
  MegaphoneIcon,
  SettingsIcon,
  UsersRoundIcon,
  WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";
import { hasCapability } from "@/lib/family-access";
import type { FamilyDetail } from "./types";

export function QuickActionsBar({ family }: { family: FamilyDetail }) {
  const actions = [
    {
      title: "Check members",
      description: "Make sure the right people are in the family.",
      href: `/family/${family.slug}/members`,
      icon: UsersRoundIcon,
      visible: true,
    },
    {
      title: "Open money",
      description:
        "Start from income and expenses when money records are ready.",
      href: `/family/${family.slug}/money`,
      icon: WalletCardsIcon,
      visible: true,
    },
    {
      title: "Post a notice",
      description: "Share a message everyone can find later.",
      href: `/family/${family.slug}/announcements`,
      icon: MegaphoneIcon,
      visible: hasCapability(family, "MANAGE_ANNOUNCEMENTS"),
    },
    {
      title: "Review settings",
      description: "Confirm currency, country, and contribution rhythm.",
      href: `/family/${family.slug}/settings`,
      icon: SettingsIcon,
      visible: hasCapability(family, "MANAGE_FAMILY_SETTINGS"),
    },
    {
      title: "Plan events",
      description: "Create family events and reminders.",
      href: `/family/${family.slug}/events`,
      icon: CalendarDaysIcon,
      visible: hasCapability(family, "MANAGE_EVENTS"),
    },
    {
      title: "Start project",
      description: "Organize and track family projects.",
      href: `/family/${family.slug}/projects`,
      icon: FolderKanbanIcon,
      visible: hasCapability(family, "MANAGE_PROJECTS"),
    },
  ].filter((action) => action.visible);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-lg tracking-tight">Quick actions</h2>
        <p className="text-muted-foreground text-sm">
          Jump right into what matters most.
        </p>
      </div>
      <div className="grid auto-cols-[minmax(10rem,1fr)] grid-flow-col gap-2 overflow-x-auto rounded-xl border bg-card p-2 sm:grid-flow-row sm:grid-cols-3 lg:grid-cols-6">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex min-h-28 flex-col items-start gap-2 rounded-lg border bg-background p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Icon className="size-4 shrink-0" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium">{action.title}</span>
              <span className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                {action.description}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export { QuickActionsBar as NextStepsCard };
