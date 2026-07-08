"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";
import { PwaRegistration } from "@/components/pwa-registration";
import { SessionRefresh } from "@/components/session-refresh";
import { ThemeShortcut } from "@/components/theme-shortcut";
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
      <ThemeShortcut />
      <PwaRegistration />
      <TooltipProvider>
        <SessionRefresh />
        {children}
      </TooltipProvider>
    </NextThemesProvider>
  );
}
