"use client";

import {
  AlertTriangleIcon,
  BellIcon,
  CheckCircle2Icon,
  CheckIcon,
  CreditCardIcon,
  InboxIcon,
  UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type NotificationItem,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationSummary,
} from "@/hooks/use-notifications";
import { createTranslator } from "@/i18n/translate";
import { cn } from "@/lib/utils";

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "just now";
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function getNotificationIcon(type: NotificationItem["type"]) {
  switch (type) {
    case "FAMILY_INVITE":
      return <UsersIcon className="size-4 text-foreground" />;
    case "TRANSACTION_APPROVED":
      return <CheckCircle2Icon className="size-4 text-foreground" />;
    case "TRANSACTION_REJECTED":
      return <AlertTriangleIcon className="size-4 text-foreground" />;
    case "CONTRIBUTION_VERIFIED":
    case "CONTRIBUTION_REVERSED":
      return <CreditCardIcon className="size-4 text-foreground" />;
    default:
      return <BellIcon className="size-4 text-foreground" />;
  }
}

export default function AppNavbarNotifications() {
  const router = useRouter();
  const t = createTranslator("AppShell.navbar");
  const { data: summary, isLoading } = useNotificationSummary();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const unreadCount = summary?.unreadCount ?? 0;
  const recentNotifications = summary?.recent?.slice(0, 5) ?? [];

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllReadMutation.mutate();
  };

  const handleSelectNotification = (notification: NotificationItem) => {
    if (!notification.readAt) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.href) {
      router.push(notification.href);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t((m) => m.AppShell.navbar.notifications)}
          className="relative h-9 w-9 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
        >
          <BellIcon className="size-[18px]" />
          {unreadCount > 0 && (
            <span
              data-slot="notification-badge"
              className="absolute top-1.5 right-1.5 flex size-2 rounded-full bg-primary ring-2 ring-background animate-pulse"
            />
          )}
          <span className="sr-only">
            {t((m) => m.AppShell.navbar.notifications)}
            {unreadCount > 0 ? ` (${unreadCount} unread)` : ""}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-1 md:w-96">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <DropdownMenuLabel className="p-0 font-semibold text-sm">
              {t((m) => m.AppShell.navbar.notifications)}
            </DropdownMenuLabel>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4"
              >
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <CheckIcon className="size-3" />
              {t((m) => m.AppShell.navbar.markAllRead)}
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[320px] overflow-y-auto no-scrollbar py-1">
          {isLoading ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
              <InboxIcon className="size-8 opacity-40 mb-2" />
              <span className="text-xs">
                {t((m) => m.AppShell.navbar.noNotificationsYet)}
              </span>
            </div>
          ) : (
            recentNotifications.map((notification) => {
              const isUnread = !notification.readAt;
              return (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => handleSelectNotification(notification)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors focus:bg-accent/60 cursor-pointer",
                    isUnread && "bg-muted/40 font-medium",
                  )}
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-background border border-border/40 shadow-xs">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-xs truncate",
                          isUnread
                            ? "text-foreground font-semibold"
                            : "text-muted-foreground font-normal",
                        )}
                      >
                        {notification.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground/80 shrink-0">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                      {notification.description}
                    </p>
                    {notification.family && (
                      <span className="inline-block text-[10px] text-muted-foreground/90 font-medium">
                        {notification.family.name}
                      </span>
                    )}
                  </div>
                  {isUnread && (
                    <div className="flex items-center gap-1 mt-1.5 shrink-0">
                      <span className="sr-only">Unread</span>
                      <div className="size-2 rounded-full bg-primary" />
                    </div>
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/me/notifications")}
          className="justify-center text-xs text-muted-foreground font-medium py-2 rounded-xl focus:bg-accent cursor-pointer"
        >
          {t((m) => m.AppShell.navbar.viewAllActivity)}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
