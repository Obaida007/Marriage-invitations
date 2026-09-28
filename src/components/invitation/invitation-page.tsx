import "server-only";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { InvitationView } from "@/components/invitation/InvitationView";
import { coupleTitle } from "@/lib/couple";
import { getGuestByToken, getInvitationBySlug, listWishes } from "@/lib/data";
import { formatGregorian, fmtLocale } from "@/lib/dates";
import { getOrigin } from "@/lib/origin";
import { getCurrentUser } from "@/lib/auth";
import { getInvitationAccess } from "@/lib/data";

const load = cache(async (slug: string) => getInvitationBySlug(slug));

/** Metadata for both /i/[slug] and the personal link /i/[slug]/[token]. */
export async function invitationMetadata(slug: string): Promise<Metadata> {
  const inv = await load(slug);
  if (!inv) return { title: "الدعوة غير موجودة" };
  const c = inv.content;
  const title = coupleTitle(c.couple, c.locale);
  const main = c.events[0];
  const description = [c.texts.invitationLine || c.texts.hosts, main && formatGregorian(main.startsAt, fmtLocale(c.locale, c.numerals))]
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

export async function renderInvitation(slug: string, token: string | undefined) {
  const inv = await load(slug);
  if (!inv) notFound();
  // Hidden invitations stay visible to their own users and admins.
  if (!inv.published && !(await getInvitationAccess(inv.id, await getCurrentUser()))) notFound();

  const [guest, wishes, origin] = await Promise.all([
    getGuestByToken(inv.id, token),
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
