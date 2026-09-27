import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { guestInputSchema } from "@/lib/invitation-schema";
import { jsonError, readJson, requireAccess } from "@/lib/api";
import { countGuests, guestStats, listGuests } from "@/lib/data";
import { newGuestToken, newId } from "@/lib/ids";

const createSchema = z.union([
  z.object({ guests: z.array(guestInputSchema).min(1).max(500) }),
  guestInputSchema,
]);

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/invitations/[id]/guests">) {
  const { id } = await ctx.params;
  const auth = await requireAccess(id, "view");
  if (!auth.ok) return auth.response;
  const list = await listGuests(id);
  return NextResponse.json({ guests: list, stats: guestStats(list) });
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/invitations/[id]/guests">) {
  const { id } = await ctx.params;
  const auth = await requireAccess(id, "guests");
  if (!auth.ok) return auth.response;
  const body = await readJson(req, createSchema);
  if (!body.ok) return body.response;
  const input = "guests" in body.data ? body.data.guests : [body.data];

  if (auth.inv.maxGuests != null) {
    const remaining = auth.inv.maxGuests - (await countGuests(id));
    if (input.length > remaining) {
      return jsonError(
        remaining <= 0
          ? `وصلت إلى الحد الأقصى لعدد المدعوين (${auth.inv.maxGuests})`
          : `يمكنك إضافة ${remaining} مدعو فقط (الحد الأقصى ${auth.inv.maxGuests})`,
        403,
      );
    }
  }

  const rows = input.map((g) => ({
    id: newId(),
    invitationId: id,
    token: newGuestToken(),
    name: g.name,
    phone: g.phone || null,
    side: g.side,
    maxCompanions: g.maxCompanions,
  }));
  const db = await getDb();
  const created = await db.insert(schema.guests).values(rows).returning();
  return NextResponse.json({ guests: created }, { status: 201 });
}
