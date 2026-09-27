import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ensureAdmin, getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { LoginForm } from "@/components/account/LoginForm";

export const metadata: Metadata = { title: "تسجيل الدخول", robots: { index: false } };

export default async function LoginPage() {
  await ensureAdmin();
  const user = await getCurrentUser();
  if (user) redirect(user.mustChangePassword ? "/account/password" : user.role === "admin" ? "/admin" : "/my");
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
        <LoginForm />
      </main>
    </>
  );
}
