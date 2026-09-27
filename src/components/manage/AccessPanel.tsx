"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [accounts, setAccounts] = useState<(Member & { role: string })[] | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [maxGuests, setMaxGuests] = useState(initialMaxGuests?.toString() ?? "");
  const [unlockUntil, setUnlockUntil] = useState(toLocalInput(initialUnlockUntil));
  const [saved, setSaved] = useState("");

  // Members are picked from existing accounts only (no free typing).
  const loadAccounts = () =>
    fetch("/api/admin/users")
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((d) => setAccounts(d.users))
      .catch(() => setAccounts([]));
  useEffect(() => {
    loadAccounts();
  }, []);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (accounts ?? [])
      .filter((a) => a.role === "owner" && a.active && !members.some((m) => m.id === a.id))
      .filter((a) => !q || a.username.includes(q) || a.name.toLowerCase().includes(q) || (a.phone ?? "").includes(q));
  }, [accounts, members, query]);

  async function addMember(userId: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/invitations/${invitationId}/members`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMembers(data.members);
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذرت الإضافة");
      // The list may be stale (account deleted or deactivated in another tab).
      loadAccounts();
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
          <div className="space-y-2 rounded-xl border border-line p-3">
            <span className="text-sm font-bold">اختر مستخدماً لإضافته</span>
            <input className="input" placeholder="🔍 ابحث بالاسم أو اسم المستخدم أو الجوال" value={query} onChange={(e) => setQuery(e.target.value)} />
            {accounts === null ? (
              <p className="text-sm text-stone-500">جارٍ التحميل…</p>
            ) : candidates.length === 0 ? (
              <p className="text-sm text-stone-500">{query ? "لا يوجد مستخدم مطابق." : "لا يوجد مستخدمون متاحون."} أنشئ حساباً جديداً من لوحة الإدارة ← المستخدمون.</p>
            ) : (
              <ul className="max-h-56 divide-y divide-line overflow-y-auto rounded-lg border border-line" role="listbox" aria-label="المستخدمون المتاحون">
                {candidates.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      disabled={busy}
                      onClick={() => addMember(a.id)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-start hover:bg-soft disabled:opacity-50"
                    >
                      <span>
                        <b className="text-sm">{a.name}</b>{" "}
                        <span className="font-mono text-xs text-stone-500" dir="ltr">
                          {a.username}
                        </span>
                        {a.phone && (
                          <span className="ms-2 text-xs text-stone-400" dir="ltr">
                            {a.phone}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs font-bold text-brand-dark">{busy ? <Spinner /> : "+ إضافة"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
