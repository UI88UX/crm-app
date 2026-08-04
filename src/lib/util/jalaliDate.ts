// src/lib/utils/jalaliDate.ts

import moment from 'moment-jalaali';

/**
 * تشخیص اینکه تاریخ میلادی است یا شمسی
 * اگر سال بین 1300-1500 باشد، احتمالاً شمسی است
 */
function isJalaliDate(date: string): boolean {
  const year = parseInt(date.split('-')[0]);
  return year >= 1300 && year <= 1500;
}

/**
 * تبدیل تاریخ به میلادی (اگر شمسی بود)
 */
export function normalizeToGregorian(date: string): string | null {
  if (!date) return null;
  
  try {
    // اگر تاریخ شمسی است، به میلادی تبدیل کن
    if (isJalaliDate(date)) {
      const m = moment(date, 'jYYYY-MM-DD');
      if (m.isValid()) {
        return m.format('YYYY-MM-DD');
      }
    }
    // اگر میلادی است، همان را برگردان
    return date;
  } catch (error) {
    console.error('Error normalizing date:', error);
    return null;
  }
}

/**
 * تبدیل تاریخ میلادی به شمسی
 */
export function toJalali(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  
  try {
    // اگر تاریخ به صورت string است و شمسی به نظر می‌رسد
    if (typeof date === 'string' && isJalaliDate(date)) {
      // قبلاً شمسی است، همان را برگردان
      return date;
    }
    
    const m = moment(date);
    if (!m.isValid()) {
      console.warn('Invalid date:', date);
      return null;
    }
    return m.format('jYYYY/jMM/jDD');
  } catch (error) {
    console.error('Error in toJalali:', error);
    return null;
  }
}

/**
 * تبدیل تاریخ میلادی به شمسی (فرمت نمایشی کامل)
 */
export function toJalaliDisplay(
  date: Date | string | null | undefined,
  format: string = "DD MMM YYYY"
): string | null {
  if (!date) return null;
  
  try {
    const m = moment(date);
    if (!m.isValid()) return null;
    
    const formats: Record<string, string> = {
      "DD MMM YYYY": "jD jMMMM jYYYY",
      "YYYY/MM/DD": "jYYYY/jMM/jDD",
      "YYYY-MM-DD": "jYYYY-jMM-jDD",
    };
    
    const formatPattern = formats[format] || "jYYYY/jMM/jDD";
    return m.format(formatPattern);
  } catch (error) {
    console.error('Error converting to Jalali display:', error);
    return null;
  }
}

/**
 * تبدیل تاریخ شمسی به میلادی
 */
export function fromJalali(jalaliDate: string): string | null {
  if (!jalaliDate) return null;
  
  try {
    const m = moment(jalaliDate, 'jYYYY/jMM/jDD');
    if (!m.isValid()) return null;
    return m.format('YYYY-MM-DD');
  } catch (error) {
    console.error('Error converting from Jalali:', error);
    return null;
  }
}
/**
 * تبدیل تاریخ شمسی به میلادی با فرمت Date
 */
export function fromJalaliToDate(jalaliDate: string): Date | null {
  if (!jalaliDate) return null;
  
  try {
    const isoDate = fromJalali(jalaliDate);
    if (!isoDate) return null;
    return new Date(isoDate);
  } catch (error) {
    console.error('Error converting from Jalali to Date:', error);
    return null;
  }
}

/**
 * فرمت تاریخ و زمان کامل به فارسی
 */
export function formatJalaliDateTime(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return null;
    
    const jalaali = moment(d);
    if (!jalaali.isValid()) return null;
    
    return jalaali.format('jYYYY/jMM/jDD - HH:mm');
  } catch (error) {
    console.error('Error formatting Jalali date time:', error);
    return null;
  }
}

/**
 * فرمت زمان
 */
export function formatTime(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return null;
    
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return null;
  }
}

/**
 * دریافت نام ماه شمسی
 */
export function getJalaliMonthName(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return null;
    
    const jalaali = moment(d);
    if (!jalaali.isValid()) return null;
    
    return jalaali.format('jMMMM');
  } catch (error) {
    console.error('Error getting Jalali month name:', error);
    return null;
  }
}

/**
 * بررسی تاریخ اعتبار
 */
export function isValidDate(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  return !isNaN(d.getTime());
}

/**
 * تنظیمات پیش‌فرض برای react-multi-date-picker با تقویم جلالی
 */
export function getJalaliPickerProps() {
  // استفاده از import پویا برای جلوگیری از خطا در سمت سرور
  try {
    const persian = require('react-date-object/calendars/persian').default;
    const persian_fa = require('react-date-object/locales/persian_fa').default;
    return {
      calendar: persian,
      locale: persian_fa,
      format: "YYYY/MM/DD",
    };
  } catch {
    // fallback
    return {
      format: "YYYY/MM/DD",
    };
  }
}