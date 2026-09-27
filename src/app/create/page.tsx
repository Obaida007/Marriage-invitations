import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { InvitationEditor } from "@/components/editor/InvitationEditor";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { defaultContent } from "@/lib/defaults";
import { THEMES } from "@/lib/themes";
import { THEME_IDS, type ThemeId } from "@/lib/invitation-schema";

export const metadata: Metadata = { title: "إنشاء دعوة جديدة" };

export default async function CreatePage(props: PageProps<"/create">) {
  await connection();
  const { theme } = await props.searchParams;
  const content = defaultContent();
  if (typeof theme === "string" && (THEME_IDS as readonly string[]).includes(theme)) {
    const th = THEMES[theme as ThemeId];
    content.style.theme = th.id;
    content.style.headingFont = th.headingFont;
    content.style.bodyFont = th.bodyFont;
  }
  return (
    <>
      <SiteHeader>
        <Link href="/" className="btn-ghost">
          الرئيسية
        </Link>
      </SiteHeader>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-stone-800 sm:text-3xl">أنشئ دعوتك</h1>
          <p className="mt-1 text-stone-600">عدّل البيانات وشاهد الدعوة تتغير مباشرة. لا حاجة لإنشاء حساب.</p>
        </div>
        <InvitationEditor mode="create" initial={content} />
      </main>
    </>
  );
}
