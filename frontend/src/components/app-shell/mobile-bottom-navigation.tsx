"use client";

import { Loader2Icon, MenuIcon } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { createTranslator } from "@/i18n/translate";
import { cn } from "@/lib/utils";
import { SidebarIcon, type SidebarIconSource } from "./sidebar-icon";
import {
  type AppSidebarMode,
  isActivePath,
  type NavigationGroup,
  type NavigationItem,
} from "./sidebar-utils";

function getMobileNavigationItems(
  mode: AppSidebarMode,
  navigation: NavigationGroup[],
) {
  const items = navigation.flatMap((group) => group.items);
  const preferredHrefs =
    mode === "family"
      ? [
          items.find(
            (item) =>
              item.href.endsWith("/family") || !item.href.includes("/", 8),
          )?.href ?? items[0]?.href,
          items.find((item) => item.href.endsWith("/money"))?.href,
          items.find((item) => item.href.endsWith("/projects"))?.href,
          items.find((item) => item.href.endsWith("/reports"))?.href,
        ]
      : ["/me", "/me/money", "/me/plans", "/family"];
  const preferred = preferredHrefs
    .filter((href): href is string => Boolean(href))
    .map((href) => items.find((item) => item.href === href))
    .filter((item): item is NavigationItem => Boolean(item));

  return (preferred.length ? preferred : items).slice(0, 4);
}

function getMobileNavigationLabel(title: string) {
  const tNav = createTranslator("AppShell.navigation.items");
  if (title === tNav("overview") || title === "Overview") return tNav("home");
  if (title === tNav("familyWorkspaces") || title === "Family workspaces")
    return tNav("families");

  return title;
}

function MobileLinkLoadingIndicator({
  icon,
  label,
}: {
  icon: SidebarIconSource;
  label: string;
}) {
  const { pending } = useLinkStatus();

  return (
    <>
      {pending ? (
        <Loader2Icon
          aria-hidden="true"
          className="size-5 shrink-0 animate-spin"
        />
      ) : (
        <SidebarIcon icon={icon} className="size-5" />
      )}
      <span className="w-full truncate text-center font-medium text-[0.65rem] leading-none">
        {label}
      </span>
    </>
  );
}

export function MobileBottomNavigation({
  mode,
  navigation,
  onOpenMore,
  pathname,
  currentHash,
}: {
  mode: AppSidebarMode;
  navigation: NavigationGroup[];
  onOpenMore: () => void;
  pathname: string;
  currentHash: string;
}) {
  const t = createTranslator("AppShell.sidebar");
  const items = getMobileNavigationItems(mode, navigation);
  const hasActiveItem = items.some((item) =>
    isActivePath(pathname, item.href, currentHash, item.exact),
  );

  return (
    <nav
      aria-label={t("primaryMobileNavigation")}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => {
          const isActive = isActivePath(
            pathname,
            item.href,
            currentHash,
            item.exact,
          );
          const label = getMobileNavigationLabel(item.title);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30",
                isActive &&
                  "border-t-2 border-t-primary rounded-t-none text-primary",
              )}
            >
              <MobileLinkLoadingIndicator icon={item.icon} label={label} />
            </Link>
          );
        })}
        <button
          type="button"
          aria-label={t("openAllNavigationLinks")}
          aria-current={!hasActiveItem ? "page" : undefined}
          className={cn(
            "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1  px-1 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30",
            !hasActiveItem &&
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          )}
          onClick={onOpenMore}
        >
          <MenuIcon aria-hidden="true" className="size-5 shrink-0" />
          <span className="w-full truncate text-center font-medium text-[0.65rem] leading-none">
            {t("more")}
          </span>
        </button>
      </div>
    </nav>
  );
}
