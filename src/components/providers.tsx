"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/src/components/ui/sonner";

/**
 * Providerهای سراسری برنامه که در ریشه (layout) قرار می‌گیرند:
 *  - ThemeProvider: مدیریت تم روشن/تیره/سیستمی (next-themes)
 *  - Toaster: نمایش نوتیفیکیشن‌ها (sonner)
 *
 * با اضافه‌شدن ماژول‌های بعدی (مثلاً React Query)، Providerهای جدید را همین‌جا
 * اضافه می‌کنیم تا layout تمیز بماند.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster richColors closeButton position="top-center" />
    </ThemeProvider>
  );
}
