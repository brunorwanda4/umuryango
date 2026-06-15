import {
  ArchiveIcon,
  FileBarChartIcon,
  HandCoinsIcon,
  LockKeyholeIcon,
  ReceiptTextIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { PublicSiteShell } from "@/components/public-site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const highlights = [
  {
    title: "Money records",
    description: "Income, expenses, savings, debts, and approvals.",
    icon: ReceiptTextIcon,
  },
  {
    title: "Contributions",
    description: "Monthly, emergency, event, and project contributions.",
    icon: HandCoinsIcon,
  },
  {
    title: "Documents",
    description: "Receipts, agreements, reports, and private files.",
    icon: ArchiveIcon,
  },
  {
    title: "Reports",
    description: "Readable summaries generated from saved records.",
    icon: FileBarChartIcon,
  },
  {
    title: "Members",
    description: "Owner, leader, and member roles with clear permissions.",
    icon: UsersIcon,
  },
  {
    title: "Privacy",
    description: "Family data is not sold or used for unrelated purposes.",
    icon: LockKeyholeIcon,
  },
];

export default function Home() {
  return (
    <PublicSiteShell>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-5 py-12 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] lg:items-center">
          <div className="flex flex-col gap-7">
            <Badge variant="outline" className="w-fit">
              Free to use now
            </Badge>
            <div className="flex flex-col gap-5">
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-normal text-balance sm:text-6xl">
                Rwanda Family
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Securely manage family money, contributions, projects,
                documents, announcements, events, and reports from one private
                workspace.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 w-full rounded-full sm:w-fit"
                href="/auth/login"
              >
                Log in
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-full sm:w-fit"
                href="/items"
              >
                View items
              </Button>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Rwanda Family does not sell private family data or use it for
              unrelated advertising, profiling, or external datasets.{" "}
              <Link href="/privacy" className="font-medium text-foreground">
                Read the privacy policy.
              </Link>
            </p>
          </div>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Built for trust</CardTitle>
              <CardDescription>
                Family records should stay accurate, permission-aware, and easy
                to explain.
              </CardDescription>
            </CardHeader>
            <div className="grid gap-3 px-5 pb-5">
              {[
                "Free access",
                "Private family workspace",
                "Auditable records",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-md border border-border bg-background px-4 py-3 text-sm font-medium"
                >
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((highlight) => (
            <Card key={highlight.title} className="rounded-lg">
              <CardHeader>
                <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-muted">
                  <highlight.icon aria-hidden="true" className="size-5" />
                </div>
                <CardTitle>{highlight.title}</CardTitle>
                <CardDescription>{highlight.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>
      </main>
    </PublicSiteShell>
  );
}
