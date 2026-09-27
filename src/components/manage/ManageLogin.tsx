export function ManageLogin({ id, error }: { id: string; error: boolean }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <form method="GET" action={`/manage/${id}/access`} className="card space-y-4 p-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-soft text-2xl">🔐</div>
          <h1 className="text-xl font-extrabold">إدارة الدعوة</h1>
          <p className="mt-1 text-sm text-stone-600">الصق رابط الإدارة الذي حصلت عليه عند إنشاء الدعوة، أو مفتاح الإدارة.</p>
        </div>
        {error && <p className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">رابط أو مفتاح الإدارة غير صحيح</p>}
        <input name="key" className="input" dir="ltr" placeholder="https://…/manage/…/access?key=…" required autoComplete="off" />
        <button className="btn-primary w-full">دخول</button>
      </form>
    </main>
  );
}
