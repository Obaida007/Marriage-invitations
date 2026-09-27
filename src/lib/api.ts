import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { manageKeyFromRequest } from "./auth";
import { getManagedInvitation } from "./data";

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

export async function requireManaged(req: NextRequest, id: string) {
  const inv = await getManagedInvitation(id, manageKeyFromRequest(req, id));
  if (!inv) return { ok: false as const, response: jsonError("غير مصرح لك بإدارة هذه الدعوة", 401) };
  return { ok: true as const, inv };
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
