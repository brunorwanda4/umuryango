import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isSupportedLocale, defaultLocale } from "@/i18n/config";

const LANGUAGE_COOKIE = "rf_language";
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

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

export function proxy(request: NextRequest) {
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

	const requestHeaders = new Headers(request.headers);
	if (request.nextUrl.pathname.startsWith("/dashboard")) {
		requestHeaders.set(
			"x-pathname",
			request.nextUrl.pathname + request.nextUrl.search,
		);
	}

	const response = NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	});
	setLanguageCookie(response, locale);
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
