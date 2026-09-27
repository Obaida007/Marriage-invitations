import type { Metadata } from "next";
import { getInvitationById, getManagedInvitation, guestStats, listGuests, listWishes } from "@/lib/data";
import { manageKeyFromCookies } from "@/lib/auth";
import { getOrigin } from "@/lib/origin";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { ManageLogin } from "@/components/manage/ManageLogin";
import { ManageDashboard } from "@/components/manage/ManageDashboard";
import { coupleTitle } from "@/lib/couple";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "إدارة الدعوة", robots: { index: false, follow: false } };

export default async function ManagePage(props: PageProps<"/manage/[id]">) {
  const { id } = await props.params;
  const { error, welcome } = await props.searchParams;
  const key = await manageKeyFromCookies(id);
  const inv = await getManagedInvitation(id, key);

  if (!inv) {
    if (!(await getInvitationById(id))) notFound();
    return (
      <>
        <SiteHeader />
        <ManageLogin id={id} error={error === "1"} />
      </>
    );
  }

  const [guests, wishes, origin] = await Promise.all([listGuests(id), listWishes(id, true), getOrigin()]);

  return (
    <>
      <SiteHeader>
        <a href={`/i/${inv.slug}`} target="_blank" className="btn-ghost">
          عرض الدعوة ↗
        </a>
      </SiteHeader>
      <ManageDashboard
        id={inv.id}
        slug={inv.slug}
        title={coupleTitle(inv.content.couple, inv.content.locale)}
        content={inv.content}
        published={inv.published}
        views={inv.views}
        origin={origin}
        manageKey={key!}
        welcome={welcome === "1"}
        initialGuests={guests.map(serializeGuest)}
        initialStats={guestStats(guests)}
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
