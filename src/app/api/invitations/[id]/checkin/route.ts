import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { jsonError, readJson, requireManaged } from "@/lib/api";
import { getGuestByToken } from "@/lib/data";

/** Looks up a guest by their pass code and marks them as checked in. */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/invitations/[id]/checkin">) {
  const { id } = await ctx.params;
  const auth = await requireManaged(req, id);
  if (!auth.ok) return auth.response;
  const body = await readJson(req, z.object({ token: z.string().trim().min(4).max(64) }));
  if (!body.ok) return body.response;

  // Accept either a raw token or a full invitation URL containing ?g=TOKEN.
  let token = body.data.token;
  const match = token.match(/[?&]g=([A-Za-z0-9]+)/);
  if (match) token = match[1];

  const guest = await getGuestByToken(id, token);
  if (!guest) return jsonError("رمز الدخول غير صحيح", 404);
  const alreadyCheckedIn = !!guest.checkedInAt;
  if (!alreadyCheckedIn) {
    const db = await getDb();
    await db.update(schema.guests).set({ checkedInAt: new Date() }).where(eq(schema.guests.id, guest.id));
  }
  return NextResponse.json({ guest: { ...guest, checkedInAt: guest.checkedInAt ?? new Date() }, alreadyCheckedIn });
}
