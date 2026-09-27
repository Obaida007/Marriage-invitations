import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, blob } from "drizzle-orm/sqlite-core";
import type { InvitationContent } from "@/lib/invitation-schema";

export const invitations = sqliteTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    /** Legacy secret-link access; no longer used (access is via user accounts). */
    manageKeyHash: text("manage_key_hash").notNull().default(""),
    content: text("content", { mode: "json" }).$type<InvitationContent>().notNull(),
    published: integer("published", { mode: "boolean" }).notNull().default(true),
    views: integer("views").notNull().default(0),
    /** Guest-list quota for this occasion (null = unlimited). */
    maxGuests: integer("max_guests"),
    /** Admin override: owners may keep editing until this time even after the event. */
    unlockUntil: integer("unlock_until", { mode: "timestamp" }),
    createdBy: text("created_by"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
);

export const guests = sqliteTable(
  "guests",
  {
    id: text("id").primaryKey(),
    invitationId: text("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    name: text("name").notNull(),
    phone: text("phone"),
    side: text("side", { enum: ["groom", "bride", "both"] }).notNull().default("both"),
    maxCompanions: integer("max_companions").notNull().default(0),
    status: text("status", { enum: ["pending", "attending", "declined"] }).notNull().default("pending"),
    attendingCount: integer("attending_count").notNull().default(0),
    note: text("note"),
    source: text("source", { enum: ["list", "public"] }).notNull().default("list"),
    openedAt: integer("opened_at", { mode: "timestamp" }),
    respondedAt: integer("responded_at", { mode: "timestamp" }),
    checkedInAt: integer("checked_in_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [index("guests_invitation_idx").on(t.invitationId)],
);

export const wishes = sqliteTable(
  "wishes",
  {
    id: text("id").primaryKey(),
    invitationId: text("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    guestId: text("guest_id").references(() => guests.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    message: text("message").notNull(),
    hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [index("wishes_invitation_idx").on(t.invitationId)],
);

export const media = sqliteTable("media", {
  id: text("id").primaryKey(),
  mime: text("mime").notNull(),
  data: blob("data", { mode: "buffer" }).notNull(),
  size: integer("size").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  /** Login name, stored lowercase. */
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "owner"] }).notNull().default("owner"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  /** Set for admin-issued temporary passwords; forces a change at next login. */
  mustChangePassword: integer("must_change_password", { mode: "boolean" }).notNull().default(true),
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: integer("locked_until", { mode: "timestamp" }),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

/** Which users may manage which invitation (at most MAX_MEMBERS per invitation). */
export const invitationMembers = sqliteTable(
  "invitation_members",
  {
    invitationId: text("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [primaryKey({ columns: [t.invitationId, t.userId] }), index("members_user_idx").on(t.userId)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    /** SHA-256 of the session token; the raw token only lives in the cookie. */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export type Invitation = typeof invitations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Guest = typeof guests.$inferSelect;
export type Wish = typeof wishes.$inferSelect;
