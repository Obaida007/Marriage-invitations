import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { newId, randomSlugSuffix } from "@/lib/ids";
import { invitationContentSchema, RESERVED_SLUGS, slugSchema } from "@/lib/invitation-schema";
import { jsonError, readJson, requireAdmin } from "@/lib/api";
import { suggestSlug } from "@/lib/slug";
import { isSlugFree } from "@/lib/data";
import { contentRuleViolation } from "@/lib/permissions";

const createSchema = z.object({
  slug: z.union([slugSchema, z.literal("")]).optional(),
  content: invitationContentSchema,
  maxGuests: z.number().int().min(1).max(10000).nullable().optional(),
});

/** Only admins create occasions (and so decide their date). */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await readJson(req, createSchema);
  if (!body.ok) return body.response;
  const { content } = body.data;
  const rule = contentRuleViolation(content);
  if (rule) return jsonError(rule, 422);

  let slug = body.data.slug || suggestSlug(content.couple.groomName, content.couple.brideName, content.couple.hideBrideName);
  if (RESERVED_SLUGS.has(slug)) return jsonError("هذا الرابط محجوز، اختر رابطاً آخر", 409);
  if (!(await isSlugFree(slug))) {
    if (body.data.slug) return jsonError("هذا الرابط مستخدم مسبقاً، اختر رابطاً آخر", 409);
    slug = `${slug}-${randomSlugSuffix()}`;
  }

  const id = newId();
  const db = await getDb();
  await db.insert(schema.invitations).values({
    id,
    slug,
    manageKeyHash: "",
    content,
    maxGuests: body.data.maxGuests ?? null,
    createdBy: auth.user.id,
  });
  return NextResponse.json({ id, slug }, { status: 201 });
}
