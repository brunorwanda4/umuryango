"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiRequest from "@/service/api";

export type NotificationItem = {
  id: string;
  userId: string;
  familyId?: string | null;
  type:
    | "FAMILY_INVITE"
    | "TRANSACTION_APPROVED"
    | "TRANSACTION_REJECTED"
    | "CONTRIBUTION_VERIFIED"
    | "CONTRIBUTION_REVERSED"
    | "SYSTEM";
  title: string;
  description: string;
  href?: string | null;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
  family?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type NotificationListResponse = {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  unreadCount: number;
};

export type NotificationSummaryResponse = {
  unreadCount: number;
  pendingInvitationCount: number;
  recent: NotificationItem[];
};

export type FamilyInviteItem = {
  id: string;
  familyId: string;
  invitedById?: string | null;
  email: string;
  authority: string;
  kinshipLabel?: string | null;
  kinshipCustom?: string | null;
  capabilities: string[];
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  family: {
    id: string;
    name: string;
    slug: string;
    country: string;
    defaultCurrency: string;
    type: string;
  };
  invitedBy?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
};

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (filters: { page?: number; limit?: number; unread?: boolean }) =>
    [...notificationKeys.lists(), filters] as const,
  summary: () => [...notificationKeys.all, "summary"] as const,
  family: (familySlug: string) =>
    [...notificationKeys.all, "family", familySlug] as const,
  familyLists: (familySlug: string) =>
    [...notificationKeys.family(familySlug), "list"] as const,
  familyList: (
    familySlug: string,
    filters: { page?: number; limit?: number; unread?: boolean },
  ) => [...notificationKeys.familyLists(familySlug), filters] as const,
  familySummary: (familySlug: string) =>
    [...notificationKeys.family(familySlug), "summary"] as const,
};

export const invitationKeys = {
  all: ["invitations"] as const,
  lists: () => [...invitationKeys.all, "list"] as const,
  list: (status?: string) => [...invitationKeys.lists(), { status }] as const,
};

export function useNotifications(params?: {
  page?: number;
  limit?: number;
  unread?: boolean;
  familySlug?: string;
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const unread = params?.unread;
  const familySlug = params?.familySlug;

  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", String(limit));
  if (typeof unread === "boolean") {
    searchParams.set("unread", String(unread));
  }

  const endpoint = familySlug
    ? `/families/${encodeURIComponent(familySlug)}/notifications?${searchParams.toString()}`
    : `/notifications?${searchParams.toString()}`;

  const queryKey = familySlug
    ? notificationKeys.familyList(familySlug, { page, limit, unread })
    : notificationKeys.list({ page, limit, unread });

  return useQuery({
    queryKey,
    queryFn: async () => {
      const res = await apiRequest<undefined, NotificationListResponse>(
        "get",
        endpoint,
      );
      if (!res.ok || !res.data) {
        throw new Error(res.message ?? "Failed to load notifications");
      }
      return res.data;
    },
  });
}

export function useFamilyNotifications(
  familySlug: string,
  params?: {
    page?: number;
    limit?: number;
    unread?: boolean;
  },
) {
  return useNotifications({ ...params, familySlug });
}

export function useNotificationSummary(familySlug?: string) {
  const queryKey = familySlug
    ? notificationKeys.familySummary(familySlug)
    : notificationKeys.summary();

  const endpoint = familySlug
    ? `/families/${encodeURIComponent(familySlug)}/notifications/summary`
    : "/notifications/summary";

  return useQuery({
    queryKey,
    queryFn: async () => {
      const res = await apiRequest<undefined, NotificationSummaryResponse>(
        "get",
        endpoint,
      );
      if (!res.ok || !res.data) {
        throw new Error(res.message ?? "Failed to load notification summary");
      }
      return res.data;
    },
    refetchInterval: 30000,
    enabled: familySlug !== undefined ? !!familySlug : true,
  });
}

export function useFamilyNotificationSummary(familySlug: string) {
  return useNotificationSummary(familySlug);
}

export function useMarkNotificationRead(familySlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const endpoint = familySlug
        ? `/families/${encodeURIComponent(familySlug)}/notifications/${id}/read`
        : `/notifications/${id}/read`;

      const res = await apiRequest<undefined, NotificationItem>(
        "patch",
        endpoint,
      );
      if (!res.ok || !res.data) {
        throw new Error(res.message ?? "Failed to mark notification as read");
      }
      return res.data;
    },
    onSuccess: () => {
      if (familySlug) {
        void queryClient.invalidateQueries({
          queryKey: notificationKeys.family(familySlug),
        });
        void queryClient.invalidateQueries({
          queryKey: notificationKeys.summary(),
        });
        void queryClient.invalidateQueries({
          queryKey: notificationKeys.lists(),
        });
      } else {
        void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      }
    },
  });
}

export function useFamilyMarkNotificationRead(familySlug: string) {
  return useMarkNotificationRead(familySlug);
}

export function useMarkAllNotificationsRead(familySlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const endpoint = familySlug
        ? `/families/${encodeURIComponent(familySlug)}/notifications/read-all`
        : "/notifications/read-all";

      const res = await apiRequest<undefined, { count: number }>(
        "patch",
        endpoint,
      );
      if (!res.ok) {
        throw new Error(res.message ?? "Failed to mark all as read");
      }
      return res.data;
    },
    onSuccess: () => {
      if (familySlug) {
        void queryClient.invalidateQueries({
          queryKey: notificationKeys.family(familySlug),
        });
        void queryClient.invalidateQueries({
          queryKey: notificationKeys.summary(),
        });
        void queryClient.invalidateQueries({
          queryKey: notificationKeys.lists(),
        });
      } else {
        void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      }
    },
  });
}

export function useFamilyMarkAllNotificationsRead(familySlug: string) {
  return useMarkAllNotificationsRead(familySlug);
}

export function useInvitations(
  status = "PENDING",
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: invitationKeys.list(status),
    queryFn: async () => {
      const res = await apiRequest<undefined, FamilyInviteItem[]>(
        "get",
        `/invitations?status=${status}`,
      );
      if (!res.ok || !res.data) {
        throw new Error(res.message ?? "Failed to load invitations");
      }
      return res.data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest<undefined, { id: string }>(
        "post",
        `/invitations/${id}/accept`,
      );
      if (!res.ok) {
        throw new Error(res.message ?? "Failed to accept invitation");
      }
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invitationKeys.all });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest<undefined, { id: string }>(
        "post",
        `/invitations/${id}/decline`,
      );
      if (!res.ok) {
        throw new Error(res.message ?? "Failed to decline invitation");
      }
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invitationKeys.all });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
