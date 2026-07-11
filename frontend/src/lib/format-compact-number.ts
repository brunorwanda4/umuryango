export type CompactFormatValue = number | null | undefined;
export type MinorUnitValue = number | string | null | undefined;

export interface CompactFormatOptions {
  /** Locale passed to Intl.NumberFormat. Defaults to "en". */
  locale?: Intl.LocalesArgument;
  /** Currency code used when showCurrency is true. */
  currency?: string;
  /** Maximum decimal places to show after compaction. Defaults to 1. */
  maximumFractionDigits?: number;
  /** Minimum decimal places to show after compaction. Defaults to 0. */
  minimumFractionDigits?: number;
  /** Prefix the value with the currency display when currency is provided. */
  showCurrency?: boolean;
}

type CompactSuffix = {
  suffix: "T" | "B" | "M" | "K";
  value: number;
};

const DEFAULT_LOCALE = "en";
const DEFAULT_MAXIMUM_FRACTION_DIGITS = 1;
const DEFAULT_MINIMUM_FRACTION_DIGITS = 0;
const COMPACT_SUFFIXES: CompactSuffix[] = [
  { suffix: "T", value: 1_000_000_000_000 },
  { suffix: "B", value: 1_000_000_000 },
  { suffix: "M", value: 1_000_000 },
  { suffix: "K", value: 1_000 },
];

/**
 * Formats a number into a compact, human-readable value.
 *
 * @example
 * formatCompactNumber(1200)
 * // "1.2K"
 *
 * formatCompactNumber(1250000, { maximumFractionDigits: 1 })
 * // "1.3M"
 */
export function formatCompactNumber(
  value: CompactFormatValue,
  localeOrOptions?: Intl.LocalesArgument | CompactFormatOptions,
  options?: CompactFormatOptions,
) {
  const localeOptions = isCompactFormatOptions(localeOrOptions)
    ? localeOrOptions
    : undefined;

  return formatCompactValue(value, localeOrOptions, {
    ...options,
    showCurrency: options?.showCurrency ?? localeOptions?.showCurrency ?? false,
  });
}

/**
 * Formats a money amount into a compact, human-readable value.
 *
 * @example
 * formatCompactMoney(1250000, "RWF")
 * // "RWF 1.3M"
 *
 * formatCompactMoney(2500000000, "USD")
 * // "$2.5B"
 */
export function formatCompactMoney(
  value: CompactFormatValue,
  currency = "RWF",
  localeOrOptions?: Intl.LocalesArgument | CompactFormatOptions,
  options?: CompactFormatOptions,
) {
  const localeOptions = isCompactFormatOptions(localeOrOptions)
    ? localeOrOptions
    : undefined;

  return formatCompactValue(value, localeOrOptions, {
    ...options,
    currency,
    showCurrency: options?.showCurrency ?? localeOptions?.showCurrency ?? true,
  });
}

export function formatCompactValue(
  value: CompactFormatValue,
  localeOrOptions?: Intl.LocalesArgument | CompactFormatOptions,
  options?: CompactFormatOptions,
) {
  if (value === null || value === undefined) {
    return "\u2014";
  }

  if (value === 0) {
    return "0";
  }

  const resolvedOptions = resolveCompactOptions(localeOrOptions, options);

  if (supportsCompactNotation(resolvedOptions.locale)) {
    return formatWithIntlCompact(value, resolvedOptions);
  }

  return formatWithFallbackCompact(value, resolvedOptions);
}

/**
 * Formats a persisted minor-unit money value as compact money.
 *
 * RWF has zero fraction digits, so 1200 minor units displays as RWF 1.2K.
 * USD has two fraction digits, so 120000 minor units displays as $1.2K.
 */
