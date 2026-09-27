"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Toggle } from "@/components/ui/controls";
import { CopyButton } from "./CopyButton";

/** The venue-door QR: guests scan it and enter name + phone to check themselves in. */
export function VenueQrCard({
  invitationId,
  origin,
  initialCode,
  initialEnabled,
  windowLabel,
}: {
  invitationId: string;
  origin: string;
  initialCode: string;
  initialEnabled: boolean;
  windowLabel: string;
}) {
  const [code, setCode] = useState(initialCode);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [src, setSrc] = useState("");
  const url = `${origin}/c/${code}`;

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 1024, errorCorrectionLevel: "M" }).then(setSrc, () => setSrc(""));
  }, [url]);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/invitations/${invitationId}/venue-qr`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) return alert(data.error);
    setCode(data.checkinCode);
    setEnabled(data.selfCheckin);
  }

  return (
    <div className="card space-y-4 p-5">
      <div>
        <h2 className="font-bold">🚪 رمز QR لباب القاعة</h2>
        <p className="text-sm text-stone-600">اطبعه وضعه عند المدخل. يمسحه الضيف ويكتب اسمه ورقم جواله فيُسجَّل حضوره. إن كان مدعواً برقمه يُطابَق تلقائياً، وإلا يُضاف كضيف «سجّل عند الباب».</p>
      </div>
      <div className="flex flex-wrap items-start gap-4">
        <div className={`h-36 w-36 shrink-0 overflow-hidden rounded-xl border border-line bg-white p-1.5 ${enabled ? "" : "opacity-40"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL */}
          {src && <img src={src} alt="QR" className="h-full w-full" />}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <code className="block truncate rounded-lg bg-soft px-2 py-1.5 text-xs" dir="ltr">
            {url}
          </code>
          <div className="flex flex-wrap gap-2">
            <a href={`/manage/${invitationId}/poster`} target="_blank" className="btn-primary px-3 py-2 text-xs">
              🖨️ ملصق للطباعة
            </a>
            {src && (
              <a href={src} download="venue-qr.png" className="btn-ghost px-3 py-2 text-xs">
                ⬇️ تحميل الصورة
              </a>
            )}
            <CopyButton text={url} label="نسخ الرابط" className="btn-ghost px-3 py-2 text-xs" />
          </div>
          <p className="text-xs text-stone-500">⏰ {windowLabel}</p>
        </div>
      </div>
      <Toggle label="تسجيل الحضور الذاتي مفعّل" checked={enabled} onChange={(v) => patch({ selfCheckin: v })} />
      <button
        type="button"
        className="text-xs text-stone-500 underline"
        onClick={() => confirm("سيتوقف الرمز الحالي والملصقات المطبوعة عن العمل. متابعة؟") && patch({ regenerate: true })}
      >
        توليد رمز جديد (عند تسريب الرمز)
      </button>
    </div>
  );
}
