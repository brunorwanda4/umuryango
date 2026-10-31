import {
  FileTextIcon,
  LockKeyholeIcon,
  PackageIcon,
  ShieldCheckIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { type AppLocale, getLocalizedHref, type Messages } from "@/i18n/config";
import { createTranslator } from "@/i18n/translate";

const navigationLinks = [
  { href: "/items", labelKey: "nav.items", icon: PackageIcon },
  { href: "/privacy", labelKey: "nav.privacy", icon: LockKeyholeIcon },
  { href: "/terms", labelKey: "nav.terms", icon: FileTextIcon },
  { href: "/safety", labelKey: "nav.safety", icon: ShieldCheckIcon },
];

type PublicSiteShellProps = {
  children: ReactNode;
  locale: AppLocale;
  messages: Messages;
};

export function PublicSiteShell({
  children,
  locale,
  messages,
}: PublicSiteShellProps) {
  const t = createTranslator(messages, "Shared");

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-border border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-4 pr-20 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pr-24 lg:px-8">
          <Link
            href={getLocalizedHref("/", locale)}
            className="flex w-fit items-center gap-3"
            aria-label={t((m) => m.Shared.homeAriaLabel)}
          >
            <span
              aria-hidden="true"
              className="block h-9 w-40 bg-foreground [mask-image:url('/brand/umuryango-horizontal-wordmark.png')] [mask-position:left_center] [mask-repeat:no-repeat] [mask-size:contain] [-webkit-mask-image:url('/brand/umuryango-horizontal-wordmark.png')] [-webkit-mask-position:left_center] [-webkit-mask-repeat:no-repeat] [-webkit-mask-size:contain]"
            />
          </Link>

          <nav
            aria-label={t((m) => m.Shared.navigationAriaLabel)}
            className="flex flex-wrap items-center gap-2"
          >
            {navigationLinks.map((link) => (
              <Button
                key={link.href}
                href={getLocalizedHref(link.href, locale)}
                variant="ghost"
                size="sm"
                className="rounded-full"
              >
                <link.icon data-icon="inline-start" aria-hidden="true" />
                {t(link.labelKey)}
              </Button>
            ))}
            <Button
              href={getLocalizedHref("/auth/login", locale)}
              size="sm"
              className="rounded-full"
            >
              {t((m) => m.Shared.nav.login)}
            </Button>
          </nav>
        </div>
      </header>

      {children}

      <footer className="mt-auto border-border border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-sm font-medium">
              <Image
                src="/brand/umuryango-inverted-icon.png"
                alt=""
                width={28}
                height={28}
              />
              <span>{t((m) => m.Shared.brand)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={getLocalizedHref(link.href, locale)}
                  className="rounded-full px-2 py-1 hover:text-foreground"
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </div>
          </div>
          <Separator />
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {t((m) => m.Shared.footer.privacy)}
          </p>
        </div>
      </footer>
    </div>
  );
}
