"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { Dict } from "@/lib/i18n";
import { formatNumber, type FmtLocale } from "@/lib/dates";

export function GuestPass({
  url,
  token,
  name,
  count,
  locale,
  d,
}: {
  url: string;
  token: string;
  name: string;
  count: number;
  locale: FmtLocale;
  d: Dict;
}) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement.querySelector(".inv-root") ?? document.body);
    QRCode.toDataURL(url, {
      margin: 1,
      width: 480,
      errorCorrectionLevel: "M",
      color: { dark: styles.getPropertyValue("--inv-text").trim() || "#000000", light: "#ffffff" },
    }).then(setSrc, () => setSrc(""));
  }, [url]);

  return (
    <div className="mx-auto max-w-xs rounded-[var(--inv-radius)] border-2 border-dashed border-inv-accent/60 bg-inv-bg p-5 text-center">
      <p className="font-heading text-xl text-inv-accent">{d.passTitle}</p>
      <p className="mt-1 font-body text-lg">{name}</p>
      <div className="mx-auto mt-3 aspect-square w-48 overflow-hidden rounded-[var(--inv-radius-sm)] bg-white p-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL */}
        {src && <img src={src} alt={`QR ${token}`} className="h-full w-full" />}
      </div>
      <p className="mt-3 font-mono text-lg tracking-[.3em]" dir="ltr">
        {token}
      </p>
      <p className="mt-1 font-sans text-sm text-inv-muted">
        {formatNumber(count, locale)} {d.guests} · {d.passHint}
      </p>
    </div>
  );
}
