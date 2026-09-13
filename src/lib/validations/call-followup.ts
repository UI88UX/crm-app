// src/lib/validations/call-followup.ts
import { z } from "zod";

// ============================================
// Call Followup Schemas
// ============================================

const callResultEnum = z.enum([
  'positive',
  'negative',
  'no_answer',
  'callback',
  'not_interested',
]);

const callFollowupStatusEnum = z.enum([
  'pending',
  'completed',
  'cancelled',
  'rescheduled',
]);

// --------------------------------------------
// Schema: ایجاد پیگیری جدید
// --------------------------------------------
export const createCallFollowupSchema = z.object({
  patient_id: z.string().uuid("شناسه بیمار نامعتبر است"),

  due_date: z
    .string()
    .datetime({ message: "تاریخ پیگیری نامعتبر است" })
    .refine(
      (val) => new Date(val) > new Date(),
      { message: "تاریخ پیگیری باید در آینده باشد" }
    ),

  notes: z
    .string()
    .max(1000, "یادداشت نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد")
    .optional()
    .nullable(),
});

// --------------------------------------------
// Schema: تکمیل پیگیری (ثبت نتیجه)
// --------------------------------------------
export const completeCallFollowupSchema = z
  .object({
    result: callResultEnum,

    call_notes: z
      .string()
      .max(2000, "یادداشت تماس نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد")
      .optional()
      .nullable(),

    next_followup_date: z
      .string()
      .datetime({ message: "تاریخ پیگیری بعدی نامعتبر است" })
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.result === 'callback') {
        return !!data.next_followup_date;
      }
      return true;
    },
    {
      message: "برای تماس مجدد، تاریخ پیگیری بعدی الزامی است",
      path: ["next_followup_date"],
    }
  )
  .refine(
    (data) => {
      if (data.next_followup_date) {
        return new Date(data.next_followup_date) > new Date();
      }
      return true;
    },
    {
      message: "تاریخ پیگیری بعدی باید در آینده باشد",
      path: ["next_followup_date"],
    }
  );

// --------------------------------------------
// Schema: ویرایش پیگیری
// --------------------------------------------
export const updateCallFollowupSchema = z.object({
  due_date: z
    .string()
    .datetime({ message: "تاریخ پیگیری نامعتبر است" })
    .refine(
      (val) => new Date(val) > new Date(),
      { message: "تاریخ پیگیری باید در آینده باشد" }
    )
    .optional(),

  notes: z
    .string()
    .max(1000, "یادداشت نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد")
    .optional()
    .nullable(),
});

// --------------------------------------------
// Schema: فیلتر جستجو
// --------------------------------------------
export const callFollowupFiltersSchema = z.object({
  status: callFollowupStatusEnum.optional(),
  result: callResultEnum.optional(),
  patient_id: z.string().uuid().optional(),
  due_from: z.string().datetime().optional(),
  due_to: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
});

// ============================================
// Type Inference
// ============================================

export type CreateCallFollowupFormData = z.infer<typeof createCallFollowupSchema>;
export type CompleteCallFollowupFormData = z.infer<typeof completeCallFollowupSchema>;
export type UpdateCallFollowupFormData = z.infer<typeof updateCallFollowupSchema>;
export type CallFollowupFilters = z.infer<typeof callFollowupFiltersSchema>;

// ============================================
// Helper Functions
// ============================================

export function isCallFollowupCompletable(status: string): boolean {
  return status === 'pending' || status === 'rescheduled';
}

export function isCallFollowupDue(
  dueDate: string,
  completedAt: string | null
): boolean {
  if (completedAt) return false;
  return new Date(dueDate).getTime() <= Date.now();
}

export function isCallFollowupDueSoon(
  dueDate: string,
  completedAt: string | null
): boolean {
  if (completedAt) return false;
  const now = Date.now();
  const due = new Date(dueDate).getTime();
  const tomorrow = now + 24 * 60 * 60 * 1000;
  return due > now && due <= tomorrow;
}