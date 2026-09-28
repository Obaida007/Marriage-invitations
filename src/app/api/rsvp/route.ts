import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { rsvpInputSchema } from "@/lib/invitation-schema";
import { jsonError, rateLimit, readJson } from "@/lib/api";
import { getGuestByToken, getInvitationBySlug } from "@/lib/data";
import { newGuestToken, newId } from "@/lib/ids";
import { isRsvpClosed } from "@/lib/rsvp";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "rsvp", 30, 10 * 60 * 1000);
  if (limited) return limited;
  const body = await readJson(req, rsvpInputSchema);
  if (!body.ok) return body.response;
  const input = body.data;

  const inv = await getInvitationBySlug(input.slug);
  if (!inv || !inv.published) return jsonError("الدعوة غير موجودة", 404);
  if (!inv.content.features.rsvp) return jsonError("تأكيد الحضور غير مفعّل لهذه الدعوة", 403);
  if (isRsvpClosed(inv.content)) return jsonError("انتهت فترة تأكيد الحضور", 403);

  const db = await getDb();
  const guest = await getGuestByToken(inv.id, input.guestToken);
  const maxCompanions = guest ? guest.maxCompanions : inv.content.rsvp.defaultCompanions;
  const attendingCount =
    // The invited allowance is a guideline shown to the guest, not a hard cap;
    // hosts see responses that exceed it flagged in their guest list.
    input.status === "attending" ? Math.max(input.attendingCount, 1) : 0;
  const now = new Date();

  if (guest) {
    const [updated] = await db
      .update(schema.guests)
      .set({
        status: input.status,
        attendingCount,
        note: input.note || null,
        phone: input.phone || guest.phone,
        // Guests invited from the list keep the name the hosts entered.
        name: guest.source === "public" ? input.name : guest.name,
        respondedAt: now,
      })
      .where(eq(schema.guests.id, guest.id))
      .returning();
    return NextResponse.json({ guest: publicGuest(updated) });
  }

  if (input.guestToken) return jsonError("الرابط الشخصي غير صالح", 404);
  if (!inv.content.rsvp.openRsvp) return jsonError("تأكيد الحضور متاح عبر الرابط الشخصي فقط", 403);

  const [created] = await db
    .insert(schema.guests)
    .values({
      id: newId(),
      invitationId: inv.id,
      token: newGuestToken(),
      name: input.name,
      phone: input.phone || null,
      maxCompanions,
      status: input.status,
      attendingCount,
      note: input.note || null,
      source: "public",
      openedAt: now,
      respondedAt: now,
    })
    .returning();
  return NextResponse.json({ guest: publicGuest(created) }, { status: 201 });
}

function publicGuest(g: typeof schema.guests.$inferSelect) {
  return {
    token: g.token,
    name: g.name,
    status: g.status,
    attendingCount: g.attendingCount,
    maxCompanions: g.maxCompanions,
  };
}

/** Lets a device that already responded restore its RSVP state. */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? "";
  const token = req.nextUrl.searchParams.get("token");
  const inv = await getInvitationBySlug(slug);
  if (!inv) return jsonError("الدعوة غير موجودة", 404);
  const guest = await getGuestByToken(inv.id, token);
  if (!guest) return jsonError("غير موجود", 404);
  return NextResponse.json({ guest: publicGuest(guest) });
}
