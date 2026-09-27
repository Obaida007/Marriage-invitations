import Link from "next/link";
import type { InvitationContent } from "@/lib/invitation-schema";
import type { Access } from "@/lib/permissions";
import { coupleTitle } from "@/lib/couple";
import { formatGregorian, zonedToDate } from "@/lib/dates";
import { resolveStyle } from "@/lib/themes";

export interface InvitationSummary {
  id: string;
  slug: string;
  content: InvitationContent;
  published: boolean;
  access: Access;
  guests: number;
  headcount: number;
  maxGuests: number | null;
  members: { username: string; name: string }[];
}

export function statusOf(inv: InvitationSummary, now = Date.now()) {
  const lockAt = new Date(inv.access.lockAt).getTime();
  const first = Math.min(...inv.content.events.map((e) => zonedToDate(e.startsAt, inv.content.timezone).getTime()));
  if (lockAt < now) return { key: "past" as const, label: inv.access.locked ? "منتهية — للعرض فقط" : "منتهية (تعديل مسموح مؤقتاً)", cls: "bg-stone-200 text-stone-700" };
  const days = Math.ceil((first - now) / 86400000);
  if (days <= 0) return { key: "today" as const, label: "اليوم 🎉", cls: "bg-rose-100 text-rose-700" };
  return { key: "upcoming" as const, label: `بعد ${days} يوم`, cls: "bg-emerald-100 text-emerald-800" };
}

export function InvitationCard({ inv, showMembers }: { inv: InvitationSummary; showMembers?: boolean }) {
  const c = inv.content;
  const rs = resolveStyle(c.style);
  const status = statusOf(inv);
  const main = [...c.events].sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  return (
    <div className="card flex flex-col overflow-hidden transition hover:shadow-md">
      <div className="relative flex h-28 items-center justify-center" style={{ background: rs.colors.bg, color: rs.colors.accent }}>
        <span className="font-display text-3xl">{coupleTitle(c.couple, c.locale)}</span>
        <span className={`absolute start-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${status.cls}`}>{status.label}</span>
        {!inv.published && <span className="absolute end-3 top-3 rounded-full bg-stone-800/80 px-2.5 py-0.5 text-[11px] font-bold text-white">مخفية</span>}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="text-sm text-stone-600">📅 {main && formatGregorian(main.startsAt, "ar")}</div>
        <div className="flex gap-4 text-sm">
          <span>
            👥 <b>{inv.guests}</b>
            {inv.maxGuests != null && <span className="text-stone-400"> / {inv.maxGuests}</span>} مدعو
          </span>
          <span>
            ✅ <b>{inv.headcount}</b> حضور مؤكد
          </span>
        </div>
        {showMembers && (
          <div className="text-xs text-stone-500">
            المستخدمون: {inv.members.length ? inv.members.map((m) => `${m.name} (${m.username})`).join("، ") : <span className="text-amber-700">لا يوجد — أضف مستخدماً</span>}
          </div>
        )}
        <div className="mt-auto flex gap-2">
          <Link href={`/manage/${inv.id}`} className="btn-primary flex-1">
            {inv.access.locked ? "عرض" : "إدارة"}
          </Link>
          <a href={`/i/${inv.slug}`} target="_blank" className="btn-ghost">
            الدعوة ↗
          </a>
        </div>
      </div>
    </div>
  );
}
