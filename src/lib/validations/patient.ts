// src/lib/validations/patient.ts
import { z } from "zod";

// ============================================
// الگوریتم چک‌سام کد ملی ایران
// ============================================

/**
 * اعتبارسنجی کد ملی ایران
 * @param nationalCode - کد ملی ۱۰ رقمی
 * @returns true اگر معتبر باشد
 * 
 * الگوریتم:
 * 1. کد ملی باید ۱۰ رقم باشد
 * 2. ارقام تکراری (مانند ۱۱۱۱۱۱۱۱۱۱) نامعتبر هستند
 * 3. رقم کنترل با استفاده از الگوریتم خاص محاسبه می‌شود
 */
export function validateIranianNationalCode(nationalCode: string): boolean {
  // حذف فاصله‌ها
  const code = nationalCode.trim();
  
  // بررسی طول و عددی بودن
  if (!/^\d{10}$/.test(code)) {
    return false;
  }

  // بررسی ارقام تکراری
  const repeatedDigits = [
    '0000000000',
    '1111111111',
    '2222222222',
    '3333333333',
    '4444444444',
    '5555555555',
    '6666666666',
    '7777777777',
    '8888888888',
    '9999999999',
  ];
  if (repeatedDigits.includes(code)) {
    return false;
  }

  // الگوریتم چک‌سام
  const digits = code.split('').map(Number);
  const checkDigit = digits[9];
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  
  const remainder = sum % 11;
  
  if (remainder < 2) {
    return checkDigit === remainder;
  } else {
    return checkDigit === (11 - remainder);
  }
}

// ============================================
// Schemaهای Zod
// ============================================

/**
 * Schema اصلی بیمار
 * برای ایجاد و ویرایش
 */
export const patientSchema = z.object({
  first_name: z.string()
    .min(2, "نام باید حداقل ۲ کاراکتر باشد")
    .max(50, "نام نمی‌تواند بیشتر از ۵۰ کاراکتر باشد")
    .regex(/^[\u0600-\u06FF\s]+$/, "نام باید به فارسی باشد"),

  last_name: z.string()
    .min(2, "نام خانوادگی باید حداقل ۲ کاراکتر باشد")
    .max(50, "نام خانوادگی نمی‌تواند بیشتر از ۵۰ کاراکتر باشد")
    .regex(/^[\u0600-\u06FF\s]+$/, "نام خانوادگی باید به فارسی باشد"),

  national_code: z.string()
    .length(10, "کد ملی باید دقیقاً ۱۰ رقم باشد")
    .regex(/^\d{10}$/, "کد ملی فقط می‌تواند شامل اعداد باشد")
    .refine(
      (val) => validateIranianNationalCode(val),
      { message: "کد ملی نامعتبر است" }
    ),

  phone: z.string()
    .min(11, "شماره تلفن باید حداقل ۱۱ رقم باشد")
    .max(11, "شماره تلفن باید ۱۱ رقم باشد")
    .regex(/^09\d{9}$/, "شماره تلفن باید با ۰۹ شروع شود"),

  email: z.string()
    .email("ایمیل نامعتبر است")
    .optional()
    .nullable()
    .or(z.literal('')),

  birth_date: z.string()
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine(
      (val) => {
        if (!val) return true;
        // بررسی فرمت YYYY-MM-DD
        return /^\d{4}-\d{2}-\d{2}$/.test(val);
      },
      { message: "فرمت تاریخ نامعتبر است" }
    ),

  gender: z.enum(['male', 'female', 'other'])
    .optional()
    .nullable(),

  address: z.string()
    .max(500, "آدرس نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد")
    .optional()
    .nullable(),

  city: z.string()
    .max(100, "شهر نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .optional()
    .nullable(),

  province: z.string()
    .max(100, "استان نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .optional()
    .nullable(),

  postal_code: z.string()
    .length(10, "کد پستی باید ۱۰ رقم باشد")
    .regex(/^\d{10}$/, "کد پستی فقط می‌تواند شامل اعداد باشد")
    .optional()
    .nullable(),

  emergency_contact_name: z.string()
    .max(100, "نام فرد معتمد نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد")
    .optional()
    .nullable(),

  emergency_contact_phone: z.string()
    .min(11, "شماره تلفن اضطراری باید حداقل ۱۱ رقم باشد")
    .max(11, "شماره تلفن اضطراری باید ۱۱ رقم باشد")
    .regex(/^09\d{9}$/, "شماره تلفن باید با ۰۹ شروع شود")
    .optional()
    .nullable(),

  notes: z.string()
    .max(1000, "توضیحات نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد")
    .optional()
    .nullable(),
});

/**
 * Schema برای جستجوی بیماران
 */
export const patientSearchSchema = z.object({
  query: z.string()
    .optional()
    .nullable()
    .transform(val => val?.trim() || ''),
  page: z.number()
    .int()
    .positive()
    .default(1),
  limit: z.number()
    .int()
    .positive()
    .max(100)
    .default(20),
});

/**
 * Schema برای ایجاد بیمار (بدون ID)
 */
export const createPatientSchema = patientSchema;

/**
 * Schema برای ویرایش بیمار (فیلدها اختیاری)
 */
export const updatePatientSchema = patientSchema.partial();

// ============================================
// Type Inference
// ============================================

export type PatientFormData = z.infer<typeof patientSchema>;
export type PatientSearchFormData = z.infer<typeof patientSearchSchema>;
export type CreatePatientFormData = z.infer<typeof createPatientSchema>;
export type UpdatePatientFormData = z.infer<typeof updatePatientSchema>;

// ============================================
// توابع کمکی
// ============================================

/**
 * تبدیل جنسیت به فارسی
 */
export function getGenderLabel(gender: string | null | undefined): string {
  if (!gender) return 'نامشخص';
  const map: Record<string, string> = {
    male: 'مرد',
    female: 'زن',
    other: 'سایر',
  };
  return map[gender] || gender;
}

/**
 * دریافت گزینه‌های جنسیت برای select
 */
export const GENDER_OPTIONS = [
  { value: 'male', label: 'مرد' },
  { value: 'female', label: 'زن' },
  { value: 'other', label: 'سایر' },
] as const;

/**
 * اعتبارسنجی سریع کد ملی (برای استفاده در فرم)
 * @returns پیام خطا یا null
 */
export function validateNationalCodeQuick(code: string): string | null {
  if (!code) return 'کد ملی الزامی است';
  if (code.length !== 10) return 'کد ملی باید ۱۰ رقم باشد';
  if (!/^\d{10}$/.test(code)) return 'کد ملی فقط می‌تواند شامل اعداد باشد';
  if (!validateIranianNationalCode(code)) return 'کد ملی نامعتبر است';
  return null;
}

/**
 * اعتبارسنجی سریع تلفن (برای استفاده در فرم)
 * @returns پیام خطا یا null
 */
export function validatePhoneQuick(phone: string): string | null {
  if (!phone) return 'شماره تلفن الزامی است';
  if (phone.length !== 11) return 'شماره تلفن باید ۱۱ رقم باشد';
  if (!/^09\d{9}$/.test(phone)) return 'شماره تلفن باید با ۰۹ شروع شود';
  return null;
}