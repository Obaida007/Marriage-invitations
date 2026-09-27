"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_MEMBERS } from "@/lib/permissions";
import { Spinner } from "@/components/ui/controls";

export interface Member {
  id: string;
  username: string;
  name: string;
  phone: string | null;
  active: boolean;
  lastLoginAt: string | null;
}

/** Local "YYYY-MM-DDTHH:mm" for a datetime-local input. */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AccessPanel({
  invitationId,
  initialMembers,
  initialMaxGuests,
  initialUnlockUntil,
  lockAt,
}: {
  invitationId: string;
  initialMembers: Member[];
  initialMaxGuests: number | null;
  initialUnlockUntil: string | null;
  lockAt: string;
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [maxGuests, setMaxGuests] = useState(initialMaxGuests?.toString() ?? "");
  const [unlockUntil, setUnlockUntil] = useState(toLocalInput(initialUnlockUntil));
  const [saved, setSaved] = useState("");

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/invitations/${invitationId}/members`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMembers(data.members);
      setUsername("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذرت الإضافة");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(m: Member) {
    if (!confirm(`إزالة وصول ${m.name} لهذه الدعوة؟`)) return;
    const res = await fetch(`/api/invitations/${invitationId}/members?userId=${m.id}`, { method: "DELETE" });
    if (res.ok) setMembers((await res.json()).members);
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaved("");
    const res = await fetch(`/api/invitations/${invitationId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        maxGuests: maxGuests ? Number(maxGuests) : null,
        unlockUntil: unlockUntil ? new Date(unlockUntil).toISOString() : null,
      }),
    });
    const data = await res.json();
    setSaved(res.ok ? "✓ تم الحفظ" : data.error);
    if (res.ok) router.refresh();
  }

  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
      <div className="card space-y-4 p-5">
        <div>
          <h2 className="font-bold">👥 مستخدمو هذه الدعوة ({members.length}/{MAX_MEMBERS})</h2>
          <p className="text-sm text-stone-600">يستطيعون تعديل الدعوة (عدا التاريخ والأسماء والرابط)، وإدارة المدعوين، ومتابعة الردود والتهاني — حتى انتهاء المناسبة.</p>
        </div>
        {members.length === 0 ? (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">لا يوجد مستخدمون بعد.</p>
        ) : (
          <ul className="divide-y divide-line">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <b>{m.name}</b>{" "}
                  <span className="font-mono text-sm text-stone-500" dir="ltr">
                    {m.username}
                  </span>
                  {!m.active && <span className="ms-2 rounded-full bg-red-100 px-2 text-[11px] text-red-700">موقوف</span>}
                  <div className="text-xs text-stone-500">آخر دخول: {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleString("ar-u-nu-latn") : "لم يدخل بعد"}</div>
                </div>
                <button className="text-sm text-red-600 hover:underline" onClick={() => removeMember(m)}>
                  إزالة
                </button>
              </li>
            ))}
          </ul>
        )}
        {members.length < MAX_MEMBERS && (
          <form onSubmit={addMember} className="flex gap-2">
            <input className="input" dir="ltr" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} required />
            <button className="btn-primary shrink-0" disabled={busy}>
              {busy && <Spinner />} إضافة
            </button>
          </form>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-stone-500">
          أنشئ الحسابات من <a href="/admin" className="underline">لوحة الإدارة ← المستخدمون</a>. يمكن لنفس المستخدم أن يُربط بأكثر من مناسبة وتظهر له في «دعواتي».
        </p>
      </div>

      <form onSubmit={saveSettings} className="card space-y-4 p-5">
        <h2 className="font-bold">⚙️ حدود الدعوة</h2>
        <label className="block">
          <span className="label">الحد الأقصى لعدد المدعوين</span>
          <input type="number" min={1} max={10000} className="input" placeholder="بدون حد" value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} />
          <span className="mt-1 block text-xs text-stone-500">عدد بطاقات الدعوة (الأسماء) المسموح إضافتها حسب الباقة.</span>
        </label>
        <div className="rounded-xl bg-soft/70 p-3 text-sm">
          🔒 تُقفل الدعوة لأصحابها تلقائياً في <b>{new Date(lockAt).toLocaleString("ar-u-nu-latn")}</b> (نهاية يوم المناسبة).
        </div>
        <label className="block">
          <span className="label">السماح بالتعديل مؤقتاً حتى (اختياري)</span>
          <input type="datetime-local" className="input" value={unlockUntil} onChange={(e) => setUnlockUntil(e.target.value)} />
          <span className="mt-1 block text-xs text-stone-500">لفتح التعديل استثنائياً بعد انتهاء المناسبة (مثلاً لتصحيح أو إضافة صور). اتركه فارغاً للإلغاء.</span>
        </label>
        <div className="flex items-center gap-3">
          <button className="btn-primary">حفظ</button>
          {saved && <span className="text-sm text-stone-600">{saved}</span>}
        </div>
      </form>
    </div>
  );
}
