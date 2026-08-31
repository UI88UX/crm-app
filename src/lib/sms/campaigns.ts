// src/lib/sms/campaigns.ts

import { createClient } from '@/lib/supabase/server';
import { addToQueue } from './queue';
import type { SmsCampaign, SmsCampaignStatus } from '@/types/messaging';

/**
 * جستجوی پیشرفته بیماران بر اساس فیلترها
 */
export async function searchPatients(filters: any, tenantId: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from('patients')
    .select('id, first_name, last_name, phone, national_code, hearing_aid_brand, created_at')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .eq('consent_to_sms', true);

  // فیلتر بر اساس تاریخ آخرین ویزیت
  if (filters.last_visit_days_ago) {
    const date = new Date();
    date.setDate(date.getDate() - filters.last_visit_days_ago);
    query = query.lt('updated_at', date.toISOString());
  }

  // فیلتر بر اساس برند سمعک
  if (filters.hearing_aid_brand) {
    query = query.eq('hearing_aid_brand', filters.hearing_aid_brand);
  }

  // فیلتر بر اساس تاریخ خرید سمعک
  if (filters.hearing_aid_purchased_months_ago) {
    const date = new Date();
    date.setMonth(date.getMonth() - filters.hearing_aid_purchased_months_ago);
    query = query.lt('hearing_aid_purchased_at', date.toISOString());
  }

  // فیلتر بر اساس شهر
  if (filters.city) {
    query = query.eq('city', filters.city);
  }

  // فیلتر بر اساس جنسیت
  if (filters.gender) {
    query = query.eq('gender', filters.gender);
  }

  // فیلتر بر اساس رضایت به دریافت پیامک
  if (filters.consent_to_sms !== undefined) {
    query = query.eq('consent_to_sms', filters.consent_to_sms);
  }

  // تعداد محدود
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error searching patients:', error);
    return { error: error.message, data: [] };
  }

  return { data: data || [], error: null };
}

/**
 * ایجاد کمپین جدید
 */
export async function createCampaign(data: {
  name: string;
  content: string;
  filters: any;
  scheduled_at?: string;
  created_by?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient();
    const tenantId = await getCurrentTenantId();

    // ابتدا تعداد گیرندگان را محاسبه کن
    const recipients = await searchPatients(data.filters, tenantId);
    
    if (recipients.error) {
      return { success: false, error: recipients.error };
    }

    const totalRecipients = recipients.data.length;

    const { data: campaign, error } = await supabase
      .from('sms_campaigns')
      .insert({
        tenant_id: tenantId,
        name: data.name,
        content: data.content,
        filters: data.filters,
        total_recipients: totalRecipients,
        scheduled_at: data.scheduled_at || null,
        status: data.scheduled_at ? 'scheduled' : 'draft',
        created_by: data.created_by || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: campaign };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'خطای ناشناخته' };
  }
}

/**
 * اجرای کمپین (ارسال پیامک به همه گیرندگان)
 */
export async function sendCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const tenantId = await getCurrentTenantId();

    // دریافت اطلاعات کمپین
    const { data: campaign, error: fetchError } = await supabase
      .from('sms_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !campaign) {
      return { success: false, error: 'کمپین یافت نشد' };
    }

    if (campaign.status === 'sent' || campaign.status === 'sending') {
      return { success: false, error: 'کمپین قبلاً ارسال شده یا در حال ارسال است' };
    }

    // به‌روزرسانی وضعیت به sending
    await supabase
      .from('sms_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId);

    // دریافت لیست گیرندگان
    const recipients = await searchPatients(campaign.filters, tenantId);
    
    if (recipients.error || !recipients.data.length) {
      await supabase
        .from('sms_campaigns')
        .update({ status: 'failed' })
        .eq('id', campaignId);
      return { success: false, error: 'هیچ گیرنده‌ای یافت نشد' };
    }

    let sentCount = 0;
    let failedCount = 0;

    // ارسال پیامک به هر گیرنده
    for (const patient of recipients.data) {
      if (!patient.phone) {
        failedCount++;
        continue;
      }

      // جایگزینی متغیرها در متن پیام
      let content = campaign.content;
      content = content.replace(/\{\{patient\.first_name\}\}/g, patient.first_name || '');
      content = content.replace(/\{\{patient\.last_name\}\}/g, patient.last_name || '');
      content = content.replace(/\{\{patient\.national_code\}\}/g, patient.national_code || '');

      const result = await addToQueue({
        tenant_id: tenantId,
        patient_id: patient.id,
        phone: patient.phone,
        content: content,
        type: 'bulk_campaign',
        reference_id: campaignId,
        reference_type: 'sms_campaigns',
        priority: 0,
      });

      if (result.success) {
        sentCount++;
      } else {
        failedCount++;
      }
    }

    // به‌روزرسانی آمار کمپین
    await supabase
      .from('sms_campaigns')
      .update({
        sent_count: sentCount,
        failed_count: failedCount,
        status: sentCount > 0 ? 'sent' : 'failed',
        sent_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    return { success: true };
  } catch (error) {
    console.error('Error sending campaign:', error);
    return { success: false, error: error instanceof Error ? error.message : 'خطای ناشناخته' };
  }
}

/**
 * دریافت لیست کمپین‌ها
 */
export async function getCampaigns() {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('sms_campaigns')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message, data: [] };
  }

  return { data: data || [], error: null };
}

/**
 * دریافت جزئیات یک کمپین
 */
export async function getCampaign(campaignId: string) {
  const supabase = await createClient();
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('sms_campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

// تابع کمکی برای دریافت tenantId
async function getCurrentTenantId() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_current_tenant_id');
  if (error || !data) {
    throw new Error('Tenant not found');
  }
  return data;
}