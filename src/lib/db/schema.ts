import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, blob } from "drizzle-orm/sqlite-core";
import type { InvitationContent } from "@/lib/invitation-schema";

export const invitations = sqliteTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    manageKeyHash: text("manage_key_hash").notNull(),
    content: text("content", { mode: "json" }).$type<InvitationContent>().notNull(),
    published: integer("published", { mode: "boolean" }).notNull().default(true),
    views: integer("views").notNull().default(0),
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

export type Invitation = typeof invitations.$inferSelect;
export type Guest = typeof guests.$inferSelect;
export type Wish = typeof wishes.$inferSelect;
