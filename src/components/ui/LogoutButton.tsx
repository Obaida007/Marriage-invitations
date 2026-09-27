"use client";

import { useRouter } from "next/navigation";

export function LogoutButton({ className = "btn-ghost" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
    >
      خروج
    </button>
  );
}
