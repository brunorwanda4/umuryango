"use client";

import { WalletCardsIcon } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import apiRequest from "@/service/api";
import { FamilyMoneySkeleton } from "./family-money-skeleton";
import type { MoneyPageContext } from "./money-section-types";
import type { FetchState, MoneyOverview } from "./types";
import { normalizeMoneyOverview } from "./utils";

export function FamilyMoneyPageData({
  children,
  familyName,
}: {
  children: (context: MoneyPageContext) => ReactNode;
  familyName: string;
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

  return children({
    family: state.family,
    money: state.money,
    moneyMessage: state.moneyMessage,
    currency: state.money?.currency ?? state.family.defaultCurrency,
  });
}
