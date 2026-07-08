"use client";

import { useEffect } from "react";
import apiRequest from "@/service/api";

const SESSION_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;
const SESSION_REFRESH_STORAGE_KEY = "rf_last_session_refresh_at";
const PROTECTED_PREFIXES = ["/me", "/family"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function shouldRefreshSession() {
  if (!isProtectedPath(window.location.pathname)) {
    return false;
  }

  const lastRefreshAt = Number(
    window.localStorage.getItem(SESSION_REFRESH_STORAGE_KEY) ?? "0",
  );

  return Date.now() - lastRefreshAt >= SESSION_REFRESH_INTERVAL_MS;
}

async function refreshSessionIfNeeded() {
  if (!shouldRefreshSession()) {
    return;
  }

  window.localStorage.setItem(
    SESSION_REFRESH_STORAGE_KEY,
    Date.now().toString(),
  );
  const response = await apiRequest("post", "/auth/refresh");

  if (!response.ok) {
    window.localStorage.removeItem(SESSION_REFRESH_STORAGE_KEY);
  }
}

export function SessionRefresh() {
  useEffect(() => {
    void refreshSessionIfNeeded();

    const intervalId = window.setInterval(() => {
      void refreshSessionIfNeeded();
    }, SESSION_REFRESH_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshSessionIfNeeded();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", refreshSessionIfNeeded);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", refreshSessionIfNeeded);
    };
  }, []);

  return null;
}
