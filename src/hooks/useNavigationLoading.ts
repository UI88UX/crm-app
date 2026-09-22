// src/hooks/useNavigationLoading.ts
"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export function useNavigationLoading() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const navigate = useCallback(
    (href: string) => {
      if (isNavigating) return;
      setIsNavigating(true);
      router.push(href);
    },
    [isNavigating, router]
  );

  return { isNavigating, navigate };
}