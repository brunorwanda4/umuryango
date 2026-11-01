"use client";

import { ArrowLeftIcon, ChevronLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  href?: string;
  label?: string;
  className?: string;
};

export function BackButton({ href, label = "Go back", className }: BackButtonProps) {
  const router = useRouter();
  const navigationProps = href
    ? { href }
    : { type: "button" as const, onClick: () => router.back() };

  return (
    <Button
      {...navigationProps}
      variant="ghost"
      size="icon"
      aria-label={label}
      className={cn("rounded-full text-muted-foreground", className)}
    >
      <ArrowLeftIcon aria-hidden="true" className="size-5" />
    </Button>
  );
}
