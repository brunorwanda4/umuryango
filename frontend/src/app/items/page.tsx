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
import {
  getMessages,
  type LocaleSearchParams,
  resolveLocaleFromSearchParams,
} from "@/i18n/config";
import { createTranslator } from "@/i18n/translate";
import enMessages from "@/messages/en.json";

const itemIcons = {
  money: WalletCardsIcon,
  contributions: HandCoinsIcon,
  savings: PiggyBankIcon,
  expenses: ReceiptTextIcon,
  projects: FolderKanbanIcon,
  documents: ArchiveIcon,
  reports: FileBarChartIcon,
  announcements: MegaphoneIcon,
  events: CalendarDaysIcon,
  members: UsersIcon,
};

export const metadata: Metadata = {
  title: enMessages.ItemsPage.metadataTitle,
  description: enMessages.ItemsPage.metadataDescription,
};

type ItemsPageProps = {
  searchParams?: Promise<LocaleSearchParams>;
};

export default async function ItemsPage({ searchParams }: ItemsPageProps) {
  const locale = resolveLocaleFromSearchParams(await searchParams);
  const messages = getMessages(locale);
  const t = createTranslator(messages, "ItemsPage");

  return (
    <PublicSiteShell locale={locale} messages={messages}>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-5 py-12 sm:px-6 lg:px-8">
        <section className="flex max-w-3xl flex-col gap-5">
          <Badge variant="outline" className="w-fit">
            {t("badge")}
          </Badge>
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-normal text-balance sm:text-5xl">
              {t("title")}
            </h1>
            <p className="text-lg leading-8 text-muted-foreground">
              {t("description")}
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {messages.ItemsPage.items.map((item) => {
            const ItemIcon = itemIcons[item.id as keyof typeof itemIcons];

            return (
              <Card key={item.id} className="rounded-lg">
                <CardHeader>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-muted">
                    <ItemIcon aria-hidden="true" className="size-5" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </section>

        <Card className="rounded-lg">
          <CardContent className="py-6">
            <p className="text-base leading-7 text-muted-foreground">
              {t("freeNote")}
            </p>
          </CardContent>
        </Card>
      </main>
    </PublicSiteShell>
  );
}
