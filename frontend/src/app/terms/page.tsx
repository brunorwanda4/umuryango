import type { Metadata } from "next";
import { PublicSiteShell } from "@/components/public-site-shell";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const sections = [
  {
    title: "Free use",
    body: "Rwanda Family is currently free to use. If paid features are introduced later, users should receive clear notice before being asked to pay.",
  },
  {
    title: "User responsibility",
    body: "Users are responsible for entering accurate records, protecting login details, inviting only trusted members, and reviewing records before approval or reporting.",
  },
  {
    title: "Family owner responsibility",
    body: "Family owners manage the workspace, approve members, assign roles, and decide which information members can access according to family needs.",
  },
  {
    title: "Financial records",
    body: "Rwanda Family helps organize family records but does not create, invent, or approve financial activity on behalf of a family. Reports must be based on persisted records.",
  },
  {
    title: "Acceptable use",
    body: "Users may not use Rwanda Family to upload harmful files, violate privacy, impersonate others, attack the service, bypass permissions, or store unlawful content.",
  },
  {
    title: "Service changes",
    body: "Features may change as the product improves. Privacy, security, and auditability remain core requirements for changes that affect family data.",
  },
];

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Read the Rwanda Family terms covering free use, user responsibilities, family owner responsibilities, and acceptable use.",
};

export default function TermsPage() {
  return (
    <PublicSiteShell>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-5 py-12 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-5">
          <Badge variant="outline" className="w-fit">
            Last updated June 15, 2026
          </Badge>
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-normal text-balance sm:text-5xl">
              Terms of Use
            </h1>
            <p className="text-lg leading-8 text-muted-foreground">
              These terms explain how Rwanda Family should be used while it is
              offered as a free family management application.
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
