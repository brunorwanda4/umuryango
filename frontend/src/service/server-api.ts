import { cookies, headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import {
  type APIResponse,
  type ApiRequestOptions,
  getApiUrl,
} from "@/service/api";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

type ApiEnvelope<T> = {
  data?: T;
  message?: string | string[];
  error?: string | { message?: string };
  statusCode?: number;
};

function normalizeBaseUrl(value?: string | null) {
  const normalized = value?.trim().replace(/\/$/, "");
  return normalized || undefined;
}

function getAppUrl() {
  const configuredAppUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (configuredAppUrl) {
    return configuredAppUrl;
  }

  const vercelUrl = normalizeBaseUrl(process.env.VERCEL_URL);
  if (!vercelUrl) {
    return undefined;
  }

  return /^https?:\/\//.test(vercelUrl) ? vercelUrl : `https://${vercelUrl}`;
}

function getServerApiBaseUrl(explicitBaseUrl?: string) {
  return (
    normalizeBaseUrl(explicitBaseUrl) ??
    normalizeBaseUrl(process.env.API_PROXY_URL) ??
    normalizeBaseUrl(process.env.NEXT_PUBLIC_DIRECT_API_URL) ??
    normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL) ??
    normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL) ??
    (process.env.NODE_ENV === "production" ? getAppUrl() : undefined)
  );
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

async function redirectToLogin() {
  const [cookieStore, headerStore] = await Promise.all([
    cookies(),
    nextHeaders(),
  ]);
  const currentPath = headerStore.get("x-pathname") ?? "/";
  const savedLocale = cookieStore.get("rf_language")?.value;
  const params = new URLSearchParams();

  if (currentPath !== "/") {
    params.set("redirect", currentPath);
  }

  if (savedLocale && savedLocale !== "en") {
    params.set("lang", savedLocale);
  }

  const query = params.toString();
  redirect(query ? `/auth/login?${query}` : "/auth/login");
}

export async function serverApiRequest<TRequest = unknown, TResponse = unknown>(
  method: HttpMethod,
  url: string,
  data?: TRequest,
  options: ApiRequestOptions = {},
): Promise<APIResponse<TResponse>> {
  const {
    baseUrl,
    credentials: _credentials,
    headers: requestHeaders,
    idempotencyKey,
    skipAuthRefresh: _skipAuthRefresh,
    ...requestOptions
  } = options;
  const headers = new Headers(requestHeaders);
  const cookieHeader = (await cookies()).toString();
  const isFormData = data instanceof FormData;

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (!headers.has("Cookie") && cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  if (!isFormData && data !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  let response: Response;

  try {
    response = await fetch(getApiUrl(url, getServerApiBaseUrl(baseUrl)), {
      ...requestOptions,
      method: method.toUpperCase(),
      headers,
      body:
        method === "get" || data === undefined
          ? undefined
          : isFormData
            ? data
            : JSON.stringify(data),
    });
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

  const payload = await parseJson<TResponse>(response);

  if (!response.ok) {
    if (response.status === 401) {
      await redirectToLogin();
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
}
