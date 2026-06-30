"use client";

import {
  AlertCircleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ClipboardListIcon,
  FileClockIcon,
  FolderTreeIcon,
  ListChecksIcon,
  type LucideIcon,
  PlusIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
  UploadIcon,
  WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type FamilyCapability, hasCapability } from "@/lib/family-access";
import apiRequest from "@/service/api";
import { FamilyMoneySkeleton } from "./family-money-skeleton";
import { MoneyApprovalTable } from "./money-approval-table";
import { MoneyBudgetList } from "./money-budget-list";
import { MoneyMetricCards } from "./money-metric-cards";
import { StatusBadge, TableEmptyState } from "./money-ui-helpers";
import type {
  FetchState,
  MoneyMinorValue,
  MoneyOverview,
  MoneyRecordRow,
} from "./types";
import {
  formatDate,
  formatOptionalMoney,
  formatTitle,
  normalizeMoneyOverview,
} from "./utils";

export type MoneySection =
  | "income"
  | "expenses"
  | "categories"
  | "approvals"
  | "receipts"
  | "budgets";

type MoneySectionDefinition = {
  title: string;
  eyebrow: string;
  description: string;
  actionLabel: string;
  actionCapability?: FamilyCapability;
  actionIcon: LucideIcon;
  icon: LucideIcon;
  examples: string[];
};

const sectionDefinitions: Record<MoneySection, MoneySectionDefinition> = {
  income: {
    title: "Income",
    eyebrow: "Money received",
    description:
      "Record family money that comes in, such as rent payments, support from relatives, project income, or contribution transfers.",
    actionLabel: "Record income",
    actionCapability: "RECORD_INCOME",
    actionIcon: PlusIcon,
    icon: ArrowDownIcon,
    examples: [
      "Rent paid by a tenant",
      "Money sent for a family event",
      "Project or family business income",
    ],
  },
  expenses: {
    title: "Expenses",
    eyebrow: "Money spent",
    description:
      "Track money given out or spent for the family, including small errands, food, furniture, school items, and project costs.",
    actionLabel: "Record expense",
    actionCapability: "RECORD_EXPENSE",
    actionIcon: PlusIcon,
    icon: ArrowUpIcon,
    examples: [
      "Money given to a child to buy a pen",
      "Money given to buy food",
      "New chairs or other household purchases",
    ],
  },
  categories: {
    title: "Categories",
    eyebrow: "Money organization",
    description:
      "Keep income and expenses organized by purpose so reports can explain where money came from and where it was used.",
    actionLabel: "Manage categories",
    actionIcon: FolderTreeIcon,
    icon: FolderTreeIcon,
    examples: [
      "Food and household",
      "Rent and property",
      "School, transport, furniture, and ceremonies",
    ],
  },
  approvals: {
    title: "Approvals",
    eyebrow: "Review queue",
    description:
      "Review submitted money records before they affect official family reports, balances, and budgets.",
    actionLabel: "Review approvals",
    actionCapability: "APPROVE_EXPENSE",
    actionIcon: ShieldCheckIcon,
    icon: FileClockIcon,
    examples: [
      "Approve an expense with a receipt",
      "Reject a record with a correction reason",
      "Keep the reviewer and decision history auditable",
    ],
  },
  receipts: {
    title: "Receipts",
    eyebrow: "Proof and documents",
    description:
      "Attach and review proof for family spending and received money so every important record can be checked later.",
    actionLabel: "Upload receipt",
    actionCapability: "RECORD_EXPENSE",
    actionIcon: UploadIcon,
    icon: ReceiptTextIcon,
    examples: [
      "Receipt for food shopping",
      "Photo proof for chairs or household items",
      "Rent payment proof or bank confirmation",
    ],
  },
  budgets: {
    title: "Budgets",
    eyebrow: "Planning and limits",
    description:
      "Plan spending limits by category and compare approved source records against each budget period.",
    actionLabel: "Create budget",
    actionIcon: ListChecksIcon,
    icon: ListChecksIcon,
    examples: [
      "Monthly food budget",
      "School items and supplies",
      "Furniture or home improvement budget",
    ],
  },
};

const moneySectionLinks: { section: MoneySection; hrefPart: string }[] = [
  { section: "income", hrefPart: "income" },
  { section: "expenses", hrefPart: "expenses" },
  { section: "categories", hrefPart: "categories" },
  { section: "approvals", hrefPart: "approvals" },
  { section: "receipts", hrefPart: "receipts" },
  { section: "budgets", hrefPart: "budgets" },
];

