// src/lib/validations/appointment.ts
import { z } from "zod";

// ============================================
// Schemaهای Zod برای نوبت
// ============================================

/**
 * Schema اصلی نوبت
 */
export const appointmentSchema = z.object({
  patient_id: z.string()
    .uuid("شناسه بیمار نامعتبر است"),

  start_time: z.string()
    .datetime({ message: "زمان شروع نامعتبر است" })
    .refine(
      (val) => !isNaN(new Date(val).getTime()),
      { message: "زمان شروع نامعتبر است" }
    )
    .refine(
      (val) => new Date(val) > new Date(),
      { message: "زمان شروع باید در آینده باشد" }
    ),

  end_time: z.string()
    .datetime({ message: "زمان پایان نامعتبر است" })
    .refine(
      (val) => !isNaN(new Date(val).getTime()),
      { message: "زمان پایان نامعتبر است" }
    ),

  type: z.enum(['visit', 'follow_up', 'test', 'fitting', 'consultation', 'other']),

  status: z.enum(['scheduled', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])
    .default('scheduled'),

  title: z.string()
    .max(200, "عنوان نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد")
    .optional()
    .nullable(),

  description: z.string()
    .max(500, "توضیحات نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد")
    .optional()
    .nullable(),

  notes: z.string()
    .max(1000, "یادداشت نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد")
    .optional()
    .nullable(),
}).refine(
  (data) => {
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    return end > start;
  },
  {
    message: "زمان پایان باید بعد از زمان شروع باشد",
    path: ["end_time"],
  }
).refine(
  (data) => {
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return diffMinutes >= 5;
  },
  {
    message: "مدت زمان نوبت باید حداقل ۵ دقیقه باشد",
    path: ["end_time"],
  }
).refine(
  (data) => {
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return diffMinutes <= 480;
  },
  {
    message: "مدت زمان نوبت نمی‌تواند بیشتر از ۸ ساعت باشد",
    path: ["end_time"],
  }
);

// ============================================
// Type Inference
// ============================================

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

// ============================================
// توابع کمکی
// ============================================

/**
 * تبدیل نوع نوبت به فارسی
 */
export function getAppointmentTypeLabel(type: string | null | undefined): string {
  if (!type) return 'نامشخص';
  const map: Record<string, string> = {
    visit: 'ویزیت',
    follow_up: 'پیگیری',
    test: 'تست شنوایی',
    fitting: 'تنظیم سمعک',
    consultation: 'مشاوره',
    other: 'سایر',
  };
  return map[type] || type;
}

/**
 * تبدیل وضعیت نوبت به فارسی
 */
export function getAppointmentStatusLabel(status: string | null | undefined): string {
  if (!status) return 'نامشخص';
  const map: Record<string, string> = {
    scheduled: 'برنامه‌ریزی‌شده',
    pending: 'در انتظار',
    confirmed: 'تأیید شده',
    in_progress: 'در حال انجام',
    completed: 'انجام شده',
    cancelled: 'لغو شده',
    no_show: 'عدم حضور',
  };
  return map[status] || status;
}

/**
 * دریافت رنگ وضعیت نوبت برای Tailwind
 */
export function getAppointmentStatusColor(status: string | null | undefined): string {
  if (!status) return 'gray';
  const map: Record<string, string> = {
    scheduled: 'blue',
    pending: 'yellow',
    confirmed: 'green',
    in_progress: 'purple',
    completed: 'gray',
    cancelled: 'red',
    no_show: 'orange',
  };
  return map[status] || 'gray';
}

/**
 * دریافت آیکون وضعیت نوبت (برای استفاده در UI)
 */
export function getAppointmentStatusIcon(status: string | null | undefined): string {
  if (!status) return '⏳';
  const map: Record<string, string> = {
    scheduled: '📅',
    pending: '⏳',
    confirmed: '✅',
    in_progress: '🔄',
    completed: '✔️',
    cancelled: '❌',
    no_show: '🚫',
  };
  return map[status] || '⏳';
}

/**
 * اعتبارسنجی زمان شروع و پایان
 */
export function validateAppointmentTimes(startTime: string, endTime: string): string | null {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return "زمان نامعتبر است";
  }

  if (end <= start) {
    return "زمان پایان باید بعد از زمان شروع باشد";
  }

  const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  if (diffMinutes < 5) {
    return "مدت زمان نوبت باید حداقل ۵ دقیقه باشد";
  }

  if (diffMinutes > 480) {
    return "مدت زمان نوبت نمی‌تواند بیشتر از ۸ ساعت باشد";
  }

  return null;
}