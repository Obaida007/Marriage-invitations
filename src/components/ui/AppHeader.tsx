import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import { SiteHeader } from "./SiteHeader";
import { LogoutButton } from "./LogoutButton";

/** Header for signed-in pages. */
export function AppHeader({ user, children }: { user: SessionUser; children?: React.ReactNode }) {
  return (
    <SiteHeader>
      {children}
      {user.role === "admin" ? (
        <Link href="/admin" className="btn-ghost hidden sm:inline-flex">
          لوحة الإدارة
        </Link>
      ) : (
        <Link href="/my" className="btn-ghost hidden sm:inline-flex">
          دعواتي
        </Link>
      )}
      <Link href="/account/password" className="hidden items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-stone-600 hover:bg-soft md:flex" title="الحساب">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-soft font-bold text-brand-dark">{user.name.trim().charAt(0)}</span>
        <span className="max-w-32 truncate">{user.name}</span>
      </Link>
      <LogoutButton />
    </SiteHeader>
  );
}
