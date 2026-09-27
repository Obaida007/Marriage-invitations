import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { invitationContentSchema, RESERVED_SLUGS, slugSchema } from "@/lib/invitation-schema";
import { jsonError, readJson, requireManaged } from "@/lib/api";
import { getInvitationBySlug } from "@/lib/data";
import { manageCookieName } from "@/lib/auth";

const patchSchema = z.object({
  slug: slugSchema.optional(),
  content: invitationContentSchema.optional(),
  published: z.boolean().optional(),
});

export async function GET(req: NextRequest, ctx: RouteContext<"/api/invitations/[id]">) {
  const { id } = await ctx.params;
  const auth = await requireManaged(req, id);
  if (!auth.ok) return auth.response;
  const inv: Partial<typeof auth.inv> = { ...auth.inv };
  delete inv.manageKeyHash;
  return NextResponse.json(inv);
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/invitations/[id]">) {
  const { id } = await ctx.params;
  const auth = await requireManaged(req, id);
  if (!auth.ok) return auth.response;
  const body = await readJson(req, patchSchema);
  if (!body.ok) return body.response;
  const { slug, content, published } = body.data;

  if (slug && slug !== auth.inv.slug) {
    if (RESERVED_SLUGS.has(slug)) return jsonError("هذا الرابط محجوز", 409);
    const existing = await getInvitationBySlug(slug);
    if (existing && existing.id !== id) return jsonError("هذا الرابط مستخدم مسبقاً", 409);
  }

  const db = await getDb();
  await db
    .update(schema.invitations)
    .set({
      ...(slug ? { slug } : {}),
      ...(content ? { content } : {}),
      ...(published !== undefined ? { published } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.invitations.id, id));
  return NextResponse.json({ ok: true, slug: slug ?? auth.inv.slug });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/invitations/[id]">) {
  const { id } = await ctx.params;
  const auth = await requireManaged(req, id);
  if (!auth.ok) return auth.response;
  const db = await getDb();
  await db.delete(schema.invitations).where(eq(schema.invitations.id, id));
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(manageCookieName(id));
  return res;
}
