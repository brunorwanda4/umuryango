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

const navigationLinks = [
  { href: "/items", label: "Items", icon: PackageIcon },
  { href: "/privacy", label: "Privacy", icon: LockKeyholeIcon },
  { href: "/terms", label: "Terms", icon: FileTextIcon },
  { href: "/safety", label: "Safety", icon: ShieldCheckIcon },
];

type PublicSiteShellProps = {
  children: ReactNode;
};

export function PublicSiteShell({ children }: PublicSiteShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-border border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-4 pr-20 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pr-24 lg:px-8">
          <Link
            href="/"
            className="flex w-fit items-center gap-3"
            aria-label="Rwanda Family home"
          >
            <Image
              src="/logo.svg"
              alt=""
              width={36}
              height={36}
              className="rounded-xl"
              priority
            />
            <span className="text-base font-semibold">Rwanda Family</span>
          </Link>

          <nav
            aria-label="Public pages"
            className="flex flex-wrap items-center gap-2"
          >
            {navigationLinks.map((link) => (
              <Button
                key={link.href}
                href={link.href}
                variant="ghost"
                size="sm"
                className="rounded-full"
              >
                <link.icon data-icon="inline-start" aria-hidden="true" />
                {link.label}
              </Button>
            ))}
            <Button href="/auth/login" size="sm" className="rounded-full">
              Log in
            </Button>
          </nav>
        </div>
      </header>

      {children}

      <footer className="mt-auto border-border border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-sm font-medium">
              <Image src="/logo.svg" alt="" width={28} height={28} />
              <span>Rwanda Family</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-2 py-1 hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <Separator />
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Rwanda Family is currently free to use. Private family data is used
            to provide the application, protect accounts, and support family
            workflows. It is not sold or used for unrelated purposes.
          </p>
        </div>
      </footer>
    </div>
  );
}
