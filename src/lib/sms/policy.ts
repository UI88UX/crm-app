// src/lib/sms/policy.ts

import { createClient } from '@/lib/supabase/server';

/**
 * بررسی ساعات مجاز ارسال (۹ صبح تا ۸ شب)
 */
export function isAllowedHour(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 9 && hour <= 20;
}

/**
 * بررسی سقف پیامک ماهانه بیمار
 */
export async function canSendToPatient(
  patientId: string,
  tenantId: string
): Promise<{ allowed: boolean; currentCount: number; maxLimit: number }> {
  const supabase = await createClient();

  // دریافت تنظیمات Tenant
  const { data: settings, error: settingsError } = await supabase
    .from('sms_settings')
    .select('max_messages_per_month')
    .eq('tenant_id', tenantId)
    .single();

  if (settingsError || !settings) {
    // مقدار پیش‌فرض: ۱۰ پیامک در ماه
    return { allowed: true, currentCount: 0, maxLimit: 10 };
  }

  const maxLimit = settings.max_messages_per_month || 10;

  // دریافت تعداد پیامک‌های ارسال‌شده در این ماه
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('sms_logs')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', patientId)
    .eq('tenant_id', tenantId)
    .gte('sent_at', startOfMonth.toISOString());

  if (error) {
    console.error('Error counting SMS logs:', error);
    return { allowed: true, currentCount: 0, maxLimit };
  }

  const currentCount = count || 0;
  return {
    allowed: currentCount < maxLimit,
    currentCount,
    maxLimit,
  };
}

/**
 * بررسی کلی: آیا می‌توان پیامک ارسال کرد؟
 */
export async function canSendSms(
  patientId: string | null,
  tenantId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // ۱. بررسی ساعات مجاز
  if (!isAllowedHour()) {
    return {
      allowed: false,
      reason: 'ساعت ارسال مجاز نیست (۹ صبح تا ۸ شب)',
    };
  }

  // ۲. اگر patientId وجود نداشت، فقط ساعت را بررسی کن
  if (!patientId) {
    return { allowed: true };
  }

  // ۳. بررسی سقف ماهانه
  const result = await canSendToPatient(patientId, tenantId);
  if (!result.allowed) {
    return {
      allowed: false,
      reason: `سقف ماهانه (${result.maxLimit} پیامک) تکمیل شده است`,
    };
  }

  return { allowed: true };
}