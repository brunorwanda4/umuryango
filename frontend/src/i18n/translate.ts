import {
  type AppLocale,
  defaultLocale,
  getMessages,
  isSupportedLocale,
  type Messages,
} from "@/i18n/config";

export type TranslationValues = Record<string, string | number>;

function readMessage(messages: Messages, key: string) {
  return key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }

    return undefined;
  }, messages);
}

function resolvePluralMessage(
  message: unknown,
  values?: TranslationValues,
  locale = defaultLocale,
): unknown {
  if (
    message !== null &&
    typeof message === "object" &&
    values &&
    "count" in values &&
    typeof values.count === "number"
  ) {
    const count = values.count;
    const msgObj = message as Record<string, unknown>;
    try {
      const pr = new Intl.PluralRules(locale);
      const rule = pr.select(count);
      return (
        (count === 0 && msgObj.zero ? msgObj.zero : undefined) ??
        msgObj[rule] ??
        msgObj.other
      );
    } catch {
      return (
        (count === 0 && msgObj.zero ? msgObj.zero : undefined) ??
        (count === 1 ? msgObj.one : msgObj.other)
      );
    }
  }
  return message;
}

function interpolate(message: string, values?: TranslationValues) {
  if (!values) {
    return message;
  }

  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    message,
  );
}

export function translate(
  messages: Messages,
  key: string,
  values?: TranslationValues,
  locale: string = defaultLocale,
) {
  let message = readMessage(messages, key);
  message = resolvePluralMessage(message, values, locale);

  if (typeof message !== "string") {
    return key;
  }

  return interpolate(message, values);
}

export type Translator = (key: string, values?: TranslationValues) => string;

export function createTranslator(
  messagesOrNamespace?: Messages | string,
  namespaceOrLocale?: string | AppLocale,
  locale: AppLocale = defaultLocale,
): Translator {
  let messages: Messages;
  let namespace: string | undefined;
  let resolvedLocale = locale;

  if (typeof messagesOrNamespace === "string") {
    messages = getMessages(defaultLocale);
    namespace = messagesOrNamespace;
    if (
      typeof namespaceOrLocale === "string" &&
      isSupportedLocale(namespaceOrLocale)
    ) {
      resolvedLocale = namespaceOrLocale;
      messages = getMessages(resolvedLocale);
    }
  } else {
    messages = messagesOrNamespace ?? getMessages(defaultLocale);
    namespace =
      typeof namespaceOrLocale === "string" ? namespaceOrLocale : undefined;
  }

  return (key: string, values?: TranslationValues) =>
    translate(
      messages,
      namespace ? `${namespace}.${key}` : key,
      values,
      resolvedLocale,
    );
}

export function useTranslation(
  namespace?: string,
  locale: AppLocale = defaultLocale,
): Translator {
  return createTranslator(getMessages(locale), namespace, locale);
}
