// src/hooks/useCurrentPermissions.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import type { CurrentPermissions } from '@/lib/auth/permissions';

export const permissionKeys = {
  all: ['permissions'] as const,
  current: () => [...permissionKeys.all, 'current'] as const,
};

/**
 * Hook دریافت دسترسی‌های کاربر جاری
 * 
 * از RPC get_my_permissions استفاده می‌کند و role، is_active و permissions را برمی‌گرداند.
 */
export function useCurrentPermissions() {
  return useQuery({
    queryKey: permissionKeys.current(),
    queryFn: async (): Promise<CurrentPermissions> => {
      const response = await fetch('/api/auth/permissions');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت دسترسی‌ها');
      }

      const result = await response.json();
      return result.data as CurrentPermissions;
    },
    staleTime: 5 * 60 * 1000, // ۵ دقیقه
    refetchOnWindowFocus: true,
  });
}