export function FamilyMoneySectionPage({
  familyName,
  section,
}: {
  familyName: string;
  section: MoneySection;
}) {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    setState({ status: "loading" });

    (async () => {
      const familyResponse = await apiRequest<undefined, FamilyDetail>(
        "get",
        `/families/${encodeURIComponent(familyName)}`,
      );

      if (!active) return;

      if (!familyResponse.ok || !familyResponse.data) {
        setState({
          status: "error",
          message: familyResponse.message ?? "Unable to load this family.",
        });
        return;
      }

      const family = familyResponse.data;
      const moneyResponse = await apiRequest<undefined, MoneyOverview>(
        "get",
        `/families/${encodeURIComponent(family.id)}/money/overview?period=month`,
      );

      if (!active) return;

      setState({
        status: "success",
        family,
        money: moneyResponse.ok
          ? normalizeMoneyOverview(moneyResponse.data)
          : null,
        moneyMessage: moneyResponse.ok
          ? undefined
          : (moneyResponse.message ??
            "Money records are not available from the API yet."),
      });
    })();

    return () => {
      active = false;
    };
  }, [familyName]);

  if (state.status === "loading") {
    return <FamilyMoneySkeleton />;
  }

  if (state.status === "error") {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WalletCardsIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Money page could not load</EmptyTitle>
          <EmptyDescription>
            {state.message} You may not have access, or the family workspace no
            longer exists. <Link href="/family">Back to your families</Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <MoneySectionContent
      family={state.family}
      money={state.money}
      moneyMessage={state.moneyMessage}
      section={section}
    />
  );
}

function MoneySectionContent({
  family,
  money,
  moneyMessage,
  section,
}: {
  family: FamilyDetail;
  money: MoneyOverview | null;
  moneyMessage?: string;
  section: MoneySection;
}) {
  const definition = sectionDefinitions[section];
  const Icon = definition.icon;
  const ActionIcon = definition.actionIcon;
  const currency = money?.currency ?? family.defaultCurrency;
  const canUseAction =
    !definition.actionCapability ||
    hasCapability(family, definition.actionCapability);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{definition.eyebrow}</Badge>
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
                {definition.title}
              </h1>
            </div>
            <p className="max-w-4xl text-muted-foreground text-sm leading-6">
              {definition.description}
            </p>
          </div>
          {canUseAction ? (
            <Button
              disabled
              size="sm"
              title="This needs the backend money write workflow before records can be saved."
            >
              <ActionIcon aria-hidden="true" data-icon="inline-start" />
              {definition.actionLabel}
            </Button>
          ) : null}
        </div>
        <MoneySectionNavigation
          activeSection={section}
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
      <MoneyMetricCards currency={currency} money={money} />
      <MoneyWorkflowExamples definition={definition} />
      <MoneySectionBody currency={currency} money={money} section={section} />
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
      {moneySectionLinks.map((item) => {
        const definition = sectionDefinitions[item.section];

        return (
          <Button
            aria-current={item.section === activeSection ? "page" : undefined}
            className="shrink-0"
            href={`${baseHref}/${item.hrefPart}`}
            key={item.section}
            size="sm"
            variant={item.section === activeSection ? "default" : "outline"}
          >
            {definition.title}
          </Button>
        );
      })}
    </nav>
  );
}

