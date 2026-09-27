import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { readJson, requireManaged } from "@/lib/api";

type Ctx = RouteContext<"/api/invitations/[id]/wishes/[wishId]">;

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id, wishId } = await ctx.params;
  const auth = await requireManaged(req, id);
  if (!auth.ok) return auth.response;
  const body = await readJson(req, z.object({ hidden: z.boolean() }));
  if (!body.ok) return body.response;
  const db = await getDb();
  await db
    .update(schema.wishes)
    .set({ hidden: body.data.hidden })
    .where(and(eq(schema.wishes.id, wishId), eq(schema.wishes.invitationId, id)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id, wishId } = await ctx.params;
  const auth = await requireManaged(req, id);
  if (!auth.ok) return auth.response;
  const db = await getDb();
  await db.delete(schema.wishes).where(and(eq(schema.wishes.id, wishId), eq(schema.wishes.invitationId, id)));
  return NextResponse.json({ ok: true });
}
