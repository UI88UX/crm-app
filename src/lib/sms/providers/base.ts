// src/lib/sms/providers/base.ts

export interface SmsSendResult {
    success: boolean;
    messageId?: string;
    error?: string;
    providerResponse?: any;
  }
  
  export abstract class BaseSmsProvider {
    protected from: string;
  
    constructor(from: string) {
      this.from = from;
    }
  
    abstract send(phone: string, message: string): Promise<SmsSendResult>;
  
    protected normalizePhone(phone: string): string {
      let normalized = phone.replace(/\s/g, '');
      if (normalized.startsWith('0')) {
        normalized = '98' + normalized.substring(1);
      }
      if (!normalized.startsWith('98')) {
        normalized = '98' + normalized;
      }
      return normalized;
    }
  }