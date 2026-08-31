// src/lib/sms/index.ts

import { MelipayamakProvider } from './providers/melipayamak';
import { SmsSendResult } from './providers/base';

let instance: MelipayamakProvider | null = null;

function getProvider(): MelipayamakProvider {
  if (!instance) {
    const username = process.env.MELIPAYAMAK_USERNAME;
    const password = process.env.MELIPAYAMAK_PASSWORD;
    const from = process.env.MELIPAYAMAK_FROM;
    const bodyId = parseInt(process.env.MELIPAYAMAK_BODY_ID || '521180');

    if (!username || !password || !from) {
      throw new Error(
        'MELIPAYAMAK_USERNAME, MELIPAYAMAK_PASSWORD و MELIPAYAMAK_FROM در .env تنظیم نشده‌اند'
      );
    }

    instance = new MelipayamakProvider(username, password, from, bodyId);
  }
  return instance;
}

/**
 * ارسال پیامک با یک متغیر (برای الگوی تست)
 */
export async function sendSms(
  phone: string,
  code: string  // ✅ فقط یک متغیر
): Promise<SmsSendResult> {
  try {
    const provider = getProvider();
    // ✅ فقط یک متغیر به آرایه اضافه می‌کنیم
    return await provider.sendWithArray(phone, [code]);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطای ناشناخته',
    };
  }
}

/**
 * ارسال با آرایه (برای آینده که الگوی اصلی تایید شود)
 */
export async function sendSmsWithArray(
  phone: string,
  textArray: string[]
): Promise<SmsSendResult> {
  try {
    const provider = getProvider();
    return await provider.sendWithArray(phone, textArray);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطای ناشناخته',
    };
  }
}

export { MelipayamakProvider };