import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { guestPatchSchema } from "@/lib/invitation-schema";
import { jsonError, readJson, requireAccess } from "@/lib/api";

type Ctx = RouteContext<"/api/invitations/[id]/guests/[guestId]">;

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id, guestId } = await ctx.params;
  const auth = await requireAccess(id, "guests");
  if (!auth.ok) return auth.response;
  const body = await readJson(req, guestPatchSchema);
  if (!body.ok) return body.response;
  const { checkedIn, phone, status, ...rest } = body.data;

  const db = await getDb();
  const [updated] = await db
    .update(schema.guests)
    .set({
      ...rest,
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(status ? { status, respondedAt: status === "pending" ? null : new Date() } : {}),
      ...(checkedIn !== undefined ? { checkedInAt: checkedIn ? new Date() : null } : {}),
    })
    .where(and(eq(schema.guests.id, guestId), eq(schema.guests.invitationId, id)))
    .returning();
  if (!updated) return jsonError("الضيف غير موجود", 404);
  return NextResponse.json({ guest: updated });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id, guestId } = await ctx.params;
  const auth = await requireAccess(id, "guests");
  if (!auth.ok) return auth.response;
  const db = await getDb();
  await db.delete(schema.guests).where(and(eq(schema.guests.id, guestId), eq(schema.guests.invitationId, id)));
  return NextResponse.json({ ok: true });
}
