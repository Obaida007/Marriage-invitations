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
};

const client = (globalForDb.__client ??= makeClient());
export const db = drizzle(client, { schema });

/** Applies pending migrations once per process before the first query. */
export async function getDb() {
  globalForDb.__migrated ??= (async () => {
    // Needed for ON DELETE CASCADE (guests, wishes, members, sessions).
    await client.execute("PRAGMA foreign_keys = ON");
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  })().catch((err) => {
    globalForDb.__migrated = undefined;
    throw err;
  });
  await globalForDb.__migrated;
  return db;
}

export { schema };
