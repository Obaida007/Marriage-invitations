"use client";

import { useState } from "react";

export function AdminTabs({ invitations, users, counts }: { invitations: React.ReactNode; users: React.ReactNode; counts: { invitations: number; users: number } }) {
  const [tab, setTab] = useState<"invitations" | "users">("invitations");
  return (
    <>
      <nav className="mb-6 flex gap-1">
        {(
          [
            ["invitations", `💌 الدعوات (${counts.invitations})`],
            ["users", `👤 المستخدمون (${counts.users})`],
          ] as const
        ).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${tab === id ? "bg-stone-800 text-white" : "bg-white text-stone-600 ring-1 ring-line"}`}>
            {label}
          </button>
        ))}
      </nav>
      {tab === "invitations" ? invitations : users}
    </>
  );
}
