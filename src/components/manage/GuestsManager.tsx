"use client";

import { useEffect, useMemo, useState } from "react";
import type { GuestStats } from "@/lib/data";
import { Spinner } from "@/components/ui/controls";
import { CopyButton } from "./CopyButton";

export interface GuestRow {
  id: string;
  token: string;
  name: string;
  phone: string | null;
  side: "groom" | "bride" | "both";
  maxCompanions: number;
  status: "pending" | "attending" | "declined";
  attendingCount: number;
  note: string | null;
  source: "list" | "public";
  openedAt: string | null;
  respondedAt: string | null;
  checkedInAt: string | null;
  createdAt: string;
}

const SIDE_LABEL = { groom: "أهل العريس", bride: "أهل العروس", both: "مشترك" } as const;
const STATUS = {
  pending: { label: "لم يرد", cls: "bg-stone-100 text-stone-600" },
  attending: { label: "سيحضر", cls: "bg-emerald-100 text-emerald-800" },
  declined: { label: "معتذر", cls: "bg-rose-100 text-rose-700" },
} as const;

const DEFAULT_TEMPLATE = "السلام عليكم {الاسم} 🌸\nيسعدنا ويشرفنا دعوتكم لحضور حفل زفاف {العروسين}\nتفاصيل الدعوة وتأكيد الحضور من الرابط:\n{الرابط}";

/** Parses "name, phone, companions" per line (comma, tab or Arabic comma separated). */
function parseBulk(text: string, side: GuestRow["side"], defaultCompanions: number) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, phone = "", comp] = line.split(/\s*[,،\t]\s*/);
      const n = Number(comp);
      return { name: name.slice(0, 80), phone: phone.slice(0, 30), side, maxCompanions: Number.isFinite(n) && comp ? Math.max(0, Math.min(20, n)) : defaultCompanions };
    })
    .filter((g) => g.name);
}

function waNumber(phone: string | null) {
  return (phone ?? "").replace(/[^\d]/g, "").replace(/^00/, "");
}

