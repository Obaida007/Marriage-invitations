import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { listInvitationsFor } from "@/lib/data";
import { AppHeader } from "@/components/ui/AppHeader";
import { InvitationCard, statusOf } from "@/components/account/InvitationCard";

export const metadata: Metadata = { title: "دعواتي", robots: { index: false } };

export default async function MyInvitationsPage() {
  const user = await requirePageUser();
  if (user.role === "admin") redirect("/admin");
  const list = await listInvitationsFor(user);
  const upcoming = list.filter((i) => statusOf(i).key !== "past");
  const past = list.filter((i) => statusOf(i).key === "past");

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="font-display text-4xl text-stone-800">دعواتي</h1>
        <p className="mt-1 text-stone-600">أهلاً {user.name} 👋 هذه المناسبات المرتبطة بحسابك.</p>

        {list.length === 0 ? (
          <div className="card mt-8 p-10 text-center text-stone-500">لا توجد دعوات مرتبطة بحسابك بعد. تواصل مع الإدارة لربط مناسبتك.</div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-3 font-bold text-stone-700">المناسبات القادمة</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((inv) => (
                    <InvitationCard key={inv.id} inv={inv} />
                  ))}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section className="mt-10">
                <h2 className="mb-1 font-bold text-stone-700">مناسبات منتهية</h2>
                <p className="mb-3 text-sm text-stone-500">يمكنك مراجعة المدعوين والردود والتهاني، دون تعديل.</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {past.map((inv) => (
                    <InvitationCard key={inv.id} inv={inv} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
