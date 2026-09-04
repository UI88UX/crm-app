// src/app/api/cron/daily-reminders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { scheduleHearingAidServiceReminders } from '@/lib/sms/reminders';
import { scheduleBirthdayAlerts } from '@/lib/sms/birthday';
import { processQueue } from '@/lib/sms/queue';

// این مسیر هر روز ساعت ۸ صبح اجرا می‌شود
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

    console.log('🔄 Starting daily reminders...');

    // 1. یادآوری سرویس سمعک
    console.log('📢 Scheduling hearing aid service reminders...');
    await scheduleHearingAidServiceReminders();

    // 2. تبریک تولد
    console.log('🎂 Scheduling birthday alerts...');
    await scheduleBirthdayAlerts();

    // 3. پردازش صف پیامک‌ها
    console.log('📤 Processing queue...');
    const queueResult = await processQueue();

    console.log(`✅ Daily reminders completed. Queue: ${queueResult.processed} items`);

    return NextResponse.json({
      success: true,
      message: 'Daily reminders processed successfully',
      queue: queueResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error in daily reminders:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}