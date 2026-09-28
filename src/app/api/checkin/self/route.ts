import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { jsonError, rateLimit, readJson } from "@/lib/api";
import { getInvitationByCheckinCode, listGuests } from "@/lib/data";
import { newGuestToken, newId } from "@/lib/ids";
import { selfCheckinWindow } from "@/lib/permissions";
import { MAX_PARTY } from "@/lib/invitation-schema";
import { normalizePhone, samePhone } from "@/lib/phone";

const inputSchema = z.object({
  code: z.string().trim().min(6).max(32),
  name: z.string().trim().min(2, "اكتب اسمك").max(80),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => normalizePhone(v).length >= 7, "اكتب رقم جوال صحيح"),
  count: z.number().int().min(1).max(MAX_PARTY).default(1),
});

/**
 * Guest scans the QR at the venue door and enters name + phone.
 * Matches an invited guest by phone; otherwise records a walk-in.
 */
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "self-checkin", 15, 10 * 60 * 1000);
  if (limited) return limited;
  const body = await readJson(req, inputSchema);
  if (!body.ok) return body.response;
  const { code, name, phone, count } = body.data;

  const inv = await getInvitationByCheckinCode(code);
  if (!inv) return jsonError("رمز الحضور غير صالح", 404);
  if (!inv.selfCheckin) return jsonError("تسجيل الحضور الذاتي غير مفعّل لهذه المناسبة", 403);
  const window = selfCheckinWindow(inv.content);
  if (!window.open) {
    return jsonError(window.reason === "before" ? "لم يبدأ تسجيل الحضور بعد، يفتح يوم الحفل" : "انتهت المناسبة", 403);
  }

  const db = await getDb();
  const now = new Date();
  const match = (await listGuests(inv.id)).find((g) => samePhone(g.phone, phone));

  if (match) {
    if (match.checkedInAt) {
      return NextResponse.json({ status: "already", name: match.name, checkedInAt: match.checkedInAt });
    }
    // At the door, record how many actually came.
    const attendingCount = count;
    await db
      .update(schema.guests)
      .set({ checkedInAt: now, status: "attending", attendingCount, respondedAt: match.respondedAt ?? now, phone: match.phone || phone })
      .where(eq(schema.guests.id, match.id));
    return NextResponse.json({ status: "checked-in", invited: true, name: match.name, count: attendingCount });
  }

  if (inv.maxGuests != null && (await listGuests(inv.id)).length >= inv.maxGuests + 50) {
    // Guard against abuse of a leaked code: walk-ins get a generous but finite buffer.
    return jsonError("تعذر التسجيل، يرجى مراجعة الاستقبال", 403);
  }
  await db.insert(schema.guests).values({
    id: newId(),
    invitationId: inv.id,
    token: newGuestToken(),
    name,
    phone: normalizePhone(phone),
    maxCompanions: count - 1,
    status: "attending",
    attendingCount: count,
    source: "walkin",
    respondedAt: now,
    checkedInAt: now,
  });
  return NextResponse.json({ status: "checked-in", invited: false, name, count }, { status: 201 });
}
