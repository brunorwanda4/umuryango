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
import {
  getLocalizedHref,
  getMessages,
  type LocaleSearchParams,
  resolveLocaleFromSearchParams,
} from "@/i18n/config";
import { createTranslator } from "@/i18n/translate";

const highlightIcons = {
  money: ReceiptTextIcon,
  contributions: HandCoinsIcon,
  documents: ArchiveIcon,
  reports: FileBarChartIcon,
  members: UsersIcon,
  privacy: LockKeyholeIcon,
};

type HomeProps = {
  searchParams?: Promise<LocaleSearchParams>;
};

export default async function Home({ searchParams }: HomeProps) {
  const locale = resolveLocaleFromSearchParams(await searchParams);
  const messages = getMessages(locale);
  const t = createTranslator(messages, "Home");

  return (
    <PublicSiteShell locale={locale} messages={messages}>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-5 py-12 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] lg:items-center">
          <div className="flex flex-col gap-7">
            <Badge variant="outline" className="w-fit">
              {t((m) => m.Home.badge)}
            </Badge>
            <div className="flex flex-col gap-5">
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-normal text-balance sm:text-6xl">
                {t((m) => m.Home.title)}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                {t((m) => m.Home.description)}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 w-full rounded-full sm:w-fit"
                href={getLocalizedHref("/auth/login", locale)}
              >
                {t((m) => m.Home.login)}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-full sm:w-fit"
                href={getLocalizedHref("/items", locale)}
              >
                {t((m) => m.Home.viewItems)}
              </Button>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {t((m) => m.Home.privacyNote)}{" "}
              <Link
                href={getLocalizedHref("/privacy", locale)}
                className="font-medium text-foreground"
              >
                {t((m) => m.Home.privacyLink)}
              </Link>
            </p>
          </div>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>{t((m) => m.Home.trustTitle)}</CardTitle>
              <CardDescription>
                {t((m) => m.Home.trustDescription)}
              </CardDescription>
            </CardHeader>
            <div className="grid gap-3 px-5 pb-5">
              {messages.Home.trustItems.map((item) => (
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
          {messages.Home.highlights.map((highlight) => {
            const HighlightIcon =
              highlightIcons[highlight.id as keyof typeof highlightIcons];

            return (
              <Card key={highlight.id} className="rounded-lg">
                <CardHeader>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-muted">
                    <HighlightIcon aria-hidden="true" className="size-5" />
                  </div>
                  <CardTitle>{highlight.title}</CardTitle>
                  <CardDescription>{highlight.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </section>
      </main>
    </PublicSiteShell>
  );
}
