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
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const unread = params?.unread;

  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", String(limit));
  if (typeof unread === "boolean") {
    searchParams.set("unread", String(unread));
  }

  return useQuery({
    queryKey: notificationKeys.list({ page, limit, unread }),
    queryFn: async () => {
      const res = await apiRequest<undefined, NotificationListResponse>(
        "get",
        `/notifications?${searchParams.toString()}`,
      );
      if (!res.ok || !res.data) {
        throw new Error(res.message ?? "Failed to load notifications");
      }
      return res.data;
    },
  });
}

export function useNotificationSummary() {
  return useQuery({
    queryKey: notificationKeys.summary(),
    queryFn: async () => {
      const res = await apiRequest<undefined, NotificationSummaryResponse>(
        "get",
        "/notifications/summary",
      );
      if (!res.ok || !res.data) {
        throw new Error(res.message ?? "Failed to load notification summary");
      }
      return res.data;
    },
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest<undefined, NotificationItem>(
        "patch",
        `/notifications/${id}/read`,
      );
      if (!res.ok || !res.data) {
        throw new Error(res.message ?? "Failed to mark notification as read");
      }
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest<undefined, { count: number }>(
        "patch",
        "/notifications/read-all",
      );
      if (!res.ok) {
        throw new Error(res.message ?? "Failed to mark all as read");
      }
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useInvitations(status = "PENDING") {
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
