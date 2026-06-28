"use client";

import { UsersIcon } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  FamilyDashboard,
  FamilyDashboardSkeleton,
} from "@/components/family/dashboard/family-dashboard";
import type { FamilyDetail } from "@/components/family/dashboard/types";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import apiRequest from "@/service/api";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; family: FamilyDetail };

export default function FamilyDashboardPage({
  params,
}: {
  params: Promise<{ familyName: string }>;
}) {
  const { familyName } = use(params);
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    (async () => {
      const response = await apiRequest<undefined, FamilyDetail>(
        "get",
        `/families/${encodeURIComponent(familyName)}`,
      );

      if (!active) return;

      if (response.ok && response.data) {
        setState({ status: "success", family: response.data });
      } else {
        setState({
          status: "error",
          message: response.message ?? "Unable to load this family.",
        });
      }
    })();

    return () => {
      active = false;
    };
  }, [familyName]);

  if (state.status === "loading") {
    return <FamilyDashboardSkeleton />;
  }

  if (state.status === "error") {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Family not found</EmptyTitle>
          <EmptyDescription>
            {state.message} You may not have access, or it no longer exists.{" "}
            <Link href="/family">Back to your families</Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return <FamilyDashboard family={state.family} />;
}