function MoneyWorkflowExamples({
  definition,
}: {
  definition: MoneySectionDefinition;
}) {
  return (
    <section
      aria-label={`${definition.title} examples`}
      className="grid grid-cols-1 gap-4 md:grid-cols-3"
    >
      {definition.examples.map((example) => (
        <Card key={example}>
          <CardHeader>
            <CardAction>
              <ClipboardListIcon className="size-4 text-muted-foreground" />
            </CardAction>
            <CardTitle className="text-base">{example}</CardTitle>
            <CardDescription>
              Save the amount, date, category, creator, approval state, and any
              supporting note or receipt.
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </section>
  );
}

function MoneySectionBody({
  currency,
  money,
  section,
}: {
  currency: string;
  money: MoneyOverview | null;
  section: MoneySection;
}) {
  if (section === "approvals") {
    return <MoneyApprovalTable currency={currency} money={money} />;
  }

  if (section === "budgets") {
    return <MoneyBudgetList currency={currency} money={money} />;
  }

  if (section === "categories") {
    return <MoneyCategoriesView currency={currency} money={money} />;
  }

  if (section === "receipts") {
    return <MoneyReceiptsView currency={currency} money={money} />;
  }

  return (
    <MoneyRecordsByTypeView
      currency={currency}
      money={money}
      recordType={section}
    />
  );
}

function MoneyRecordsByTypeView({
  currency,
  money,
  recordType,
}: {
  currency: string;
  money: MoneyOverview | null;
  recordType: "income" | "expenses";
}) {
  const records = filterRecordsBySection(money?.records ?? [], recordType);
  const title = recordType === "income" ? "Income records" : "Expense records";
  const description =
    recordType === "income"
      ? "Approved and submitted family income records returned by the API."
      : "Approved and submitted family spending records returned by the API.";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {records.length ? (
          <MoneyRecordsTable records={records} currency={currency} />
        ) : (
          <TableEmptyState
            icon={recordType === "income" ? ArrowDownIcon : ArrowUpIcon}
            title={`No ${recordType === "income" ? "income" : "expense"} records returned`}
            description="Saved records from the backend will appear here with amount, date, category, creator, and approval status."
          />
        )}
      </CardContent>
    </Card>
  );
}

function MoneyCategoriesView({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const summaries = summarizeRecordsByCategory(money?.records ?? []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category summary</CardTitle>
        <CardDescription>
          Category totals are calculated only from records returned by the API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {summaries.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Records</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((summary) => (
                <TableRow key={summary.category}>
                  <TableCell className="font-medium">
                    {summary.category}
                  </TableCell>
                  <TableCell>{summary.recordCount.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatOptionalMoney(summary.incomeMinorUnits, currency)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatOptionalMoney(summary.expenseMinorUnits, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <TableEmptyState
            icon={FolderTreeIcon}
            title="No category records returned"
            description="Food, rent, school, transport, furniture, ceremonies, and project categories will appear after saved records use them."
          />
        )}
      </CardContent>
    </Card>
  );
}

function MoneyReceiptsView({
  currency,
  money,
}: {
  currency: string;
  money: MoneyOverview | null;
}) {
  const records = filterRecordsBySection(money?.records ?? [], "receipts");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipt-ready records</CardTitle>
        <CardDescription>
          Attachments will be linked to the money record they support after the
          receipt API is available.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {records.length ? (
          <MoneyRecordsTable records={records} currency={currency} />
        ) : (
          <TableEmptyState
            icon={ReceiptTextIcon}
            title="No receipt records returned"
            description="Receipts for food shopping, rent payments, furniture, school supplies, and other family purchases will show here."
          />
        )}
      </CardContent>
    </Card>
  );
}

function MoneyRecordsTable({
  currency,
  records,
}: {
  currency: string;
  records: MoneyRecordRow[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Record</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span className="font-medium">{row.title}</span>
                <span className="text-muted-foreground text-xs">
                  {formatTitle(row.type)} by {row.createdBy ?? "Unknown"}
                </span>
              </div>
            </TableCell>
            <TableCell>{row.category ?? "Uncategorized"}</TableCell>
            <TableCell>{formatDate(row.date)}</TableCell>
            <TableCell>
              <StatusBadge value={row.status ?? "draft"} />
            </TableCell>
            <TableCell className="text-right font-mono">
              {formatOptionalMoney(row.amountMinorUnits, currency)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function filterRecordsBySection(
  records: MoneyRecordRow[],
  section: "income" | "expenses" | "receipts",
) {
  if (section === "receipts") {
    return records.filter((record) =>
      ["expense", "income", "purchase", "rent"].some((value) =>
        normalizeRecordType(record.type).includes(value),
      ),
    );
  }

  return records.filter((record) => {
    const type = normalizeRecordType(record.type);

    return section === "income"
      ? type.includes("income")
      : ["expense", "spend", "purchase"].some((value) => type.includes(value));
  });
}

function summarizeRecordsByCategory(records: MoneyRecordRow[]) {
  const summaries = new Map<
    string,
    {
      category: string;
      recordCount: number;
      incomeMinorUnits: string | null;
      expenseMinorUnits: string | null;
    }
  >();

  for (const record of records) {
    const category = record.category ?? "Uncategorized";
    const existing = summaries.get(category) ?? {
      category,
      recordCount: 0,
      incomeMinorUnits: null,
      expenseMinorUnits: null,
    };
    const type = normalizeRecordType(record.type);
    const amount = normalizeMoneyValue(record.amountMinorUnits);

    existing.recordCount += 1;

    if (type.includes("income")) {
      existing.incomeMinorUnits = addMinorUnits(
        existing.incomeMinorUnits,
        amount,
      );
    } else if (
      ["expense", "spend", "purchase"].some((value) => type.includes(value))
    ) {
      existing.expenseMinorUnits = addMinorUnits(
        existing.expenseMinorUnits,
        amount,
      );
    }

    summaries.set(category, existing);
  }

  return Array.from(summaries.values()).sort((first, second) =>
    first.category.localeCompare(second.category),
  );
}

function normalizeRecordType(value: string) {
  return value.toLowerCase().replace(/[_-]+/g, " ");
}

function normalizeMoneyValue(value: MoneyMinorValue | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }

  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return BigInt(value);
  }

  return BigInt(0);
}

function addMinorUnits(current: string | null, amount: bigint): string | null {
  if (amount === BigInt(0) && current === null) {
    return null;
  }

  return ((current ? BigInt(current) : BigInt(0)) + amount).toString();
}
