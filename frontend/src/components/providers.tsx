"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode, useState } from "react";
import { AppUpdateManager } from "@/components/app-update-manager";
import { OfflineSync } from "@/components/offline-sync";
import { PwaRegistration } from "@/components/pwa-registration";
import { SessionRefresh } from "@/components/session-refresh";
import { ThemeShortcut } from "@/components/theme-shortcut";
import { TooltipProvider } from "@/components/ui/tooltip";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ThemeShortcut />
        <PwaRegistration />
        <OfflineSync />
        <AppUpdateManager />
        <TooltipProvider>
          <SessionRefresh />
          {children}
        </TooltipProvider>
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
