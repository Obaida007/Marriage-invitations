import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, count, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, schema } from "./db";
import { newId } from "./ids";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number, opts: { N: number; r: number; p: number }) => Promise<Buffer>;

export const SESSION_COOKIE = "dawati_session";
const SESSION_DAYS = 30;
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
export const MIN_PASSWORD_LENGTH = 8;

export type SessionUser = Pick<typeof schema.users.$inferSelect, "id" | "username" | "name" | "role" | "mustChangePassword">;

// ---------- Passwords ----------

const SCRYPT = { N: 16384, r: 8, p: 1 };

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64, SCRYPT);
  return `scrypt$${SCRYPT.N}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, n, saltB64, hashB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, { ...SCRYPT, N: Number(n) });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Readable temporary password, e.g. "Kp7m-Qx4t-Rn2w". */
export function generateTempPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(12);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

// ---------- Sessions ----------

const tokenId = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const db = await getDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.insert(schema.sessions).values({ id: tokenId(token), userId, expiresAt });
  // Opportunistic cleanup of expired sessions.
  await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()));
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(schema.sessions).where(eq(schema.sessions.id, tokenId(token)));
  }
  jar.delete(SESSION_COOKIE);
}

/** Ends every session of a user (password reset, deactivation). */
export async function destroyUserSessions(userId: string) {
  const db = await getDb();
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
}

/** The signed-in, active user for this request, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const [row] = await db
    .select({
      id: schema.users.id,
      username: schema.users.username,
      name: schema.users.name,
      role: schema.users.role,
      mustChangePassword: schema.users.mustChangePassword,
      active: schema.users.active,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(eq(schema.sessions.id, tokenId(token)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || !row.active) return null;
  const { active: _active, ...user } = row;
  void _active;
  return user;
}

/** For pages: redirects to login (or the forced password change) when needed. */
export async function requirePageUser(opts: { allowPasswordChange?: boolean } = {}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword && !opts.allowPasswordChange) redirect("/account/password");
  return user;
}

// ---------- Login ----------

export type LoginResult = { ok: true; user: SessionUser } | { ok: false; error: string };

export async function attemptLogin(usernameRaw: string, password: string): Promise<LoginResult> {
  const db = await getDb();
  const username = usernameRaw.trim().toLowerCase();
  const user = await db.query.users.findFirst({ where: eq(schema.users.username, username) });
  const generic = "اسم المستخدم أو كلمة المرور غير صحيحة";
  if (!user) {
    // Spend comparable time so response timing doesn't reveal valid usernames.
    await hashPassword(password);
    return { ok: false, error: generic };
  }
  if (!user.active) return { ok: false, error: "هذا الحساب موقوف، تواصل مع الإدارة" };
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return { ok: false, error: `تم إيقاف الدخول مؤقتاً بسبب محاولات خاطئة متكررة. حاول بعد ${mins} دقيقة` };
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    const failed = user.failedLogins + 1;
    const lock = failed >= MAX_FAILED_LOGINS;
    await db
      .update(schema.users)
      .set({ failedLogins: lock ? 0 : failed, lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60000) : null })
      .where(eq(schema.users.id, user.id));
    return { ok: false, error: lock ? `محاولات كثيرة خاطئة، تم إيقاف الدخول ${LOCK_MINUTES} دقيقة` : generic };
  }
  await db.update(schema.users).set({ failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));
  await createSession(user.id);
  return { ok: true, user: { id: user.id, username: user.username, name: user.name, role: user.role, mustChangePassword: user.mustChangePassword } };
}

// ---------- Admin bootstrap ----------

let bootstrapped: Promise<void> | null = null;

/**
 * Creates the first admin from ADMIN_USERNAME / ADMIN_PASSWORD when no admin
 * exists. In development a default admin/admin12345 is used (must be changed).
 */
export function ensureAdmin() {
  bootstrapped ??= (async () => {
    const db = await getDb();
    const [{ n }] = await db.select({ n: count() }).from(schema.users).where(eq(schema.users.role, "admin"));
    if (n > 0) return;
    let username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
    let password = process.env.ADMIN_PASSWORD;
    if (!username || !password) {
      if (process.env.NODE_ENV === "production") {
        console.warn("[dawati] No admin account. Set ADMIN_USERNAME and ADMIN_PASSWORD to create one.");
        return;
      }
      username = "admin";
      password = "admin12345";
      console.warn("[dawati] Created development admin: admin / admin12345 (you'll be asked to change it).");
    }
    await db
      .insert(schema.users)
      .values({ id: newId(), username, name: "مدير النظام", role: "admin", passwordHash: await hashPassword(password), mustChangePassword: !process.env.ADMIN_PASSWORD })
      .onConflictDoNothing();
  })().catch((err) => {
    bootstrapped = null;
    throw err;
  });
  return bootstrapped;
}
