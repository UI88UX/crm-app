// src/lib/sms/providers/melipayamak.ts

import { BaseSmsProvider, SmsSendResult } from './base';

export class MelipayamakProvider extends BaseSmsProvider {
  private username: string;
  private password: string;
  private bodyId: number;

  constructor(username: string, password: string, from: string, bodyId: number = 521180) {
    super(from);
    this.username = username;
    this.password = password;
    this.bodyId = bodyId;
  }

  async send(phone: string, message: string): Promise<SmsSendResult> {
    try {
      const normalizedPhone = this.normalizePhone(phone);

      let url = `http://api.payamak-panel.com/post/Send.asmx/SendByBaseNumber2?`;
      url += `username=${encodeURIComponent(this.username)}`;
      url += `&password=${encodeURIComponent(this.password)}`;
      url += `&to=${encodeURIComponent(normalizedPhone)}`;
      url += `&bodyId=${this.bodyId}`; // ✅ bodyId = 521180

      const textArray = [message];
      textArray.forEach((value, index) => {
        url += `&text[${index}]=${encodeURIComponent(value)}`;
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
        },
      });

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

  async sendWithArray(phone: string, textArray: string[]): Promise<SmsSendResult> {
    try {
      const normalizedPhone = this.normalizePhone(phone);

      // ✅ ترکیب آرایه با جداکننده ;
      const textString = textArray.join(';');

      let url = `http://api.payamak-panel.com/post/Send.asmx/SendByBaseNumber2?`;
      url += `username=${encodeURIComponent(this.username)}`;
      url += `&password=${encodeURIComponent(this.password)}`;
      url += `&to=${encodeURIComponent(normalizedPhone)}`;
      url += `&bodyId=${this.bodyId}`;
      url += `&text=${encodeURIComponent(textString)}`; // ✅ یک رشته با ;

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