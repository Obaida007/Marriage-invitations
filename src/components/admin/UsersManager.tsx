"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui/controls";
import { CopyButton } from "@/components/manage/CopyButton";

export interface UserRow {
  id: string;
  username: string;
  name: string;
  phone: string | null;
  role: "admin" | "owner";
  active: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  invitations: number;
}

/** Shows a one-time password with a copyable login message. */
function Credentials({ username, password, onClose }: { username: string; password: string; onClose: () => void }) {
  const message = `بيانات الدخول لإدارة دعوتك:\nالرابط: ${typeof window !== "undefined" ? window.location.origin : ""}/login\nاسم المستخدم: ${username}\nكلمة المرور المؤقتة: ${password}\n(سيُطلب منك تغييرها عند أول دخول)`;
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="font-bold text-emerald-900">✓ بيانات الدخول — تظهر مرة واحدة فقط</p>
      <div className="mt-2 grid gap-1 text-sm" dir="ltr">
        <span>
          username: <b>{username}</b>
        </span>
        <span>
          password: <b className="font-mono">{password}</b>
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <CopyButton text={message} label="نسخ رسالة الدخول" />
        <a className="btn bg-[#25D366] text-white" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(message)}`}>
          إرسال عبر واتساب
        </a>
        <button type="button" className="btn-ghost" onClick={onClose}>
          تم
        </button>
      </div>
    </div>
  );
}

export function UsersManager({ initial, currentUserId }: { initial: UserRow[]; currentUserId: string }) {
  const [users, setUsers] = useState(initial);
  const [form, setForm] = useState({ username: "", name: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [creds, setCreds] = useState<{ username: string; password: string } | null>(null);
  const [query, setQuery] = useState("");

  async function refresh() {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers((await res.json()).users);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCreds({ username: data.user.username, password: data.tempPassword });
      setForm({ username: "", name: "", phone: "" });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر الإنشاء");
    } finally {
      setBusy(false);
    }
  }

  async function patch(u: UserRow, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) return alert(data.error);
    if (data.tempPassword) setCreds({ username: u.username, password: data.tempPassword });
    refresh();
  }

  async function remove(u: UserRow) {
    if (!confirm(`حذف الحساب ${u.username}؟ سيفقد الوصول لكل دعواته.`)) return;
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    if (res.ok) refresh();
  }

  const filtered = users.filter((u) => !query || u.username.includes(query.toLowerCase()) || u.name.includes(query) || (u.phone ?? "").includes(query));

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-4">
        <form onSubmit={create} className="card space-y-3 p-5">
          <h2 className="font-bold">➕ حساب جديد لصاحب مناسبة</h2>
          <input className="input" placeholder="الاسم (مثال: محمد أحمد)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" dir="ltr" placeholder="username" autoCapitalize="none" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} required />
          <input className="input" dir="ltr" placeholder="رقم الجوال (اختياري)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy && <Spinner />} إنشاء الحساب
          </button>
          <p className="text-xs text-stone-500">تُولَّد كلمة مرور مؤقتة، ويُطلب من المستخدم تغييرها عند أول دخول. بعدها اربطه بدعوته من لوحة الدعوة ← «الوصول».</p>
        </form>
        {creds && <Credentials {...creds} onClose={() => setCreds(null)} />}
      </div>

      <div className="space-y-3">
        <input className="input max-w-xs" placeholder="🔍 بحث" value={query} onChange={(e) => setQuery(e.target.value)} />
        <ul className="space-y-2">
          {filtered.map((u) => (
            <li key={u.id} className={`card flex flex-wrap items-center justify-between gap-3 p-4 ${u.active ? "" : "opacity-60"}`}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <b>{u.name}</b>
                  <span className="font-mono text-sm text-stone-500" dir="ltr">
                    {u.username}
                  </span>
                  {u.role === "admin" && <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[11px] font-bold text-white">مدير</span>}
                  {!u.active && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">موقوف</span>}
                  {u.mustChangePassword && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">كلمة مرور مؤقتة</span>}
                </div>
                <div className="mt-1 text-xs text-stone-500">
                  {u.role === "owner" && <>الدعوات: {u.invitations} · </>}
                  آخر دخول: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("ar-u-nu-latn") : "لم يدخل بعد"}
                  {u.phone && (
                    <>
                      {" "}
                      · <span dir="ltr">{u.phone}</span>
                    </>
                  )}
                </div>
              </div>
              {u.id !== currentUserId && (
                <div className="flex flex-wrap gap-1.5">
                  <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => confirm(`إعادة تعيين كلمة مرور ${u.username}؟`) && patch(u, { resetPassword: true })}>
                    كلمة مرور جديدة
                  </button>
                  <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => patch(u, { active: !u.active })}>
                    {u.active ? "إيقاف" : "تفعيل"}
                  </button>
                  <button className="btn-ghost px-3 py-1.5 text-xs text-red-600" onClick={() => remove(u)}>
                    حذف
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
