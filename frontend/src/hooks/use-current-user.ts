"use client";

import { useEffect, useState } from "react";
import apiRequest from "@/service/api";

export type CurrentUser = {
  id: string;
  email: string;
  phoneNumber: string | null;
  fullName: string;
  avatarUrl: string | null;
  pendingEmail: string | null;
  gender: string | null;
  emailVerified: boolean;
  createdAt: string;
};

export const CURRENT_USER_UPDATED_EVENT = "rwanda-family:current-user-updated";

export function publishCurrentUserUpdate(user: CurrentUser) {
  window.dispatchEvent(
    new CustomEvent<CurrentUser>(CURRENT_USER_UPDATED_EVENT, {
      detail: user,
    }),
  );
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const handleUserUpdate = (event: Event) => {
      const user = (event as CustomEvent<CurrentUser>).detail;
      if (active && user) {
        setUser(user);
      }
    };

    window.addEventListener(CURRENT_USER_UPDATED_EVENT, handleUserUpdate);

    (async () => {
      const response = await apiRequest<undefined, { user?: CurrentUser }>(
        "get",
        "/auth/me",
      );

      if (active) {
        setUser(response.ok ? (response.data?.user ?? null) : null);
        setIsLoading(false);
      }
    })();

    return () => {
      active = false;
      window.removeEventListener(CURRENT_USER_UPDATED_EVENT, handleUserUpdate);
    };
  }, []);

  return { user, isLoading };
}
