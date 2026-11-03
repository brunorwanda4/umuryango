import { CheckIcon, FileClockIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { createTranslator } from "@/i18n/translate";
import apiRequest from "@/service/api";
import { StatusBadge, TableEmptyState } from "./money-ui-helpers";
import type { MoneyOverview } from "./types";
import { formatDate, formatTitle } from "./utils";

export function MoneyApprovalTable({
  currency,
  money,
  familyId,
}: {
  currency: string;
  money: MoneyOverview | null;
  familyId: string;
}) {
  const t = createTranslator("FamilyMoney");
  const tCommon = createTranslator("Common");
  const approvals = money?.approvals ?? [];
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setProcessingId(id);
    try {
      const response = await apiRequest(
        "patch",
        `/families/${encodeURIComponent(familyId)}/money/transactions/${id}/${action}`,
      );
      if (response.ok) {
        toast.success(
          action === "approve"
            ? t((m) => m.FamilyMoney.transactionApproved)
            : t((m) => m.FamilyMoney.transactionRejected),
        );
        window.location.reload();
      } else {
        toast.error(response.message || t((m) => m.FamilyMoney.processFailed));
      }
    } catch {
      toast.error(tCommon("errors.unexpected"));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t((m) => m.FamilyMoney.approvalQueueTitle)}</CardTitle>
        <CardDescription>
          {t((m) => m.FamilyMoney.approvalQueueDesc)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {approvals.length ? (
          <ItemGroup>
            {approvals.map((approval) => {
              const approveLabel = t(
                (m) => m.FamilyApprovals.approve,
                undefined,
              );
              const rejectLabel = t((m) => m.FamilyApprovals.reject, undefined);
              const isProcessing = processingId === approval.id;

              return (
                <Item key={approval.id} variant="outline" size="sm">
                  <ItemMedia
                    variant="icon"
                    className="size-9 rounded-xl bg-muted text-muted-foreground"
                  >
                    <FileClockIcon aria-hidden="true" />
                  </ItemMedia>

                  <ItemContent className="min-w-0">
                    <ItemTitle className="w-full min-w-0 flex-wrap">
                      <span className="min-w-0 flex-1 truncate">
                        {approval.title}
                      </span>
                      <StatusBadge value={approval.status ?? "pending"} />
                    </ItemTitle>
                    <ItemDescription className="line-clamp-none text-xs">
                      <span className="block truncate">
                        {formatTitle(approval.type)}
                      </span>
                      <span className="block truncate">
                        {t((m) => m.FamilyMoney.submittedBy)}:{" "}
                        {approval.submittedBy ??
                          t((m) => m.FamilyMoney.unknownUser)}
                        {approval.submittedAt
                          ? ` · ${formatDate(approval.submittedAt)}`
                          : null}
                      </span>
                    </ItemDescription>
                  </ItemContent>

                  <ItemFooter className="border-border/60 border-t pt-2.5">
                    <CompactMoney
                      className="font-mono font-semibold tabular-nums"
                      currency={currency}
                      emptyLabel="No records"
                      value={approval.amountMinorUnits}
                    />
                    <ItemActions>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        aria-label={approveLabel}
                        title={approveLabel}
                        disabled={isProcessing}
                        onClick={() => handleAction(approval.id, "approve")}
                      >
                        {isProcessing ? (
                          <Spinner />
                        ) : (
                          <CheckIcon data-icon="inline-start" />
                        )}
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        aria-label={rejectLabel}
                        title={rejectLabel}
                        disabled={isProcessing}
                        onClick={() => handleAction(approval.id, "reject")}
                      >
                        {isProcessing ? (
                          <Spinner />
                        ) : (
                          <XIcon
                            data-icon="inline-start"
                            className="text-destructive"
                          />
                        )}
                      </Button>
                    </ItemActions>
                  </ItemFooter>
                </Item>
              );
            })}
          </ItemGroup>
        ) : (
          <TableEmptyState
            icon={FileClockIcon}
            title={t((m) => m.FamilyMoney.noApprovalsTitle)}
            description={t((m) => m.FamilyMoney.noApprovalsDesc)}
          />
        )}
      </CardContent>
    </Card>
  );
}
