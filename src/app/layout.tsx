import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "دعوتي | دعوات زفاف إلكترونية فاخرة",
    template: "%s | دعوتي",
  },
  description:
    "أنشئ دعوة زفاف إلكترونية أنيقة على شكل رابط: عدّاد تنازلي، موقع الحفل، تأكيد الحضور، روابط شخصية لكل ضيف، بطاقة دخول QR، ودفتر تهاني.",
  applicationName: "دعوتي",
};

export const viewport: Viewport = {
  themeColor: "#fbf8f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
