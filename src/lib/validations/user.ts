// src/lib/validations/user.ts
import { z } from 'zod';

// ============================================
// الگوریتم اعتبارسنجی شماره موبایل ایران
// ============================================
export function validateIranianPhone(phone: string): boolean {
  return /^09\d{9}$/.test(phone);
}

const permissionsSchema = z.object({
  can_delete: z.boolean(),
  can_manage_sms: z.boolean(),
  can_view_reports: z.boolean(),
});

// ============================================
// Schema ایجاد کاربر جدید
// ============================================
export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, 'ایمیل الزامی است')
    .email('فرمت ایمیل نامعتبر است')
    .max(100, 'ایمیل نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد'),

  password: z
    .string()
    .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد')
    .max(100, 'رمز عبور نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد'),

  full_name: z
    .string()
    .min(2, 'نام باید حداقل ۲ کاراکتر باشد')
    .max(100, 'نام نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد'),

  phone: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || validateIranianPhone(val),
      { message: 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد' }
    ),

  role: z.enum(['admin', 'user'], {
    message: 'نقش نامعتبر است',
  }),

  permissions: permissionsSchema.optional(),  // ← جدید
});
// ============================================
// Schema ویرایش کاربر
// ============================================
export const updateUserSchema = z.object({
  full_name: z
    .string()
    .min(2, 'نام باید حداقل ۲ کاراکتر باشد')
    .max(100, 'نام نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد')
    .optional(),

  phone: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || validateIranianPhone(val),
      { message: 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد' }
    ),

  role: z.enum(['admin', 'user']).optional(),

  is_active: z.boolean().optional(),

  permissions: permissionsSchema.optional(),  // ← جدید
});


// ============================================
// Type Inference
// ============================================
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ============================================
// توابع کمکی
// ============================================

/**
 * اعتبارسنجی سریع ایمیل
 */
export function validateEmailQuick(email: string): string | null {
  if (!email) return 'ایمیل الزامی است';
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) return 'فرمت ایمیل نامعتبر است';
  return null;
}

/**
 * اعتبارسنجی سریع رمز عبور
 */
export function validatePasswordQuick(password: string): string | null {
  if (!password) return 'رمز عبور الزامی است';
  if (password.length < 8) return 'رمز عبور باید حداقل ۸ کاراکتر باشد';
  return null;
}

/**
 * اعتبارسنجی سریع شماره موبایل
 */
export function validatePhoneQuick(phone: string): string | null {
  if (!phone) return null; // اختیاری
  if (!validateIranianPhone(phone)) {
    return 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد';
  }
  return null;
}
