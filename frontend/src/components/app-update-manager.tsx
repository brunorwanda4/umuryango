"use client";

import type { Update } from "@tauri-apps/plugin-updater";
import { DownloadIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { createTranslator } from "@/i18n/translate";
import { invokeNative, isNativeApp } from "@/service/native-bridge";

type NativeUpdateContext = {
  platform: "android" | "windows" | string;
  currentVersion: string;
};

type AndroidUpdateMetadata = {
  currentVersion: string;
  version: string;
  notes?: string;
  downloadUrl: string;
  publishedAt?: string;
};

type AvailableUpdate =
  | { platform: "windows"; version: string }
  | { platform: "android"; version: string; downloadUrl: string };

const t = createTranslator("AppShell.updates");

export function AppUpdateManager() {
  const desktopUpdateRef = useRef<Update | null>(null);
  const checkingRef = useRef(false);
  const hasCheckedRef = useRef(false);
  const [availableUpdate, setAvailableUpdate] =
    useState<AvailableUpdate | null>(null);
  const [installing, setInstalling] = useState(false);
  const [actionError, setActionError] = useState(false);

  const checkForUpdate = useCallback(async () => {
    if (
      !isNativeApp() ||
      checkingRef.current ||
      hasCheckedRef.current ||
      availableUpdate ||
      !navigator.onLine
    ) {
      return;
    }

    checkingRef.current = true;
    try {
      const context = await invokeNative<NativeUpdateContext>(
        "get_native_update_context",
      );
      hasCheckedRef.current = true;

      if (context.platform === "windows") {
        const { check } = await import("@tauri-apps/plugin-updater");
        const update = await check({ timeout: 15_000 });
        if (update) {
          desktopUpdateRef.current = update;
          setAvailableUpdate({ platform: "windows", version: update.version });
        }
      } else if (context.platform === "android") {
        const update = await invokeNative<AndroidUpdateMetadata | null>(
          "check_android_update",
        );
        if (update) {
          setAvailableUpdate({
            platform: "android",
            version: update.version,
            downloadUrl: update.downloadUrl,
          });
        }
      }
    } catch {
      // Update checks are intentionally silent so a network problem never
      // interrupts normal app use.
    } finally {
      checkingRef.current = false;
    }
  }, [availableUpdate]);

  useEffect(() => {
    const timer = window.setTimeout(() => void checkForUpdate(), 1_500);
    const handleOnline = () => void checkForUpdate();
    window.addEventListener("online", handleOnline);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
    };
  }, [checkForUpdate]);

  const dismiss = () => {
    if (installing) return;
    void desktopUpdateRef.current?.close().catch(() => undefined);
    desktopUpdateRef.current = null;
    setAvailableUpdate(null);
    setActionError(false);
  };

  const installUpdate = async () => {
    if (!availableUpdate || installing) return;
    setInstalling(true);
    setActionError(false);

    try {
      if (availableUpdate.platform === "windows") {
        await desktopUpdateRef.current?.downloadAndInstall();
      } else {
        const { openUrl } = await import("@tauri-apps/plugin-opener");
        await openUrl(availableUpdate.downloadUrl);
        setAvailableUpdate(null);
        setActionError(false);
      }
    } catch {
      setActionError(true);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Dialog
      open={Boolean(availableUpdate)}
      onOpenChange={(open) => {
        if (!open) dismiss();
      }}
    >
      <DialogContent showCloseButton={!installing}>
        <DialogHeader>
          <DialogTitle>{t((m) => m.AppShell.updates.title)}</DialogTitle>
          <DialogDescription>
            {availableUpdate
              ? t((m) => m.AppShell.updates.description, {
                  version: availableUpdate.version,
                })
              : null}
          </DialogDescription>
        </DialogHeader>

        {actionError ? (
          <p role="alert" className="text-sm text-destructive">
            {t((m) => m.AppShell.updates.installError)}
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" disabled={installing} onClick={dismiss}>
            {t((m) => m.AppShell.updates.later)}
          </Button>
          <Button disabled={installing} onClick={() => void installUpdate()}>
            {installing ? (
              <Spinner data-icon="inline-start" />
            ) : availableUpdate?.platform === "windows" ? (
              <RefreshCwIcon data-icon="inline-start" />
            ) : (
              <DownloadIcon data-icon="inline-start" />
            )}
            {installing
              ? t((m) => m.AppShell.updates.starting)
              : availableUpdate?.platform === "windows"
                ? t((m) => m.AppShell.updates.windowsAction)
                : t((m) => m.AppShell.updates.androidAction)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
