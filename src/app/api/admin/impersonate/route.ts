// src/app/api/admin/impersonate/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientStateless } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/impersonate
 * 
 * سوپر ادمین با این endpoint می‌تونه «موقتاً» به داشبورد یه مطب بره.
 * tenant_id در یک cookie ست می‌شه و داشبورد بر اساس اون نشون داده می‌شه.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClientStateless();

    // ۱. احراز هویت
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'لطفاً وارد حساب کاربری خود شوید.' },
        { status: 401 }
      );
    }

    // ۲. چک is_super_admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!userData?.is_super_admin) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز.' },
        { status: 403 }
      );
    }

    // ۳. دریافت body
    const body = await request.json();
    const { tenant_id } = body;

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'شناسه مطب الزامی است.' },
        { status: 400 }
      );
    }

    // ۴. بررسی وجود مطب
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id, name, is_active')
      .eq('id', tenant_id)
      .single();

    if (!tenant) {
      return NextResponse.json(
        { error: 'مطب یافت نشد.' },
        { status: 404 }
      );
    }

    // ۵. لاگ فعالیت (اختیاری)
    try {
      await supabaseAdmin.from('activity_logs').insert({
        tenant_id: tenant.id,
        user_id: user.id,
        action: 'super_admin_impersonate',
        table_name: 'tenants',
        record_id: tenant.id,
        metadata: {
          tenant_name: tenant.name,
          impersonated_at: new Date().toISOString(),
        },
      });
    } catch (logError) {
      console.error('Log error:', logError);
    }

    // ۶. تنظیم cookie برای داشبورد
    const response = NextResponse.json({
      data: {
        tenant_id: tenant.id,
        tenant_name: tenant.name,
      },
      message: `ورود به داشبورد ${tenant.name}`,
    });

    response.cookies.set('impersonate_tenant_id', tenant_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // ۲ ساعت
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Impersonate error:', error);
    return NextResponse.json(
      { error: error.message || 'خطای غیرمنتظره' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/impersonate
 * خروج از حالت impersonate
 */
export async function DELETE() {
  const response = NextResponse.json({
    message: 'خروج از داشبورد مطب',
  });

  response.cookies.delete('impersonate_tenant_id');

  return response;
}