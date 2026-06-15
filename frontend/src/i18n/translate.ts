import type { Messages } from "@/i18n/config";

type TranslationValues = Record<string, string | number>;

function readMessage(messages: Messages, key: string) {
  return key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }

    return undefined;
  }, messages);
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
) {
  const message = readMessage(messages, key);

  if (typeof message !== "string") {
    return key;
  }

  return interpolate(message, values);
}

export function createTranslator(messages: Messages, namespace?: string) {
  return (key: string, values?: TranslationValues) =>
    translate(messages, namespace ? `${namespace}.${key}` : key, values);
}