export function formatCompactMinorUnits(
  value: MinorUnitValue,
  currency = "RWF",
  localeOrOptions?: Intl.LocalesArgument | CompactFormatOptions,
  options?: CompactFormatOptions,
) {
  if (value === null || value === undefined) {
    return "\u2014";
  }

  const majorValue = minorUnitsToMajorNumber(value, currency);

  if (majorValue === null) {
    return `${currency} ${String(value)}`;
  }

  return formatCompactMoney(majorValue, currency, localeOrOptions, options);
}

export function formatOptionalCompactMinorUnits(
  value: MinorUnitValue,
  currency = "RWF",
  emptyLabel = "No records",
) {
  if (value === null || value === undefined) {
    return emptyLabel;
  }

  return formatCompactMinorUnits(value, currency);
}

export function formatFullMinorUnits(value: unknown, currency = "RWF") {
  if (value === null || value === undefined) {
    return "\u2014";
  }

  const normalized = normalizeMinorUnitString(value);

  if (normalized === null) {
    return `${currency} ${String(value)}`;
  }

  const fractionDigits = getCurrencyFractionDigits(currency);
  const negative = normalized.startsWith("-");
  const absolute = negative ? normalized.slice(1) : normalized;

  if (fractionDigits === 0) {
    return `${negative ? "-" : ""}${currency} ${groupDigits(absolute)}`;
  }

  const padded = absolute.padStart(fractionDigits + 1, "0");
  const major = padded.slice(0, -fractionDigits);
  const minor = padded.slice(-fractionDigits);

  return `${negative ? "-" : ""}${currency} ${groupDigits(major)}.${minor}`;
}

export function supportsCompactNotation(
  locale: Intl.LocalesArgument = DEFAULT_LOCALE,
) {
  try {
    const options = new Intl.NumberFormat(locale, {
      notation: "compact",
    }).resolvedOptions();

    return options.notation === "compact";
  } catch {
    return false;
  }
}

export function formatWithIntlCompact(
  value: number,
  options: RequiredCompactFormatOptions,
) {
  try {
    const formatted = new Intl.NumberFormat(options.locale, {
      compactDisplay: "short",
      currency: options.showCurrency ? options.currency : undefined,
      maximumFractionDigits: options.maximumFractionDigits,
      minimumFractionDigits: options.minimumFractionDigits,
      notation: "compact",
      style: options.showCurrency && options.currency ? "currency" : "decimal",
    }).format(value);

    return normalizeSpaces(formatted);
  } catch {
    return formatWithFallbackCompact(value, options);
  }
}

export function formatWithFallbackCompact(
  value: number,
  options: RequiredCompactFormatOptions,
) {
  const sign = value < 0 ? "-" : "";
  const absoluteValue = Math.abs(value);
  const compact = getFallbackCompactParts(
    absoluteValue,
    options.maximumFractionDigits,
  );
  const formattedNumber = new Intl.NumberFormat(options.locale, {
    maximumFractionDigits: options.maximumFractionDigits,
    minimumFractionDigits: options.minimumFractionDigits,
  }).format(compact.value);
  const compactValue = `${sign}${formattedNumber}${compact.suffix}`;

  const currency = options.currency;

  if (!options.showCurrency || !currency) {
    return normalizeSpaces(compactValue);
  }

  return normalizeSpaces(
    formatFallbackCurrencyCompact(
      sign,
      getCurrencyDisplay({ ...options, currency }),
      formattedNumber,
      compact.suffix,
      currency,
    ),
  );
}

export function getFallbackCompactParts(
  absoluteValue: number,
  maximumFractionDigits = DEFAULT_MAXIMUM_FRACTION_DIGITS,
) {
  let suffixIndex = COMPACT_SUFFIXES.findIndex(
    (suffix) => absoluteValue >= suffix.value,
  );

  if (suffixIndex === -1) {
    return { suffix: "", value: absoluteValue };
  }

  let compact = COMPACT_SUFFIXES[suffixIndex];
  let roundedValue = roundToFractionDigits(
    absoluteValue / compact.value,
    maximumFractionDigits,
  );

  while (suffixIndex > 0 && roundedValue >= 1000) {
    suffixIndex -= 1;
    compact = COMPACT_SUFFIXES[suffixIndex];
    roundedValue = roundToFractionDigits(
      absoluteValue / compact.value,
      maximumFractionDigits,
    );
  }

  return {
    suffix: compact.suffix,
    value: roundedValue,
  };
}

