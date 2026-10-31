"use client";

import {
  CheckIcon,
  ChevronsUpDownIcon,
  PlusIcon,
  RefreshCwIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { createTranslator } from "@/i18n/translate";
import type { FamilyAuthority } from "@/lib/family-access";
import apiRequest from "@/service/api";

type NavbarFamily = {
  authority: FamilyAuthority;
  id: string;
  name: string;
  slug: string;
};

type FamiliesState =
  | { status: "loading"; families: NavbarFamily[] }
  | { status: "success"; families: NavbarFamily[] }
  | { status: "error"; families: NavbarFamily[] };

function getCurrentFamilySlug(pathname: string) {
  const encodedSlug = pathname.match(/^\/family\/([^/]+)/)?.[1];

  if (!encodedSlug) {
    return null;
  }

  try {
    return decodeURIComponent(encodedSlug);
  } catch {
    return encodedSlug;
  }
}

const AppNavbarFamilies = () => {
  const pathname = usePathname();
  const currentFamilySlug = getCurrentFamilySlug(pathname);
  const requestIdRef = useRef(0);
  const [state, setState] = useState<FamiliesState>({
    status: "loading",
    families: [],
  });

  const loadFamilies = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((current) => ({
      status: "loading",
      families: current.families,
    }));

    const response = await apiRequest<undefined, NavbarFamily[]>(
      "get",
      "/families",
    );

    if (requestId !== requestIdRef.current) {
      return;
    }

    if (response.ok) {
      setState({ status: "success", families: response.data ?? [] });
      return;
    }

    setState((current) => ({
      status: "error",
      families: current.families,
    }));
  }, []);

  useEffect(() => {
    void loadFamilies();

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadFamilies]);

  const t = createTranslator("AppShell.navbar");
  const currentFamily = state.families.find(
    (family) => family.slug === currentFamilySlug,
  );
  const triggerLabel =
    currentFamily?.name ?? t((m) => m.AppShell.navbar.families);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={
            currentFamily
              ? t((m) => m.AppShell.navbar.switchFamilyWithCurrent, {
                  name: currentFamily.name,
                })
              : t((m) => m.AppShell.navbar.switchFamily)
          }
        >
          <UsersIcon data-icon="inline-start" aria-hidden="true" />
          <span className="hidden max-w-32 truncate lg:inline">
            {triggerLabel}
          </span>
          <ChevronsUpDownIcon
            data-icon="inline-end"
            className="hidden lg:block"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>
          {t((m) => m.AppShell.navbar.switchFamily)}
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {state.status === "loading" && state.families.length === 0 ? (
            <DropdownMenuItem disabled>
              <Spinner aria-hidden="true" />
              {t((m) => m.AppShell.navbar.loadingFamilies)}
            </DropdownMenuItem>
          ) : null}

          {state.families.map((family) => {
            const isCurrent = family.slug === currentFamilySlug;

            return (
              <DropdownMenuItem key={family.id} asChild>
                <Link
                  href={`/family/${encodeURIComponent(family.slug)}`}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  <UsersIcon aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{family.name}</span>
                  {isCurrent ? <CheckIcon aria-hidden="true" /> : null}
                </Link>
              </DropdownMenuItem>
            );
          })}

          {state.status === "success" && state.families.length === 0 ? (
            <DropdownMenuItem disabled>
              {t((m) => m.AppShell.navbar.noFamiliesYet)}
            </DropdownMenuItem>
          ) : null}

          {state.status === "error" ? (
            <DropdownMenuItem onSelect={() => void loadFamilies()}>
              <RefreshCwIcon aria-hidden="true" />
              {t((m) => m.AppShell.navbar.tryLoadingAgain)}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/me">
              <UserIcon aria-hidden="true" />
              {t((m) => m.AppShell.navbar.personalWorkspaces)}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/family">
              <UsersIcon aria-hidden="true" />
              {t((m) => m.AppShell.navbar.viewAllFamilies)}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/family/new">
              <PlusIcon aria-hidden="true" />
              {t((m) => m.AppShell.navbar.createFamily)}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AppNavbarFamilies;
