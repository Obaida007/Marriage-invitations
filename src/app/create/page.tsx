import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { AppHeader } from "@/components/ui/AppHeader";
import { InvitationEditor } from "@/components/editor/InvitationEditor";
import { defaultContent, defaultStyle } from "@/lib/defaults";
import { THEME_IDS, type ThemeId } from "@/lib/invitation-schema";

export const metadata: Metadata = { title: "إنشاء دعوة جديدة" };

export default async function CreatePage(props: PageProps<"/create">) {
  // Only admins create occasions (and so decide their date).
  const user = await requirePageUser();
  if (user.role !== "admin") redirect("/my");
  const { theme } = await props.searchParams;
  const content = defaultContent();
  if (typeof theme === "string" && (THEME_IDS as readonly string[]).includes(theme)) {
    content.style = defaultStyle(theme as ThemeId);
  }
  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-stone-800 sm:text-3xl">دعوة جديدة</h1>
          <p className="mt-1 text-stone-600">حدّد تاريخ المناسبة وأسماء العروسين بدقة — لن يتمكن أصحاب الدعوة من تغييرها لاحقاً. بعد الإنشاء اربط حسابات أصحابها من قسم «الوصول».</p>
        </div>
        <InvitationEditor mode="create" initial={content} />
      </main>
    </>
  );
}
