"use client";

import { RefreshCwIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { createTranslator } from "@/i18n/translate";
import { cn } from "@/lib/utils";
import {
  calculatePullDistance,
  PULL_TO_REFRESH_THRESHOLD,
} from "./pull-to-refresh-utils";

const t = createTranslator("AppShell.pullToRefresh");

type TouchOrigin = {
  x: number;
  y: number;
};

function isPageAtTop() {
  return window.scrollY <= 0 && document.documentElement.scrollTop <= 0;
}

function shouldIgnoreTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest("input, textarea, select, [role='dialog']"))
  );
}

export function PullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const originRef = useRef<TouchOrigin | null>(null);
  const pullDistanceRef = useRef(0);
  const refreshingRef = useRef(false);

  useEffect(() => {
    let reloadTimer: number | undefined;

    const resetPull = () => {
      originRef.current = null;
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (
        refreshingRef.current ||
        event.touches.length !== 1 ||
        !isPageAtTop() ||
        shouldIgnoreTarget(event.target)
      ) {
        return;
      }

      const touch = event.touches[0];
      if (!touch) return;

      originRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchMove = (event: TouchEvent) => {
      const origin = originRef.current;
      const touch = event.touches[0];

      if (!origin || !touch) return;
      if (!isPageAtTop()) {
        resetPull();
        return;
      }

      const distance = calculatePullDistance({
        startX: origin.x,
        startY: origin.y,
        currentX: touch.clientX,
        currentY: touch.clientY,
      });

      if (distance <= 0) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }

      event.preventDefault();
      pullDistanceRef.current = distance;
      setPullDistance(distance);
    };

    const finishPull = () => {
      if (!originRef.current) return;

      originRef.current = null;

      if (pullDistanceRef.current < PULL_TO_REFRESH_THRESHOLD) {
        resetPull();
        return;
      }

      refreshingRef.current = true;
      setRefreshing(true);
      setPullDistance(PULL_TO_REFRESH_THRESHOLD);
      reloadTimer = window.setTimeout(() => window.location.reload(), 150);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", finishPull, { passive: true });
    window.addEventListener("touchcancel", resetPull, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", finishPull);
      window.removeEventListener("touchcancel", resetPull);
      if (reloadTimer !== undefined) window.clearTimeout(reloadTimer);
    };
  }, []);

  const ready = pullDistance >= PULL_TO_REFRESH_THRESHOLD;
  const visible = refreshing || pullDistance > 0;
  const label = refreshing
    ? t((m) => m.AppShell.pullToRefresh.refreshing)
    : ready
      ? t((m) => m.AppShell.pullToRefresh.release)
      : t((m) => m.AppShell.pullToRefresh.pull);

  return (
    <div
      aria-hidden={!visible}
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed left-1/2 z-50 flex items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-2 text-xs font-medium text-foreground shadow-lg backdrop-blur transition-opacity duration-150",
        visible ? "opacity-100" : "opacity-0",
      )}
      style={{
        top: "calc(env(safe-area-inset-top, 0px) + 0.5rem)",
        transform: `translate(-50%, ${refreshing ? 0 : Math.min(0, pullDistance - 48)}px)`,
      }}
    >
      {refreshing ? (
        <Spinner aria-hidden="true" className="size-4" />
      ) : (
        <RefreshCwIcon
          aria-hidden="true"
          className="size-4 transition-transform"
          style={{ transform: `rotate(${Math.min(360, pullDistance * 4)}deg)` }}
        />
      )}
      <span>{label}</span>
    </div>
  );
}
