// src/app/api/sms/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tenantId, error: tenantError } = await supabase
      .rpc('get_current_tenant_id');

    if (tenantError || !tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    // کل آمار
    const { data: logs, error } = await supabase
      .from('sms_logs')
      .select('status, cost, sent_at')
      .eq('tenant_id', tenantId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const totalSent = logs?.length || 0;
    const totalDelivered = logs?.filter(l => l.status === 'sent' || l.status === 'delivered').length || 0;
    const totalFailed = logs?.filter(l => l.status === 'failed').length || 0;
    const totalCost = logs?.reduce((sum, l) => sum + (l.cost || 0), 0) || 0;
    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;

    // آمار این ماه
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthSent = logs?.filter(
      l => new Date(l.sent_at) >= startOfMonth
    ).length || 0;

    const lastMonthSent = logs?.filter(
      l => new Date(l.sent_at) >= startOfLastMonth && new Date(l.sent_at) <= endOfLastMonth
    ).length || 0;

    return NextResponse.json({
      data: {
        total_sent: totalSent,
        total_delivered: totalDelivered,
        total_failed: totalFailed,
        total_cost: totalCost,
        delivery_rate: deliveryRate,
        this_month_sent: thisMonthSent,
        last_month_sent: lastMonthSent,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}