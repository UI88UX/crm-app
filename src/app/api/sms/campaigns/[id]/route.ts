// src/app/api/sms/campaigns/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCampaign } from '@/lib/sms/campaigns';
import { createClient } from '@/lib/supabase/server';

type RouteContext = {
  params: {
    id: string;
  };
};

// GET - دریافت جزئیات یک کمپین
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = context.params; // ✅ بدون await
    const result = await getCampaign(id);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - ویرایش کمپین
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = context.params;
    const body = await request.json();
    const { name, content, filters, scheduled_at } = body;

    const { data: tenantId, error: tenantError } = await supabase
      .rpc('get_current_tenant_id');

    if (tenantError || !tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    // محاسبه تعداد گیرندگان با فیلترهای جدید
    let totalRecipients = 0;
    if (filters) {
      const { searchPatients } = await import('@/lib/sms/campaigns');
      const result = await searchPatients(filters, tenantId);
      if (!result.error) {
        totalRecipients = result.data.length;
      }
    }

    const updateData: any = {
      name,
      content,
      filters: filters || {},
      total_recipients: totalRecipients,
      updated_at: new Date().toISOString(),
    };

    if (scheduled_at) {
      updateData.scheduled_at = scheduled_at;
      updateData.status = 'scheduled';
    } else {
      updateData.scheduled_at = null;
      updateData.status = 'draft';
    }

    const { data, error } = await supabase
      .from('sms_campaigns')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - حذف کمپین
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = context.params; // ✅ بدون await

    const { data: tenantId, error: tenantError } = await supabase
      .rpc('get_current_tenant_id');

    if (tenantError || !tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const { error } = await supabase
      .from('sms_campaigns')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}