import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { createSession, destroyUserSessions, getCurrentUser, hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "@/lib/auth";
import { jsonError, rateLimit, readJson } from "@/lib/api";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, "password", 10, 15 * 60 * 1000);
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) return jsonError("يجب تسجيل الدخول", 401);
  const body = await readJson(
    req,
    z.object({
      current: z.string().min(1, "أدخل كلمة المرور الحالية").max(200),
      next: z.string().min(MIN_PASSWORD_LENGTH, `كلمة المرور الجديدة يجب ألا تقل عن ${MIN_PASSWORD_LENGTH} أحرف`).max(200),
    }),
  );
  if (!body.ok) return body.response;
  const db = await getDb();
  const row = await db.query.users.findFirst({ where: eq(schema.users.id, user.id) });
  if (!row || !(await verifyPassword(body.data.current, row.passwordHash))) return jsonError("كلمة المرور الحالية غير صحيحة", 403);
  if (body.data.current === body.data.next) return jsonError("اختر كلمة مرور مختلفة عن الحالية", 422);
  if (body.data.next.toLowerCase().includes(row.username)) return jsonError("كلمة المرور يجب ألا تحتوي اسم المستخدم", 422);

  await db.update(schema.users).set({ passwordHash: await hashPassword(body.data.next), mustChangePassword: false }).where(eq(schema.users.id, user.id));
  // Sign out other devices, keep this one signed in.
  await destroyUserSessions(user.id);
  await createSession(user.id);
  return NextResponse.json({ ok: true, next: user.role === "admin" ? "/admin" : "/my" });
}
