"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { InvitationContent } from "@/lib/invitation-schema";
import type { GuestStats } from "@/lib/data";
import { InvitationEditor } from "@/components/editor/InvitationEditor";
import { Toggle } from "@/components/ui/controls";
import { GuestsManager, type GuestRow } from "./GuestsManager";
import { WishesManager, type WishRow } from "./WishesManager";
import { CheckinPanel } from "./CheckinPanel";
import { VenueQrCard } from "./VenueQrCard";
import { CopyButton } from "./CopyButton";
import { AccessPanel, type Member } from "./AccessPanel";
import type { Access } from "@/lib/permissions";

const TABS = [
  { id: "overview", label: "نظرة عامة", icon: "📊" },
  { id: "guests", label: "الضيوف", icon: "👥" },
  { id: "edit", label: "تعديل الدعوة", icon: "✏️" },
  { id: "wishes", label: "التهاني", icon: "💌" },
  { id: "checkin", label: "الاستقبال", icon: "🎫" },
  { id: "access", label: "الوصول", icon: "🔐" },
  { id: "settings", label: "الإعدادات", icon: "⚙️" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function computeStats(guests: GuestRow[]): GuestStats {
  const s = { total: guests.length, attending: 0, declined: 0, pending: 0, headcount: 0, invitedSeats: 0, opened: 0, checkedIn: 0, checkedInSeats: 0 };
  for (const g of guests) {
    s[g.status]++;
    if (g.status === "attending") s.headcount += g.attendingCount;
    s.invitedSeats += g.maxCompanions + 1;
    if (g.openedAt) s.opened++;
    if (g.checkedInAt) {
      s.checkedIn++;
      s.checkedInSeats += g.attendingCount || 1;
    }
  }
  return s;
}

export function ManageDashboard(props: {
  id: string;
  slug: string;
  title: string;
  content: InvitationContent;
  published: boolean;
  views: number;
  origin: string;
  access: Access;
  members: Member[];
  maxGuests: number | null;
  venueQr: { code: string; enabled: boolean; windowLabel: string } | null;
  initialGuests: GuestRow[];
  initialWishes: WishRow[];
}) {
  const { id, origin, access } = props;
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("overview");
  const [slug, setSlug] = useState(props.slug);
  const [content, setContent] = useState(props.content);
  const [guests, setGuests] = useState<GuestRow[]>(props.initialGuests);
  const [wishes, setWishes] = useState<WishRow[]>(props.initialWishes);
  const [published, setPublished] = useState(props.published);
  const stats = computeStats(guests);
  const publicUrl = `${origin}/i/${slug}`;
  const tabs = TABS.filter(
    (t) =>
      (t.id !== "edit" || access.canEdit) &&
      (t.id !== "checkin" || access.canCheckIn) &&
      (t.id !== "access" || access.canManageAccess) &&
      (t.id !== "settings" || access.canEdit || access.canDelete),
  );

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("tab") as TabId | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync initial tab from the URL after hydration
    if (fromUrl && tabs.some((t) => t.id === fromUrl)) setTab(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  function selectTab(t: TabId) {
    setTab(t);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", t);
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function togglePublished(v: boolean) {
    setPublished(v);
    const res = await fetch(`/api/invitations/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ published: v }) });
    if (!res.ok) setPublished(!v);
  }

  async function deleteInvitation() {
    if (!confirm("سيتم حذف الدعوة وجميع الضيوف والتهاني نهائياً. هل أنت متأكد؟")) return;
    const res = await fetch(`/api/invitations/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin");
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
      {/^https?:\/\/(localhost|127\.|\[::1\]|0\.0\.0\.0)/.test(origin) && (
        <div className="card mb-6 border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <b>⚠️ روابط الدعوة تستخدم العنوان المحلي ({origin.replace(/^https?:\/\//, "")})</b> — هذا العنوان موجود على جهازك فقط، فلن تفتح الروابط المرسلة عبر واتساب
          على جوالات الضيوف. عند النشر ضع رابط موقعك الحقيقي في <code dir="ltr">NEXT_PUBLIC_APP_URL</code> (مثل <code dir="ltr">https://dawati.com</code>). وللتجربة على
          جوالك داخل نفس شبكة الواي فاي افتح لوحة التحكم عبر عنوان جهازك في الشبكة (مثل <code dir="ltr">http://192.168.1.5:3000</code>) بدلاً من localhost. وعلى جهازك استخدم <code dir="ltr">http://</code> وليس <code dir="ltr">https://</code>.
        </div>
      )}
      {access.locked && (
        <div className="card mb-6 border-amber-200 bg-amber-50 p-4 text-amber-900">
          <b>🔒 انتهى موعد المناسبة</b> — الدعوة متاحة الآن للعرض فقط: يمكنك مراجعة المدعوين والردود والتهاني وتصدير القائمة، دون تعديل.
        </div>
      )}
      {!access.locked && access.role === "owner" && access.unlockUntil && new Date(access.lockAt) < new Date() && (
        <div className="card mb-6 border-sky-200 bg-sky-50 p-4 text-sky-900">
          ✏️ سمحت الإدارة بالتعديل مؤقتاً حتى {new Date(access.unlockUntil).toLocaleString("ar-u-nu-latn")}.
        </div>
      )}

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-stone-500">لوحة إدارة الدعوة</p>
          <h1 className="font-display text-3xl text-stone-800 sm:text-4xl">{props.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${published ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-700"}`}>
            {published ? "● منشورة" : "○ مخفية"}
          </span>
        </div>
      </div>

      <nav className="-mx-4 mb-6 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" aria-label="أقسام الإدارة">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => selectTab(t.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition ${tab === t.id ? "bg-stone-800 text-white" : "bg-white text-stone-600 ring-1 ring-line hover:bg-soft"}`}
            aria-current={tab === t.id ? "page" : undefined}
          >
            <span>{t.icon}</span>
            {t.label}
            {t.id === "guests" && stats.total > 0 && <span className="rounded-full bg-black/10 px-1.5 text-[11px]">{stats.total}</span>}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="مشاهدات الدعوة" value={props.views} icon="👁️" />
            <Stat label="الحضور المؤكد (أشخاص)" value={stats.headcount} icon="✅" tone="emerald" />
            <Stat label="بانتظار الرد" value={stats.pending} icon="⏳" tone="amber" />
            <Stat label="معتذرون" value={stats.declined} icon="🙏" tone="rose" />
          </div>

          {stats.total > 0 && (
            <div className="card p-5">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-bold">نسبة الردود</span>
                <span className="text-stone-500">
                  {stats.attending + stats.declined} من {stats.total} ضيف · فتح الدعوة {stats.opened}
                </span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-stone-100">
                <div className="bg-emerald-500" style={{ width: `${(stats.attending / stats.total) * 100}%` }} />
                <div className="bg-rose-400" style={{ width: `${(stats.declined / stats.total) * 100}%` }} />
              </div>
              <div className="mt-2 flex gap-4 text-xs text-stone-500">
                <span>🟢 سيحضر {stats.attending}</span>
                <span>🔴 معتذر {stats.declined}</span>
                <span>⚪ لم يرد {stats.pending}</span>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card space-y-3 p-5">
              <h2 className="font-bold">🔗 الرابط العام للدعوة</h2>
              <p className="text-sm text-stone-600">شاركه في مجموعات العائلة ووسائل التواصل. لروابط شخصية باسم كل ضيف استخدم قسم الضيوف.</p>
              <code className="block truncate rounded-xl bg-soft px-3 py-2.5 text-sm" dir="ltr">
                {publicUrl}
              </code>
              <div className="flex flex-wrap gap-2">
                <CopyButton text={publicUrl} label="نسخ الرابط" />
                <a
                  className="btn-ghost"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://wa.me/?text=${encodeURIComponent(`${content.locale === "ar" ? "دعوة زفاف" : "Wedding invitation"} ${props.title} 💍\n${publicUrl}`)}`}
                >
                  مشاركة عبر واتساب
                </a>
                <a className="btn-ghost" href={publicUrl} target="_blank">
                  فتح ↗
                </a>
              </div>
            </div>
            <div className="card space-y-3 p-5">
              <h2 className="font-bold">🚀 الخطوات التالية</h2>
              <ol className="space-y-2 text-sm text-stone-700">
                <Step done={stats.total > 0} onClick={() => selectTab("guests")}>
                  أضف قائمة الضيوف لإرسال رابط شخصي لكل ضيف
                </Step>
                <Step done={!!content.media.coverImage || content.media.gallery.length > 0} onClick={() => access.canEdit && selectTab("edit")}>
                  أضف صورة غلاف أو صوراً للمعرض
                </Step>
                <Step done={stats.opened > 0} onClick={() => selectTab("guests")}>
                  أرسل الدعوات عبر واتساب بضغطة زر
                </Step>
                <Step done={stats.checkedIn > 0} onClick={() => selectTab("checkin")}>
                  يوم الحفل: امسح بطاقات الدخول من قسم الاستقبال
                </Step>
              </ol>
            </div>
          </div>
        </div>
      )}

      {tab === "guests" && <GuestsManager invitationId={id} slug={slug} title={props.title} origin={origin} guests={guests} setGuests={setGuests} stats={stats} readOnly={!access.canManageGuests} maxGuests={props.maxGuests} numerals={content.numerals} />}

      {tab === "edit" && (
        <InvitationEditor
          mode="edit"
          id={id}
          coreLocked={!access.canEditCoreFields}
          initial={content}
          initialSlug={slug}
          onSaved={(s, c) => {
            setSlug(s);
            setContent(c);
          }}
        />
      )}

      {tab === "wishes" && <WishesManager invitationId={id} wishes={wishes} setWishes={setWishes} readOnly={!access.canModerateWishes} />}

      {tab === "checkin" && (
        <CheckinPanel
          invitationId={id}
          guests={guests}
          setGuests={setGuests}
          stats={stats}
          venueQr={
            props.venueQr && (
              <VenueQrCard invitationId={id} origin={origin} initialCode={props.venueQr.code} initialEnabled={props.venueQr.enabled} windowLabel={props.venueQr.windowLabel} />
            )
          }
        />
      )}

      {tab === "access" && <AccessPanel invitationId={id} initialMembers={props.members} initialMaxGuests={props.maxGuests} initialUnlockUntil={access.unlockUntil} lockAt={access.lockAt} />}

      {tab === "settings" && (
        <div className="max-w-2xl space-y-4">
          {access.canEdit && (
            <div className="card p-5">
              <Toggle label="الدعوة منشورة" hint="عند الإخفاء لن يتمكن الضيوف من فتح الدعوة (يمكنك أنت معاينتها)" checked={published} onChange={togglePublished} />
            </div>
          )}
          {access.canDelete && (
          <div className="card space-y-3 border-red-200 p-5">
            <h2 className="font-bold text-red-700">منطقة الخطر</h2>
            <p className="text-sm text-stone-600">حذف الدعوة نهائي ولا يمكن التراجع عنه.</p>
            <button className="btn-danger" onClick={deleteInvitation}>
              حذف الدعوة نهائياً
            </button>
          </div>
          )}
        </div>
      )}
    </main>
  );
}

function Stat({ label, value, icon, tone = "stone" }: { label: string; value: number; icon: string; tone?: "stone" | "emerald" | "amber" | "rose" }) {
  const tones = { stone: "text-stone-800", emerald: "text-emerald-700", amber: "text-amber-700", rose: "text-rose-700" };
  return (
    <div className="card p-4">
      <div className="text-xl">{icon}</div>
      <div className={`mt-1 text-3xl font-extrabold tabular-nums ${tones[tone]}`}>{value.toLocaleString("ar-u-nu-latn")}</div>
      <div className="text-xs text-stone-500">{label}</div>
    </div>
  );
}

function Step({ done, children, onClick }: { done: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <li>
      <button onClick={onClick} className="flex w-full items-start gap-2 text-start hover:text-brand-dark">
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${done ? "bg-emerald-500 text-white" : "border border-stone-300"}`}>{done ? "✓" : ""}</span>
        <span className={done ? "text-stone-400 line-through" : ""}>{children}</span>
      </button>
    </li>
  );
}
