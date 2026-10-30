import { UsersIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PersonalMoneyEmptyWorkspace() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-border bg-card p-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <UsersIcon className="size-5 flex-none text-foreground" />
        <span>
          Your personal money workspace could not be loaded transactions.
        </span>
      </div>
      <Button asChild size="sm">
        <Link href="/family">Open family workspaces</Link>
      </Button>
    </div>
  );
}
