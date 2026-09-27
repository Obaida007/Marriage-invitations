"use client";

import { useState } from "react";
import type { Dict } from "@/lib/i18n";
import { formatNumber } from "@/lib/dates";
import { Icon } from "./Ornaments";

export interface PublicGuest {
  token: string;
  name: string;
  status: "pending" | "attending" | "declined";
  attendingCount: number;
  maxCompanions: number;
}

export function RsvpSection({
  slug,
  guest,
  onGuest,
  maxCompanions,
  askNote,
  closed,
  guestOnly,
  deadlineLabel,
  preview,
  locale,
  d,
}: {
  slug: string;
  guest: PublicGuest | null;
  onGuest: (g: PublicGuest) => void;
  maxCompanions: number;
  askNote: boolean;
  closed: boolean;
  guestOnly: boolean;
  deadlineLabel?: string;
  preview?: boolean;
  locale: "ar" | "en";
  d: Dict;
}) {
  const responded = guest && guest.status !== "pending";
  const [editing, setEditing] = useState(!responded);
  const [name, setName] = useState(guest?.name ?? "");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"attending" | "declined">(guest?.status === "declined" ? "declined" : "attending");
  const [count, setCount] = useState(Math.max(1, guest?.attendingCount || 1));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const max = (guest?.maxCompanions ?? maxCompanions) + 1;

  if (closed && !responded) return <p className="text-center font-sans text-inv-muted">{d.rsvpClosed}</p>;
  if (guestOnly && !guest) return <p className="text-center font-sans text-inv-muted">{d.rsvpGuestOnly}</p>;

  if (!editing && guest) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-inv-accent-soft text-inv-accent">
          <Icon name={guest.status === "attending" ? "check" : "heart"} className="h-7 w-7" />
        </div>
        <p className="font-body text-xl">{guest.status === "attending" ? d.thanksAttending : d.thanksDeclined}</p>
        {guest.status === "attending" && (
          <p className="mt-1 font-sans text-sm text-inv-muted">
            {formatNumber(guest.attendingCount, locale)} {d.guests}
          </p>
        )}
        {!closed && (
          <button type="button" className="inv-btn-outline mt-5" onClick={() => setEditing(true)}>
            {d.changeResponse}
          </button>
        )}
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (preview) {
      // Demo/preview: simulate a response locally.
      onGuest({ token: "DEMO2026", name: name || guest?.name || "ضيف", status, attendingCount: status === "attending" ? count : 0, maxCompanions: max - 1 });
      setEditing(false);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, guestToken: guest?.token, name: name || guest?.name, phone, status, attendingCount: status === "attending" ? count : 0, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onGuest(data.guest);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "حدث خطأ، حاول مجدداً");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 font-sans">
      {deadlineLabel && (
        <p className="text-center text-sm text-inv-muted">
          {d.rsvpDeadline} {deadlineLabel}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 rounded-full bg-inv-bg p-1 ring-1 ring-inv-border" role="radiogroup">
        {(["attending", "declined"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={status === s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-2.5 text-sm font-bold transition ${status === s ? "bg-inv-accent text-inv-surface shadow" : "text-inv-muted"}`}
          >
            {s === "attending" ? d.attending : d.declined}
          </button>
        ))}
      </div>
      {!(guest && guest.name) && (
        <input className="inv-input" placeholder={d.yourName} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" />
      )}
      {!guest && (
        <input className="inv-input" placeholder={d.phone} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" maxLength={30} dir="ltr" style={{ textAlign: locale === "ar" ? "right" : "left" }} />
      )}
      {status === "attending" && max > 1 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-inv-border bg-inv-bg px-4 py-2.5">
          <span className="text-sm">
            {d.companions}
            <span className="block text-xs text-inv-muted">
              {d.maxAllowed}: {formatNumber(max, locale)}
            </span>
          </span>
          <div className="flex items-center gap-3">
            <button type="button" className="h-9 w-9 rounded-full border border-inv-border text-lg" onClick={() => setCount((c) => Math.max(1, c - 1))} aria-label="-">
              −
            </button>
            <span className="w-6 text-center text-lg font-bold tabular-nums">{formatNumber(count, locale)}</span>
            <button type="button" className="h-9 w-9 rounded-full border border-inv-border text-lg" onClick={() => setCount((c) => Math.min(max, c + 1))} aria-label="+">
              +
            </button>
          </div>
        </div>
      )}
      {askNote && <textarea className="inv-input min-h-20" placeholder={d.noteLabel} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />}
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
      <button type="submit" className="inv-btn w-full" disabled={busy}>
        {busy ? d.sending : d.send}
      </button>
    </form>
  );
}
