"use client";

import { useState } from "react";
import type { Dict } from "@/lib/i18n";

export interface PublicWish {
  id: string;
  name: string;
  message: string;
}

export function WishesSection({
  slug,
  guestToken,
  defaultName,
  initial,
  preview,
  d,
}: {
  slug: string;
  guestToken?: string;
  defaultName?: string;
  initial: PublicWish[];
  preview?: boolean;
  d: Dict;
}) {
  const [list, setList] = useState(initial);
  const [name, setName] = useState(defaultName ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (preview) {
      setList((l) => [{ id: String(Date.now()), name, message }, ...l]);
      setMessage("");
      setSent(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, guestToken, name, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setList((l) => [data.wish, ...l]);
      setMessage("");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }

  const visible = showAll ? list : list.slice(0, 6);

  return (
    <div className="space-y-6">
      {sent ? (
        <p className="rounded-2xl bg-inv-accent-soft p-4 text-center font-sans text-inv-accent">{d.wishThanks}</p>
      ) : (
        <form onSubmit={submit} className="space-y-3 font-sans">
          <input className="inv-input" placeholder={d.yourName} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} />
          <textarea className="inv-input min-h-24" placeholder={d.wishPlaceholder} value={message} onChange={(e) => setMessage(e.target.value)} required minLength={2} maxLength={500} />
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          <button className="inv-btn w-full" disabled={busy}>
            {busy ? d.sending : d.sendWish}
          </button>
        </form>
      )}
      {list.length === 0 ? (
        <p className="text-center font-sans text-sm text-inv-muted">{d.noWishes}</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((w) => (
            <li key={w.id} className="rounded-2xl border border-inv-border bg-inv-bg p-4">
              <p className="whitespace-pre-line font-body text-lg leading-relaxed">{w.message}</p>
              <p className="mt-2 font-sans text-sm font-bold text-inv-accent">— {w.name}</p>
            </li>
          ))}
        </ul>
      )}
      {list.length > 6 && !showAll && (
        <button type="button" className="inv-btn-outline mx-auto flex" onClick={() => setShowAll(true)}>
          +{list.length - 6}
        </button>
      )}
    </div>
  );
}
