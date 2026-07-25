import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import ClientBody from "./ClientBody";
import { Providers } from "@/src/components/providers";

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
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        {/* استفاده از next/script به جای script معمولی */}
        {/* <Script
          src="//unpkg.com/react-grab/dist/index.global.js"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        <Script
          src="//unpkg.com/same-runtime/dist/index.global.js"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        /> */}
      </head>
      <body suppressHydrationWarning className="antialiased">
        <Providers>
          <ClientBody>{children}</ClientBody>
        </Providers>
      </body>
    </html>
  );
}