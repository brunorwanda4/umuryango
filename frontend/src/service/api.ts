import {
  type AuthRefreshResult,
  classifyAuthRefreshResponse,
} from "@/service/auth-refresh";
import { invokeNative, isNativeApp } from "@/service/native-bridge";
import {
  getOfflineMoneyMutation,
  isOfflineSafeMutation,
} from "@/service/offline-policy";
import {
  cacheApiResponse,
  clearOfflineAccount,
  enqueueOfflineMutation,
  getCachedApiResponse,
  listOfflineMutations,
  prepareWebOfflineLogin,
  removeOfflineMutation,
  setOfflineAccount,
  unlockWebOfflineAccount,
} from "@/service/offline-store";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

type ApiEnvelope<T> = {
  data?: T;
  message?: string | string[];
  error?: string | { message?: string };
  statusCode?: number;
};

export interface APIResponse<T = unknown> {
  ok: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
  isLoading: boolean;
}

export interface ApiRequestOptions
  extends Omit<RequestInit, "body" | "credentials" | "headers" | "method"> {
  baseUrl?: string;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  idempotencyKey?: string;
  skipAuthRefresh?: boolean;
}

const DEFAULT_API_URL =
  process.env.NODE_ENV === "production" ? "" : "http://localhost:4915";

export function getApiBaseUrl() {
  if (process.env.NODE_ENV === "production") {
    return (process.env.NEXT_PUBLIC_DIRECT_API_URL ?? DEFAULT_API_URL).replace(
      /\/$/,
      "",
    );
  }

  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_API_URL
  ).replace(/\/$/, "");
}

export function getApiUrl(path: string, baseUrl = getApiBaseUrl()) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  if (normalizedBaseUrl.endsWith("/api/v1")) {
    return normalizedPath.startsWith("/api/v1")
      ? `${normalizedBaseUrl}${normalizedPath.replace(/^\/api\/v1/, "")}`
      : `${normalizedBaseUrl}${normalizedPath}`;
  }

  if (normalizedPath.startsWith("/api/v1")) {
    return `${normalizedBaseUrl}${normalizedPath}`;
  }

  return `${normalizedBaseUrl}/api/v1${normalizedPath}`;
}

export function getApiAuthUrl(path: string) {
  return getApiUrl(`/auth/${path}`);
}

function getMessage(payload: ApiEnvelope<unknown> | null, fallback: string) {
  if (!payload) {
    return fallback;
  }

  if (typeof payload.error === "object" && payload.error?.message) {
    return payload.error.message;
  }

  if (Array.isArray(payload.message)) {
    return payload.message[0] ?? fallback;
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }

  if (typeof payload.error === "string") {
    return payload.error;
  }

  return fallback;
}

async function parseJson<T>(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    return null;
  }
}

let authRefreshPromise: Promise<AuthRefreshResult> | null = null;
let outboxFlushPromise: Promise<void> | null = null;

function isBrowserOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

function offlineResponse<T>(message: string): APIResponse<T> {
  return {
    ok: false,
    error: message,
    message,
    statusCode: 0,
    isLoading: false,
  };
}

