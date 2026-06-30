"use client";

import { DownloadIcon } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function MobileInstallPrompt() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true;

    if (isStandalone || sessionStorage.getItem("install-prompt-dismissed")) {
      return;
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstallPrompt(null);
      setDismissed(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!installPrompt || dismissed) {
    return null;
  }

  async function handleInstall() {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (choice.outcome === "dismissed") {
      sessionStorage.setItem("install-prompt-dismissed", "true");
      setDismissed(true);
    }
  }

  function handleDismiss() {
    sessionStorage.setItem("install-prompt-dismissed", "true");
    setDismissed(true);
  }

  return (
    <div className="fixed inset-x-3 z-40 md:hidden bottom-[calc(4.75rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md items-center gap-2 rounded-md border bg-background/95 p-2 shadow-lg backdrop-blur">
        <button
          type="button"
          className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 font-medium text-primary-foreground text-sm"
          onClick={handleInstall}
        >
          <DownloadIcon aria-hidden="true" className="size-4" />
          Install app
        </button>
        <button
          type="button"
          aria-label="Dismiss install app prompt"
          className="flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
          onClick={handleDismiss}
        >
          Later
        </button>
      </div>
    </div>
  );
}
