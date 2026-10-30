import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { defaultLocale, isSupportedLocale } from "@/i18n/config";
import {
  type AuthRefreshResult,
  classifyAuthRefreshResponse,
} from "@/service/auth-refresh";

const LANGUAGE_COOKIE = "rf_language";
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const ACCESS_COOKIE = "rf_access_token";
const REFRESH_COOKIE = "rf_refresh_token";
const PROTECTED_PREFIXES = ["/me", "/family"];
const API_PROXY_URL = (
  process.env.API_PROXY_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4915"
).replace(/\/$/, "");

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function splitSetCookieHeader(header: string) {
  return header.split(/,(?=\s*[^;,]+=)/).map((cookie) => cookie.trim());
}

function getSetCookieHeaders(headers: Headers) {
  const withGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof withGetSetCookie.getSetCookie === "function") {
    return withGetSetCookie.getSetCookie();
  }

  const setCookie = headers.get("set-cookie");
  return setCookie ? splitSetCookieHeader(setCookie) : [];
}

function mergeCookies(cookieHeader: string, setCookieHeaders: string[]) {
  const cookies = new Map<string, string>();

  for (const cookie of cookieHeader.split(";")) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name && valueParts.length > 0) {
      cookies.set(name, valueParts.join("="));
    }
  }

  for (const setCookie of setCookieHeaders) {
    const [cookiePair] = setCookie.split(";");
    const [name, ...valueParts] = cookiePair.trim().split("=");
    if (name && valueParts.length > 0) {
      cookies.set(name, valueParts.join("="));
    }
  }

  return Array.from(cookies, ([name, value]) => `${name}=${value}`).join("; ");
}

type SessionRefresh =
  | { status: Exclude<AuthRefreshResult, "refreshed"> }
  | {
      status: "refreshed";
      cookieHeader: string;
      setCookieHeaders: string[];
    };

async function refreshSessionCookies(
  request: NextRequest,
): Promise<SessionRefresh> {
  const cookieHeader = request.headers.get("cookie") ?? "";

  if (!cookieHeader) {
    return { status: "unauthorized" };
  }

  const response = await fetch(`${API_PROXY_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Cookie: cookieHeader,
    },
    cache: "no-store",
  }).catch(() => undefined);

  if (!response) {
    return { status: "unavailable" };
  }

  const refreshResult = classifyAuthRefreshResponse(response);
  if (refreshResult !== "refreshed") {
    return { status: refreshResult };
  }

  const setCookieHeaders = getSetCookieHeaders(response.headers);
  if (setCookieHeaders.length === 0) {
    return { status: "unavailable" };
  }

  return {
    status: "refreshed",
    cookieHeader: mergeCookies(cookieHeader, setCookieHeaders),
    setCookieHeaders,
  };
}

function appendSessionCookies(
  response: NextResponse,
  sessionRefresh: Extract<SessionRefresh, { status: "refreshed" }>,
) {
  for (const setCookieHeader of sessionRefresh.setCookieHeaders) {
    response.headers.append("Set-Cookie", setCookieHeader);
  }
}

function redirectToLogin(request: NextRequest, locale: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/auth/login";
  url.searchParams.set("redirect", request.nextUrl.pathname);

  if (locale === defaultLocale) {
    url.searchParams.delete("lang");
  } else {
    url.searchParams.set("lang", locale);
  }

  const response = NextResponse.redirect(url);
  setLanguageCookie(response, locale);
  return response;
}

function normalizeLocale(locale?: string | null) {
  if (!locale) return undefined;
  if (isSupportedLocale(locale)) return locale;
  return undefined;
}

function setLanguageCookie(response: NextResponse, locale: string) {
  response.cookies.set(LANGUAGE_COOKIE, locale, {
    maxAge: LANGUAGE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
}

function redirectWithLocale(
  request: NextRequest,
  pathname: string,
  locale: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;

  if (locale === defaultLocale) {
    url.searchParams.delete("lang");
  } else {
    url.searchParams.set("lang", locale);
  }

  const response = NextResponse.redirect(url);
  setLanguageCookie(response, locale);
  return response;
}

export async function proxy(request: NextRequest) {
  const requestedLocale = normalizeLocale(
    request.nextUrl.searchParams.get("lang"),
  );
  const savedLocale = normalizeLocale(
    request.cookies.get(LANGUAGE_COOKIE)?.value,
  );
  const locale = requestedLocale ?? savedLocale ?? defaultLocale;
  const hasLocaleQuery = request.nextUrl.searchParams.has("lang");
  const hasInvalidLocaleQuery = hasLocaleQuery && !requestedLocale;

  if (hasInvalidLocaleQuery || (!hasLocaleQuery && locale !== defaultLocale)) {
    return redirectWithLocale(request, request.nextUrl.pathname, locale);
  }

  const hasAccessCookie = Boolean(request.cookies.get(ACCESS_COOKIE)?.value);
  const hasRefreshCookie = Boolean(request.cookies.get(REFRESH_COOKIE)?.value);
  const canEnterProtectedRoute = hasAccessCookie || hasRefreshCookie;
  const isProtectedRoute = isProtectedPath(request.nextUrl.pathname);
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");

  if (isProtectedRoute && !canEnterProtectedRoute) {
    return redirectToLogin(request, locale);
  }

  if (isAuthRoute && hasAccessCookie) {
    return redirectWithLocale(request, "/me", locale);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    "x-pathname",
    request.nextUrl.pathname + request.nextUrl.search,
  );

  const sessionRefresh =
    (isProtectedRoute || isAuthRoute) && !hasAccessCookie && hasRefreshCookie
      ? await refreshSessionCookies(request)
      : undefined;

  if (isProtectedRoute && !hasAccessCookie && hasRefreshCookie) {
    if (sessionRefresh?.status === "unauthorized") {
      return redirectToLogin(request, locale);
    }

    if (sessionRefresh?.status === "refreshed") {
      requestHeaders.set("cookie", sessionRefresh.cookieHeader);
    }
  }

  if (isAuthRoute && sessionRefresh?.status === "refreshed") {
    const response = redirectWithLocale(request, "/me", locale);
    appendSessionCookies(response, sessionRefresh);
    return response;
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  setLanguageCookie(response, locale);

  if (sessionRefresh?.status === "refreshed") {
    appendSessionCookies(response, sessionRefresh);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
