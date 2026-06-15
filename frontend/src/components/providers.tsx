"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>{children}</TooltipProvider>
    </NextThemesProvider>
  );
}
