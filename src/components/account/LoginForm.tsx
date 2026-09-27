"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/controls";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(data.next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "تعذر تسجيل الدخول");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-soft text-2xl">💍</div>
        <h1 className="text-xl font-extrabold">تسجيل الدخول</h1>
        <p className="mt-1 text-sm text-stone-600">ادخل بالحساب الذي استلمته لإدارة دعوتك</p>
      </div>
      <label className="block">
        <span className="label">اسم المستخدم</span>
        <input className="input" dir="ltr" autoComplete="username" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} required />
      </label>
      <label className="block">
        <span className="label">كلمة المرور</span>
        <input className="input" dir="ltr" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <p className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>
        {busy && <Spinner />} دخول
      </button>
      <p className="text-center text-xs text-stone-500">نسيت كلمة المرور؟ تواصل مع الإدارة لإعادة تعيينها.</p>
    </form>
  );
}
