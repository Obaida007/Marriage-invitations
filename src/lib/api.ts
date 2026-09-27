import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser, type SessionUser } from "./auth";
import { getInvitationAccess, type LoadedInvitation } from "./data";
import type { Access } from "./permissions";

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export async function readJson<T extends z.ZodType>(req: Request, schema: T) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false as const, response: jsonError("طلب غير صالح") };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false as const,
      response: jsonError(first?.message ?? "بيانات غير صالحة", 422, z.flattenError(parsed.error)),
    };
  }
  return { ok: true as const, data: parsed.data as z.infer<T> };
}

type Need = "view" | "edit" | "guests" | "wishes" | "checkin" | "admin";

const LOCKED_MESSAGE = "انتهى موعد المناسبة، الدعوة متاحة للعرض فقط";

/** Signed-in user who has already replaced any temporary password. */
export async function requireUser(): Promise<{ ok: true; user: SessionUser } | { ok: false; response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: jsonError("يجب تسجيل الدخول", 401) };
  if (user.mustChangePassword) return { ok: false, response: jsonError("يجب تغيير كلمة المرور المؤقتة أولاً", 403) };
  return { ok: true, user };
}

export async function requireAdmin() {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  if (auth.user.role !== "admin") return { ok: false as const, response: jsonError("هذه العملية للإدارة فقط", 403) };
  return auth;
}

/** Loads the invitation and checks the signed-in user may perform `need` on it. */
export async function requireAccess(
  id: string,
  need: Need,
): Promise<{ ok: true; user: SessionUser; inv: LoadedInvitation; access: Access } | { ok: false; response: NextResponse }> {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const found = await getInvitationAccess(id, auth.user);
  if (!found) return { ok: false, response: jsonError("لا تملك صلاحية على هذه الدعوة", 403) };
  const { access } = found;
  const allowed =
    need === "view" ||
    (need === "edit" && access.canEdit) ||
    (need === "guests" && access.canManageGuests) ||
    (need === "wishes" && access.canModerateWishes) ||
    (need === "checkin" && access.canCheckIn) ||
    (need === "admin" && access.canManageAccess);
  if (!allowed) return { ok: false, response: jsonError(need === "admin" ? "هذه العملية للإدارة فقط" : LOCKED_MESSAGE, 403) };
  return { ok: true, user: auth.user, ...found };
}

/** Very small in-memory fixed-window limiter; good enough for a single instance. */
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(req: NextRequest, name: string, limit: number, windowMs: number) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "local";
  const key = `${name}:${ip}`;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    }
    return null;
  }
  b.count++;
  return b.count > limit ? jsonError("طلبات كثيرة، حاول لاحقاً", 429) : null;
}
