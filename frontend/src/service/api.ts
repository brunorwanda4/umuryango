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

  try {
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

    return {
      ok: true,
      data: payload?.data,
      message: getMessage(payload, "Request successful"),
      statusCode: payload?.statusCode ?? response.status,
      isLoading: false,
    };
  } catch (error) {
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

import {
  type AuthRefreshResult,
  classifyAuthRefreshResponse,
} from "@/service/auth-refresh";
