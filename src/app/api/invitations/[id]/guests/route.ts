import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { guestInputSchema } from "@/lib/invitation-schema";
import { readJson, requireManaged } from "@/lib/api";
import { guestStats, listGuests } from "@/lib/data";
import { newGuestToken, newId } from "@/lib/ids";

const createSchema = z.union([
  z.object({ guests: z.array(guestInputSchema).min(1).max(500) }),
  guestInputSchema,
]);

export async function GET(req: NextRequest, ctx: RouteContext<"/api/invitations/[id]/guests">) {
  const { id } = await ctx.params;
  const auth = await requireManaged(req, id);
  if (!auth.ok) return auth.response;
  const list = await listGuests(id);
  return NextResponse.json({ guests: list, stats: guestStats(list) });
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/invitations/[id]/guests">) {
  const { id } = await ctx.params;
  const auth = await requireManaged(req, id);
  if (!auth.ok) return auth.response;
  const body = await readJson(req, createSchema);
  if (!body.ok) return body.response;
  const input = "guests" in body.data ? body.data.guests : [body.data];

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
