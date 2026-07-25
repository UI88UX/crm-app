// src/lib/storage/helpers.ts

// ============================================
// Constants
// ============================================

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf'
];

// ============================================
// Helper Functions
// ============================================

/**
 * اعتبارسنجی فایل
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  console.log('validateFile called with:', file.name, file.type, file.size);
  
  // بررسی حجم
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `حجم فایل باید کمتر از ${MAX_FILE_SIZE / (1024 * 1024)} مگابایت باشد`
    };
  }

  // بررسی MIME Type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'فقط فایل‌های JPG، PNG و PDF مجاز هستند'
    };
  }

  return { valid: true };
}

/**
 * تولید مسیر فایل در Storage
 * فرمت: {tenant_id}/{patient_id}/{timestamp}_{filename}
 */
export function generateFilePath(
  tenantId: string,
  patientId: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const safeFileName = fileName.replace(/\s/g, '_');
  return `${tenantId}/${patientId}/${timestamp}_${safeFileName}`;
}