// src/app/api/test-sms/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { sendSms } from '@/lib/sms';

export async function GET(request: NextRequest) {
  try {
    // ✅ ارسال با یک متغیر (کد تأیید)
    const result = await sendSms(
      '09364019466',
      '123456'  // فقط یک متغیر
    );

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      providerResponse: result.providerResponse,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'خطا'
    }, { status: 500 });
  }
}