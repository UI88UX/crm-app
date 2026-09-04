// src/lib/sms/birthday.ts

import { createClient } from '@/lib/supabase/server';
import { addToQueue } from './queue';
import { toJalali } from '@/lib/util/jalaliDate';

/**
 * بررسی و برنامه‌ریزی تبریک تولد
 * هر روز صبح اجرا می‌شود و برای بیمارانی که امروز تولدشان است پیام تبریک ارسال می‌کند
 */
export async function scheduleBirthdayAlerts() {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  // دریافت تنظیمات Tenant
  const { data: settings, error: settingsError } = await supabase
    .from('sms_settings')
    .select('enable_birthday_alerts, clinic_name')
    .eq('tenant_id', tenantId)
    .single();

  if (settingsError || !settings?.enable_birthday_alerts) {
    console.log('⏭️ Birthday alerts is disabled for tenant:', tenantId);
    return;
  }

  // ✅ اضافه کردن birth_date به select
  const { data: patients, error } = await supabase
    .from('patients')
    .select('id, first_name, last_name, phone, birth_date')  // ← birth_date اضافه شد
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .eq('consent_to_sms', true)
    .not('birth_date', 'is', null);

  if (error) {
    console.error('Error fetching patients for birthday alerts:', error);
    return;
  }

  // فیلتر کردن بیمارانی که امروز تولدشان است
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const birthdayPatients = patients?.filter(patient => {
    if (!patient.birth_date) return false;
    const birthDate = new Date(patient.birth_date);
    return birthDate.getMonth() + 1 === month && birthDate.getDate() === day;
  }) || [];

  let scheduledCount = 0;

  for (const patient of birthdayPatients) {
    if (!patient.phone) continue;

    const clinicName = settings.clinic_name || 'مطب';

    const content = `🎂 تولدتون مبارک! 
سلام ${patient.first_name} عزیز،
روز تولدتان را به شما تبریک می‌گوییم. برای شما سالی پر از سلامتی و شادی آرزومندیم.
${clinicName}`;

    await addToQueue({
      tenant_id: tenantId,
      patient_id: patient.id,
      phone: patient.phone,
      content,
      type: 'birthday',
      reference_id: patient.id,
      reference_type: 'patients',
      priority: 1,
    });

    scheduledCount++;
  }

  console.log(`🎂 ${scheduledCount} birthday alerts scheduled for tenant ${tenantId}`);
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