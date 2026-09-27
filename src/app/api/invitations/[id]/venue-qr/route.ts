import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { readJson, requireAccess } from "@/lib/api";
import { newCheckinCode } from "@/lib/ids";

/** Regenerate the venue QR (invalidates printed copies) or toggle self check-in. */
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/invitations/[id]/venue-qr">) {
  const { id } = await ctx.params;
  const auth = await requireAccess(id, "checkin");
  if (!auth.ok) return auth.response;
  const body = await readJson(req, z.object({ regenerate: z.literal(true).optional(), selfCheckin: z.boolean().optional() }));
  if (!body.ok) return body.response;
  const db = await getDb();
  const checkinCode = body.data.regenerate ? newCheckinCode() : undefined;
  await db
    .update(schema.invitations)
    .set({ ...(checkinCode ? { checkinCode } : {}), ...(body.data.selfCheckin !== undefined ? { selfCheckin: body.data.selfCheckin } : {}) })
    .where(eq(schema.invitations.id, id));
  return NextResponse.json({ ok: true, checkinCode: checkinCode ?? auth.inv.checkinCode, selfCheckin: body.data.selfCheckin ?? auth.inv.selfCheckin });
}
