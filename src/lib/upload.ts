"use client";

/** Downscales an image in the browser and re-encodes it as JPEG before uploading. */
async function compressImage(file: File, maxSize = 1600, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("تعذر معالجة الصورة"))), "image/jpeg", quality),
  );
}

export async function uploadFile(file: File, kind: "image" | "audio"): Promise<string> {
  const body = new FormData();
  if (kind === "image") {
    body.append("file", await compressImage(file), "image.jpg");
  } else {
    body.append("file", file);
  }
  const res = await fetch("/api/media", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "فشل رفع الملف");
  return data.url as string;
}
