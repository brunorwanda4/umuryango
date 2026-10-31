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
import {
  getMessages,
  type LocaleSearchParams,
  resolveLocaleFromSearchParams,
} from "@/i18n/config";
import { createTranslator } from "@/i18n/translate";
import enMessages from "@/messages/en.json";

const protectionIcons = {
  "unrelated-use": EyeOffIcon,
  permissions: LockIcon,
  audit: BadgeCheckIcon,
  tenant: DatabaseIcon,
  "sensitive-data": ShieldAlertIcon,
  free: ShieldCheckIcon,
};

export const metadata: Metadata = {
  title: enMessages.SafetyPage.metadataTitle,
  description: enMessages.SafetyPage.metadataDescription,
};

type SafetyPageProps = {
  searchParams?: Promise<LocaleSearchParams>;
};

export default async function SafetyPage({ searchParams }: SafetyPageProps) {
  const locale = resolveLocaleFromSearchParams(await searchParams);
  const messages = getMessages(locale);
  const t = createTranslator(messages, "SafetyPage");

  return (
    <PublicSiteShell locale={locale} messages={messages}>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-5 py-12 sm:px-6 lg:px-8">
        <section className="flex max-w-3xl flex-col gap-5">
          <Badge variant="outline" className="w-fit">
            {t((m) => m.SafetyPage.badge)}
          </Badge>
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-normal text-balance sm:text-5xl">
              {t((m) => m.SafetyPage.title)}
            </h1>
            <p className="text-lg leading-8 text-muted-foreground">
              {t((m) => m.SafetyPage.description)}
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {messages.SafetyPage.protections.map((protection) => {
            const ProtectionIcon =
              protectionIcons[protection.id as keyof typeof protectionIcons];

            return (
              <Card key={protection.id} className="rounded-lg">
                <CardHeader>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-muted">
                    <ProtectionIcon aria-hidden="true" className="size-5" />
                  </div>
                  <CardTitle>{protection.title}</CardTitle>
                  <CardDescription>{protection.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </section>
      </main>
    </PublicSiteShell>
  );
}
