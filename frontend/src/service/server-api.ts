import { cookies } from "next/headers";
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

  try {
    const response = await fetch(getApiUrl(url, baseUrl), {
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
    const payload = await parseJson<TResponse>(response);

    if (!response.ok) {
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
