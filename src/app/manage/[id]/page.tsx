import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageUser } from "@/lib/auth";
import { getInvitationAccess, listGuests, listMembers, listWishes } from "@/lib/data";
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
