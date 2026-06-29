"use client";

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (!window.isSecureContext) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installation remains optional; the app should not fail if SW setup is blocked.
    });
  }, []);

  return null;
}
