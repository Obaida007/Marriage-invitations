import type { Metadata } from "next";
import { MIN_PASSWORD_LENGTH, requirePageUser } from "@/lib/auth";
import { AppHeader } from "@/components/ui/AppHeader";
import { PasswordForm } from "@/components/account/PasswordForm";

export const metadata: Metadata = { title: "كلمة المرور", robots: { index: false } };

export default async function PasswordPage() {
  const user = await requirePageUser({ allowPasswordChange: true });
  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
        <p className="mb-4 text-center text-sm text-stone-500">
          الحساب: <b dir="ltr">{user.username}</b>
        </p>
        <PasswordForm forced={user.mustChangePassword} minLength={MIN_PASSWORD_LENGTH} />
      </main>
    </>
  );
}
