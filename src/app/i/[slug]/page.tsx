import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { InvitationView } from "@/components/invitation/InvitationView";
import { coupleTitle } from "@/lib/couple";
import { getGuestByToken, getInvitationBySlug, listWishes } from "@/lib/data";
import { formatGregorian } from "@/lib/dates";
import { getOrigin } from "@/lib/origin";
import { manageKeyFromCookies, verifyKey } from "@/lib/auth";

const load = cache(async (slug: string) => getInvitationBySlug(slug));

export async function generateMetadata(props: PageProps<"/i/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const inv = await load(slug);
  if (!inv) return { title: "الدعوة غير موجودة" };
  const c = inv.content;
  const title = coupleTitle(c.couple, c.locale);
  const main = c.events[0];
  const description = [c.texts.invitationLine || c.texts.hosts, main && formatGregorian(main.startsAt, c.locale)]
    .filter(Boolean)
    .join(" — ");
  return {
    title: { absolute: `${c.locale === "ar" ? "دعوة زفاف" : "Wedding of"} ${title}` },
    description,
    openGraph: { title, description, type: "website", locale: c.locale === "ar" ? "ar_AR" : "en_US" },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: false, follow: false },
  };
}

export default async function InvitationPage(props: PageProps<"/i/[slug]">) {
  const { slug } = await props.params;
  const { g } = await props.searchParams;
  const inv = await load(slug);
  if (!inv) notFound();
  if (!inv.published && !verifyKey(await manageKeyFromCookies(inv.id), inv.manageKeyHash)) notFound();

  const [guest, wishes, origin] = await Promise.all([
    getGuestByToken(inv.id, typeof g === "string" ? g : undefined),
    inv.content.features.wishes ? listWishes(inv.id) : Promise.resolve([]),
    getOrigin(),
  ]);

  return (
    <InvitationView
      content={inv.content}
      slug={inv.slug}
      origin={origin}
      guest={
        guest && {
          token: guest.token,
          name: guest.name,
          status: guest.status,
          attendingCount: guest.attendingCount,
          maxCompanions: guest.maxCompanions,
        }
      }
      wishes={wishes.map((w) => ({ id: w.id, name: w.name, message: w.message }))}
    />
  );
}
