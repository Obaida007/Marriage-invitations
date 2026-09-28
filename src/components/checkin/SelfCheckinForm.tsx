"use client";

import { useEffect, useState } from "react";

type Result = { status: "checked-in" | "already"; name: string; count?: number; invited?: boolean };

export function SelfCheckinForm({ code, title }: { code: string; title: string }) {
  const storageKey = `checkin:${code}`;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [count, setCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  // A guest who already checked in on this phone sees their confirmation again.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore from device storage after hydration
      if (saved) setResult({ ...JSON.parse(saved), status: "already" });
    } catch {}
  }, [storageKey]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkin/self", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, name, phone, count }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      try {
        localStorage.setItem(storageKey, JSON.stringify({ name: data.name, count: data.count }));
      } catch {}
      navigator.vibrate?.(120);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "تعذر التسجيل، حاول مجدداً");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-inv-accent text-4xl text-inv-surface shadow-lg">✓</div>
        <h2 className="mt-5 font-heading text-3xl text-inv-accent">{result.status === "already" ? "حضورك مسجّل" : "أهلاً وسهلاً"}</h2>
        <p className="mt-2 font-body text-2xl">{result.name}</p>
        {result.count && result.count > 1 && <p className="mt-1 font-sans text-sm text-inv-muted">{result.count} أشخاص</p>}
        <p className="mt-6 font-body text-lg text-inv-muted">نورتم {title} 🤍</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 font-sans">
      <input className="inv-input" placeholder="الاسم الكريم" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" />
      <input
        className="inv-input"
        placeholder="رقم الجوال"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
        inputMode="tel"
        autoComplete="tel"
        dir="ltr"
        style={{ textAlign: "right" }}
        maxLength={30}
      />
      <div className="flex items-center justify-between gap-3 rounded-[var(--inv-radius-sm)] border border-inv-border bg-inv-bg px-4 py-2.5">
        <span className="text-sm">عدد الحضور معك (بما فيهم أنت)</span>
        <div className="flex items-center gap-3">
          <button type="button" className="h-9 w-9 rounded-full border border-inv-border text-lg" onClick={() => setCount((c) => Math.max(1, c - 1))} aria-label="-">
            −
          </button>
          <span className="w-6 text-center text-lg font-bold tabular-nums">{count}</span>
          <button type="button" className="h-9 w-9 rounded-full border border-inv-border text-lg" onClick={() => setCount((c) => Math.min(50, c + 1))} aria-label="+">
            +
          </button>
        </div>
      </div>
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
      <button className="inv-btn w-full py-3 text-base" disabled={busy}>
        {busy ? "جارٍ التسجيل…" : "تسجيل الحضور"}
      </button>
      <p className="text-center text-xs text-inv-muted">إن كنت مدعواً برقمك، سنتعرف عليك تلقائياً.</p>
    </form>
  );
}
