// src/app/api/users/[id]/password/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientStateless } from '@/lib/supabase/admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const changePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد')
    .max(100, 'رمز عبور نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const supabaseAdmin = createAdminClientStateless();

    // ۱. احراز هویت
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json(
        { error: 'لطفاً وارد حساب کاربری خود شوید.' },
        { status: 401 }
      );
    }

    // ۲. دریافت tenant_id
    const { data: tenantId, error: tenantError } = await supabase.rpc(
      'get_current_tenant_id'
    );

    if (tenantError || !tenantId) {
      return NextResponse.json(
        { error: 'کاربر به هیچ مطب متصل نیست.' },
        { status: 403 }
      );
    }

    // ۳. بررسی نقش کاربر جاری (فقط admin یا super_admin)
    const { data: currentUserData } = await supabaseAdmin
      .from('users')
      .select('role, is_super_admin')
      .eq('id', currentUser.id)
      .single();

    const isAdmin =
      currentUserData?.role === 'admin' ||
      currentUserData?.is_super_admin === true;

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'فقط مدیر می‌تواند رمز کاربران را تغییر دهد.' },
        { status: 403 }
      );
    }

    // ۴. بررسی وجود کاربر هدف در tenant جاری
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('users')
      .select('id, is_super_admin')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'کاربر یافت نشد.' }, { status: 404 });
    }

    // ۵. جلوگیری از تغییر رمز super_admin
    if (targetUser.is_super_admin && !currentUserData?.is_super_admin) {
      return NextResponse.json(
        { error: 'امکان تغییر رمز مدیر کل وجود ندارد.' },
        { status: 403 }
      );
    }

    // ۶. اعتبارسنجی body
    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError =
        Object.values(errors).flat()[0] || 'داده‌های وارد شده نامعتبر است';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    // ۷. تغییر رمز در Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      { password: validation.data.password }
    );

    if (updateError) {
      return NextResponse.json(
        { error: 'خطا در تغییر رمز: ' + updateError.message },
        { status: 500 }
      );
    }

    // ۸. لاگ فعالیت
    try {
      await supabaseAdmin.from('activity_logs').insert({
        tenant_id: tenantId,
        user_id: currentUser.id,
        action: 'change_user_password',
        table_name: 'users',
        record_id: id,
        metadata: {
          changed_by: currentUser.id,
        },
      });
    } catch (logError) {
      console.error('Log error:', logError);
    }

    return NextResponse.json({
      message: 'رمز عبور با موفقیت تغییر کرد.',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: error.message || 'خطای غیرمنتظره' },
      { status: 500 }
    );
  }
}