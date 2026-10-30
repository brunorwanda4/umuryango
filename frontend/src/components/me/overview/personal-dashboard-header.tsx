import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PersonalDashboardHeader({ firstName }: { firstName?: string }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-fraunces text-4xl font-semibold tracking-tight sm:text-5xl">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
      </div>
    </header>
  );
}