export function getCurrencyDisplay(
  options: RequiredCompactFormatOptions & { currency: string },
) {
  try {
    const parts = new Intl.NumberFormat(options.locale, {
      currency: options.currency,
      currencyDisplay: "narrowSymbol",
      style: "currency",
    }).formatToParts(0);
    const currency = parts.find((part) => part.type === "currency")?.value;

    return currency || options.currency;
  } catch {
    return options.currency;
  }
}

export function normalizeMinorUnitString(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value).toString();
  }

  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return value;
  }

  return null;
}

export function getCurrencyFractionDigits(currency: string) {
  try {
    const maximumFractionDigits = new Intl.NumberFormat("en", {
      currency,
      style: "currency",
    }).resolvedOptions().maximumFractionDigits;

    return typeof maximumFractionDigits === "number"
      ? maximumFractionDigits
      : 2;
  } catch {
    return 2;
  }
}

export function minorUnitsToMajorNumber(
  value: MinorUnitValue,
  currency = "RWF",
) {
  const normalized = normalizeMinorUnitString(value);

  if (normalized === null) {
    return null;
  }

  return Number(normalized) / 10 ** getCurrencyFractionDigits(currency);
}

export function toChartNumber(value: unknown) {
  const numeric = typeof value === "string" ? Number(value) : value;

  return typeof numeric === "number" && Number.isFinite(numeric) ? numeric : 0;
}

export function groupDigits(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

interface RequiredCompactFormatOptions {
  currency?: string;
  locale: Intl.LocalesArgument;
  maximumFractionDigits: number;
  minimumFractionDigits: number;
  showCurrency: boolean;
}

function resolveCompactOptions(
  localeOrOptions?: Intl.LocalesArgument | CompactFormatOptions,
  options: CompactFormatOptions = {},
): RequiredCompactFormatOptions {
  const localeOptions = isCompactFormatOptions(localeOrOptions)
    ? localeOrOptions
    : undefined;
  const localeArgument = localeOptions
    ? undefined
    : (localeOrOptions as Intl.LocalesArgument | undefined);
  const locale =
    localeOptions?.locale ?? localeArgument ?? options.locale ?? DEFAULT_LOCALE;
  const mergedOptions = {
    ...localeOptions,
    ...options,
  };

  return {
    currency: mergedOptions.currency,
    locale,
    maximumFractionDigits:
      mergedOptions.maximumFractionDigits ?? DEFAULT_MAXIMUM_FRACTION_DIGITS,
    minimumFractionDigits:
      mergedOptions.minimumFractionDigits ?? DEFAULT_MINIMUM_FRACTION_DIGITS,
    showCurrency: mergedOptions.showCurrency ?? Boolean(mergedOptions.currency),
  };
}

function isCompactFormatOptions(
  value: Intl.LocalesArgument | CompactFormatOptions | undefined,
): value is CompactFormatOptions {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    ("currency" in value ||
      "locale" in value ||
      "maximumFractionDigits" in value ||
      "minimumFractionDigits" in value ||
      "showCurrency" in value)
  );
}

function roundToFractionDigits(value: number, maximumFractionDigits: number) {
  const multiplier = 10 ** maximumFractionDigits;

  return Math.round(value * multiplier) / multiplier;
}

function formatFallbackCurrencyCompact(
  sign: string,
  currencyDisplay: string,
  formattedNumber: string,
  suffix: string,
  currency?: string,
) {
  const separator = currencyDisplay === currency ? " " : "";

  return `${sign}${currencyDisplay}${separator}${formattedNumber}${suffix}`;
}

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
