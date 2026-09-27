import type { DateStyle } from "@/lib/themes";
import { formatDayNumber, formatGregorian, formatHijri, formatNumber, formatTime } from "@/lib/dates";

const TAG = { ar: "ar-u-nu-arab", en: "en-GB" } as const;

function parts(local: string) {
  const [y, m, d] = local.slice(0, 10).split("-").map(Number);
  return { y, m, d, date: new Date(Date.UTC(y, m - 1, d, 12)) };
}

/** The main event date in the hero, in one of several visual styles. */
export function DateBlock({ startsAt, locale, variant, showHijri }: { startsAt: string; locale: "ar" | "en"; variant: DateStyle; showHijri: boolean }) {
  const { y, m, d, date } = parts(startsAt);
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(TAG[locale], { ...o, timeZone: "UTC" }).format(date);
  const hijri = showHijri ? formatHijri(startsAt, locale) : "";
  const hijriLine = hijri && <p className="mt-3 font-sans text-sm text-inv-muted">{hijri}</p>;

  if (variant === "calendar") {
    const first = new Date(Date.UTC(y, m - 1, 1));
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const lead = first.getUTCDay(); // Sunday-first grid
    // 2023-01-01 was a Sunday. "narrow" gives the standard one-letter labels (ح ن ث ر خ ج س).
    const weekdays = Array.from({ length: 7 }, (_, i) =>
      new Intl.DateTimeFormat(TAG[locale], { weekday: "narrow", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, 1 + i))),
    );
    const cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    return (
      <div className="mx-auto mt-10 w-full max-w-xs">
        <p className="font-heading text-2xl text-inv-accent">{fmt({ month: "long", year: "numeric" })}</p>
        <div className="mt-3 grid grid-cols-7 gap-y-1.5 font-sans text-sm" dir={locale === "ar" ? "rtl" : "ltr"}>
          {weekdays.map((w, i) => (
            <span key={`w${i}`} className="pb-1 text-[11px] text-inv-muted">
              {w}
            </span>
          ))}
          {cells.map((day, i) =>
            day === null ? (
              <span key={`e${i}`} />
            ) : day === d ? (
              <span key={day} className="relative mx-auto flex h-8 w-8 items-center justify-center font-bold text-inv-surface">
                <svg className="absolute inset-0 h-full w-full text-inv-accent" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 21s-7.5-4.6-9.3-9.6C1.6 8.1 3.6 4.5 7.2 4.5c2 0 3.6 1.2 4.8 2.8 1.2-1.6 2.8-2.8 4.8-2.8 3.6 0 5.6 3.6 4.5 6.9C19.5 16.4 12 21 12 21z" />
                </svg>
                <span className="relative text-xs">{formatNumber(day, locale)}</span>
              </span>
            ) : (
              <span key={day} className="flex h-8 items-center justify-center text-inv-muted">
                {formatNumber(day, locale)}
              </span>
            ),
          )}
        </div>
        <p className="mt-3 font-body text-lg">
          {fmt({ weekday: "long" })} · {formatTime(startsAt, locale)}
        </p>
        {hijriLine}
      </div>
    );
  }

  if (variant === "stacked") {
    const bar = <span className="w-px self-stretch bg-inv-accent/50" />;
    return (
      <div className="mt-10">
        <p className="font-body text-lg tracking-widest text-inv-muted">{fmt({ weekday: "long" })}</p>
        <div className="mx-auto mt-3 flex max-w-sm items-center justify-center gap-4 sm:gap-6">
          <span className="font-heading text-6xl leading-none text-inv-accent sm:text-7xl">{formatNumber(d, locale)}</span>
          {bar}
          <span className="font-heading text-2xl text-inv-accent sm:text-3xl">{fmt({ month: "long" })}</span>
          {bar}
          <span className="font-heading text-3xl text-inv-accent sm:text-4xl">{formatNumber(y, locale).replace(/[٬,]/g, "")}</span>
        </div>
        <p className="mt-3 font-sans text-sm text-inv-muted">{formatTime(startsAt, locale)}</p>
        {hijriLine}
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className="mt-10">
        <p className="font-body text-xl">{formatGregorian(startsAt, locale)}</p>
        <p className="mt-1 font-sans text-sm text-inv-muted">{formatTime(startsAt, locale)}</p>
        {hijriLine}
      </div>
    );
  }

  // ribbon (default)
  return (
    <div>
      <div className="mx-auto mt-10 flex max-w-sm items-center justify-center gap-4 font-body">
        <span className="flex-1 border-y border-inv-accent/50 py-2 text-lg">{fmt({ weekday: "long" })}</span>
        <span className="font-heading text-6xl text-inv-accent">{formatNumber(Number(formatDayNumber(startsAt)), locale)}</span>
        <span className="flex-1 border-y border-inv-accent/50 py-2 text-lg">{fmt({ month: "long", year: "numeric" })}</span>
      </div>
      {hijriLine}
    </div>
  );
}
