"use client";

import {
  CreditCardIcon,
  FileTextIcon,
  FolderKanbanIcon,
  HomeIcon,
  ReceiptTextIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { createTranslator } from "@/i18n/translate";

export default function AppNavbarSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const [openSearch, setOpenSearch] = useState(false);
  const tSearch = createTranslator("AppShell.search");
  const tNav = createTranslator("AppShell.navbar");

  // Parse family slug if present in the pathname
  const familySlugMatch = pathname.match(/^\/family\/([^/]+)/);
  const familySlug = familySlugMatch ? familySlugMatch[1] : null;
  const isFamilyView = !!familySlug;
  const familyHref = isFamilyView ? `/family/${familySlug}` : "";

  // Listen for Cmd+K / Ctrl+K shortcut to open search dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenSearch((open) => !open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNavigate = (href: string) => {
    setOpenSearch(false);
    router.push(href);
  };

  return (
    <>
      {/* Desktop Search Trigger Button (Centered) */}
      <div className="hidden md:flex flex-1 justify-center max-w-xs md:max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setOpenSearch(true)}
          className="flex w-full max-w-[240px] lg:max-w-[320px] items-center justify-between gap-2 rounded-2xl border border-border/30 bg-muted/40 hover:bg-muted/70 px-3 py-1.5 text-xs text-muted-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center gap-2">
            <SearchIcon className="size-3.5 shrink-0 opacity-70" />
            <span>{tNav((m) => m.AppShell.navbar.searchPlaceholder)}</span>
          </div>
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border border-border/50 bg-muted px-1.5 font-mono text-[9px] font-medium opacity-100">
            <span className="text-2xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Mobile Search Button Trigger */}
      <button
        type="button"
        onClick={() => setOpenSearch(true)}
        className="md:hidden flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
      >
        <SearchIcon className="size-[18px]" />
        <span className="sr-only">
          {tNav((m) => m.AppShell.navbar.searchAction)}
        </span>
      </button>

      {/* Command Search Dialog */}
      <CommandDialog open={openSearch} onOpenChange={setOpenSearch}>
        <CommandInput
          placeholder={tSearch((m) => m.AppShell.search.placeholder)}
        />
        <CommandList className="py-2 animate-in fade-in-50 duration-200">
          <CommandEmpty>
            {tSearch((m) => m.AppShell.search.noResults)}
          </CommandEmpty>

          {isFamilyView && (
            <CommandGroup
              heading={tSearch((m) => m.AppShell.search.familyScope)}
            >
              <CommandItem onSelect={() => handleNavigate(familyHref)}>
                <HomeIcon className="mr-2 size-4" />
                <span>{tSearch((m) => m.AppShell.search.familyDashboard)}</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleNavigate(`${familyHref}/money`)}
              >
                <CreditCardIcon className="mr-2 size-4" />
                <span>
                  {tSearch((m) => m.AppShell.search.familyMoneyOverview)}
                </span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleNavigate(`${familyHref}/money/expenses`)}
              >
                <TrendingUpIcon className="mr-2 size-4" />
                <span>{tSearch((m) => m.AppShell.search.familyExpenses)}</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleNavigate(`${familyHref}/projects`)}
              >
                <FolderKanbanIcon className="mr-2 size-4" />
                <span>{tSearch((m) => m.AppShell.search.familyProjects)}</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleNavigate(`${familyHref}/reports`)}
              >
                <ReceiptTextIcon className="mr-2 size-4" />
                <span>{tSearch((m) => m.AppShell.search.familyReports)}</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleNavigate(`${familyHref}/settings`)}
              >
                <SettingsIcon className="mr-2 size-4" />
                <span>{tSearch((m) => m.AppShell.search.familySettings)}</span>
              </CommandItem>
            </CommandGroup>
          )}

          <CommandGroup
            heading={tSearch((m) => m.AppShell.search.personalScope)}
          >
            <CommandItem onSelect={() => handleNavigate("/me")}>
              <HomeIcon className="mr-2 size-4" />
              <span>{tSearch((m) => m.AppShell.search.personalDashboard)}</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/me/money")}>
              <CreditCardIcon className="mr-2 size-4" />
              <span>{tSearch((m) => m.AppShell.search.myMoney)}</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/me/documents")}>
              <FileTextIcon className="mr-2 size-4" />
              <span>{tSearch((m) => m.AppShell.search.myDocuments)}</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/me/settings")}>
              <SettingsIcon className="mr-2 size-4" />
              <span>{tSearch((m) => m.AppShell.search.accountSettings)}</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/me/security")}>
              <ShieldCheckIcon className="mr-2 size-4" />
              <span>{tSearch((m) => m.AppShell.search.securitySettings)}</span>
            </CommandItem>
          </CommandGroup>

          <CommandGroup
            heading={tSearch((m) => m.AppShell.search.quickNavigations)}
          >
            <CommandItem onSelect={() => handleNavigate("/family")}>
              <UsersIcon className="mr-2 size-4" />
              <span>{tSearch((m) => m.AppShell.search.browseFamilies)}</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/family/new")}>
              <UsersIcon className="mr-2 size-4" />
              <span>{tSearch((m) => m.AppShell.search.createNewFamily)}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
