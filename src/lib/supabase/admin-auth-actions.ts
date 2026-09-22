// src/lib/supabase/admin-auth-actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClientStateless } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

/**
 * لاگین اختصاصی سوپر ادمین
 * فقط کاربرانی که is_super_admin = true هستن می‌تونن وارد بشن
 */
export async function adminLogin(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'ایمیل و رمز عبور الزامی است.' };
  }

  // ۱. بررسی: آیا این ایمیل سوپر ادمین است؟
  const supabaseAdmin = createAdminClientStateless();

  const { data: superAdminUser, error: checkError } = await supabaseAdmin
    .from('users')
    .select('id, is_super_admin, is_active')
    .eq('is_super_admin', true)
    .eq('is_active', true)
    .filter('id', 'in', `(SELECT id FROM auth.users WHERE email = '${email.replace(/'/g, "''")}')`)
    .maybeSingle();

  // ⚠️ مطمئن‌تر: با email از auth.users بگردیم
  const { data: authUser } = await supabaseAdmin.auth.admin.listUsers();
  const matchingAuthUser = authUser?.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!matchingAuthUser) {
    return { error: 'ایمیل یا رمز عبور اشتباه است.' };
  }

  // ۲. بررسی is_super_admin
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('is_super_admin, is_active')
    .eq('id', matchingAuthUser.id)
    .single();

  if (!userData) {
    return { error: 'کاربر یافت نشد.' };
  }

  if (!userData.is_super_admin) {
    return {
      error: 'شما دسترسی به پنل مدیریت را ندارید.',
      code: 'NOT_SUPER_ADMIN',
    };
  }

  if (!userData.is_active) {
    return {
      error: 'حساب کاربری شما غیرفعال است.',
      code: 'ACCOUNT_DISABLED',
    };
  }

  // ۳. حالا لاگین کن
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    return { error: 'ایمیل یا رمز عبور اشتباه است.' };
  }

  revalidatePath('/', 'layout');
  redirect('/admin/tenants');
}

/**
 * خروج از پنل ادمین
 */
export async function adminLogout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}