/**
 * Event times are stored as venue wall-clock strings ("YYYY-MM-DDTHH:mm") plus
 * an IANA timezone, so guests abroad still see the real local time of the venue.
 */

function tzOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - date.getTime();
}

/** Converts venue wall-clock time to an absolute Date. */
export function zonedToDate(local: string, timeZone: string): Date {
  const [d, t = "00:00"] = local.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [hh, mm] = t.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, day, hh, mm);
  let tz = timeZone;
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
  } catch {
    tz = "UTC";
  }
  const offset = tzOffsetMs(new Date(guess), tz);
  const result = guess - offset;
  // Re-check around DST transitions.
  const offset2 = tzOffsetMs(new Date(result), tz);
  return new Date(offset2 === offset ? result : guess - offset2);
}

/** Formatting locale: Arabic with Arabic-Indic digits, Arabic with Western digits, or English. */
export type FmtLocale = "ar" | "ar-latn" | "en";

const LOCALE_TAG: Record<FmtLocale, string> = { ar: "ar-u-nu-arab", "ar-latn": "ar-u-nu-latn", en: "en-GB" };
export const localeTag = (locale: FmtLocale) => LOCALE_TAG[locale];

/** Picks the formatting locale from the invitation language and digit preference. */
export function fmtLocale(locale: FmtLocale, numerals?: "arab" | "latn"): FmtLocale {
  if (locale === "en") return "en";
  return numerals === "latn" ? "ar-latn" : "ar";
}

export function formatGregorian(local: string, locale: FmtLocale) {
  const [d] = local.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, day, 12));
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatHijri(local: string, locale: FmtLocale) {
  const [d] = local.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, day, 12));
  const tag =
    locale === "en" ? "en-u-ca-islamic-umalqura" : `ar-SA-u-ca-islamic-umalqura-nu-${locale === "ar-latn" ? "latn" : "arab"}`;
  try {
    return new Intl.DateTimeFormat(tag, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
  } catch {
    return "";
  }
}

export function formatTime(local: string, locale: FmtLocale) {
  const [, t = "00:00"] = local.split("T");
  const [hh, mm] = t.split(":").map(Number);
  const date = new Date(Date.UTC(2000, 0, 1, hh, mm));
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(date);
}

export function formatDayNumber(local: string) {
  return local.slice(8, 10);
}

export function formatNumber(n: number, locale: FmtLocale) {
  return new Intl.NumberFormat(LOCALE_TAG[locale]).format(n);
}

/** Formats a Date as UTC basic format for iCalendar / Google Calendar. */
export function toIcsUtc(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
