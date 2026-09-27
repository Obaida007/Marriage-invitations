"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/dates";
import type { Dict } from "@/lib/i18n";

export function Countdown({ target, locale, d }: { target: number; locale: "ar" | "en"; d: Dict }) {
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
    { v: diff === null ? null : Math.floor(diff / 86400000), l: d.days },
    { v: diff === null ? null : Math.floor(diff / 3600000) % 24, l: d.hours },
    { v: diff === null ? null : Math.floor(diff / 60000) % 60, l: d.minutes },
    { v: diff === null ? null : Math.floor(diff / 1000) % 60, l: d.seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3" role="timer" aria-live="off">
      {parts.map((p) => (
        <div key={p.l} className="rounded-[var(--inv-radius-sm)] border border-inv-border bg-inv-bg px-1 py-3 text-center">
          <div className="font-heading text-3xl tabular-nums text-inv-accent sm:text-4xl">
            {p.v === null ? "–" : formatNumber(p.v, locale)}
          </div>
          <div className="mt-1 font-sans text-xs text-inv-muted">{p.l}</div>
        </div>
      ))}
    </div>
  );
}
