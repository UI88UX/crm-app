// src/app/api/sms/patients/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { searchPatients } from '@/lib/sms/campaigns';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { filters } = body;

    // دریافت tenant_id
    const { data: tenantId, error: tenantError } = await supabase
      .rpc('get_current_tenant_id');

    if (tenantError || !tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 400 }
      );
    }

    const result = await searchPatients(filters || {}, tenantId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      data: result.data,
      count: result.data.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}