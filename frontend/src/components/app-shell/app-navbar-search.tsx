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

export default function AppNavbarSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const [openSearch, setOpenSearch] = useState(false);

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
            <span>Search...</span>
          </div>
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border border-border/50 bg-muted px-1.5 font-mono text-[9px] font-medium opacity-100">
            <span className="text-2xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Mobile Search Button Trigger (rendered inline elsewhere, but we can expose it or just render it here if absolute/fixed layout or sibling flex wrapper is used. Wait! If we render it here, it will be placed in the flex container. But wait, in the flex container, the desktop search is flex-1 and mobile search is md:hidden. This is perfect, they are rendered sequentially but styled with md:flex / md:hidden respectively!) */}
      <button
        type="button"
        onClick={() => setOpenSearch(true)}
        className="md:hidden flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
      >
        <SearchIcon className="size-[18px]" />
        <span className="sr-only">Search</span>
      </button>

      {/* Command Search Dialog */}
      <CommandDialog open={openSearch} onOpenChange={setOpenSearch}>
        <CommandInput placeholder="Search pages and actions..." />
        <CommandList className="py-2 animate-in fade-in-50 duration-200">
          <CommandEmpty>No results found.</CommandEmpty>

          {isFamilyView && (
            <CommandGroup heading="Family Scope">
              <CommandItem onSelect={() => handleNavigate(familyHref)}>
                <HomeIcon className="mr-2 size-4" />
                <span>Family Dashboard</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleNavigate(`${familyHref}/money`)}
              >
                <CreditCardIcon className="mr-2 size-4" />
                <span>Family Money Overview</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleNavigate(`${familyHref}/money/expenses`)}
              >
                <TrendingUpIcon className="mr-2 size-4" />
                <span>Family Expenses</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleNavigate(`${familyHref}/projects`)}
              >
                <FolderKanbanIcon className="mr-2 size-4" />
                <span>Family Projects</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleNavigate(`${familyHref}/reports`)}
              >
                <ReceiptTextIcon className="mr-2 size-4" />
                <span>Family Reports</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleNavigate(`${familyHref}/settings`)}
              >
                <SettingsIcon className="mr-2 size-4" />
                <span>Family Settings</span>
              </CommandItem>
            </CommandGroup>
          )}

          <CommandGroup heading="Personal Scope">
            <CommandItem onSelect={() => handleNavigate("/me")}>
              <HomeIcon className="mr-2 size-4" />
              <span>Personal Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/me/money")}>
              <CreditCardIcon className="mr-2 size-4" />
              <span>My Money</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/me/documents")}>
              <FileTextIcon className="mr-2 size-4" />
              <span>My Documents</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/me/settings")}>
              <SettingsIcon className="mr-2 size-4" />
              <span>Account Settings</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/me/security")}>
              <ShieldCheckIcon className="mr-2 size-4" />
              <span>Security Settings</span>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Quick Navigations">
            <CommandItem onSelect={() => handleNavigate("/family")}>
              <UsersIcon className="mr-2 size-4" />
              <span>Browse Families</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/family/new")}>
              <UsersIcon className="mr-2 size-4" />
              <span>Create a New Family</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
