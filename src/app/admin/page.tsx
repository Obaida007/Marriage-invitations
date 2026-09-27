import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { count, desc, eq } from "drizzle-orm";
import { requirePageUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { listInvitationsFor } from "@/lib/data";
import { AppHeader } from "@/components/ui/AppHeader";
import { InvitationCard } from "@/components/account/InvitationCard";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { UsersManager } from "@/components/admin/UsersManager";

export const metadata: Metadata = { title: "لوحة الإدارة", robots: { index: false } };

export default async function AdminPage() {
  const user = await requirePageUser();
  if (user.role !== "admin") redirect("/my");
  const db = await getDb();
  const [invitations, users] = await Promise.all([
    listInvitationsFor(user),
    db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        name: schema.users.name,
        phone: schema.users.phone,
        role: schema.users.role,
        active: schema.users.active,
        mustChangePassword: schema.users.mustChangePassword,
        lastLoginAt: schema.users.lastLoginAt,
        invitations: count(schema.invitationMembers.invitationId),
      })
      .from(schema.users)
      .leftJoin(schema.invitationMembers, eq(schema.invitationMembers.userId, schema.users.id))
      .groupBy(schema.users.id)
      .orderBy(desc(schema.users.createdAt)),
  ]);

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-stone-800">لوحة الإدارة</h1>
            <p className="mt-1 text-stone-600">أنشئ المناسبات وحدد تواريخها، ثم امنح أصحابها حسابات لإدارتها.</p>
          </div>
          <Link href="/create" className="btn-primary">
            ➕ دعوة جديدة
          </Link>
        </div>
        <AdminTabs
          counts={{ invitations: invitations.length, users: users.length }}
          invitations={
            invitations.length === 0 ? (
              <div className="card p-10 text-center text-stone-500">لا توجد دعوات بعد.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {invitations.map((inv) => (
                  <InvitationCard key={inv.id} inv={inv} showMembers />
                ))}
              </div>
            )
          }
          users={<UsersManager currentUserId={user.id} initial={users.map((u) => ({ ...u, lastLoginAt: u.lastLoginAt?.toISOString() ?? null }))} />}
        />
      </main>
    </>
  );
}
