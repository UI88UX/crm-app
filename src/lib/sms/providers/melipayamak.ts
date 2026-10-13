// src/lib/sms/providers/melipayamak.ts

import { BaseSmsProvider, SmsSendResult } from './base';

export class MelipayamakProvider extends BaseSmsProvider {
  private username: string;
  private password: string;
  private defaultBodyId: number;

  constructor(
    username: string,
    password: string,
    from: string,
    defaultBodyId: number = 554139
  ) {
    super(from);
    this.username = username;
    this.password = password;
    this.defaultBodyId = defaultBodyId;
  }

  /**
   * ارسال پیامک با یک متغیر (برای پیامک‌های تک‌متغیره)
   * bodyId: اگر داده شود، از آن استفاده می‌شود؛ در غیر این صورت defaultBodyId
   */
  async send(
    phone: string,
    message: string,
    bodyId?: number
  ): Promise<SmsSendResult> {
    return this.sendWithArray(phone, [message], bodyId);
  }

  /**
   * ارسال پیامک با آرایه‌ای از متغیرها
   * ترتیب آرایه باید مطابق {0}, {1}, {2}, ... در الگوی پنل ملی‌پیامک باشد
   */
  async sendWithArray(
    phone: string,
    textArray: string[],
    bodyId?: number
  ): Promise<SmsSendResult> {
    try {
      const normalizedPhone = this.normalizePhone(phone);
      const effectiveBodyId = bodyId ?? this.defaultBodyId;

      // ✅ ترکیب آرایه با جداکننده ;
      const textString = textArray.join(';');

      let url = `http://api.payamak-panel.com/post/Send.asmx/SendByBaseNumber2?`;
      url += `username=${encodeURIComponent(this.username)}`;
      url += `&password=${encodeURIComponent(this.password)}`;
      url += `&to=${encodeURIComponent(normalizedPhone)}`;
      url += `&bodyId=${effectiveBodyId}`;
      url += `&text=${encodeURIComponent(textString)}`;

      const response = await fetch(url, { method: 'GET' });
      const text = await response.text();

      const match = text.match(/<string[^>]*>(.*?)<\/string>/);

      if (!response.ok || !match) {
        return {
          success: false,
          error: 'خطا در ارسال پیامک',
          providerResponse: text,
        };
      }

      const result = match[1].trim();

      if (/^\d+$/.test(result)) {
        return {
          success: true,
          messageId: result,
          providerResponse: text,
        };
      }

      return {
        success: false,
        error: result || 'خطا در ارسال پیامک',
        providerResponse: text,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'خطای ناشناخته',
      };
    }
  }
}