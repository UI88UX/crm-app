// src/lib/sms/queue.ts

import { createClient } from '@/lib/supabase/server';
import { sendSms } from './index';
import { SmsQueue, SmsQueueStatus, SmsQueueType } from '@/types/messaging';

export interface AddToQueueParams {
  tenant_id: string;
  patient_id?: string;
  phone: string;
  content: string;
  type: SmsQueueType;
  scheduled_at?: string; // اگر خالی باشد، فوری ارسال می‌شود
  reference_id?: string;
  reference_type?: string;
  priority?: number;
  variables?: Record<string, any>;
}

/**
 * اضافه کردن پیام به صف
 */
export async function addToQueue(params: AddToQueueParams): Promise<{ success: boolean; queueId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // اگر زمان مشخص نشده، الان را در نظر بگیر
    const scheduledAt = params.scheduled_at || new Date().toISOString();

    // بررسی سیاست ارسال (سقف پیامک در ماه)
    if (params.patient_id) {
      const canSend = await checkCanSendSms(params.patient_id, params.tenant_id);
      if (!canSend) {
        return {
          success: false,
          error: 'بیمار به سقف پیامک ماهانه رسیده است',
        };
      }
    }

    const { data, error } = await supabase
      .from('sms_queue')
      .insert({
        tenant_id: params.tenant_id,
        patient_id: params.patient_id || null,
        phone: params.phone,
        content: params.content,
        type: params.type,
        scheduled_at: scheduledAt,
        priority: params.priority || 0,
        reference_id: params.reference_id || null,
        reference_type: params.reference_type || null,
        variables: params.variables || {},
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding to queue:', error);
      return { success: false, error: error.message };
    }

    // اگر زمان ارسال الان یا گذشته است، بلافاصله پردازش کن
    if (new Date(scheduledAt) <= new Date()) {
      // اجرای غیرهمزمان (fire-and-forget)
      processQueueItem(data.id).catch(console.error);
    }

    return { success: true, queueId: data.id };
  } catch (error) {
    console.error('Error in addToQueue:', error);
    return { success: false, error: error instanceof Error ? error.message : 'خطای ناشناخته' };
  }
}


/**
 * پردازش یک آیتم صف
 */
export async function processQueueItem(queueId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient();
  
      const { data: queueItem, error: fetchError } = await supabase
        .from('sms_queue')
        .select('*')
        .eq('id', queueId)
        .eq('status', 'pending')
        .single();
  
      if (fetchError || !queueItem) {
        return { success: false, error: 'آیتم صف یافت نشد یا قبلاً پردازش شده است' };
      }
  
      // بررسی ساعات مجاز ارسال
      const now = new Date();
      const hour = now.getHours();
      if (hour < 9 || hour > 20) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
  
        await supabase
          .from('sms_queue')
          .update({ scheduled_at: tomorrow.toISOString() })
          .eq('id', queueId);
  
        return { success: false, error: 'ساعت ارسال مجاز نیست، به فردا موکول شد' };
      }
  
      // ✅ ارسال با یک متغیر (برای الگوی تست)
      // اگر محتوای پیام یک کد است، آن را به‌عنوان متغیر ارسال کن
      const sendResult = await sendSms(queueItem.phone, queueItem.content);
  
      // ثبت لاگ
      await supabase.from('sms_logs').insert({
        tenant_id: queueItem.tenant_id,
        queue_id: queueItem.id,
        patient_id: queueItem.patient_id,
        phone: queueItem.phone,
        message: queueItem.content,
        type: queueItem.type,
        provider: 'melipayamak',
        status: sendResult.success ? 'sent' : 'failed',
        error: sendResult.error || null,
        provider_response: sendResult.providerResponse || null,
        cost: sendResult.success ? 150 : 0,
      });
  
      // بروزرسانی وضعیت صف
      await supabase
        .from('sms_queue')
        .update({
          status: sendResult.success ? 'sent' : 'failed',
          provider: 'melipayamak',
          provider_message_id: sendResult.messageId || null,
          sent_at: sendResult.success ? new Date().toISOString() : null,
          attempts: queueItem.attempts + 1,
          last_error: sendResult.error || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', queueId);
  
      // تلاش مجدد 
      if (!sendResult.success && queueItem.attempts + 1 < queueItem.max_attempts) {
        const retryDelay = 60 * 60 * 1000;
        const retryTime = new Date(Date.now() + retryDelay);
  
        await supabase
          .from('sms_queue')
          .update({
            status: 'pending',
            scheduled_at: retryTime.toISOString(),
          })
          .eq('id', queueId);
  
        return { success: false, error: `تلاش مجدد در ${retryTime.toISOString()}` };
      }
  
      return { success: sendResult.success, error: sendResult.error };
    } catch (error) {
      console.error('Error in processQueueItem:', error);
      return { success: false, error: error instanceof Error ? error.message : 'خطای ناشناخته' };
    }
  }


/**
 * پردازش همه آیتم‌های صف که زمان ارسال آنها رسیده است
 */
export async function processQueue(): Promise<{ processed: number; success: number; failed: number }> {
  try {
    const supabase = await createClient();

    // دریافت آیتم‌های صف که زمان ارسال آنها رسیده است
    const { data: queueItems, error } = await supabase
      .from('sms_queue')
      .select('id')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_at', { ascending: true })
      .limit(50); // هر بار حداکثر ۵۰ پیامک

    if (error) {
      console.error('Error fetching queue:', error);
      return { processed: 0, success: 0, failed: 0 };
    }

    let success = 0;
    let failed = 0;

    // پردازش هر آیتم
    for (const item of queueItems) {
      const result = await processQueueItem(item.id);
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    }

    return { processed: queueItems.length, success, failed };
  } catch (error) {
    console.error('Error in processQueue:', error);
    return { processed: 0, success: 0, failed: 0 };
  }
}

/**
 * بررسی سقف پیامک ماهانه بیمار
 */

export async function checkCanSendSms(patientId: string, tenantId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // ✅ اصلاح: نام پارامترها را با تابع دیتابیس هماهنگ کن
    const { data, error } = await supabase
      .rpc('can_send_sms', {
        p_patient_id: patientId,   // ✅ تغییر
        p_tenant_id: tenantId,     // ✅ تغییر
      });

    if (error) {
      console.error('Error checking sms limit:', error);
      return true;
    }

    return data || false;
  } catch (error) {
    console.error('Error in checkCanSendSms:', error);
    return true;
  }
}
/**
 * لغو پیام از صف
 */
export async function cancelQueueItem(queueId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('sms_queue')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', queueId)
      .in('status', ['pending']);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'خطای ناشناخته' };
  }
}