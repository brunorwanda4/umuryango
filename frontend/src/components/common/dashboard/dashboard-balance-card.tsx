import Link from "next/link";
import type { ReactNode } from "react";
import { CompactMoney } from "@/components/common/money/compact-money";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import type { MinorUnitValue } from "@/lib/format-compact-number";
import { cn } from "@/lib/utils";

export function DashboardBalanceStat({
  href,
  currency,
  label,
  value,
  emptyLabel,
}: {
  href?: string;
  currency: string;
  label: ReactNode;
  value: MinorUnitValue;
  emptyLabel?: string;
}) {
  const inner = (
    <>
      <small className="block text-[13px] text-white/70">{label}</small>
      <CompactMoney
        className="mt-1 block font-mono text-lg font-semibold text-white"
        currency={currency}
        emptyLabel={emptyLabel}
        value={value}
      />
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-xl border border-white/10 bg-white/6 p-3 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {inner}
      </Link>
    );
  }

  return <div className="rounded-xl border border-white/10 bg-white/6 p-3">{inner}</div>;
}

export function DashboardBalanceCard({
  label,
  currency,
  value,
  href,
  unavailable = false,
  unavailableLabel,
  badge,
  children,
  className,
}: {
  label: ReactNode;
  currency: string;
  value: MinorUnitValue;
  href?: string;
  unavailable?: boolean;
  unavailableLabel?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const balanceContent = (
    <>
      <CompactMoney
        className="mt-2 font-mono text-4xl font-semibold tracking-[0.06em] text-white sm:text-5xl"
        currency={currency}
        value={unavailable ? 0 : value}
      />
      {unavailable && unavailableLabel ? (
        <p className="mt-2 text-sm text-white/70">{unavailableLabel}</p>
      ) : null}
    </>
  );

  return (
    <Card
      className={cn(
        "family-balance-card gap-0 rounded-[22px] border py-[22px] text-white shadow-xl",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 px-[22px]">
        <CardDescription className="font-mono text-[17px] font-semibold uppercase tracking-[0.14em] text-white/90">
          {label}
        </CardDescription>
        {badge}
      </CardHeader>
      <CardContent className="mt-7 flex flex-1 flex-col px-[22px]">
        {href ? (
          <Link href={href} className="block">
            {balanceContent}
          </Link>
        ) : (
          <div>{balanceContent}</div>
        )}
        {children ? <div className="mt-auto grid grid-cols-2 gap-3 pt-5">{children}</div> : null}
      </CardContent>
    </Card>
  );
}
