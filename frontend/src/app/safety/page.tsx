import {
  BadgeCheckIcon,
  DatabaseIcon,
  EyeOffIcon,
  LockIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { PublicSiteShell } from "@/components/public-site-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const protections = [
  {
    title: "No unrelated use",
    description:
      "Private family records are for running Rwanda Family workflows, not for unrelated advertising, profiling, or resale.",
    icon: EyeOffIcon,
  },
  {
    title: "Permission-aware access",
    description:
      "Protected actions and records should be checked against family membership, role, and permissions on the server.",
    icon: LockIcon,
  },
  {
    title: "Audit-friendly records",
    description:
      "Financial approvals, permission changes, exports, and sensitive activity should leave accountable history.",
    icon: BadgeCheckIcon,
  },
  {
    title: "Tenant boundary",
    description:
      "Family workspaces are designed as private tenant boundaries so one family cannot access another family's records.",
    icon: DatabaseIcon,
  },
  {
    title: "Sensitive data care",
    description:
      "Passwords, tokens, reset codes, MFA details, and private payment details must not be logged or exposed.",
    icon: ShieldAlertIcon,
  },
  {
    title: "Free access",
    description:
      "The application is currently free to use, so families can organize records without a subscription barrier.",
    icon: ShieldCheckIcon,
  },
];

export const metadata: Metadata = {
  title: "Safety and Data Policy",
  description:
    "Learn how Rwanda Family keeps the application free, protects private family data, and limits access to sensitive records.",
};

export default function SafetyPage() {
  return (
    <PublicSiteShell>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-5 py-12 sm:px-6 lg:px-8">
        <section className="flex max-w-3xl flex-col gap-5">
          <Badge variant="outline" className="w-fit">
            Free and private by design
          </Badge>
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-normal text-balance sm:text-5xl">
              Safety and Data Policy
            </h1>
            <p className="text-lg leading-8 text-muted-foreground">
              Rwanda Family should be safe for every family. The application is
              currently free to use, and private family data must not be sold,
              reused for unrelated purposes, or accessed casually.
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {protections.map((protection) => (
            <Card key={protection.title} className="rounded-lg">
              <CardHeader>
                <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-muted">
                  <protection.icon aria-hidden="true" className="size-5" />
                </div>
                <CardTitle>{protection.title}</CardTitle>
                <CardDescription>{protection.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>
      </main>
    </PublicSiteShell>
  );
}
