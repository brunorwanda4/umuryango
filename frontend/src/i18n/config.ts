import enMessages from "@/messages/en.json";

export const defaultLocale = "en";

export const messagesByLocale = {
  en: enMessages,
} as const;

export type AppLocale = keyof typeof messagesByLocale;
export type Messages = (typeof messagesByLocale)[typeof defaultLocale];

export type LocaleSearchParams = {
  lang?: string | string[];
};

export function isSupportedLocale(locale: string): locale is AppLocale {
  return locale in messagesByLocale;
}

export function resolveLocaleFromSearchParams(
  searchParams?: LocaleSearchParams,
): AppLocale {
  const requested = Array.isArray(searchParams?.lang)
    ? searchParams?.lang[0]
    : searchParams?.lang;

  if (requested && isSupportedLocale(requested)) {
    return requested;
  }

  return defaultLocale;
}

export function getMessages(locale: AppLocale): Messages {
  return messagesByLocale[locale] ?? messagesByLocale[defaultLocale];
}

export function getLocalizedHref(href: string, locale: AppLocale) {
  if (href.startsWith("http")) {
    return href;
  }

  const [pathname, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("lang", locale);

  return `${pathname}?${params.toString()}`;
}
