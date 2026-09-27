"use client";

export interface WishRow {
  id: string;
  name: string;
  message: string;
  hidden: boolean;
  createdAt: string;
}

export function WishesManager({ invitationId, wishes, setWishes }: { invitationId: string; wishes: WishRow[]; setWishes: React.Dispatch<React.SetStateAction<WishRow[]>> }) {
  async function toggle(w: WishRow) {
    setWishes((l) => l.map((x) => (x.id === w.id ? { ...x, hidden: !w.hidden } : x)));
    await fetch(`/api/invitations/${invitationId}/wishes/${w.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ hidden: !w.hidden }) });
  }
  async function remove(w: WishRow) {
    if (!confirm("حذف هذه التهنئة؟")) return;
    setWishes((l) => l.filter((x) => x.id !== w.id));
    await fetch(`/api/invitations/${invitationId}/wishes/${w.id}`, { method: "DELETE" });
  }

  if (wishes.length === 0) {
    return <div className="card p-10 text-center text-stone-500">لا توجد تهاني بعد. ستظهر هنا فور كتابتها من الضيوف 💌</div>;
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {wishes.map((w) => (
        <div key={w.id} className={`card p-4 ${w.hidden ? "opacity-60" : ""}`}>
          <p className="whitespace-pre-line font-amiri text-lg leading-relaxed">{w.message}</p>
          <div className="mt-3 flex items-center justify-between gap-2 text-sm">
            <span className="font-bold text-brand-dark">
              {w.name}
              <span className="ms-2 font-normal text-stone-400">{new Date(w.createdAt).toLocaleDateString("ar-u-nu-latn")}</span>
            </span>
            <span className="flex gap-3">
              <button className="text-stone-600 hover:underline" onClick={() => toggle(w)}>
                {w.hidden ? "إظهار" : "إخفاء"}
              </button>
              <button className="text-red-600 hover:underline" onClick={() => remove(w)}>
                حذف
              </button>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
