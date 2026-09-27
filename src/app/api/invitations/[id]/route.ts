import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { invitationContentSchema, RESERVED_SLUGS, slugSchema } from "@/lib/invitation-schema";
import { jsonError, readJson, requireAccess } from "@/lib/api";
import { getInvitationBySlug } from "@/lib/data";
import { contentRuleViolation, coreFieldViolation } from "@/lib/permissions";

const patchSchema = z.object({
  slug: slugSchema.optional(),
  content: invitationContentSchema.optional(),
  published: z.boolean().optional(),
  // Admin-only settings
  maxGuests: z.number().int().min(1).max(10000).nullable().optional(),
  unlockUntil: z.iso.datetime({ offset: true }).nullable().optional(),
});

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/invitations/[id]">) {
  const { id } = await ctx.params;
  const auth = await requireAccess(id, "view");
  if (!auth.ok) return auth.response;
  const { id: invId, slug, content, published, views, maxGuests, createdAt, updatedAt } = auth.inv;
  return NextResponse.json({ id: invId, slug, content, published, views, maxGuests, createdAt, updatedAt, access: auth.access });
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/invitations/[id]">) {
  const { id } = await ctx.params;
  const auth = await requireAccess(id, "edit");
  if (!auth.ok) return auth.response;
  const body = await readJson(req, patchSchema);
  if (!body.ok) return body.response;
  const { slug, content, published, maxGuests, unlockUntil } = body.data;
  const { access, inv } = auth;

  const adminOnly = (slug !== undefined && slug !== inv.slug) || maxGuests !== undefined || unlockUntil !== undefined;
  if (adminOnly && !access.canManageAccess) return jsonError("تغيير الرابط أو حدود الدعوة من صلاحيات الإدارة فقط", 403);

  if (content) {
    if (!access.canEditCoreFields) {
      const violation = coreFieldViolation(inv.content, content);
      if (violation) return jsonError(violation, 403);
    }
    const rule = contentRuleViolation(content);
    if (rule) return jsonError(rule, 422);
  }

  if (slug && slug !== inv.slug) {
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
      ...(maxGuests !== undefined ? { maxGuests } : {}),
      ...(unlockUntil !== undefined ? { unlockUntil: unlockUntil ? new Date(unlockUntil) : null } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.invitations.id, id));
  return NextResponse.json({ ok: true, slug: slug ?? inv.slug });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/invitations/[id]">) {
  const { id } = await ctx.params;
  const auth = await requireAccess(id, "admin");
  if (!auth.ok) return auth.response;
  const db = await getDb();
  await db.delete(schema.invitations).where(eq(schema.invitations.id, id));
  return NextResponse.json({ ok: true });
}
