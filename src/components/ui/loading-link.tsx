// src/components/ui/loading-link.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingLink({
  href,
  children,
  className,
  activeClassName,
  isActive,
  spinnerClassName,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  isActive?: boolean;
  spinnerClassName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  // ✅ وقتی مسیر عوض شد، لودینگ را ریست کن
  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading || isActive) return;
    setLoading(true);
    router.push(href);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      data-loading="false"
      className={cn(
        className,
        isActive && activeClassName,
        loading && "opacity-70 pointer-events-none"
      )}
    >
      {children}
      {loading && (
        <Loader2
          className={cn("w-4 h-4 animate-spin ml-auto", spinnerClassName)}
        />
      )}
    </a>
  );
}