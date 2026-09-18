// src/hooks/useCurrentUser.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export const currentUserKeys = {
  all: ['current-user'] as const,
  detail: () => [...currentUserKeys.all, 'detail'] as const,
};

/**
 * Hook دریافت کاربر جاری از session
 *
 * کاربر جاری رو از Supabase auth می‌گیره.
 * برای چک کردن «آیا این کاربر خود من است؟» استفاده می‌شه.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserKeys.detail(),
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        throw new Error(error.message);
      }

      return user;
    },
    staleTime: 5 * 60 * 1000, // ۵ دقیقه
    refetchOnWindowFocus: false,
  });
}