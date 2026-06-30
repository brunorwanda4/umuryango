import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { defaultLocale, getLocalizedHref, getMessages } from "@/i18n/config";
import { createTranslator } from "@/i18n/translate";

const authFooterLinks = [
  { href: "/items", labelKey: "nav.items" },
  { href: "/privacy", labelKey: "nav.privacy" },
  { href: "/terms", labelKey: "nav.terms" },
  { href: "/safety", labelKey: "nav.safety" },
];

const LayoutAuth = ({ children }: { children: ReactNode }) => {
  const messages = getMessages(defaultLocale);
  const shared = createTranslator(messages, "Shared");
  const auth = createTranslator(messages, "AuthLayout");

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <div className="flex-1">
        {children}{" "}
        <div className="fixed right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>
      </div>
      <footer className="border-border border-t px-5 py-5 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{auth("free")}</p>
          <nav
            aria-label={shared("authFooterAriaLabel")}
            className="flex flex-wrap items-center gap-3"
          >
            {authFooterLinks.map((link) => (
              <Link
                key={link.href}
                href={getLocalizedHref(link.href, defaultLocale)}
                className="font-medium hover:text-foreground"
              >
                {shared(link.labelKey)}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default LayoutAuth;
