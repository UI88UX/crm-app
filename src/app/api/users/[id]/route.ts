// src/app/api/users/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateUserSchema } from '@/lib/validations/user';
import type { User, UserRole } from '@/types/user';
import { createAdminClientStateless } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// ============================================
// Helper: بررسی دسترسی ادمین + tenant
// ============================================
async function checkAdminAccess() {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClientStateless();  // ✅ تغییر

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.log('❌ [checkAdminAccess] No user:', authError?.message);
    return { error: 'unauthorized', status: 401, message: 'لطفاً وارد حساب کاربری خود شوید.' };
  }

  const { data: tenantId, error: tenantError } = await supabase.rpc(
    'get_current_tenant_id'
  );
  if (tenantError || !tenantId) {
    console.log('❌ [checkAdminAccess] No tenant:', tenantError?.message);
    return { error: 'no_tenant', status: 403, message: 'کاربر به هیچ مطب متصل نیست.' };
  }

  const { data: currentUserData, error: currentUserError } = await supabaseAdmin
    .from('users')
    .select('role, is_super_admin')
    .eq('id', user.id)
    .single();

  console.log('🔍 [checkAdminAccess] user.id:', user.id);
  console.log('🔍 [checkAdminAccess] currentUserData:', currentUserData);
  console.log('🔍 [checkAdminAccess] currentUserError:', currentUserError);

  const isAdmin =
    currentUserData?.role === 'admin' || currentUserData?.is_super_admin === true;

  if (!isAdmin) {
    console.log('❌ [checkAdminAccess] Not admin');
    return { error: 'forbidden', status: 403, message: 'دسترسی غیرمجاز.' };
  }

  return { user, tenantId, supabaseAdmin, currentUser: currentUserData };
}
// ============================================
// GET /api/users/[id]
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'لطفاً وارد حساب کاربری خود شوید.' },
        { status: 401 }
      );
    }

    const { data: tenantId, error: tenantError } = await supabase.rpc(
      'get_current_tenant_id'
    );
    if (tenantError || !tenantId) {
      return NextResponse.json(
        { error: 'کاربر به هیچ مطب متصل نیست.' },
        { status: 403 }
      );
    }

    const { data: dbUser, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !dbUser) {
      return NextResponse.json({ error: 'کاربر یافت نشد.' }, { status: 404 });
    }
    // دریافت ایمیل از auth
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id);

    return NextResponse.json({
      data: {
        ...dbUser,
        role: dbUser.role as UserRole,
        email: authUser?.user?.email,
      } as User,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: error.message || 'خطای غیرمنتظره' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/users/[id]
// ویرایش کاربر (نام، موبایل، نقش)
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await checkAdminAccess();

    if ('error' in access) {
      return NextResponse.json(
        { error: access.message },
        { status: access.status }
      );
    }

    const { tenantId, supabaseAdmin, user: currentUser } = access;

    // جلوگیری از ویرایش خود
    if (id === currentUser.id) {
      return NextResponse.json(
        { error: 'نمی‌توانید اطلاعات خود را از این طریق ویرایش کنید.' },
        { status: 400 }
      );
    }

    // بررسی وجود کاربر در tenant جاری
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, role, is_super_admin, is_active')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (checkError || !existingUser) {
      return NextResponse.json({ error: 'کاربر یافت نشد.' }, { status: 404 });
    }

    // اعتبارسنجی body
    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError =
        Object.values(errors).flat()[0] || 'داده‌های وارد شده نامعتبر است';
      return NextResponse.json(
        { error: firstError, fieldErrors: errors },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // جلوگیری از تغییر نقش super_admin
    if (existingUser.is_super_admin && updateData.role && updateData.role !== 'admin') {
      return NextResponse.json(
        { error: 'امکان تغییر نقش مدیرکل وجود ندارد.' },
        { status: 400 }
      );
    }

    // ساخت آبجکت آپدیت
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updateData.full_name !== undefined) updatePayload.full_name = updateData.full_name;
    if (updateData.phone !== undefined) updatePayload.phone = updateData.phone;
    if (updateData.role !== undefined) updatePayload.role = updateData.role;
    if (updateData.is_active !== undefined) {
      updatePayload.is_active = updateData.is_active;
    }
    // 🆕 permissions
    if (updateData.permissions !== undefined) {
      updatePayload.permissions = updateData.permissions;
    }
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updatePayload)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'خطا در ویرایش کاربر: ' + updateError.message },
        { status: 500 }
      );
    }
    // لاگ
    try {
      await supabaseAdmin.from('activity_logs').insert({
        tenant_id: tenantId,
        user_id: currentUser.id,
        action:
          updateData.is_active === true
            ? 'reactivate_user'
            : updateData.is_active === false
              ? 'deactivate_user'
              : updateData.permissions !== undefined
                ? 'update_user_permissions'
                : 'update_user',
        metadata: {
          updated_fields: Object.keys(updatePayload),
          ...(updateData.permissions !== undefined && {
            new_permissions: updateData.permissions,
          }),
        },
      });
    } catch (logError) {
      console.error('Log error:', logError);
    }

    return NextResponse.json({
      data: updatedUser as User,
      message: 'کاربر با موفقیت ویرایش شد.',
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: error.message || 'خطای غیرمنتظره' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/users/[id]
// غیرفعال‌سازی کاربر (soft delete)
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await checkAdminAccess();

    if ('error' in access) {
      return NextResponse.json(
        { error: access.message },
        { status: access.status }
      );
    }

    const { tenantId, supabaseAdmin, user: currentUser } = access;

    // جلوگیری از غیرفعال‌سازی خود
    if (id === currentUser.id) {
      return NextResponse.json(
        { error: 'نمی‌توانید حساب خود را غیرفعال کنید.' },
        { status: 400 }
      );
    }

    // بررسی وجود کاربر
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, is_super_admin, is_active, full_name')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (checkError || !existingUser) {
      return NextResponse.json({ error: 'کاربر یافت نشد.' }, { status: 404 });
    }

    if (existingUser.is_super_admin) {
      return NextResponse.json(
        { error: 'امکان غیرفعال‌سازی مدیرکل وجود ندارد.' },
        { status: 400 }
      );
    }

    if (!existingUser.is_active) {
      return NextResponse.json(
        { error: 'این کاربر قبلاً غیرفعال شده است.' },
        { status: 400 }
      );
    }

    // Soft delete: is_active = false
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'خطا در غیرفعال‌سازی کاربر: ' + updateError.message },
        { status: 500 }
      );
    }

    // لاگ
    try {
      await supabaseAdmin.from('activity_logs').insert({
        tenant_id: tenantId,
        user_id: currentUser.id,
        action: 'deactivate_user',
        table_name: 'users',
        record_id: id,
        metadata: { user_name: existingUser.full_name },
      });
    } catch (logError) {
      console.error('Log error:', logError);
    }

    return NextResponse.json({
      data: updatedUser as User,
      message: 'کاربر با موفقیت غیرفعال شد.',
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: error.message || 'خطای غیرمنتظره' },
      { status: 500 }
    );
  }
}