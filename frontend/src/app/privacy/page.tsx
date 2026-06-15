import type { Metadata } from "next";
import { PublicSiteShell } from "@/components/public-site-shell";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getMessages,
  type LocaleSearchParams,
  resolveLocaleFromSearchParams,
} from "@/i18n/config";
import { createTranslator } from "@/i18n/translate";
import enMessages from "@/messages/en.json";

export const metadata: Metadata = {
  title: enMessages.PrivacyPage.metadataTitle,
  description: enMessages.PrivacyPage.metadataDescription,
};

type PrivacyPageProps = {
  searchParams?: Promise<LocaleSearchParams>;
};

export default async function PrivacyPage({ searchParams }: PrivacyPageProps) {
  const locale = resolveLocaleFromSearchParams(await searchParams);
  const messages = getMessages(locale);
  const t = createTranslator(messages, "PrivacyPage");

  return (
    <PublicSiteShell locale={locale} messages={messages}>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-5 py-12 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-5">
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

        <section className="flex flex-col gap-8">
          {messages.PrivacyPage.sections.map((section) => (
            <div key={section.title} className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold tracking-normal">
                {section.title}
              </h2>
              <p className="text-base leading-7 text-muted-foreground">
                {section.body}
              </p>
              <Separator />
            </div>
          ))}
        </section>
      </main>
    </PublicSiteShell>
  );
}
