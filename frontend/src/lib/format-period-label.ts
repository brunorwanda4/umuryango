export function formatPeriodLabel(
  from: string,
  to: string,
  locale: Intl.LocalesArgument = "en",
) {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${formatter.format(parseLocalDate(from))} - ${formatter.format(
    parseLocalDate(to),
  )}`;
}

function parseLocalDate(value: string) {
  return new Date(`${value}T00:00:00`);
}
