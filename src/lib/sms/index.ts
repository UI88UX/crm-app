// src/lib/sms/index.ts

import { MelipayamakProvider } from './providers/melipayamak';
import { SmsSendResult } from './providers/base';

let instance: MelipayamakProvider | null = null;

function getProvider(): MelipayamakProvider {
  if (!instance) {
    const username = process.env.MELIPAYAMAK_USERNAME;
    const password = process.env.MELIPAYAMAK_PASSWORD;
    const from = process.env.MELIPAYAMAK_FROM;
    const defaultBodyId = parseInt(process.env.MELIPAYAMAK_BODY_ID_DEFAULT || '521180');

    if (!username || !password || !from) {
      throw new Error(
        'MELIPAYAMAK_USERNAME, MELIPAYAMAK_PASSWORD و MELIPAYAMAK_FROM در .env تنظیم نشده‌اند'
      );
    }

    instance = new MelipayamakProvider(username, password, from, defaultBodyId);
  }
  return instance;
}

/**
 * ارسال پیامک تک‌متغیره
 */
export async function sendSms(
  phone: string,
  code: string,
  bodyId?: number
): Promise<SmsSendResult> {
  try {
    const provider = getProvider();
    return await provider.sendWithArray(phone, [code], bodyId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطای ناشناخته',
    };
  }
}

/**
 * ارسال پیامک چندمتغیره
 */
export async function sendSmsWithArray(
  phone: string,
  textArray: string[],
  bodyId?: number
): Promise<SmsSendResult> {
  try {
    const provider = getProvider();
    return await provider.sendWithArray(phone, textArray, bodyId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطای ناشناخته',
    };
  }
}

export { MelipayamakProvider };