async function saveOfflineMutation<TRequest, TResponse>(
  method: HttpMethod,
  url: string,
  data: TRequest | undefined,
  headers: Headers,
): Promise<APIResponse<TResponse>> {
  if (!isOfflineSafeMutation(method, url, data)) {
    return offlineResponse(
      "This action needs an internet connection. Cached pages and offline-safe entries remain available.",
    );
  }

  const nativeMutation = getOfflineMoneyMutation(url, data);
  if (isNativeApp() && nativeMutation) {
    try {
      const result = await invokeNative<unknown>(nativeMutation.command, {
        input: nativeMutation.input,
      });
      return {
        ok: true,
        data: result as TResponse,
        message: "Saved on this device. It will sync when you reconnect.",
        statusCode: 202,
        isLoading: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return offlineResponse(message);
    }
  }

  const queued = await enqueueOfflineMutation({
    method: method as "post" | "put" | "patch" | "delete",
    url,
    data,
    headers: Object.fromEntries(headers.entries()),
  });

  if (!queued) {
    return offlineResponse(
      "Sign in once while online before saving entries for offline sync.",
    );
  }

  return {
    ok: true,
    data: { offlinePending: true, localId: queued.id } as TResponse,
    message: "Saved offline. It will sync when you reconnect.",
    statusCode: 202,
    isLoading: false,
  };
}

export async function flushOfflineApiOutbox() {
  if (typeof window === "undefined" || isBrowserOffline() || isNativeApp())
    return;
  if (outboxFlushPromise) return outboxFlushPromise;

  outboxFlushPromise = (async () => {
    const mutations = await listOfflineMutations();
    for (const mutation of mutations) {
      const headers = new Headers(mutation.headers);
      const response = await fetch(getApiUrl(mutation.url), {
        method: mutation.method.toUpperCase(),
        credentials: "include",
        headers,
        body:
          mutation.data === undefined
            ? undefined
            : JSON.stringify(mutation.data),
      });

      if (response.ok || response.status === 409) {
        await removeOfflineMutation(mutation.id);
        continue;
      }

      if (response.status >= 500 || response.status === 429) break;
      // Keep permanent failures for a future conflict/retry screen instead of losing data.
      break;
    }
  })().finally(() => {
    outboxFlushPromise = null;
  });

  return outboxFlushPromise;
}

function shouldAttemptAuthRefresh(url: string) {
  const path = /^https?:\/\//.test(url) ? new URL(url).pathname : url;
  const normalizedPath = path.startsWith("/api/v1")
    ? path.replace(/^\/api\/v1/, "")
    : path;

  return ![
    "/auth/login",
    "/auth/logout",
    "/auth/register",
    "/auth/refresh",
    "/auth/verify-email",
    "/auth/resend-verification",
    "/auth/forgot-password",
    "/auth/reset-password",
  ].some((authPath) => normalizedPath === authPath);
}

function getLoginRedirectUrl() {
  if (typeof window === "undefined") {
    return "/auth/login";
  }

  const currentPath = `${window.location.pathname}${window.location.search}`;
  const params = new URLSearchParams();

  if (currentPath !== "/") {
    params.set("redirect", currentPath);
  }

  const loginUrl = `/auth/login?${params.toString()}`;
  return loginUrl.endsWith("?") ? "/auth/login" : loginUrl;
}

function redirectBrowserToLogin() {
  if (typeof window === "undefined") {
    return;
  }

  const loginUrl = getLoginRedirectUrl();

  if (
    window.location.pathname !== "/auth/login" &&
    `${window.location.pathname}${window.location.search}` !== loginUrl
  ) {
    window.location.assign(loginUrl);
  }
}

async function refreshAuthSession(
  baseUrl: string | undefined,
  credentials: RequestCredentials,
) {
  if (!authRefreshPromise) {
    authRefreshPromise = fetch(getApiUrl("/auth/refresh", baseUrl), {
      method: "POST",
      credentials,
      headers: { Accept: "application/json" },
    })
      .then(classifyAuthRefreshResponse)
      .catch(() => "unavailable" as const)
      .finally(() => {
        authRefreshPromise = null;
      });
  }

  return authRefreshPromise;
}

async function apiRequest<TRequest = unknown, TResponse = unknown>(
  method: HttpMethod,
  url: string,
  data?: TRequest,
  options: ApiRequestOptions = {},
): Promise<APIResponse<TResponse>> {
  const {
    baseUrl,
    credentials = "include",
    headers: requestHeaders,
    idempotencyKey,
    skipAuthRefresh,
    ...requestOptions
  } = options;
  const headers = new Headers(requestHeaders);
  const isFormData = data instanceof FormData;

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (!isFormData && data !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  if (isBrowserOffline()) {
    if (method === "post" && url === "/auth/login" && isNativeApp()) {
      const login = data as
        | { emailOrMobile?: string; password?: string }
        | undefined;
      if (login?.emailOrMobile && login.password) {
        try {
          const session = await invokeNative<{ user?: { id?: string } }>(
            "unlock_offline_session",
            {
              input: {
                identifier: login.emailOrMobile,
                password: login.password,
              },
            },
          );
          if (session.user?.id) await setOfflineAccount(session.user.id);
          return {
            ok: true,
            data: session as TResponse,
            message: "Offline account unlocked.",
            statusCode: 200,
            isLoading: false,
          };
        } catch (error) {
          return offlineResponse(
            error instanceof Error ? error.message : String(error),
          );
        }
      }
    }

    if (method === "post" && url === "/auth/login" && !isNativeApp()) {
      const login = data as
        | { emailOrMobile?: string; password?: string }
        | undefined;
      if (
        login?.emailOrMobile &&
        login.password &&
        (await unlockWebOfflineAccount(login.emailOrMobile, login.password))
      ) {
        return {
          ok: true,
          data: { offlineUnlocked: true } as TResponse,
          message: "Offline account unlocked.",
          statusCode: 200,
          isLoading: false,
        };
      }

      return offlineResponse(
        "Offline login failed. Use the account and password last verified online on this device.",
      );
    }

    if (method === "get") {
      const cached = await getCachedApiResponse<APIResponse<TResponse>>(url);
      return (
        cached ??
        offlineResponse(
          "This page has not been saved on this device yet. Connect once to load it.",
        )
      );
    }

    return saveOfflineMutation<TRequest, TResponse>(method, url, data, headers);
  }

  try {
    if (method !== "get") {
      void flushOfflineApiOutbox();
    }

    const response = await fetch(getApiUrl(url, baseUrl), {
      ...requestOptions,
      method: method.toUpperCase(),
      credentials,
      headers,
      body:
        method === "get" || data === undefined
          ? undefined
          : isFormData
            ? data
            : JSON.stringify(data),
    });
    const payload = await parseJson<TResponse>(response);

    if (!response.ok) {
      if (response.status === 401 && shouldAttemptAuthRefresh(url)) {
        let shouldRedirect = Boolean(skipAuthRefresh);

        if (!skipAuthRefresh) {
          const refreshResult = await refreshAuthSession(baseUrl, credentials);

          if (refreshResult === "refreshed") {
            return apiRequest<TRequest, TResponse>(method, url, data, {
              ...options,
              skipAuthRefresh: true,
            });
          }

          shouldRedirect = refreshResult === "unauthorized";
        }

        if (shouldRedirect) {
          redirectBrowserToLogin();
        }
      }

      const message = getMessage(payload, response.statusText);

      return {
        ok: false,
        error: message,
        message,
        statusCode: payload?.statusCode ?? response.status,
        isLoading: false,
      };
    }

    const successfulResponse: APIResponse<TResponse> = {
      ok: true,
      data: payload?.data,
      message: getMessage(payload, "Request successful"),
      statusCode: payload?.statusCode ?? response.status,
      isLoading: false,
    };

    if (url === "/auth/me" || url === "/auth/login") {
      const authData = payload?.data as
        | { id?: string; user?: { id?: string } }
        | undefined;
      const accountId = authData?.user?.id ?? authData?.id;
      if (accountId) {
        await setOfflineAccount(accountId);
        if (url === "/auth/login") {
          const login = data as
            | { emailOrMobile?: string; password?: string }
            | undefined;
          if (login?.emailOrMobile && login.password) {
            await prepareWebOfflineLogin(
              accountId,
              login.emailOrMobile,
              login.password,
            );
          }
        }
      }
    }

    if (method === "get" && !url.startsWith("/auth/")) {
      await cacheApiResponse(url, successfulResponse);
    }

    if (method === "post" && url === "/auth/login" && isNativeApp()) {
      const login = data as
        | { emailOrMobile?: string; password?: string }
        | undefined;
      if (login?.emailOrMobile && login.password) {
        try {
          await invokeNative("sign_in", {
            input: {
              identifier: login.emailOrMobile,
              password: login.password,
            },
          });
        } catch {
          // The web session is valid. Native offline setup can retry at the next login.
        }
      }
    }

    if (method === "post" && url === "/auth/logout") {
      await clearOfflineAccount();
      if (isNativeApp()) {
        try {
          await invokeNative("sign_out", { wipeLocalCache: true });
        } catch {
          // Browser logout remains authoritative even if local native cleanup fails.
        }
      }
    }

    return successfulResponse;
  } catch (error) {
    if (method === "get") {
      const cached = await getCachedApiResponse<APIResponse<TResponse>>(url);
      if (cached) return cached;
    } else {
      const offlineMutation = await saveOfflineMutation<TRequest, TResponse>(
        method,
        url,
        data,
        headers,
      );
      if (offlineMutation.ok) return offlineMutation;
    }

    const message =
      error instanceof Error ? error.message : "Unable to reach the API.";

    return {
      ok: false,
      error: message,
      message,
      statusCode: 0,
      isLoading: false,
    };
  }
}

export default apiRequest;
