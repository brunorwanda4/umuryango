"use client";

import { useLayoutEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { createTranslator } from "@/i18n/translate";
import { cn } from "@/lib/utils";

const RESIZE_STORAGE_KEY = "sidebar-width";
const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 420;
const SIDEBAR_DEFAULT_WIDTH = 256;

export function SidebarResizeHandle({ open }: { open: boolean }) {
  const { toggleSidebar, state } = useSidebar();

  useLayoutEffect(() => {
    const stored = localStorage.getItem(RESIZE_STORAGE_KEY);
    if (!stored) return;
    const wrapper = document.querySelector(
      '[data-slot="sidebar-wrapper"]',
    ) as HTMLElement | null;
    if (wrapper) wrapper.style.setProperty("--sidebar-width", stored);
  }, []);

  function handleMouseDown(e: React.MouseEvent<HTMLButtonElement>) {
    if (state === "collapsed") {
      toggleSidebar();
      return;
    }
    e.preventDefault();

    const wrapper = document.querySelector(
      '[data-slot="sidebar-wrapper"]',
    ) as HTMLElement | null;
    if (!wrapper) return;
    const sidebarWrapper = wrapper;

    const gap = sidebarWrapper.querySelector(
      '[data-slot="sidebar-gap"]',
    ) as HTMLElement | null;
    const startWidth = gap
      ? gap.getBoundingClientRect().width
      : SIDEBAR_DEFAULT_WIDTH;
    const startX = e.clientX;
    let didMove = false;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMove(me: MouseEvent) {
      const delta = me.clientX - startX;
      if (Math.abs(delta) > 3) didMove = true;
      const newW = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(SIDEBAR_MIN_WIDTH, startWidth + delta),
      );
      sidebarWrapper.style.setProperty("--sidebar-width", `${newW}px`);
    }

    function onUp() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (!didMove) {
        toggleSidebar();
      } else {
        const w = sidebarWrapper.style.getPropertyValue("--sidebar-width");
        if (w) localStorage.setItem(RESIZE_STORAGE_KEY, w);
      }
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  const t = createTranslator("AppShell.sidebar");

  return (
    <button
      type="button"
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label={t((m) => m.AppShell.sidebar.resizeSidebar)}
      tabIndex={-1}
      onMouseDown={handleMouseDown}
      title={
        state === "collapsed"
          ? t((m) => m.AppShell.sidebar.expandSidebar)
          : t((m) => m.AppShell.sidebar.resizeSidebar)
      }
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 transition-colors ease-linear sm:flex",
        "group-data-[side=left]:-right-4 group-data-[side=right]:left-0",
        open
          ? "after:absolute after:inset-y-0 after:start-1/2 after:w-[1px] after:bg-sidebar-border"
          : null,
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        state === "collapsed" ? "cursor-e-resize" : "cursor-col-resize",
      )}
    />
  );
}
