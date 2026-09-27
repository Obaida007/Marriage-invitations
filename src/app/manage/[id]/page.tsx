import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageUser } from "@/lib/auth";
import { ensureCheckinCode, getInvitationAccess, listGuests, listMembers, listWishes } from "@/lib/data";
import { CHECKIN_OPENS_BEFORE_MS, selfCheckinWindow } from "@/lib/permissions";
import { getOrigin } from "@/lib/origin";
import { AppHeader } from "@/components/ui/AppHeader";
import { ManageDashboard } from "@/components/manage/ManageDashboard";
import { coupleTitle } from "@/lib/couple";

export const metadata: Metadata = { title: "إدارة الدعوة", robots: { index: false, follow: false } };

export default async function ManagePage(props: PageProps<"/manage/[id]">) {
  const { id } = await props.params;
  const user = await requirePageUser();
  const found = await getInvitationAccess(id, user);
  // Same response for "doesn't exist" and "not yours", so ids can't be probed.
  if (!found) notFound();
  const { inv, access } = found;

  const [guests, wishes, members, origin] = await Promise.all([listGuests(id), listWishes(id, true), listMembers(id), getOrigin()]);
  const venueCode = access.canCheckIn ? await ensureCheckinCode(inv) : null;
  const window = selfCheckinWindow(inv.content);
  const windowLabel = window.open
    ? "التسجيل عبر الرمز مفتوح الآن"
    : window.reason === "before"
      ? `يعمل الرمز يوم الحفل ابتداءً من ${new Date(window.opensAt!).toLocaleString("ar-u-nu-latn", { timeZone: inv.content.timezone, dateStyle: "medium", timeStyle: "short" })} (قبل الحفل بـ ${CHECKIN_OPENS_BEFORE_MS / 3600000} ساعات)`
      : "انتهت المناسبة، الرمز متوقف";

  return (
    <>
      <AppHeader user={user}>
        <Link href={user.role === "admin" ? "/admin" : "/my"} className="btn-ghost sm:hidden">
          ←
        </Link>
        <a href={`/i/${inv.slug}`} target="_blank" className="btn-ghost">
          عرض الدعوة ↗
        </a>
      </AppHeader>
      <ManageDashboard
        id={inv.id}
        slug={inv.slug}
        title={coupleTitle(inv.content.couple, inv.content.locale)}
        content={inv.content}
        published={inv.published}
        views={inv.views}
        origin={origin}
        access={access}
        maxGuests={inv.maxGuests}
        venueQr={venueCode ? { code: venueCode, enabled: inv.selfCheckin, windowLabel } : null}
        members={members.map((m) => ({ ...m, lastLoginAt: m.lastLoginAt?.toISOString() ?? null }))}
        initialGuests={guests.map(serializeGuest)}
        initialWishes={wishes.map((w) => ({ id: w.id, name: w.name, message: w.message, hidden: w.hidden, createdAt: w.createdAt.toISOString() }))}
      />
    </>
  );
}

function serializeGuest(g: Awaited<ReturnType<typeof listGuests>>[number]) {
  return {
    ...g,
    openedAt: g.openedAt?.toISOString() ?? null,
    respondedAt: g.respondedAt?.toISOString() ?? null,
    checkedInAt: g.checkedInAt?.toISOString() ?? null,
    createdAt: g.createdAt.toISOString(),
  };
}
