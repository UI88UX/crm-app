// src/types/messaging.ts

// ============================================
// SMS Template Types
// ============================================

export type SmsTemplateType =
  | 'appointment_confirmation'
  | 'appointment_reminder_24h'
  | 'appointment_reminder_2h'
  | 'appointment_cancelled'
  | 'appointment_no_show'
  | 'hearing_aid_purchased'
  | 'hearing_aid_day_3'
  | 'hearing_aid_day_14'
  | 'hearing_aid_day_30'
  | 'hearing_aid_month_3'
  | 'hearing_aid_month_6'
  | 'hearing_aid_month_12'
  | 'hearing_aid_month_18_24'
  | 'birthday'
  | 'bulk_campaign';

export interface SmsTemplate {
  id: string;
  tenant_id: string;
  name: string;
  type: SmsTemplateType;
  content: string;
  variables: string[]; // ["patient.first_name", "appointment.date", ...]
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// SMS Queue Types
// ============================================

export type SmsQueueStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
export type SmsQueueType =
  | 'appointment_confirmation'
  | 'appointment_reminder'
  | 'appointment_cancelled'
  | 'appointment_no_show'
  | 'hearing_aid_followup'
  | 'birthday'
  | 'bulk_campaign';

export interface SmsQueue {
  id: string;
  tenant_id: string;
  patient_id: string | null;
  phone: string;
  template_id: string | null;
  content: string;
  variables: Record<string, any>;
  scheduled_at: string;
  priority: number;
  status: SmsQueueStatus;
  provider: string | null;
  provider_message_id: string | null;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  type: SmsQueueType;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
  sent_at: string | null;
  updated_at: string;
}

export interface AddToQueueParams {
  tenant_id: string;
  patient_id?: string;
  phone: string;
  content: string;
  type: SmsQueueType;
  scheduled_at?: string;
  reference_id?: string;
  reference_type?: string;
  priority?: number;
  variables?: Record<string, any>;
}
// ============================================
// SMS Log Types
// ============================================

export interface SmsLog {
  id: string;
  tenant_id: string;
  queue_id: string | null;
  patient_id: string | null;
  campaign_id: string | null;
  phone: string;
  message: string;
  type: string;
  provider: string;
  status: 'sent' | 'delivered' | 'failed';
  error: string | null;
  provider_response: Record<string, any> | null;
  cost: number;
  sent_at: string;
}

// ============================================
// SMS Campaign Types
// ============================================

export type SmsCampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';

export interface SmsCampaign {
  id: string;
  tenant_id: string;
  name: string;
  template_id: string | null;
  content: string;
  variables: Record<string, any>;
  filters: Record<string, any>;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  status: SmsCampaignStatus;
  scheduled_at: string | null;
  created_by: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// SMS Settings Types
// ============================================

export interface SmsSettings {
  id: string;
  tenant_id: string;
  is_enabled: boolean;
  provider: 'kavenegar' | 'melipayamak';
  reminder_hours_1: number;
  reminder_hours_2: number;
  max_messages_per_month: number;
  allowed_start_hour: number;
  allowed_end_hour: number;
  allow_holidays: boolean;
  enable_birthday_alerts: boolean;
  enable_hearing_aid_followup: boolean;
  clinic_name: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Send SMS Request Types
// ============================================

export interface SendSmsRequest {
  tenant_id: string;
  patient_id?: string;
  phone: string;
  content: string;
  type: SmsQueueType;
  reference_id?: string;
  reference_type?: string;
  scheduled_at?: string; // اگر خالی بود، فوری ارسال شود
  priority?: number;
}

export interface SendSmsResponse {
  success: boolean;
  queue_id?: string;
  error?: string;
  provider_response?: any;
}

// ============================================
// Template Variable Types
// ============================================

export interface TemplateContext {
  patient?: {
    first_name: string;
    last_name: string;
    national_code?: string;
    phone?: string;
  };
  appointment?: {
    date: string; // تاریخ شمسی
    time: string; // ساعت
    type?: string;
    status?: string;
  };
  clinic?: {
    name: string;
    phone?: string;
    address?: string;
  };
  hearing_aid?: {
    brand?: string;
    model?: string;
    purchased_at?: string;
  };
  sale?: {
    price?: number;
    warranty_expiry?: string;
  };
  custom?: Record<string, any>;
}