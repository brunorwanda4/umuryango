import {
  type AppLocale,
  defaultLocale,
  getMessages,
  isSupportedLocale,
  type Messages,
} from "@/i18n/config";

export type TranslationValues = Record<string, string | number>;

/**
 * Selects a message from the full (root) message catalog.
 *
 * Because `messages` is typed as `typeof en.json`, every property access such
 * as `(m) => m.FamilyExpenses.addExpense` supports Ctrl+Click / F12
 * "Go to Definition" straight into `src/messages/en.json`.
 */
export type MessageSelector<M = Messages, R = unknown> = (messages: M) => R;

export type MessageKeyOrSelector<M = Messages> = string | MessageSelector<M>;

/**
 * Translator returned by `createTranslator`.
 *
 * - `t((m) => m.FamilyExpenses.addExpense)` — preferred, typed, Ctrl+Click-able.
 * - `t("addExpense")` — legacy string key, resolved relative to the namespace
 *   passed to `createTranslator` (kept for dynamic keys).
 */
export type Translator<M = Messages> = {
  <R>(selector: MessageSelector<M, R>, values?: TranslationValues): string;
  (key: string, values?: TranslationValues): string;
};

function readMessage(messages: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }

    return undefined;
  }, messages);
}

function runSelector<M>(selector: MessageSelector<M>, messages: M): unknown {
  try {
    return selector(messages);
  } catch {
    return undefined;
  }
}

function resolvePluralMessage(
  message: unknown,
  values?: TranslationValues,
  locale: string = defaultLocale,
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

function finalize(
  message: unknown,
  keyOrSelector: unknown,
  values: TranslationValues | undefined,
  locale: string,
): string {
  const resolved = resolvePluralMessage(message, values, locale);

  if (typeof resolved !== "string") {
    return typeof keyOrSelector === "string" ? keyOrSelector : "";
  }

  return interpolate(resolved, values);
}

export function translate<M = Messages>(
  messages: M,
  keyOrSelector: MessageKeyOrSelector<M>,
  values?: TranslationValues,
  locale: string = defaultLocale,
): string {
  const message =
    typeof keyOrSelector === "function"
      ? runSelector(keyOrSelector, messages)
      : readMessage(messages, keyOrSelector);

  return finalize(message, keyOrSelector, values, locale);
}

// createTranslator() / createTranslator("Namespace") / createTranslator("Namespace", "en")
export function createTranslator(
  namespace?: string,
  locale?: AppLocale,
): Translator<Messages>;

// createTranslator(messages) / createTranslator(messages, "Namespace") / createTranslator(messages, "en")
export function createTranslator<M>(
  messages: M,
  namespaceOrLocale?: string,
  locale?: AppLocale,
): Translator<M>;

export function createTranslator(
  messagesOrNamespace?: unknown,
  namespaceOrLocale?: string,
  locale?: AppLocale,
): Translator<unknown> {
  let resolvedLocale: AppLocale =
    locale && isSupportedLocale(locale) ? locale : defaultLocale;
  let namespace: string | undefined;
  let messages: unknown;

  if (messagesOrNamespace && typeof messagesOrNamespace === "object") {
    messages = messagesOrNamespace;
    if (namespaceOrLocale && isSupportedLocale(namespaceOrLocale)) {
      resolvedLocale = namespaceOrLocale;
    } else {
      namespace = namespaceOrLocale;
    }
  } else {
    if (typeof messagesOrNamespace === "string") {
      namespace = messagesOrNamespace;
    }
    if (namespaceOrLocale && isSupportedLocale(namespaceOrLocale)) {
      resolvedLocale = namespaceOrLocale;
    }
    messages = getMessages(resolvedLocale);
  }

  const fallbackMessages =
    resolvedLocale === defaultLocale ? undefined : getMessages(defaultLocale);

  const lookupKey = (catalog: unknown, key: string): unknown => {
    const scoped = namespace
      ? readMessage(catalog, `${namespace}.${key}`)
      : undefined;
    return scoped ?? readMessage(catalog, key);
  };

  return ((
    keyOrSelector: string | MessageSelector<unknown>,
    values?: TranslationValues,
  ): string => {
    let message: unknown;

    if (typeof keyOrSelector === "function") {
      message = runSelector(keyOrSelector, messages);
      if (message === undefined && fallbackMessages) {
        message = runSelector(keyOrSelector, fallbackMessages);
      }
    } else {
      message = lookupKey(messages, keyOrSelector);
      if (message === undefined && fallbackMessages) {
        message = lookupKey(fallbackMessages, keyOrSelector);
      }
    }

    return finalize(message, keyOrSelector, values, resolvedLocale);
  }) as Translator<unknown>;
}

export function useTranslation(
  namespace?: string,
  locale: AppLocale = defaultLocale,
): Translator<Messages> {
  return createTranslator(namespace, locale);
}
