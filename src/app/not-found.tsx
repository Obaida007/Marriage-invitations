import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div className="text-6xl">💌</div>
      <h1 className="mt-4 font-display text-4xl text-stone-800">الدعوة غير موجودة</h1>
      <p className="mt-2 text-stone-600">ربما تم حذفها أو إخفاؤها، أو أن الرابط غير صحيح.</p>
      <Link href="/" className="btn-primary mt-6">
        العودة للرئيسية
      </Link>
    </main>
  );
}
