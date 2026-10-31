import { CompassIcon, HouseIcon, LogInIcon } from "lucide-react";
import type { Metadata } from "next";
import { PublicSiteShell } from "@/components/public-site-shell";
import { Button } from "@/components/ui/button";
import { defaultLocale, getLocalizedHref, getMessages } from "@/i18n/config";
import { createTranslator } from "@/i18n/translate";
import enMessages from "@/messages/en.json";

export const metadata: Metadata = {
  title: enMessages.NotFoundPage.metadataTitle,
  description: enMessages.NotFoundPage.metadataDescription,
};

export default function NotFound() {
  const messages = getMessages(defaultLocale);
  const t = createTranslator(messages, "NotFoundPage");

  return (
    <PublicSiteShell locale={defaultLocale} messages={messages}>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-5 py-20 text-center sm:px-6">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <CompassIcon
            aria-hidden="true"
            className="size-8 text-muted-foreground"
          />
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold tracking-wide text-muted-foreground">
            404
          </p>
          <h1 className="text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
            {t((m) => m.NotFoundPage.heading)}
          </h1>
          <p className="mx-auto max-w-md text-lg leading-8 text-muted-foreground">
            {t((m) => m.NotFoundPage.description)}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            href={getLocalizedHref("/", defaultLocale)}
            size="lg"
            className="h-12 w-full rounded-full sm:w-fit"
          >
            <HouseIcon data-icon="inline-start" aria-hidden="true" />
            {t((m) => m.NotFoundPage.backHome)}
          </Button>
          <Button
            href={getLocalizedHref("/auth/login", defaultLocale)}
            variant="outline"
            size="lg"
            className="h-12 w-full rounded-full sm:w-fit"
          >
            <LogInIcon data-icon="inline-start" aria-hidden="true" />
            {t((m) => m.NotFoundPage.login)}
          </Button>
        </div>
      </main>
    </PublicSiteShell>
  );
}
