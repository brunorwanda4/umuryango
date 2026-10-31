import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  DownloadIcon,
  HistoryIcon,
  MessageSquareIcon,
  ReceiptTextIcon,
  SendIcon,
  UserRoundPlusIcon,
  XCircleIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { createTranslator } from "@/i18n/translate";
import { formatDate, formatTitle } from "../utils";
import {
  ApprovalStatusBadge,
  PriorityBadge,
  TypeBadge,
} from "./approval-badges";
import type { ApprovalQueueItem } from "./types";
import { buildApprovalTimeline } from "./utils";

export function ApprovalDetailsSheet({
  approval,
  canApprove,
  canAssign,
  currency,
  onAction,
  onOpenChange,
  processingId,
}: {
  approval: ApprovalQueueItem | null;
  canApprove: boolean;
  canAssign: boolean;
  currency: string;
  onAction: (approval: ApprovalQueueItem, action: "approve" | "reject") => void;
  onOpenChange: (open: boolean) => void;
  processingId: string | null;
}) {
  const t = createTranslator("FamilyApprovals");
  const tCommon = createTranslator("Common");
  const isOpen = Boolean(approval);
  const canUseTransactionAction =
    Boolean(approval) &&
    canApprove &&
    approval?.source === "transaction" &&
    approval?.status === "PENDING";

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl lg:max-w-2xl">
        {approval ? (
          <>
            <SheetHeader>
              <SheetTitle>{approval.title}</SheetTitle>
              <SheetDescription>
                {t((m) => m.FamilyApprovals.detailsSheetDesc)}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-6 pb-6">
              <div className="flex flex-wrap gap-2">
                <TypeBadge type={approval.type} />
                <ApprovalStatusBadge status={approval.status} />
                <PriorityBadge priority={approval.priority} />
              </div>

              <DetailSection title={t((m) => m.FamilyApprovals.sectionGeneral)}>
                <DetailRow
                  label={t((m) => m.FamilyApprovals.transactionType)}
                  value={formatTitle(approval.type)}
                />
                <DetailRow
                  label={t((m) => m.FamilyApprovals.titleColumn)}
                  value={approval.title}
                />
                <DetailRow
                  label={t((m) => m.FamilyApprovals.categoryColumn)}
                  value={approval.category}
                />
                <DetailRow
                  label={t((m) => m.FamilyApprovals.amountColumn)}
                  value={
                    <CompactMoney
                      currency={currency}
                      emptyLabel={tCommon((m) => m.Common.notRecorded)}
                      value={approval.amountMinorUnits}
                    />
                  }
                  mono
                />
                <DetailRow
                  label={t("dateColumn")}
                  value={formatDate(
                    approval.transaction?.date ?? approval.submittedAt,
                  )}
                />
                <div className="rounded-md border p-3">
                  <p className="font-medium text-muted-foreground text-xs">
                    {tCommon((m) => m.Common.description)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                    {approval.description}
                  </p>
                </div>
              </DetailSection>

              <DetailSection
                title={t((m) => m.FamilyApprovals.sectionFinancial)}
              >
                <DetailRow
                  label={t((m) => m.FamilyApprovals.paymentMethod)}
                  value={approval.paymentMethod}
                />
                <DetailRow
                  label={t((m) => m.FamilyApprovals.receipt)}
                  value={approval.receipt}
                />
                <DetailRow
                  label={t((m) => m.FamilyApprovals.budget)}
                  value={approval.budget}
                />
                <DetailRow
                  label={t((m) => m.FamilyApprovals.relatedProject)}
                  value={approval.relatedProject}
                />
              </DetailSection>

              <DetailSection title={t((m) => m.FamilyApprovals.sectionPeople)}>
                <DetailRow
                  label={t((m) => m.FamilyApprovals.requestedBy)}
                  value={approval.requestedBy}
                />
                <DetailRow
                  label={t((m) => m.FamilyApprovals.currentApprover)}
                  value={approval.currentApprover}
                />
                <DetailRow
                  label={t((m) => m.FamilyApprovals.previousApprovers)}
                  value={
                    approval.previousApprovers.length
                      ? approval.previousApprovers.join(", ")
                      : t((m) => m.FamilyApprovals.noneYet)
                  }
                />
              </DetailSection>

              <DetailSection
                title={t((m) => m.FamilyApprovals.sectionComments)}
              >
                <Textarea
                  disabled
                  placeholder={t((m) => m.FamilyApprovals.commentsPlaceholder)}
                />
                <p className="text-muted-foreground text-xs leading-5">
                  {t((m) => m.FamilyApprovals.commentsNote)}
                </p>
              </DetailSection>

              <DetailSection title={t((m) => m.FamilyApprovals.sectionActions)}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    disabled={
                      !canUseTransactionAction || processingId === approval.id
                    }
                    onClick={() => onAction(approval, "approve")}
                  >
                    <CheckCircle2Icon
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    {t((m) => m.FamilyApprovals.approve)}
                  </Button>
                  <Button
                    disabled={
                      !canUseTransactionAction || processingId === approval.id
                    }
                    variant="destructive"
                    onClick={() => onAction(approval, "reject")}
                  >
                    <XCircleIcon aria-hidden="true" data-icon="inline-start" />
                    {t((m) => m.FamilyApprovals.reject)}
                  </Button>
                  <Button disabled variant="outline">
                    <MessageSquareIcon
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    {t((m) => m.FamilyApprovals.requestChanges)}
                  </Button>
                  <Button disabled variant="outline">
                    <ArrowLeftIcon
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    {t((m) => m.FamilyApprovals.returnToDraft)}
                  </Button>
                  <Button disabled={!canAssign} variant="outline">
                    <UserRoundPlusIcon
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    {t((m) => m.FamilyApprovals.assignApprover)}
                  </Button>
                  <Button disabled variant="outline">
                    <ReceiptTextIcon
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    {t((m) => m.FamilyApprovals.viewReceipt)}
                  </Button>
                  <Button disabled variant="outline">
                    <DownloadIcon aria-hidden="true" data-icon="inline-start" />
                    {t((m) => m.FamilyApprovals.downloadAttachment)}
                  </Button>
                </div>
              </DetailSection>

              <DetailSection title={t((m) => m.FamilyApprovals.sectionHistory)}>
                <ApprovalTimeline approval={approval} />
              </DetailSection>

              <DetailSection
                title={t((m) => m.FamilyApprovals.sectionNotifications)}
              >
                <div className="grid gap-2">
                  {[
                    "Creator is notified when approved.",
                    "Creator is notified when rejected.",
                    "Creator is notified when changes are requested.",
                    "Next approver is notified when multi-level approval exists.",
                  ].map((notification) => (
                    <div
                      className="flex items-center gap-2 rounded-md border bg-muted/20 p-3 text-sm"
                      key={notification}
                    >
                      <SendIcon className="size-4 text-muted-foreground" />
                      {notification}
                    </div>
                  ))}
                </div>
              </DetailSection>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DetailSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-md border p-4">
      <h3 className="font-semibold text-sm">{title}</h3>
      {children}
    </section>
  );
}

function DetailRow({
  label,
  mono = false,
  value,
}: {
  label: string;
  mono?: boolean;
  value: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-4 border-b pb-2 text-sm last:border-b-0 last:pb-0">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className={mono ? "text-right font-mono" : "text-right"}>
        {value}
      </span>
    </div>
  );
}

function ApprovalTimeline({ approval }: { approval: ApprovalQueueItem }) {
  const items = buildApprovalTimeline(approval);

  return (
    <div className="relative flex flex-col gap-4">
      {items.map((item, index) => (
        <div
          className="relative flex gap-3"
          key={`${item.action}-${item.date}`}
        >
          <div className="flex flex-col items-center">
            <span className="mt-1 flex size-7 items-center justify-center rounded-full border bg-background">
              <HistoryIcon className="size-3.5 text-muted-foreground" />
            </span>
            {index < items.length - 1 ? (
              <span className="h-full min-h-8 w-px bg-border" />
            ) : null}
          </div>
          <div className="min-w-0 pb-2">
            <p className="font-medium text-sm">{item.action}</p>
            <p className="text-muted-foreground text-xs">
              {item.user} - {formatDate(item.date)}
            </p>
            {item.comment ? (
              <p className="mt-1 rounded-md bg-muted/50 p-2 text-xs leading-5">
                {item.comment}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
