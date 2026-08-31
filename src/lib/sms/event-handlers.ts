// src/lib/sms/event-handlers.ts

import { createClient } from '@/lib/supabase/server';
import { addToQueue } from './queue';
import { toJalali } from '@/lib/util/jalaliDate';
import moment from 'moment-jalaali';

/**
 * دریافت تنظیمات پیامکی Tenant
 */
async function getSmsSettings(tenantId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('sms_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    // تنظیمات پیش‌فرض
    return {
      is_enabled: true,
      clinic_name: 'مطب',
      reminder_hours_1: 24,
      reminder_hours_2: 2,
    };
  }

  return data;
}

/**
 * دریافت اطلاعات بیمار
 */
async function getPatientInfo(patientId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('patients')
    .select('id, first_name, last_name, phone, national_code')
    .eq('id', patientId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * دریافت اطلاعات نوبت
 */
async function getAppointmentInfo(appointmentId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patient:patients(id, first_name, last_name, phone, national_code)
    `)
    .eq('id', appointmentId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * رویداد: نوبت ثبت شد
 */
export async function onAppointmentCreated(appointmentId: string) {
  try {
    const supabase = await createClient();
    
    // دریافت اطلاعات نوبت
    const appointment = await getAppointmentInfo(appointmentId);
    if (!appointment || !appointment.patient) {
      console.error('Appointment or patient not found:', appointmentId);
      return;
    }

    const tenantId = appointment.tenant_id;
    const settings = await getSmsSettings(tenantId);

    // اگر سیستم پیامک غیرفعال است
    if (!settings.is_enabled) {
      console.log('SMS system is disabled for tenant:', tenantId);
      return;
    }

    const patient = appointment.patient;
    const clinicName = settings.clinic_name || 'مطب';

    // تبدیل تاریخ به شمسی
    const jalaliDate = toJalali(appointment.start_time);
    const time = moment(appointment.start_time).format('HH:mm');

    // ✅ ارسال پیامک تأیید نوبت (با یک متغیر - کد تأیید)
    // چون الگوی تست فقط یک متغیر دارد، از کد تأیید استفاده می‌کنیم
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await addToQueue({
      tenant_id: tenantId,
      patient_id: patient.id,
      phone: patient.phone,
      content: verificationCode, // فقط یک متغیر (کد تأیید)
      type: 'appointment_confirmation',
      reference_id: appointmentId,
      reference_type: 'appointments',
      priority: 2,
    });

    // ذخیره کد تأیید در دیتابیس (برای پیگیری)
    await supabase
      .from('appointments')
      .update({
        metadata: {
          ...appointment.metadata,
          sms_verification_code: verificationCode,
          sms_sent_at: new Date().toISOString(),
        }
      })
      .eq('id', appointmentId);

    console.log(`✅ Appointment confirmation SMS queued for ${patient.first_name} ${patient.last_name}`);

    // ⏰ برنامه‌ریزی یادآوری ۲۴ ساعت قبل
    await scheduleAppointmentReminder(appointmentId);

    // ⏰ برنامه‌ریزی یادآوری ۲ ساعت قبل
    await scheduleAppointmentReminder2h(appointmentId);

  } catch (error) {
    console.error('Error in onAppointmentCreated:', error);
  }
}

/**
 * برنامه‌ریزی یادآوری ۲۴ ساعت قبل
 */
async function scheduleAppointmentReminder(appointmentId: string) {
  try {
    const supabase = await createClient();
    const appointment = await getAppointmentInfo(appointmentId);
    
    if (!appointment || !appointment.patient) return;

    const tenantId = appointment.tenant_id;
    const settings = await getSmsSettings(tenantId);

    if (!settings.is_enabled) return;

    // ۲۴ ساعت قبل از نوبت
    const startTime = new Date(appointment.start_time);
    const reminderTime = new Date(startTime);
    reminderTime.setHours(reminderTime.getHours() - settings.reminder_hours_1);

    // اگر زمان یادآوری گذشته است، برنامه‌ریزی نکن
    if (reminderTime <= new Date()) {
      console.log('Reminder time has passed for appointment:', appointmentId);
      return;
    }

    const patient = appointment.patient;
    const time = moment(appointment.start_time).format('HH:mm');

    // ✅ یادآوری با کد تأیید (چون الگوی تست فقط یک متغیر دارد)
    const reminderCode = Math.floor(100000 + Math.random() * 900000).toString();

    await addToQueue({
      tenant_id: tenantId,
      patient_id: patient.id,
      phone: patient.phone,
      content: reminderCode,
      type: 'appointment_reminder',
      scheduled_at: reminderTime.toISOString(),
      reference_id: appointmentId,
      reference_type: 'appointments',
      priority: 1,
    });

    console.log(`⏰ Appointment reminder (24h) scheduled for ${patient.first_name} ${patient.last_name} at ${reminderTime.toISOString()}`);

    // ذخیره وضعیت یادآوری
    await supabase
      .from('appointments')
      .update({
        reminder_24h_sent: false,
        reminder_24h_scheduled_at: reminderTime.toISOString(),
      })
      .eq('id', appointmentId);

  } catch (error) {
    console.error('Error in scheduleAppointmentReminder:', error);
  }
}

/**
 * برنامه‌ریزی یادآوری ۲ ساعت قبل
 */
async function scheduleAppointmentReminder2h(appointmentId: string) {
  try {
    const supabase = await createClient();
    const appointment = await getAppointmentInfo(appointmentId);
    
    if (!appointment || !appointment.patient) return;

    const tenantId = appointment.tenant_id;
    const settings = await getSmsSettings(tenantId);

    if (!settings.is_enabled) return;

    // ۲ ساعت قبل از نوبت
    const startTime = new Date(appointment.start_time);
    const reminderTime = new Date(startTime);
    reminderTime.setHours(reminderTime.getHours() - settings.reminder_hours_2);

    if (reminderTime <= new Date()) {
      console.log('2h reminder time has passed for appointment:', appointmentId);
      return;
    }

    const patient = appointment.patient;
    const time = moment(appointment.start_time).format('HH:mm');

    const reminderCode = Math.floor(100000 + Math.random() * 900000).toString();

    await addToQueue({
      tenant_id: tenantId,
      patient_id: patient.id,
      phone: patient.phone,
      content: reminderCode,
      type: 'appointment_reminder',
      scheduled_at: reminderTime.toISOString(),
      reference_id: appointmentId,
      reference_type: 'appointments',
      priority: 1,
    });

    console.log(`⏰ Appointment reminder (2h) scheduled for ${patient.first_name} ${patient.last_name} at ${reminderTime.toISOString()}`);

    await supabase
      .from('appointments')
      .update({
        reminder_2h_sent: false,
        reminder_2h_scheduled_at: reminderTime.toISOString(),
      })
      .eq('id', appointmentId);

  } catch (error) {
    console.error('Error in scheduleAppointmentReminder2h:', error);
  }
}

/**
 * رویداد: نوبت لغو شد
 */
export async function onAppointmentCancelled(appointmentId: string, reason?: string) {
  try {
    const appointment = await getAppointmentInfo(appointmentId);
    if (!appointment || !appointment.patient) return;

    const tenantId = appointment.tenant_id;
    const settings = await getSmsSettings(tenantId);

    if (!settings.is_enabled) return;

    const patient = appointment.patient;

    // لغو نوبت‌های برنامه‌ریزی‌شده در صف
    const supabase = await createClient();
    await supabase
      .from('sms_queue')
      .update({ status: 'cancelled' })
      .eq('reference_id', appointmentId)
      .eq('reference_type', 'appointments')
      .in('status', ['pending']);

    // ارسال پیامک لغو (با کد تأیید)
    const cancelCode = Math.floor(100000 + Math.random() * 900000).toString();

    await addToQueue({
      tenant_id: tenantId,
      patient_id: patient.id,
      phone: patient.phone,
      content: cancelCode,
      type: 'appointment_cancelled',
      reference_id: appointmentId,
      reference_type: 'appointments',
      priority: 2,
    });

    console.log(`❌ Appointment cancellation SMS queued for ${patient.first_name} ${patient.last_name}`);

  } catch (error) {
    console.error('Error in onAppointmentCancelled:', error);
  }
}

/**
 * رویداد: عدم مراجعه (No-Show)
 */
export async function onAppointmentNoShow(appointmentId: string) {
  try {
    const appointment = await getAppointmentInfo(appointmentId);
    if (!appointment || !appointment.patient) return;

    const tenantId = appointment.tenant_id;
    const settings = await getSmsSettings(tenantId);

    if (!settings.is_enabled) return;

    const patient = appointment.patient;

    // ۱ ساعت بعد از No-Show
    const followupTime = new Date();
    followupTime.setHours(followupTime.getHours() + 1);

    const noShowCode = Math.floor(100000 + Math.random() * 900000).toString();

    await addToQueue({
      tenant_id: tenantId,
      patient_id: patient.id,
      phone: patient.phone,
      content: noShowCode,
      type: 'appointment_no_show',
      scheduled_at: followupTime.toISOString(),
      reference_id: appointmentId,
      reference_type: 'appointments',
      priority: 1,
    });

    console.log(`🚫 No-show followup SMS scheduled for ${patient.first_name} ${patient.last_name}`);

  } catch (error) {
    console.error('Error in onAppointmentNoShow:', error);
  }
}