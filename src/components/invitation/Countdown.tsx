"use client";

import { useEffect, useState } from "react";
import { formatNumber, type FmtLocale } from "@/lib/dates";
import type { Dict } from "@/lib/i18n";
import type { CountdownStyle } from "@/lib/themes";

export function Countdown({ target, locale, d, variant = "boxes" }: { target: number; locale: FmtLocale; d: Dict; variant?: CountdownStyle }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start ticking only after mount to avoid hydration mismatch
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = now === null ? null : Math.max(0, target - now);
  if (diff === 0) {
    return <p className="font-heading text-2xl text-inv-accent">{d.eventStarted}</p>;
  }
  const parts = [
    { v: diff === null ? null : Math.floor(diff / 86400000), l: d.days, max: 365 },
    { v: diff === null ? null : Math.floor(diff / 3600000) % 24, l: d.hours, max: 24 },
    { v: diff === null ? null : Math.floor(diff / 60000) % 60, l: d.minutes, max: 60 },
    { v: diff === null ? null : Math.floor(diff / 1000) % 60, l: d.seconds, max: 60 },
  ];
  const num = (v: number | null) => (v === null ? "–" : formatNumber(v, locale));

  if (variant === "circles") {
    const r = 26;
    const c = 2 * Math.PI * r;
    return (
      <div className="grid grid-cols-4 gap-2" role="timer" aria-live="off">
        {parts.map((p) => (
          <div key={p.l} className="flex flex-col items-center">
            <div className="relative h-[68px] w-[68px] sm:h-20 sm:w-20">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 60 60" aria-hidden>
                <circle cx="30" cy="30" r={r} fill="none" stroke="var(--inv-border)" strokeWidth="2.5" />
                <circle
                  cx="30"
                  cy="30"
                  r={r}
                  fill="none"
                  stroke="var(--inv-accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={c}
                  strokeDashoffset={p.v === null ? c : c * (1 - Math.min(p.v, p.max) / p.max)}
                  style={{ transition: "stroke-dashoffset .6s ease" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-heading text-2xl tabular-nums text-inv-accent sm:text-3xl">{num(p.v)}</span>
            </div>
            <span className="mt-1.5 font-sans text-xs text-inv-muted">{p.l}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className="flex items-start justify-center gap-2 sm:gap-4" role="timer" aria-live="off" dir="ltr">
        {(locale !== "en" ? [...parts].reverse() : parts).map((p, i) => (
          <div key={p.l} className="flex items-start gap-2 sm:gap-4">
            {i > 0 && <span className="font-heading text-4xl leading-none text-inv-accent/50 sm:text-5xl">:</span>}
            <div className="text-center">
              <div className="font-heading text-4xl leading-none tabular-nums text-inv-accent sm:text-5xl">{num(p.v)}</div>
              <div className="mt-2 font-sans text-[11px] uppercase tracking-wider text-inv-muted">{p.l}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3" role="timer" aria-live="off">
      {parts.map((p) => (
        <div key={p.l} className="rounded-[var(--inv-radius-sm)] border border-inv-border bg-inv-bg px-1 py-3 text-center">
          <div className="font-heading text-3xl tabular-nums text-inv-accent sm:text-4xl">{num(p.v)}</div>
          <div className="mt-1 font-sans text-xs text-inv-muted">{p.l}</div>
        </div>
      ))}
    </div>
  );
}
