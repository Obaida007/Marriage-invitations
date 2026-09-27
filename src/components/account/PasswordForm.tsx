"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/controls";

export function PasswordForm({ forced, minLength }: { forced: boolean; minLength: number }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) return setError("كلمتا المرور غير متطابقتين");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ current, next }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(data.next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "تعذر تغيير كلمة المرور");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-soft text-2xl">🔑</div>
        <h1 className="text-xl font-extrabold">{forced ? "اختر كلمة مرور جديدة" : "تغيير كلمة المرور"}</h1>
        {forced && <p className="mt-1 text-sm text-stone-600">لأمان حسابك، يجب استبدال كلمة المرور المؤقتة قبل المتابعة.</p>}
      </div>
      <label className="block">
        <span className="label">{forced ? "كلمة المرور المؤقتة" : "كلمة المرور الحالية"}</span>
        <input className="input" dir="ltr" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </label>
      <label className="block">
        <span className="label">كلمة المرور الجديدة</span>
        <input className="input" dir="ltr" type="password" autoComplete="new-password" minLength={minLength} value={next} onChange={(e) => setNext(e.target.value)} required />
        <span className="mt-1 block text-xs text-stone-500">{minLength} أحرف على الأقل، ولا تحتوي اسم المستخدم</span>
      </label>
      <label className="block">
        <span className="label">تأكيد كلمة المرور</span>
        <input className="input" dir="ltr" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </label>
      {error && <p className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>
        {busy && <Spinner />} حفظ
      </button>
    </form>
  );
}
