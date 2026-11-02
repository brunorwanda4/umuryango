"use client";

import { useEffect } from "react";
import { flushOfflineApiOutbox } from "@/service/api";
import { invokeNative, isNativeApp } from "@/service/native-bridge";

type CachedFamily = { slug: string };

async function synchronize() {
  if (!navigator.onLine) return;

  if (isNativeApp()) {
    try {
      const families = await invokeNative<CachedFamily[]>(
        "list_cached_families",
      );
      for (const family of families) {
        await invokeNative("sync_now", { familySlug: family.slug });
      }
    } catch {
      // A missing/expired native session is handled by the existing auth UI.
    }
    return;
  }

  await flushOfflineApiOutbox();
}

export function OfflineSync() {
  useEffect(() => {
    const handleOnline = () => void synchronize();
    window.addEventListener("online", handleOnline);
    void synchronize();

    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return null;
}
