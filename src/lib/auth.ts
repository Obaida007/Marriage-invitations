import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const manageCookieName = (id: string) => `mk_${id}`;

export function hashKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export function verifyKey(key: string | undefined | null, hash: string) {
  if (!key) return false;
  const a = Buffer.from(hashKey(key), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Reads the manage key from the `x-manage-key` header or the per-invitation cookie. */
export function manageKeyFromRequest(req: NextRequest, id: string) {
  return req.headers.get("x-manage-key") ?? req.cookies.get(manageCookieName(id))?.value ?? null;
}

export async function manageKeyFromCookies(id: string) {
  return (await cookies()).get(manageCookieName(id))?.value ?? null;
}
