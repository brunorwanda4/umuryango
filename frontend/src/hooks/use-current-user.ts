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

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

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
    };
  }, []);

  return { user, isLoading };
}
