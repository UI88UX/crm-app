// src/app/layout.tsx
import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ClientBody from "./ClientBody";
import { Providers } from "@/src/components/providers";
import { QueryProvider } from "@/lib/react-query/QueryProvider";
import { GlobalLoader } from "@/components/ui/global-loader"; 
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
      <body suppressHydrationWarning className="font-vazir antialiased">
        <QueryProvider>
          <Providers>
            <ClientBody>
              <GlobalLoader /> {/* ✅ اضافه شد */}
              {children}
            </ClientBody>
          </Providers>
        </QueryProvider>
      </body>
    </html>
  );
}