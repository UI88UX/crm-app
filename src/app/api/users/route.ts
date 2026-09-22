// src/app/api/users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientStateless } from '@/lib/supabase/admin';
import { createUserSchema } from '@/lib/validations/user';
import type { User, UserRole, UsersListResponse, UserLimitInfo } from '@/types/user';

export const dynamic = 'force-dynamic';

// ============================================
// GET /api/users
// لیست کاربران Tenant جاری + اطلاعات limit
// ============================================
export async function GET() {
  try {
    const supabase = await createClient();

    // 1. احراز هویت
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'لطفاً وارد حساب کاربری خود شوید.' },
        { status: 401 }
      );
    }

    // 2. دریافت tenant_id
    const { data: tenantId, error: tenantError } = await supabase.rpc(
      'get_current_tenant_id'
    );

    if (tenantError || !tenantId) {
      return NextResponse.json(
        { error: 'کاربر به هیچ مطب متصل نیست.' },
        { status: 403 }
      );
    }

    // 3. لیست کاربران از جدول users
    const supabaseAdmin = createAdminClientStateless();

    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        tenant_id,
        full_name,
        phone,
        role,
        specialty,
        avatar_url,
        is_active,
        is_super_admin,
        last_login_at,
        created_at,
        updated_at,
        permissions
      `)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'خطا در دریافت کاربران: ' + usersError.message },
        { status: 500 }
      );
    }

    // 4. دریافت ایمیل کاربران از auth.users
    const { data: authUsers, error: authUsersError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (authUsersError) {
      console.error('Error fetching auth users:', authUsersError);
    }

    // ادغام ایمیل با اطلاعات users
    const usersWithEmail: User[] = (users || []).map((u) => {
      const authUser = authUsers?.users.find((au) => au.id === u.id);
      return {
        ...u,
        role: u.role as UserRole,
        email: authUser?.email,
      };
    });

    // 5. دریافت اطلاعات limit
    const { data: limitData, error: limitError } = await supabase.rpc(
      'check_user_limit'
    );

    if (limitError) {
      console.error('Error checking user limit:', limitError);
    }

    const rawLimit = Array.isArray(limitData) ? limitData[0] : limitData;

    const limit: UserLimitInfo = rawLimit
      ? {
        current_users: Number(rawLimit.current_users) || 0,
        max_users: Number(rawLimit.max_users) || 5,
        remaining: Number(rawLimit.remaining) || 0,
        is_at_limit: Boolean(rawLimit.is_at_limit),
        can_add_user: Boolean(rawLimit.can_add_user),
      }
      : {
        current_users: usersWithEmail.length,
        max_users: 5,
        remaining: Math.max(0, 5 - usersWithEmail.length),
        is_at_limit: usersWithEmail.length >= 5,
        can_add_user: usersWithEmail.length < 5,
      };

    const response: UsersListResponse = {
      users: usersWithEmail,
      limit,
    };

    return NextResponse.json({ data: response });
  } catch (error: any) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: error.message || 'خطای غیرمنتظره در سرور' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/users
// ایجاد کاربر جدید (فقط ادمین)
// ============================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClientStateless();

    // 1. احراز هویت
    const { data: { user: currentUser }, error: authError } =
      await supabase.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json(
        { error: 'لطفاً وارد حساب کاربری خود شوید.' },
        { status: 401 }
      );
    }

    // 2. دریافت tenant_id از session
    const { data: tenantId, error: tenantError } = await supabase.rpc(
      'get_current_tenant_id'
    );

    if (tenantError || !tenantId) {
      return NextResponse.json(
        { error: 'کاربر به هیچ مطب متصل نیست.' },
        { status: 403 }
      );
    }

    // 3. بررسی نقش کاربر جاری (فقط admin)
    const { data: currentUserData, error: currentUserError } = await supabaseAdmin
      .from('users')
      .select('role, is_super_admin')
      .eq('id', currentUser.id)
      .single();

    if (currentUserError || !currentUserData) {
      return NextResponse.json(
        { error: 'اطلاعات کاربر جاری یافت نشد.' },
        { status: 403 }
      );
    }

    const isAdmin =
      currentUserData.role === 'admin' || currentUserData.is_super_admin === true;

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'فقط مدیر می‌تواند کاربر جدید اضافه کند.' },
        { status: 403 }
      );
    }

    // 4. اعتبارسنجی body
    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError =
        Object.values(errors).flat()[0] || 'داده‌های وارد شده نامعتبر است';
      return NextResponse.json(
        { error: firstError, fieldErrors: errors },
        { status: 400 }
      );
    }

    const { email, password, full_name, phone, role, permissions } = validation.data;

    // انتخاب permissions مناسب
    const finalPermissions =
      role === 'admin'
        ? { can_delete: true, can_manage_sms: true, can_view_reports: true }
        : permissions || { can_delete: true, can_manage_sms: true, can_view_reports: true };

    // 5. بررسی اتمیک سقف کاربران
    const { data: limitData, error: limitError } = await supabase.rpc(
      'check_user_limit'
    );

    if (limitError) {
      console.error('Error checking user limit:', limitError);
      return NextResponse.json(
        { error: 'خطا در بررسی سقف کاربران.' },
        { status: 500 }
      );
    }

    const rawLimit = Array.isArray(limitData) ? limitData[0] : limitData;

    if (!rawLimit || !rawLimit.can_add_user) {
      const maxUsers = rawLimit?.max_users || 5;
      return NextResponse.json(
        {
          error: `به سقف مجاز کاربران (${maxUsers} نفر) رسیده‌اید. برای افزودن کاربر جدید، با مدیر سیستم تماس بگیرید.`,
          code: 'USER_LIMIT_REACHED',
          limit: {
            current: rawLimit?.current_users || 0,
            max: maxUsers,
          },
        },
        { status: 403 }
      );
    }

    // 6. پاکسازی کامل: اگر کاربری با این ایمیل یا ID در auth.users هست
    try {
      // 6-الف: جستجو بر اساس ایمیل
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000,
        page: 1,
      });

      let oldUserByEmail: any = null;
      let currentPage = 1;
      let allUsers: any[] = listData?.users || [];

      oldUserByEmail = allUsers.find(
        (u: any) => u.email?.toLowerCase() === email.toLowerCase()
      );

      while (!oldUserByEmail && allUsers.length >= 1000) {
        currentPage++;
        const { data: nextPageData } = await supabaseAdmin.auth.admin.listUsers({
          perPage: 1000,
          page: currentPage,
        });
        allUsers = nextPageData?.users || [];
        oldUserByEmail = allUsers.find(
          (u: any) => u.email?.toLowerCase() === email.toLowerCase()
        );
        if (allUsers.length < 1000) break;
      }

      if (oldUserByEmail) {
        console.log('🧹 Cleaning up old auth user:', oldUserByEmail.id, oldUserByEmail.email);

        // حذف از public.users
        await supabaseAdmin
          .from('users')
          .delete()
          .eq('id', oldUserByEmail.id);

        // حذف از auth.users
        await supabaseAdmin.auth.admin.deleteUser(oldUserByEmail.id);

        console.log('✅ Old auth user cleaned up');
      }
    } catch (cleanupError) {
      console.error('Cleanup error (non-fatal):', cleanupError);
    }

    // 7. ایجاد کاربر در auth.users
    const { data: newAuthUser, error: createAuthError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
        },
      });

    if (createAuthError || !newAuthUser.user) {
      console.error('Error creating auth user:', createAuthError);
      return NextResponse.json(
        { error: 'خطا در ایجاد کاربر: ' + (createAuthError?.message || 'نامشخص') },
        { status: 500 }
      );
    }

    // 8. 🧹 پاکسازی رکورد orphaned در public.users
    // (اگر ID جدید از قبل در public.users هست — بقایای تست‌های قبلی)
    const { data: orphanedRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', newAuthUser.user.id)
      .maybeSingle();

    if (orphanedRecord) {
      console.log('🧹 Removing orphaned public.users record:', newAuthUser.user.id);
      await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', newAuthUser.user.id);
      console.log('✅ Orphaned record removed');
    }

    // 9. حالا insert در users (باید موفق بشه)
    const { data: newUser, error: insertError } = await supabaseAdmin
    .from('users')
    .insert({
      id: newAuthUser.user.id,
      tenant_id: tenantId,
      full_name,
      phone: phone || null,
      role,
      is_active: true,
      is_super_admin: false,
      permissions: finalPermissions,  // ← جدید
    })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting user record:', insertError);

      // rollback: حذف کاربر auth
      try {
        await supabaseAdmin.auth.admin.deleteUser(newAuthUser.user.id);
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }

      return NextResponse.json(
        { error: 'خطا در ثبت اطلاعات کاربر: ' + insertError.message },
        { status: 500 }
      );
    }

    // 10. لاگ فعالیت
    try {
      await supabaseAdmin.from('activity_logs').insert({
        tenant_id: tenantId,
        user_id: currentUser.id,
        action: 'create_user',
        table_name: 'users',
        record_id: newUser.id,
        metadata: {
          created_email: email,
          created_role: role,
          created_name: full_name,
        },
      });
    } catch (logError) {
      console.error('Error logging activity:', logError);
    }

    return NextResponse.json(
      {
        data: {
          ...newUser,
          email,
        } as User,
        message: 'کاربر با موفقیت اضافه شد.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: error.message || 'خطای غیرمنتظره در سرور' },
      { status: 500 }
    );
  }
}
