// src/components/ui/global-loader.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function GlobalLoader() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingClicks, setPendingClicks] = useState(0);

  useEffect(() => {
    // وقتی مسیر تغییر می‌کنه، بارگذاری رو مخفی کن
    setIsLoading(false);
    setIsNavigating(false);
    setPendingClicks(0);
  }, [pathname]);

  useEffect(() => {
    // گوش دادن به رویدادهای کلیک روی لینک‌ها و دکمه‌ها
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // پیدا کردن نزدیک‌ترین لینک یا دکمه
      const clickable = target.closest('a, button, [role="button"]');
      if (!clickable) return;

      // بررسی اینکه آیا لینک به صفحه دیگری می‌رود
      const isLink = clickable.tagName === 'A';
      const isButton = clickable.tagName === 'BUTTON' || clickable.hasAttribute('role');
      
      // اگر دکمه و از نوع submit یا دارای data-loading=false نباشد
      if (isButton) {
        const button = clickable as HTMLButtonElement;
        // اگر دکمه disabled یا دارای data-loading=false باشد، نادیده بگیر
        if (button.disabled || button.dataset.loading === 'false') return;
        
        // اگر دکمه در فرم نیست یا type submit نیست، نادیده بگیر
        if (button.type !== 'submit' && !button.closest('form')) return;
        
        // نمایش بارگذاری برای دکمه‌های submit
        setIsLoading(true);
        setPendingClicks(prev => prev + 1);
        
        // بعد از 5 ثانیه اگر هنوز بارگذاری نشده، مخفی کن
        setTimeout(() => {
          setPendingClicks(prev => {
            const newCount = prev - 1;
            if (newCount <= 0) {
              setIsLoading(false);
              return 0;
            }
            return newCount;
          });
        }, 5000);
        return;
      }

      // اگر لینک است و به صفحه دیگری می‌رود
      if (isLink) {
        const link = clickable as HTMLAnchorElement;
        const href = link.getAttribute('href');
        
        // اگر لینک خالی یا anchor (#) یا target blank یا download باشد، نادیده بگیر
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || link.target === '_blank' || link.download) return;
        
        // اگر لینک دارای data-loading=false باشد، نادیده بگیر
        if (link.dataset.loading === 'false') return;

        // نمایش بارگذاری
        setIsNavigating(true);
        setIsLoading(true);
        
        // بعد از 10 ثانیه اگر هنوز بارگذاری نشده، مخفی کن
        setTimeout(() => {
          setIsNavigating(false);
          setIsLoading(false);
        }, 10000);
      }
    };

    // گوش دادن به رویدادهای submit فرم
    const handleFormSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (!form) return;
      
      // اگر فرم دارای data-loading=false باشد، نادیده بگیر
      if (form.dataset.loading === 'false') return;
      
      setIsLoading(true);
      setPendingClicks(prev => prev + 1);
      
      setTimeout(() => {
        setPendingClicks(prev => {
          const newCount = prev - 1;
          if (newCount <= 0) {
            setIsLoading(false);
            return 0;
          }
          return newCount;
        });
      }, 5000);
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleFormSubmit);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleFormSubmit);
    };
  }, []);

  // اگر بارگذاری فعال نباشد، چیزی نمایش نده
  if (!isLoading) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-background/50 backdrop-blur-sm transition-all duration-300",
        isLoading ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      style={{
        animation: "fadeIn 0.2s ease-in-out",
      }}
    >
      <div className="flex flex-col items-center gap-3 bg-card p-6 rounded-xl shadow-lg border border-border/50">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          {isNavigating ? "در حال انتقال به صفحه..." : "در حال پردازش..."}
        </p>
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

// اضافه کردن استایل‌های انیمیشن
const styles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}