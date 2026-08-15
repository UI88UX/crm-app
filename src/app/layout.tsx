// src/app/layout.tsx

import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ClientBody from "./ClientBody";
import { Providers } from "@/src/components/providers";

// تعریف فونت Vazir
const vazir = Vazirmatn({
  subsets: ["arabic"],
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-vazir",
});

export const metadata: Metadata = {
  title: "CRM — مدیریت ارتباط با مشتری",
  description: "سامانه مدیریت ارتباط با مشتری ساخته‌شده با Next.js و Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={vazir.variable}>
      <head>
        {/* اسکریپت‌های مورد نظر */}
      </head>
      <body suppressHydrationWarning className="font-vazir antialiased">
        <Providers>
          <ClientBody>{children}</ClientBody>
        </Providers>
      </body>
    </html>
  );
}