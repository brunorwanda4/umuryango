"use client";

import { useEffect, useState } from "react";

export type CurrentUser = {
	id: string;
	email: string;
	phoneNumber: string | null;
	fullName: string;
	avatarUrl: string | null;
};

const getMeUrl = () => {
	const configuredUrl =
		process.env.NEXT_PUBLIC_API_URL ??
		process.env.NEXT_PUBLIC_API_BASE_URL ??
		"http://localhost:4915";
	const baseUrl = configuredUrl.replace(/\/$/, "");

	if (baseUrl.endsWith("/api/v1")) {
		return `${baseUrl}/auth/me`;
	}

	return `${baseUrl}/api/v1/auth/me`;
};

export function useCurrentUser() {
	const [user, setUser] = useState<CurrentUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let active = true;

		(async () => {
			try {
				const response = await fetch(getMeUrl(), {
					credentials: "include",
				});

				if (!response.ok) {
					if (active) setUser(null);
					return;
				}

				const payload = (await response.json().catch(() => null)) as {
					data?: { user?: CurrentUser };
				} | null;

				if (active) setUser(payload?.data?.user ?? null);
			} catch {
				if (active) setUser(null);
			} finally {
				if (active) setIsLoading(false);
			}
		})();

		return () => {
			active = false;
		};
	}, []);

	return { user, isLoading };
}
