"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type DataViewMode = "table" | "items";

function isDataViewMode(value: string | null): value is DataViewMode {
  return value === "table" || value === "items";
}

export function usePersistentViewMode(
  storageKey: string,
  defaultViewMode: DataViewMode = "table",
) {
  const [viewMode, setViewModeState] = useState<DataViewMode>(defaultViewMode);
  const eventName = useMemo(
    () => `rwanda-family-view-mode-change:${storageKey}`,
    [storageKey],
  );

  useEffect(() => {
    const syncViewMode = () => {
      const stored = window.localStorage.getItem(storageKey);

      setViewModeState(isDataViewMode(stored) ? stored : defaultViewMode);
    };

    syncViewMode();
    window.addEventListener("storage", syncViewMode);
    window.addEventListener(eventName, syncViewMode);

    return () => {
      window.removeEventListener("storage", syncViewMode);
      window.removeEventListener(eventName, syncViewMode);
    };
  }, [defaultViewMode, eventName, storageKey]);

  const setViewMode = useCallback(
    (nextViewMode: DataViewMode) => {
      setViewModeState(nextViewMode);
      window.localStorage.setItem(storageKey, nextViewMode);
      window.dispatchEvent(new Event(eventName));
    },
    [eventName, storageKey],
  );

  return [viewMode, setViewMode] as const;
}
