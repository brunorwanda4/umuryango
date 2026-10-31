"use client";

import {
  AlertCircleIcon,
  AlertTriangleIcon,
  BellIcon,
  CheckCheckIcon,
  CheckCircle2Icon,
  ClockIcon,
  CreditCardIcon,
  InboxIcon,
  Loader2Icon,
  UserCheckIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/common/pages/page-title";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type FamilyInviteItem,
  type NotificationItem,
  useAcceptInvitation,
  useDeclineInvitation,
  useInvitations,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
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
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "";
  }
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

function getNotificationIcon(type: NotificationItem["type"]) {
  switch (type) {
    case "FAMILY_INVITE":
      return <UsersIcon className="size-5 text-foreground" />;
    case "TRANSACTION_APPROVED":
      return <CheckCircle2Icon className="size-5 text-foreground" />;
    case "TRANSACTION_REJECTED":
      return <AlertTriangleIcon className="size-5 text-foreground" />;
    case "CONTRIBUTION_VERIFIED":
    case "CONTRIBUTION_REVERSED":
      return <CreditCardIcon className="size-5 text-foreground" />;
    default:
      return <BellIcon className="size-5 text-foreground" />;
  }
}

export function NotificationsPageView() {
  const router = useRouter();
  const t = createTranslator("NotificationsPage");

  const [page, setPage] = useState(1);
  const [accumulatedItems, setAccumulatedItems] = useState<NotificationItem[]>(
    [],
  );

  const { data: summary } = useNotificationSummary();
  const {
    data: notifData,
    isLoading: isNotifLoading,
    isError: isNotifError,
    error: notifError,
    refetch: refetchNotifs,
    isFetching: isNotifFetching,
  } = useNotifications({ page, limit: 20 });

  const {
    data: invitations,
    isLoading: isInvitesLoading,
    isError: isInvitesError,
    error: invitesError,
    refetch: refetchInvites,
  } = useInvitations("PENDING");

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const acceptMutation = useAcceptInvitation();
  const declineMutation = useDeclineInvitation();

  const unreadCount = summary?.unreadCount ?? notifData?.unreadCount ?? 0;
  const pendingInviteCount =
    summary?.pendingInvitationCount ?? invitations?.length ?? 0;

  useEffect(() => {
    if (notifData?.items) {
      if (page === 1) {
        setAccumulatedItems(notifData.items);
      } else {
        setAccumulatedItems((prev) => {
          const ids = new Set(prev.map((i) => i.id));
          const newItems = notifData.items.filter((i) => !ids.has(i.id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [notifData, page]);

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(t((m) => m.NotificationsPage.allMarkedRead));
        setAccumulatedItems((prev) =>
          prev.map((item) => ({ ...item, readAt: new Date().toISOString() })),
        );
      },
      onError: (err) => {
        toast.error(
          err.message || t((m) => m.NotificationsPage.markAllReadFailed),
        );
      },
    });
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.readAt) {
      markReadMutation.mutate(item.id, {
        onSuccess: () => {
          setAccumulatedItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, readAt: new Date().toISOString() } : i,
            ),
          );
        },
      });
    }

    if (item.href) {
      router.push(item.href);
    }
  };

  const handleAcceptInvite = (invite: FamilyInviteItem) => {
    acceptMutation.mutate(invite.id, {
      onSuccess: () => {
        toast.success(
          t((m) => m.NotificationsPage.invitationsTab.acceptSuccess),
        );
        if (invite.family?.slug) {
          router.push(`/family/${invite.family.slug}`);
        }
      },
      onError: (err) => {
        toast.error(
          err.message ||
            t((m) => m.NotificationsPage.invitationsTab.acceptError),
        );
      },
    });
  };

  const handleDeclineInvite = (invite: FamilyInviteItem) => {
    declineMutation.mutate(invite.id, {
      onSuccess: () => {
        toast.success(
          t((m) => m.NotificationsPage.invitationsTab.declineSuccess),
        );
      },
      onError: (err) => {
        toast.error(
          err.message ||
            t((m) => m.NotificationsPage.invitationsTab.declineError),
        );
      },
    });
  };

  const hasMore = notifData?.hasMore ?? false;

  return (
    <div className="flex w-full max-w-5xl flex-col gap-6">
      <PageTitle
        title={t((m) => m.NotificationsPage.title)}
        description={t((m) => m.NotificationsPage.description)}
        icon={<BellIcon className="size-6 text-foreground" />}
        actions={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
              className="gap-1.5 rounded-xl cursor-pointer"
            >
              {markAllReadMutation.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <CheckCheckIcon className="size-4" />
              )}
              {t((m) => m.NotificationsPage.markAllRead)}
            </Button>
          ) : undefined
        }
      />

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm mb-6">
          <TabsTrigger
            value="all"
            className="flex items-center justify-center gap-2"
          >
            <span>{t((m) => m.NotificationsPage.tabs.all)}</span>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="px-1.5 py-0 h-4 text-[10px] font-semibold"
              >
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="invitations"
            className="flex items-center justify-center gap-2"
          >
            <span>{t((m) => m.NotificationsPage.tabs.invitations)}</span>
            {pendingInviteCount > 0 && (
              <Badge
                variant="secondary"
                className="px-1.5 py-0 h-4 text-[10px] font-semibold"
              >
                {pendingInviteCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 outline-none">
          {isNotifLoading && page === 1 ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : isNotifError ? (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertTitle>
                {t((m) => m.NotificationsPage.allTab.loadErrorTitle)}
              </AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {notifError?.message ||
                    t((m) => m.NotificationsPage.allTab.loadErrorDescription)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchNotifs()}
                  className="ml-4"
                >
                  {t((m) => m.NotificationsPage.allTab.retry)}
                </Button>
              </AlertDescription>
            </Alert>
          ) : accumulatedItems.length === 0 ? (
            <Empty className="py-16 border rounded-3xl">
              <EmptyMedia variant="icon">
                <InboxIcon className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>
                  {t((m) => m.NotificationsPage.allTab.emptyTitle)}
                </EmptyTitle>
                <EmptyDescription>
                  {t((m) => m.NotificationsPage.allTab.emptyDescription)}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-2.5">
              {accumulatedItems.map((item) => {
                const isUnread = !item.readAt;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNotificationClick(item)}
                    className={cn(
                      "w-full flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-left",
                      isUnread
                        ? "bg-card border-border/80 shadow-xs"
                        : "bg-muted/20 border-border/40 opacity-85 hover:opacity-100",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                        isUnread
                          ? "bg-background border-border shadow-xs"
                          : "bg-muted/40 border-border/40 text-muted-foreground",
                      )}
                    >
                      {getNotificationIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <p
                            className={cn(
                              "text-sm truncate",
                              isUnread
                                ? "font-semibold text-foreground"
                                : "font-normal text-muted-foreground",
                            )}
                          >
                            {item.title}
                          </p>
                          {item.family && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground"
                            >
                              {item.family.name}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground/80 shrink-0">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center shrink-0 self-center pl-2">
                      <span className="sr-only">
                        {isUnread
                          ? t((m) => m.NotificationsPage.allTab.unread)
                          : t((m) => m.NotificationsPage.allTab.read)}
                      </span>
                      {isUnread && (
                        <div
                          aria-hidden="true"
                          className="size-2 rounded-full bg-primary"
                        />
                      )}
                    </div>
                  </button>
                );
              })}

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isNotifFetching}
                    className="rounded-xl px-6"
                  >
                    {isNotifFetching ? (
                      <>
                        <Loader2Icon className="size-4 animate-spin mr-2" />
                        {t((m) => m.NotificationsPage.allTab.loadingMore)}
                      </>
                    ) : (
                      t((m) => m.NotificationsPage.allTab.loadMore)
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4 outline-none">
          {isInvitesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          ) : isInvitesError ? (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertTitle>
                {t((m) => m.NotificationsPage.invitationsTab.loadErrorTitle)}
              </AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {invitesError?.message ||
                    t(
                      (m) =>
                        m.NotificationsPage.invitationsTab.loadErrorDescription,
                    )}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchInvites()}
                  className="ml-4"
                >
                  {t((m) => m.NotificationsPage.invitationsTab.retry)}
                </Button>
              </AlertDescription>
            </Alert>
          ) : !invitations || invitations.length === 0 ? (
            <Empty className="py-16 border rounded-3xl">
              <EmptyMedia variant="icon">
                <UsersIcon className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>
                  {t((m) => m.NotificationsPage.invitationsTab.emptyTitle)}
                </EmptyTitle>
                <EmptyDescription>
                  {t(
                    (m) => m.NotificationsPage.invitationsTab.emptyDescription,
                  )}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {invitations.map((invite) => {
                const isPendingMutation =
                  (acceptMutation.isPending &&
                    acceptMutation.variables === invite.id) ||
                  (declineMutation.isPending &&
                    declineMutation.variables === invite.id);

                const isExpired =
                  invite.status === "EXPIRED" ||
                  new Date(invite.expiresAt) < new Date();

                return (
                  <Card
                    key={invite.id}
                    className="flex flex-col justify-between rounded-2xl border bg-card"
                  >
                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base font-semibold">
                            {invite.family.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {invite.invitedBy?.fullName
                              ? t(
                                  (m) =>
                                    m.NotificationsPage.invitationsTab
                                      .invitedBy,
                                  { name: invite.invitedBy.fullName },
                                )
                              : t(
                                  (m) =>
                                    m.NotificationsPage.invitationsTab
                                      .invitedByUnknown,
                                )}
                          </CardDescription>
                        </div>
                        {isExpired ? (
                          <Badge variant="destructive" className="text-[10px]">
                            {t(
                              (m) => m.NotificationsPage.invitationsTab.expired,
                            )}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {invite.family.type.toLowerCase()}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-1">
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-medium">
                          <UserCheckIcon className="size-3" />
                          {t((m) => m.NotificationsPage.invitationsTab.role, {
                            role: invite.authority,
                          })}
                        </span>
                        {(invite.kinshipCustom || invite.kinshipLabel) && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-medium">
                            {t(
                              (m) => m.NotificationsPage.invitationsTab.kinship,
                              {
                                kinship:
                                  invite.kinshipCustom ||
                                  invite.kinshipLabel ||
                                  "",
                              },
                            )}
                          </span>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-1.5 text-xs text-muted-foreground/90">
                      <div className="flex items-center gap-1 text-[11px]">
                        <ClockIcon className="size-3 shrink-0" />
                        <span>
                          {t((m) => m.NotificationsPage.invitationsTab.sentOn, {
                            date: formatDate(invite.createdAt),
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <ClockIcon className="size-3 shrink-0" />
                        <span>
                          {t(
                            (m) => m.NotificationsPage.invitationsTab.expiresOn,
                            { date: formatDate(invite.expiresAt) },
                          )}
                        </span>
                      </div>
                    </CardContent>

                    <CardFooter className="flex items-center gap-2 pt-2 border-t border-border/40">
                      <Button
                        variant="default"
                        size="sm"
                        disabled={
                          isPendingMutation ||
                          isExpired ||
                          acceptMutation.isPending ||
                          declineMutation.isPending
                        }
                        onClick={() => handleAcceptInvite(invite)}
                        className="flex-1 rounded-xl cursor-pointer"
                      >
                        {acceptMutation.isPending &&
                        acceptMutation.variables === invite.id ? (
                          <>
                            <Loader2Icon className="size-3.5 animate-spin mr-1.5" />
                            {t(
                              (m) =>
                                m.NotificationsPage.invitationsTab.accepting,
                            )}
                          </>
                        ) : (
                          t((m) => m.NotificationsPage.invitationsTab.accept)
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          isPendingMutation ||
                          isExpired ||
                          acceptMutation.isPending ||
                          declineMutation.isPending
                        }
                        onClick={() => handleDeclineInvite(invite)}
                        className="flex-1 rounded-xl cursor-pointer"
                      >
                        {declineMutation.isPending &&
                        declineMutation.variables === invite.id ? (
                          <>
                            <Loader2Icon className="size-3.5 animate-spin mr-1.5" />
                            {t(
                              (m) =>
                                m.NotificationsPage.invitationsTab.declining,
                            )}
                          </>
                        ) : (
                          <>
                            <XIcon className="size-3.5 mr-1" />
                            {t(
                              (m) => m.NotificationsPage.invitationsTab.decline,
                            )}
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
