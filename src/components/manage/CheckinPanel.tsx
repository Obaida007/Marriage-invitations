"use client";

import { useEffect, useRef, useState } from "react";
import type { GuestStats } from "@/lib/data";
import { Spinner } from "@/components/ui/controls";
import { normalize, type GuestRow } from "./GuestsManager";

type Result = { kind: "ok" | "again" | "error"; guest?: GuestRow; message?: string };

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike;
  }
}

export function CheckinPanel({
  invitationId,
  guests,
  setGuests,
  stats,
}: {
  invitationId: string;
  guests: GuestRow[];
  setGuests: React.Dispatch<React.SetStateAction<GuestRow[]>>;
  stats: GuestStats;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanSupported, setScanSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastScan = useRef<{ value: string; at: number }>({ value: "", at: 0 });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feature detection must run in the browser
    setScanSupported(typeof window !== "undefined" && !!window.BarcodeDetector && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  async function checkIn(token: string) {
    if (!token.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/checkin`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await res.json();
      if (!res.ok) {
        setResult({ kind: "error", message: data.error ?? "رمز غير صحيح" });
        navigator.vibrate?.([80, 60, 80]);
        return;
      }
      const g = normalize(data.guest);
      setGuests((l) => l.map((x) => (x.id === g.id ? g : x)));
      setResult({ kind: data.alreadyCheckedIn ? "again" : "ok", guest: g });
      navigator.vibrate?.(data.alreadyCheckedIn ? [60, 40, 60] : 120);
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!scanning || !window.BarcodeDetector) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        const tick = async () => {
          if (stopped) return;
          try {
            const codes = await detector.detect(video);
            const value = codes[0]?.rawValue;
            const now = Date.now();
            if (value && (value !== lastScan.current.value || now - lastScan.current.at > 4000)) {
              lastScan.current = { value, at: now };
              await checkIn(value);
            }
          } catch {}
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setResult({ kind: "error", message: "تعذر الوصول إلى الكاميرا" });
        setScanning(false);
      }
    })();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- checkIn is stable enough for the scan loop
  }, [scanning]);

  const recent = guests
    .filter((g) => g.checkedInAt)
    .sort((a, b) => (b.checkedInAt ?? "").localeCompare(a.checkedInAt ?? ""))
    .slice(0, 12);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="card grid grid-cols-2 divide-x divide-line text-center">
          <div className="p-4">
            <div className="text-3xl font-extrabold text-violet-700">{stats.checkedIn}</div>
            <div className="text-xs text-stone-500">دعوة تم استقبالها</div>
          </div>
          <div className="p-4">
            <div className="text-3xl font-extrabold text-emerald-700">
              {stats.checkedInSeats} / {stats.headcount}
            </div>
            <div className="text-xs text-stone-500">شخص حضر من المؤكدين</div>
          </div>
        </div>

        <div className="card space-y-4 p-5">
          <h2 className="font-bold">🎫 تسجيل دخول الضيوف</h2>
          {scanSupported ? (
            <button type="button" className={scanning ? "btn-danger w-full" : "btn-primary w-full"} onClick={() => setScanning((s) => !s)}>
              {scanning ? "إيقاف الكاميرا" : "📷 مسح رمز QR بالكاميرا"}
            </button>
          ) : (
            <p className="rounded-xl bg-soft p-3 text-sm text-stone-600">المسح بالكاميرا غير مدعوم في هذا المتصفح (استخدم Chrome على أندرويد)، ويمكنك إدخال الرمز المكتوب أسفل بطاقة الضيف.</p>
          )}
          {scanning && <video ref={videoRef} className="aspect-square w-full rounded-2xl bg-black object-cover" muted playsInline />}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              checkIn(code);
            }}
          >
            <input className="input font-mono uppercase tracking-widest" dir="ltr" placeholder="ABCD2345" value={code} onChange={(e) => setCode(e.target.value)} />
            <button className="btn-primary shrink-0" disabled={busy}>
              {busy ? <Spinner /> : "تحقق"}
            </button>
          </form>
          {result && (
            <div
              className={`rounded-2xl p-4 ${result.kind === "ok" ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200" : result.kind === "again" ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200" : "bg-red-50 text-red-800 ring-1 ring-red-200"}`}
              role="status"
            >
              {result.kind === "error" ? (
                <p className="font-bold">✕ {result.message}</p>
              ) : (
                <>
                  <p className="text-lg font-extrabold">
                    {result.kind === "ok" ? "✓ أهلاً وسهلاً" : "⚠️ سبق تسجيل دخول هذه الدعوة"} — {result.guest?.name}
                  </p>
                  <p className="mt-1 text-sm">
                    {result.guest?.status === "attending" ? `عدد الحضور المؤكد: ${result.guest.attendingCount}` : result.guest?.status === "declined" ? "كان قد اعتذر عن الحضور" : "لم يؤكد الحضور مسبقاً"} · المسموح:{" "}
                    {(result.guest?.maxCompanions ?? 0) + 1}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 font-bold">آخر من حضر</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-stone-500">لم يتم تسجيل أي دخول بعد.</p>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((g) => (
              <li key={g.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-semibold">{g.name}</span>
                <span className="text-stone-500">
                  {g.attendingCount || 1} · {new Date(g.checkedInAt!).toLocaleTimeString("ar-u-nu-latn", { hour: "numeric", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