export function GuestsManager({
  invitationId,
  slug,
  title,
  origin,
  guests,
  setGuests,
  stats,
  readOnly = false,
  maxGuests = null,
}: {
  invitationId: string;
  slug: string;
  title: string;
  origin: string;
  guests: GuestRow[];
  setGuests: React.Dispatch<React.SetStateAction<GuestRow[]>>;
  stats: GuestStats;
  readOnly?: boolean;
  maxGuests?: number | null;
}) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [side, setSide] = useState<GuestRow["side"]>("both");
  const [companions, setCompanions] = useState(0);
  const [bulk, setBulk] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | GuestRow["status"]>("all");
  const [sideFilter, setSideFilter] = useState<"all" | GuestRow["side"]>("all");
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [showTemplate, setShowTemplate] = useState(false);
  const [editing, setEditing] = useState<GuestRow | null>(null);

  const templateKey = `wa-template:${invitationId}`;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(templateKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- load the saved template from this device after hydration
      if (saved) setTemplate(saved);
    } catch {}
  }, [templateKey]);

  const guestUrl = (g: GuestRow) => `${origin}/i/${slug}?g=${g.token}`;
  const message = (g: GuestRow) => template.replaceAll("{الاسم}", g.name).replaceAll("{العروسين}", title).replaceAll("{الرابط}", guestUrl(g));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests.filter(
      (g) =>
        (statusFilter === "all" || g.status === statusFilter) &&
        (sideFilter === "all" || g.side === sideFilter) &&
        (!q || g.name.toLowerCase().includes(q) || (g.phone ?? "").includes(q) || g.token.toLowerCase().includes(q)),
    );
  }, [guests, query, statusFilter, sideFilter]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = mode === "single" ? { name, phone, side, maxCompanions: companions } : { guests: parseBulk(bulk, side, companions) };
    if (mode === "bulk" && (payload as { guests: unknown[] }).guests.length === 0) return setError("أدخل اسماً واحداً على الأقل");
    setBusy(true);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/guests`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const created: GuestRow[] = data.guests.map(normalize);
      setGuests((l) => [...created, ...l]);
      setName("");
      setPhone("");
      setBulk("");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "تعذرت الإضافة");
    } finally {
      setBusy(false);
    }
  }

  async function update(g: GuestRow, body: Record<string, unknown>) {
    const res = await fetch(`/api/invitations/${invitationId}/guests/${g.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) setGuests((l) => l.map((x) => (x.id === g.id ? normalize(data.guest) : x)));
    return res.ok;
  }

  async function remove(g: GuestRow) {
    if (!confirm(`حذف ${g.name}؟`)) return;
    const res = await fetch(`/api/invitations/${invitationId}/guests/${g.id}`, { method: "DELETE" });
    if (res.ok) setGuests((l) => l.filter((x) => x.id !== g.id));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      {/* Add guests */}
      <div className="space-y-4">
        {maxGuests != null && (
          <div className={`card p-4 text-sm ${guests.length >= maxGuests ? "border-amber-300 bg-amber-50" : ""}`}>
            <div className="mb-1.5 flex justify-between">
              <span className="font-bold">المدعوون حسب الباقة</span>
              <span>
                {guests.length} / {maxGuests}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full bg-brand" style={{ width: `${Math.min(100, (guests.length / maxGuests) * 100)}%` }} />
            </div>
          </div>
        )}
        {readOnly && <div className="card p-4 text-sm text-stone-600">🔒 القائمة للعرض فقط بعد انتهاء المناسبة.</div>}
        {!readOnly && (
        <form onSubmit={add} className="card space-y-4 p-5">
          <div className="flex gap-1 rounded-xl bg-soft p-1">
            {(["single", "bulk"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={`flex-1 rounded-lg py-2 text-sm font-bold ${mode === m ? "bg-white shadow-sm" : "text-stone-500"}`}>
                {m === "single" ? "ضيف واحد" : "إضافة جماعية"}
              </button>
            ))}
          </div>
          {mode === "single" ? (
            <>
              <input className="input" placeholder="اسم الضيف (كما سيظهر في الدعوة)" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
              <input className="input" placeholder="رقم الجوال (للإرسال عبر واتساب)" dir="ltr" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
            </>
          ) : (
            <div>
              <textarea
                className="input min-h-40 font-mono text-sm"
                placeholder={"اسم في كل سطر، ويمكن إضافة الجوال وعدد المرافقين:\nأبو محمد, 966500000000, 3\nعائلة الأحمد, 966511111111\nأ. سعاد"}
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
              />
              <p className="mt-1 text-xs text-stone-500">يمكنك النسخ واللصق مباشرة من Excel (الاسم، الجوال، المرافقون).</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="label">الجهة</span>
              <select className="input" value={side} onChange={(e) => setSide(e.target.value as GuestRow["side"])}>
                {Object.entries(SIDE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">المرافقون</span>
              <input type="number" min={0} max={20} className="input" value={companions} onChange={(e) => setCompanions(Math.max(0, Math.min(20, Number(e.target.value) || 0)))} />
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy && <Spinner />} إضافة
          </button>
        </form>
        )}

        {!readOnly && (
        <div className="card space-y-3 p-5">
          <button type="button" className="flex w-full items-center justify-between font-bold" onClick={() => setShowTemplate((v) => !v)}>
            💬 نص رسالة واتساب
            <span className="text-sm font-normal text-brand-dark">{showTemplate ? "إخفاء" : "تعديل"}</span>
          </button>
          {showTemplate && (
            <>
              <textarea
                className="input min-h-36 text-sm"
                value={template}
                onChange={(e) => {
                  setTemplate(e.target.value);
                  try {
                    localStorage.setItem(templateKey, e.target.value);
                  } catch {}
                }}
              />
              <p className="text-xs text-stone-500">
                المتغيرات: <code>{"{الاسم}"}</code> <code>{"{العروسين}"}</code> <code>{"{الرابط}"}</code>
              </p>
              <button type="button" className="text-xs text-stone-500 underline" onClick={() => setTemplate(DEFAULT_TEMPLATE)}>
                استعادة النص الافتراضي
              </button>
            </>
          )}
        </div>
        )}

        <div className="card grid grid-cols-3 divide-x divide-line p-0 text-center">
          <MiniStat label="ضيف" value={stats.total} />
          <MiniStat label="مقعد مدعو" value={stats.invitedSeats} />
          <MiniStat label="حضور مؤكد" value={stats.headcount} />
        </div>
      </div>

      {/* Guest list */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input className="input max-w-xs flex-1" placeholder="🔍 بحث بالاسم أو الجوال أو الرمز" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="all">كل الحالات</option>
            <option value="attending">سيحضر</option>
            <option value="declined">معتذر</option>
            <option value="pending">لم يرد</option>
          </select>
          <select className="input w-auto" value={sideFilter} onChange={(e) => setSideFilter(e.target.value as typeof sideFilter)}>
            <option value="all">كل الجهات</option>
            {Object.entries(SIDE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <a className="btn-ghost ms-auto" href={`/api/invitations/${invitationId}/export`}>
            ⬇️ تصدير Excel
          </a>
        </div>

        {filtered.length === 0 ? (
          <div className="card p-10 text-center text-stone-500">{guests.length === 0 ? (readOnly ? "لا يوجد مدعوون" : "لم تتم إضافة ضيوف بعد. أضف أول ضيف من النموذج 👈") : "لا توجد نتائج مطابقة"}</div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((g) => (
              <li key={g.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-stone-800">{g.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS[g.status].cls}`}>
                        {STATUS[g.status].label}
                        {g.status === "attending" && ` · ${g.attendingCount}`}
                      </span>
                      {g.source === "public" && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800">من الرابط العام</span>}
                      {g.checkedInAt && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-800">✓ حضر</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-stone-500">
                      <span>{SIDE_LABEL[g.side]}</span>
                      <span>يسمح بـ {g.maxCompanions + 1} {g.maxCompanions ? "أشخاص" : "شخص"}</span>
                      {g.phone && <span dir="ltr">{g.phone}</span>}
                      <span className="font-mono">{g.token}</span>
                      <span>{g.openedAt ? "👁️ فتح الدعوة" : "لم يفتح بعد"}</span>
                    </div>
                    {g.note && <p className="mt-2 rounded-lg bg-soft px-3 py-1.5 text-sm text-stone-700">📝 {g.note}</p>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {!readOnly && (
                    <a
                      className="btn bg-[#25D366] px-3 py-2 text-white hover:brightness-95"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`https://wa.me/${waNumber(g.phone)}?text=${encodeURIComponent(message(g))}`}
                      title={g.phone ? "إرسال عبر واتساب" : "لا يوجد رقم — سيُطلب اختيار جهة الاتصال"}
                    >
                      واتساب
                    </a>
                    )}
                    <CopyButton text={guestUrl(g)} label="نسخ الرابط" className="btn-ghost px-3 py-2" />
                    {!readOnly && (
                      <>
                        <button className="btn-ghost px-3 py-2" onClick={() => setEditing(g)}>
                          تعديل
                        </button>
                        <button className="btn-ghost px-3 py-2 text-red-600" onClick={() => remove(g)} aria-label="حذف">
                          🗑
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && <EditGuestDialog guest={editing} onClose={() => setEditing(null)} onSave={async (body) => (await update(editing, body)) && setEditing(null)} />}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3">
      <div className="text-xl font-extrabold tabular-nums">{value}</div>
      <div className="text-[11px] text-stone-500">{label}</div>
    </div>
  );
}

function EditGuestDialog({ guest, onClose, onSave }: { guest: GuestRow; onClose: () => void; onSave: (body: Record<string, unknown>) => Promise<unknown> }) {
  const [form, setForm] = useState({
    name: guest.name,
    phone: guest.phone ?? "",
    side: guest.side,
    maxCompanions: guest.maxCompanions,
    status: guest.status,
    attendingCount: guest.attendingCount,
  });
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <form
        className="card w-full max-w-md space-y-4 p-5"
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          await onSave({ ...form, attendingCount: form.status === "attending" ? Math.max(1, form.attendingCount) : 0 });
          setBusy(false);
        }}
      >
        <h3 className="text-lg font-extrabold">تعديل بيانات الضيف</h3>
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} />
        <input className="input" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="رقم الجوال" maxLength={30} />
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="label">الجهة</span>
            <select className="input" value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value as GuestRow["side"] })}>
              {Object.entries(SIDE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">المرافقون المسموح</span>
            <input type="number" min={0} max={20} className="input" value={form.maxCompanions} onChange={(e) => setForm({ ...form, maxCompanions: Math.max(0, Math.min(20, Number(e.target.value) || 0)) })} />
          </label>
          <label>
            <span className="label">الحالة</span>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as GuestRow["status"] })}>
              <option value="pending">لم يرد</option>
              <option value="attending">سيحضر</option>
              <option value="declined">معتذر</option>
            </select>
          </label>
          {form.status === "attending" && (
            <label>
              <span className="label">عدد الحضور</span>
              <input type="number" min={1} max={21} className="input" value={form.attendingCount} onChange={(e) => setForm({ ...form, attendingCount: Math.max(1, Math.min(21, Number(e.target.value) || 1)) })} />
            </label>
          )}
        </div>
        <div className="flex gap-2">
          <button className="btn-primary flex-1" disabled={busy}>
            {busy && <Spinner />} حفظ
          </button>
          <button type="button" className="btn-ghost" onClick={onClose}>
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}

export function normalize(g: Record<string, unknown>): GuestRow {
  const iso = (v: unknown) => (v == null ? null : typeof v === "number" ? new Date(v * 1000).toISOString() : String(v));
  return {
    ...(g as unknown as GuestRow),
    openedAt: iso(g.openedAt),
    respondedAt: iso(g.respondedAt),
    checkedInAt: iso(g.checkedInAt),
    createdAt: iso(g.createdAt) ?? new Date().toISOString(),
  };
}
