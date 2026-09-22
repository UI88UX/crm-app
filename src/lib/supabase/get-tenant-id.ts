// src/lib/supabase/get-tenant-id.ts
import { cookies } from 'next/headers';
import { createClient } from './server';
import { createAdminClientStateless } from './admin';

/**
 * دریافت tenant_id با پشتیبانی از impersonate
 */
export async function getEffectiveTenantId(): Promise<string | null> {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // چک impersonate
  const impersonateTenantId = cookieStore.get('impersonate_tenant_id')?.value;

  if (impersonateTenantId) {
    // چک سوپر ادمین بودن
    const supabaseAdmin = createAdminClientStateless();
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (userData?.is_super_admin) {
      return impersonateTenantId;
    }
  }

  // حالت عادی
  const { data: rpcTenantId } = await supabase.rpc('get_current_tenant_id');
  return rpcTenantId || null;
}