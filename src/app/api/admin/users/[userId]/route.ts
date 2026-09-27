import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { destroyUserSessions, generateTempPassword, hashPassword } from "@/lib/auth";
import { jsonError, readJson, requireAdmin } from "@/lib/api";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  active: z.boolean().optional(),
  resetPassword: z.literal(true).optional(),
});

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/admin/users/[userId]">) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { userId } = await ctx.params;
  const body = await readJson(req, patchSchema);
  if (!body.ok) return body.response;
  const db = await getDb();
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!user) return jsonError("المستخدم غير موجود", 404);
  if (user.id === auth.user.id && body.data.active === false) return jsonError("لا يمكنك إيقاف حسابك", 422);

  const { resetPassword, phone, ...rest } = body.data;
  const tempPassword = resetPassword ? generateTempPassword() : undefined;
  await db
    .update(schema.users)
    .set({
      ...rest,
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(tempPassword ? { passwordHash: await hashPassword(tempPassword), mustChangePassword: true, failedLogins: 0, lockedUntil: null } : {}),
    })
    .where(eq(schema.users.id, userId));
  if (tempPassword || body.data.active === false) await destroyUserSessions(userId);
  return NextResponse.json({ ok: true, tempPassword });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/admin/users/[userId]">) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { userId } = await ctx.params;
  if (userId === auth.user.id) return jsonError("لا يمكنك حذف حسابك", 422);
  const db = await getDb();
  await db.delete(schema.users).where(eq(schema.users.id, userId));
  return NextResponse.json({ ok: true });
}
