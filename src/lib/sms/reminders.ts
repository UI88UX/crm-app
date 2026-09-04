// src/lib/sms/reminders.ts

import { createClient } from '@/lib/supabase/server';
import { addToQueue } from './queue';
import { toJalali } from '@/lib/util/jalaliDate';
import moment from 'moment-jalaali';

/**
 * بررسی و برنامه‌ریزی یادآوری سرویس سمعک
 * - ماه ۶: سرویس دوره‌ای
 * - ماه ۱۲: سرویس سالانه
 */
export async function scheduleHearingAidServiceReminders() {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  // دریافت تنظیمات Tenant
  const { data: settings, error: settingsError } = await supabase
    .from('sms_settings')
    .select('enable_hearing_aid_followup, clinic_name')
    .eq('tenant_id', tenantId)
    .single();

  if (settingsError || !settings?.enable_hearing_aid_followup) {
    console.log('⏭️ Hearing aid followup is disabled for tenant:', tenantId);
    return;
  }

  // دریافت بیمارانی که سمعک خریداری کرده‌اند
  const { data: patients, error } = await supabase
  .from('patients')
  .select('id, first_name, last_name, phone, hearing_aid_brand, hearing_aid_purchased_at')
  .eq('tenant_id', tenantId)
  .not('hearing_aid_purchased_at', 'is', null)
  .is('deleted_at', null)
  .eq('consent_to_sms', true);

  if (error) {
    console.error('Error fetching patients for service reminders:', error);
    return;
  }

  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  let scheduledCount = 0;

  for (const patient of patients) {
    if (!patient.phone) continue;

    const purchaseDate = new Date(patient.hearing_aid_purchased_at);
    const monthsSincePurchase = (now.getFullYear() - purchaseDate.getFullYear()) * 12 +
      (now.getMonth() - purchaseDate.getMonth());

    // چک کردن اینکه قبلاً برای این بیمار یادآوری ارسال نشده باشد
    // (می‌توانیم در جدول sms_logs چک کنیم)

    // یادآوری ۶ ماه
    if (monthsSincePurchase >= 6 && monthsSincePurchase < 7) {
      const content = `سلام ${patient.first_name} عزیز، حدود ۶ ماه از خرید سمعک ${patient.hearing_aid_brand || ''} شما می‌گذرد. لطفاً برای سرویس دوره‌ای و تنظیم مجدد به مطب مراجعه فرمایید.`;

      await addToQueue({
        tenant_id: tenantId,
        patient_id: patient.id,
        phone: patient.phone,
        content,
        type: 'hearing_aid_followup',
        reference_id: patient.id,
        reference_type: 'patients',
        priority: 1,
      });

      scheduledCount++;
    }

    // یادآوری ۱۲ ماه
    if (monthsSincePurchase >= 12 && monthsSincePurchase < 13) {
      const content = `سلام ${patient.first_name} عزیز، یک سال از خرید سمعک ${patient.hearing_aid_brand || ''} شما گذشت. سرویس سالانه و بررسی عملکرد سمعک ضروری است. لطفاً با مطب تماس بگیرید.`;

      await addToQueue({
        tenant_id: tenantId,
        patient_id: patient.id,
        phone: patient.phone,
        content,
        type: 'hearing_aid_followup',
        reference_id: patient.id,
        reference_type: 'patients',
        priority: 1,
      });

      scheduledCount++;
    }
  }

  console.log(`✅ ${scheduledCount} hearing aid service reminders scheduled for tenant ${tenantId}`);
}

// تابع کمکی
async function getCurrentTenantId() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_current_tenant_id');
  if (error || !data) {
    throw new Error('Tenant not found');
  }
  return data;
}