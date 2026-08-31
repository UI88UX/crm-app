// src/app/api/cron/process-queue/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { processQueue } from '@/lib/sms/queue';

export async function GET(request: NextRequest) {
  try {
    // بررسی کلید امنیتی
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET_KEY;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting queue processing...');

    const result = await processQueue();

    console.log(`✅ Queue processed: ${result.processed} items, ${result.success} success, ${result.failed} failed`);

    // ✅ رفع خطای تکرار success
    return NextResponse.json({
      processed: result.processed,
      success_count: result.success,  // تغییر نام
      failed_count: result.failed,    // تغییر نام
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error processing queue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}