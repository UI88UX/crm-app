// src/hooks/useSmsSettings.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export interface SmsSettings {
  is_enabled: boolean;
  max_messages_per_month: number;
  allowed_start_hour: number;
  allowed_end_hour: number;
  enable_birthday_alerts: boolean;
  enable_hearing_aid_followup: boolean;
  clinic_name: string;
}

// ============================================
// Query Keys
// ============================================

export const smsSettingsKeys = {
  all: ['sms-settings'] as const,
  detail: () => [...smsSettingsKeys.all, 'detail'] as const,
};

// ============================================
// Hooks
// ============================================

// 📥 دریافت تنظیمات پیامک
export function useSmsSettings() {
  return useQuery({
    queryKey: smsSettingsKeys.detail(),
    queryFn: async () => {
      const response = await fetch('/api/sms/settings');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در دریافت تنظیمات');
      }
      const result = await response.json();
      return result.data as SmsSettings;
    },
    staleTime: 10 * 60 * 1000, // 10 دقیقه
  });
}

// ✏️ به‌روزرسانی تنظیمات پیامک
export function useUpdateSmsSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<SmsSettings>) => {
      const response = await fetch('/api/sms/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطا در ذخیره تنظیمات');
      }

      const result = await response.json();
      return result.data as SmsSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(smsSettingsKeys.detail(), data);
      toast.success('تنظیمات با موفقیت ذخیره شد');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'خطا در ذخیره تنظیمات');
    },
  });
}