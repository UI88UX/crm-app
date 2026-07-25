// src/app/dashboard/users/page.tsx
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import UsersClient from "./page.client";

export default async function UsersPage() {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();
  
  // دریافت اطلاعات کاربر جاری
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">لطفاً وارد حساب کاربری خود شوید</h2>
      </div>
    );
  }

  // دریافت Tenant ID
  const { data: tenantId, error: tenantError } = await supabase
    .rpc('get_current_tenant_id');

  if (tenantError || !tenantId) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">خطا در دریافت اطلاعات مطب</h2>
        <p className="text-gray-600 mt-2">{tenantError?.message || 'Tenant یافت نشد'}</p>
      </div>
    );
  }

  // دریافت لیست کاربران از View جدید
  const { data: users, error: usersError } = await supabaseAdmin
    .from('users_with_auth')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('user_created_at', { ascending: false });

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">خطا در دریافت کاربران</h2>
        <p className="text-gray-600 mt-2">{usersError.message}</p>
      </div>
    );
  }

  // تبدیل داده‌ها به فرمت مناسب
  const formattedUsers = (users || []).map((user: any) => ({
    id: user.id,
    full_name: user.full_name || user.raw_user_meta_data?.full_name || 'کاربر',
    email: user.email || '',
    role: user.role || 'user',
    is_super_admin: user.is_super_admin || false,
    last_sign_in_at: user.last_sign_in_at || null,
    created_at: user.user_created_at || user.auth_created_at,
  }));

  // بررسی اینکه کاربر جاری مدیرکل است
  const { data: currentUserData } = await supabaseAdmin
    .from('users')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  const isSuperAdmin = currentUserData?.is_super_admin || false;

  return (
    <UsersClient 
      users={formattedUsers}
      currentUserId={user.id}
      isSuperAdmin={isSuperAdmin}
    />
  );
}