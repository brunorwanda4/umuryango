import {
  MegaphoneIcon,
  SettingsIcon,
  UsersRoundIcon,
  WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hasCapability } from "@/lib/family-access";
import type { FamilyDetail } from "./types";

export function NextStepsCard({ family }: { family: FamilyDetail }) {
  const steps = [
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
  ].filter((step) => step.visible);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Next useful steps</CardTitle>
        <CardDescription>
          Start with the actions families usually need first.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <Button
              key={step.href}
              asChild
              variant="outline"
              className="h-auto justify-start gap-3 p-3 text-left"
            >
              <Link href={step.href}>
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="font-medium">{step.title}</span>
                  <span className="text-muted-foreground text-xs normal-case">
                    {step.description}
                  </span>
                </span>
              </Link>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
