import {
  ArchiveIcon,
  CalendarDaysIcon,
  FileBarChartIcon,
  FolderKanbanIcon,
  HandCoinsIcon,
  MegaphoneIcon,
  PiggyBankIcon,
  ReceiptTextIcon,
  UsersIcon,
  WalletCardsIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { PublicSiteShell } from "@/components/public-site-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const items = [
  {
    title: "Family money",
    description:
      "Track income, expenses, categories, dates, statuses, creators, and approvals in one auditable place.",
    icon: WalletCardsIcon,
  },
  {
    title: "Contributions",
    description:
      "Organize monthly, emergency, event, and project contributions with expected amounts, paid amounts, due dates, and member status.",
    icon: HandCoinsIcon,
  },
  {
    title: "Savings goals",
    description:
      "Follow shared goals, target amounts, current progress, contribution history, and target dates.",
    icon: PiggyBankIcon,
  },
  {
    title: "Expense records",
    description:
      "Submit, review, approve, reject, and pay expenses without losing the audit history behind each decision.",
    icon: ReceiptTextIcon,
  },
  {
    title: "Projects",
    description:
      "Manage family initiatives with budgets, timelines, updates, members, linked documents, and linked money records.",
    icon: FolderKanbanIcon,
  },
  {
    title: "Documents",
    description:
      "Keep receipts, agreements, certificates, reports, and family files with role-aware access rules.",
    icon: ArchiveIcon,
  },
  {
    title: "Reports",
    description:
      "Generate summaries from saved records for money movement, savings, debt, contribution, budget, and project activity.",
    icon: FileBarChartIcon,
  },
  {
    title: "Announcements",
    description:
      "Publish notices, emergency updates, and pinned family messages so members can stay informed.",
    icon: MegaphoneIcon,
  },
  {
    title: "Events",
    description:
      "Plan family events with dates, locations, RSVP status, reminders, and optional linked contributions.",
    icon: CalendarDaysIcon,
  },
  {
    title: "Members",
    description:
      "Invite members, approve access, assign roles, and keep sensitive actions visible only to permitted people.",
    icon: UsersIcon,
  },
];

export const metadata: Metadata = {
  title: "Items",
  description:
    "Explore the family management items Rwanda Family helps organize, including money, contributions, projects, documents, reports, events, and members.",
};

export default function ItemsPage() {
  return (
    <PublicSiteShell>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-5 py-12 sm:px-6 lg:px-8">
        <section className="flex max-w-3xl flex-col gap-5">
          <Badge variant="outline" className="w-fit">
            What you can organize
          </Badge>
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-normal text-balance sm:text-5xl">
              Items for everyday family administration.
            </h1>
            <p className="text-lg leading-8 text-muted-foreground">
              Rwanda Family keeps the important parts of family management
              structured, private, and easy to review. Each item is designed for
              family roles, approvals, audit history, and mobile use.
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.title} className="rounded-lg">
              <CardHeader>
                <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-muted">
                  <item.icon aria-hidden="true" className="size-5" />
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <Card className="rounded-lg">
          <CardContent className="py-6">
            <p className="text-base leading-7 text-muted-foreground">
              The application is currently free to use. Rwanda Family does not
              sell private family data or use it for unrelated advertising,
              profiling, or external datasets.
            </p>
          </CardContent>
        </Card>
      </main>
    </PublicSiteShell>
  );
}
