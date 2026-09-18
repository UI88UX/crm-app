// src/hooks/useDashboardStats.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import type { DashboardData } from '@/types/dashboard';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

/**
 * Hook دریافت آمار کامل داشبورد
 *
 * یک درخواست واحد که تمام داده‌های داشبورد را برمی‌گرداند:
 * - آمار کلی (بیماران، نوبت‌های امروز، فروش، درآمد)
 * - فروش ماهانه ۶ ماه اخیر (برای نمودار)
 * - ۵ فروش آخر
 * - ۵ فعالیت آخر
 * - وضعیت اشتراک (پلن، انقضا، تعداد کاربران)
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async (): Promise<DashboardData> => {
      const response = await fetch('/api/dashboard/stats');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت اطلاعات داشبورد');
      }

      const result = await response.json();
      return result.data as DashboardData;
    },
    staleTime: 2 * 60 * 1000, // ۲ دقیقه
    refetchOnWindowFocus: false,
  });
}