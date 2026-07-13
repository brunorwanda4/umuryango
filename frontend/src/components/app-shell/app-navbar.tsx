"use client";

import {
  BellIcon,
  CheckIcon,
  CreditCardIcon,
  FileTextIcon,
  FolderKanbanIcon,
  HomeIcon,
  InboxIcon,
  ReceiptTextIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type AppNavbarProps = {
  sidebarTitle?: string;
};

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  type: "money" | "member" | "expense";
};

export default function AppNavbar({ sidebarTitle }: AppNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [openSearch, setOpenSearch] = useState(false);

  // Parse family slug if present in the pathname
  const familySlugMatch = pathname.match(/^\/family\/([^/]+)/);
  const familySlug = familySlugMatch ? familySlugMatch[1] : null;
  const isFamilyView = !!familySlug;
  const familyHref = isFamilyView ? `/family/${familySlug}` : "";

  // Mock notification state
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      title: "Contribution Approved",
      description: "Your contribution of RWF 50,000 was approved.",
      time: "5m ago",
      unread: true,
      type: "money",
    },
    {
      id: "2",
      title: "New Member Request",
      description: "Karemera requested to join your family.",
      time: "2h ago",
      unread: true,
      type: "member",
    },
    {
      id: "3",
      title: "Expense Request",
      description: "New expense request for RWF 12,000.",
      time: "1d ago",
      unread: false,
      type: "expense",
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
  };

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

  // Get notification type icon
  const getNotificationIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "money":
        return <CreditCardIcon className="size-4 text-foreground" />;
      case "member":
        return <UsersIcon className="size-4 text-foreground" />;
      case "expense":
        return <TrendingUpIcon className="size-4 text-foreground" />;
      default:
        return <InboxIcon className="size-4 text-foreground" />;
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-md transition-all">
        {/* Left Section: Sidebar Trigger & Workspace/Page Title */}
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-9 w-9 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" />
          <div className="h-4 w-px bg-border/50 hidden md:block" />
          <span className="max-w-[200px] sm:max-w-[300px] truncate bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text font-bold text-sm tracking-tight text-transparent">
            {sidebarTitle || "Personal Workspace"}
          </span>
        </div>

        {/* Right Section: Search & Notification Dropdown */}
        <div className="flex items-center gap-3">
          {/* Search Trigger Button */}
          <button
            type="button"
            onClick={() => setOpenSearch(true)}
            className="flex items-center gap-2 rounded-2xl border border-border/30 bg-muted/40 hover:bg-muted/70 px-3 py-1.5 text-xs text-muted-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <SearchIcon className="size-3.5 shrink-0 opacity-70" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="pointer-events-none hidden sm:inline-flex h-4 select-none items-center gap-0.5 rounded border border-border/50 bg-muted px-1.5 font-mono text-[9px] font-medium opacity-100">
              <span className="text-2xs">⌘</span>K
            </kbd>
          </button>

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
              >
                <BellIcon className="size-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex size-2 rounded-full bg-primary ring-2 ring-background animate-pulse" />
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-1 md:w-96">
              <div className="flex items-center justify-between px-3 py-2">
                <DropdownMenuLabel className="p-0 font-semibold text-sm">
                  Notifications
                </DropdownMenuLabel>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <CheckIcon className="size-3" />
                    Mark all read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto no-scrollbar py-1">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                    <InboxIcon className="size-8 opacity-40 mb-2" />
                    <span className="text-xs">No notifications yet</span>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors focus:bg-accent/60 cursor-pointer",
                        notification.unread && "bg-muted/30",
                      )}
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-background border border-border/40 shadow-xs">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              "text-xs truncate font-medium",
                              notification.unread
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground/80 shrink-0">
                            {notification.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                          {notification.description}
                        </p>
                      </div>
                      {notification.unread && (
                        <div className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    isFamilyView ? `${familyHref}/announcements` : "/me",
                  )
                }
                className="justify-center text-xs text-muted-foreground font-medium py-2 rounded-xl focus:bg-accent"
              >
                View all activity
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

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
