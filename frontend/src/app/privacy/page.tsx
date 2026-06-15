import type { Metadata } from "next";
import { PublicSiteShell } from "@/components/public-site-shell";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const sections = [
  {
    title: "What we collect",
    body: "Rwanda Family may collect account details, family membership details, family workspace records, financial records entered by permitted users, documents uploaded by users, device information, security logs, and support messages.",
  },
  {
    title: "How we use data",
    body: "We use data to run the application, authenticate users, enforce family permissions, keep records available, generate reports, send requested notifications, prevent abuse, improve reliability, and respond to support requests.",
  },
  {
    title: "What we do not do",
    body: "We do not sell personal data. We do not use private family financial records, documents, or member data for unrelated advertising, unrelated profiling, or external datasets.",
  },
  {
    title: "Limited operational access",
    body: "Private family data should only be accessed by authorized operational staff when needed for support requested by a user, security investigation, abuse prevention, legal compliance, or system maintenance. Access should be limited, accountable, and never for personal use.",
  },
  {
    title: "Family permissions",
    body: "Family owners and permitted leaders control who can join a family workspace and what members can see or do. The backend must enforce access rules for protected records.",
  },
  {
    title: "Retention and deletion",
    body: "Financial and permission-sensitive records may be retained for audit history. Where deletion is allowed, Rwanda Family should use safe deletion, soft deletion, or reversal records when auditability matters.",
  },
];

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read how Rwanda Family protects family data, limits data use, and avoids selling or reusing private records for unrelated purposes.",
};

export default function PrivacyPage() {
  return (
    <PublicSiteShell>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-5 py-12 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-5">
          <Badge variant="outline" className="w-fit">
            Last updated June 15, 2026
          </Badge>
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-normal text-balance sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="text-lg leading-8 text-muted-foreground">
              Rwanda Family is built for private family administration. Family
              data should be protected, used only for the application, and kept
              inside the permissions of each family workspace.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-8">
          {sections.map((section) => (
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
