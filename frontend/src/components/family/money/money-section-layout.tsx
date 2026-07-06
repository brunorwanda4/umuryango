"use client";

import { AlertCircleIcon, ClipboardListIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { hasCapability } from "@/lib/family-access";
import type { FamilyDetail } from "../dashboard/types";
import { MoneyMetricCards } from "./money-metric-cards";
import type { MoneySection, MoneySectionHeader } from "./money-section-types";
import type { MoneyOverview } from "./types";

const moneySectionLinks: {
  section: MoneySection;
  title: string;
  hrefPart: string;
}[] = [
  { section: "income", title: "Income", hrefPart: "income" },
  { section: "expenses", title: "Expenses", hrefPart: "expenses" },
  { section: "categories", title: "Categories", hrefPart: "categories" },
  { section: "approvals", title: "Approvals", hrefPart: "approvals" },
  { section: "loans", title: "Loans", hrefPart: "loans" },
];

export function MoneySectionLayout({
  children,
  currency,
  family,
  header,
  money,
  moneyMessage,
  actionDialog,
  exampleDescription,
  showMoneyMetrics = true,
}: {
  children: ReactNode;
  currency: string;
  family: FamilyDetail;
  header: MoneySectionHeader;
  money: MoneyOverview | null;
  moneyMessage?: string;
  actionDialog?: ReactNode;
  exampleDescription?: string;
  showMoneyMetrics?: boolean;
}) {
  const Icon = header.icon;
  const ActionIcon = header.actionIcon;
  const canUseAction =
    !header.actionCapability || hasCapability(family, header.actionCapability);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{header.eyebrow}</Badge>
              <Badge variant="secondary">{currency}</Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background">
                <Icon
                  aria-hidden="true"
                  className="size-5 text-muted-foreground"
                />
              </span>
              <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
                {header.title}
              </h1>
            </div>
            <p className="max-w-4xl text-muted-foreground text-sm leading-6">
              {header.description}
            </p>
          </div>
          {canUseAction
            ? (actionDialog ?? (
                <Button
                  disabled
                  size="sm"
                  title="This needs the backend money write workflow before records can be saved."
                >
                  <ActionIcon aria-hidden="true" data-icon="inline-start" />
                  {header.actionLabel}
                </Button>
              ))
            : null}
        </div>
        <MoneySectionNavigation
          activeSection={header.section}
          familySlug={family.slug}
        />
      </header>
      <Separator />
      {moneyMessage ? (
        <Alert>
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Waiting for saved money records</AlertTitle>
          <AlertDescription>
            This page is ready for persisted family money records. Records,
            totals, approvals, receipts, and budget usage stay empty until the
            backend returns saved data. API detail: {moneyMessage}
          </AlertDescription>
        </Alert>
      ) : null}
      {showMoneyMetrics ? (
        <MoneyMetricCards currency={currency} money={money} />
      ) : null}
      <MoneyWorkflowExamples description={exampleDescription} header={header} />
      {children}
    </div>
  );
}

function MoneySectionNavigation({
  activeSection,
  familySlug,
}: {
  activeSection: MoneySection;
  familySlug: string;
}) {
  const baseHref = `/family/${encodeURIComponent(familySlug)}/money`;

  return (
    <nav aria-label="Money pages" className="flex gap-2 overflow-x-auto pb-1">
      <Button href={baseHref} size="sm" variant="outline" className="shrink-0">
        Overview
      </Button>
      {moneySectionLinks.map((item) => (
        <Button
          aria-current={item.section === activeSection ? "page" : undefined}
          className="shrink-0"
          href={`${baseHref}/${item.hrefPart}`}
          key={item.section}
          size="sm"
          variant={item.section === activeSection ? "default" : "outline"}
        >
          {item.title}
        </Button>
      ))}
    </nav>
  );
}

function MoneyWorkflowExamples({
  description = "Save the amount, date, category, creator, approval state, and any supporting note or receipt.",
  header,
}: {
  description?: string;
  header: MoneySectionHeader;
}) {
  return (
    <section
      aria-label={`${header.title} examples`}
      className="grid grid-cols-1 gap-4 md:grid-cols-3"
    >
      {header.examples.map((example) => (
        <Card key={example}>
          <CardHeader>
            <CardAction>
              <ClipboardListIcon className="size-4 text-muted-foreground" />
            </CardAction>
            <CardTitle className="text-base">{example}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </section>
  );
}
