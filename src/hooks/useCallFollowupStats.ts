// src/hooks/useCallFollowupStats.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { callFollowupKeys } from './useCallFollowups';

export interface CallFollowupStats {
  overdue: number;      // عقب‌افتاده
  today: number;        // امروز
  tomorrow: number;     // فردا
  total_pending: number;
  unread: number;       // برای badge روی Bell
}

/**
 * آمار پیگیری‌های تلفنی — برای Bell icon در Header
 * خودکار هر ۲ دقیقه refresh می‌شود
 */
export function useCallFollowupStats() {
  return useQuery({
    queryKey: callFollowupKeys.stats(),
    queryFn: async () => {
      const response = await fetch('/api/call-followups/stats');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت آمار پیگیری‌ها');
      }
      const result = await response.json();
      return result.data as CallFollowupStats;
    },
    staleTime: 60 * 1000,             // ۱ دقیقه
    refetchInterval: 2 * 60 * 1000,    // هر ۲ دقیقه refresh خودکار
    refetchOnWindowFocus: true,
  });
}