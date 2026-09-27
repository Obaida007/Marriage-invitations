import "server-only";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

function makeClient(): Client {
  const url = process.env.DATABASE_URL ?? "file:./data/app.db";
  if (url.startsWith("file:")) {
    fs.mkdirSync(path.dirname(path.resolve(url.slice(5))), { recursive: true });
  }
  return createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
}

const globalForDb = globalThis as unknown as {
  __client?: Client;
  __migrated?: Promise<void>;
  __migratedFor?: number;
};

const migrationsFolder = path.join(process.cwd(), "drizzle");
const journalPath = path.join(migrationsFolder, "meta", "_journal.json");

/**
 * Identifies the current set of migrations. In development the dev server (and
 * this module's global state) survives `git pull` and hot reloads, so new
 * migration files must trigger a re-run; production processes start fresh.
 */
function migrationsVersion() {
  if (process.env.NODE_ENV === "production") return 0;
  try {
    return fs.statSync(journalPath).mtimeMs;
  } catch {
    return 0;
  }
}

const client = (globalForDb.__client ??= makeClient());
export const db = drizzle(client, { schema });

/** Applies pending migrations before the first query (and again if new ones appear). */
export async function getDb() {
  const version = migrationsVersion();
  if (!globalForDb.__migrated || globalForDb.__migratedFor !== version) {
    globalForDb.__migratedFor = version;
    globalForDb.__migrated = (async () => {
      // Needed for ON DELETE CASCADE (guests, wishes, members, sessions).
      await client.execute("PRAGMA foreign_keys = ON");
      await migrate(db, { migrationsFolder });
    })().catch((err) => {
      globalForDb.__migrated = undefined;
      console.error("[dawati] Database migration failed:", err);
      throw err;
    });
  }
  await globalForDb.__migrated;
  return db;
}

export { schema };
