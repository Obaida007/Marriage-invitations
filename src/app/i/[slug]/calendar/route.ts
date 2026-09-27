import type { NextRequest } from "next/server";
import { getInvitationBySlug } from "@/lib/data";
import { toIcsUtc, zonedToDate } from "@/lib/dates";
import { coupleTitle } from "@/lib/couple";

function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

/** iCalendar file for Apple Calendar / Outlook. */
export async function GET(req: NextRequest, ctx: RouteContext<"/i/[slug]/calendar">) {
  const { slug } = await ctx.params;
  const inv = await getInvitationBySlug(slug);
  if (!inv || !inv.published) return new Response("Not found", { status: 404 });
  const c = inv.content;
  const eventId = req.nextUrl.searchParams.get("e");
  const selected = eventId ? c.events.filter((e) => e.id === eventId) : c.events;
  const url = `${req.nextUrl.origin}/i/${inv.slug}`;
  const title = coupleTitle(c.couple, c.locale);

  const vevents = (selected.length ? selected : c.events).map((e) => {
    const start = zonedToDate(e.startsAt, c.timezone);
    const end = e.endsAt ? zonedToDate(e.endsAt, c.timezone) : new Date(start.getTime() + 4 * 3600000);
    return [
      "BEGIN:VEVENT",
      `UID:${inv.id}-${e.id}@dawati`,
      `DTSTAMP:${toIcsUtc(new Date())}`,
      `DTSTART:${toIcsUtc(start)}`,
      `DTEND:${toIcsUtc(end)}`,
      `SUMMARY:${esc(`${e.title} - ${title}`)}`,
      `LOCATION:${esc([e.venueName, e.address].filter(Boolean).join(" - "))}`,
      `DESCRIPTION:${esc(url)}`,
      `URL:${url}`,
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(e.title)}`,
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");
  });

  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Dawati//Wedding Invitations//AR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", ...vevents, "END:VCALENDAR"].join("\r\n");
  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="wedding-${inv.slug}.ics"`,
    },
  });
}
