import Link from "next/link";
import type { ReactNode } from "react";

const authFooterLinks = [
  { href: "/items", label: "Items" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/safety", label: "Safety" },
];

const LayoutAuth = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <div className="flex-1">{children}</div>
      <footer className="border-border border-t px-5 py-5 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Rwanda Family is currently free to use.</p>
          <nav
            aria-label="Authentication footer pages"
            className="flex flex-wrap items-center gap-3"
          >
            {authFooterLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-medium hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default LayoutAuth;
