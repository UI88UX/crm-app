import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import DashboardClient from "./page.client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();
  
  try {
    // دریافت اطلاعات کاربر جاری
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User error:', userError);
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600">لطفاً وارد حساب کاربری خود شوید</h2>
          <p className="text-gray-600 mt-2">{userError?.message || 'کاربر یافت نشد'}</p>
        </div>
      );
    }

    const userId = user.id;
    let tenantId: string | null = null;

    // ============ مرحله 1: اطمینان از وجود کاربر در جدول users ============
    
    // ابتدا بررسی کن کاربر وجود دارد یا نه
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, tenant_id')
      .eq('id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('Check user error:', checkError);
    }

    if (!existingUser) {
      // کاربر وجود ندارد → INSERT
      console.log('Creating new user...');
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          tenant_id: '4cc6e0e8-715c-42da-88b8-3db126ac6176',
          role: 'admin',
          is_super_admin: true,
          full_name: user.user_metadata?.full_name || 'مدیر سیستم'
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        return (
          <div className="p-8 text-center">
            <h2 className="text-xl font-bold text-red-600">خطا در ایجاد کاربر</h2>
            <p className="text-gray-600 mt-2">{insertError.message}</p>
          </div>
        );
      }
      
      tenantId = '4cc6e0e8-715c-42da-88b8-3db126ac6176';
    } else {
      // کاربر وجود دارد → UPDATE
      console.log('Updating existing user...');
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          tenant_id: '4cc6e0e8-715c-42da-88b8-3db126ac6176',
          is_super_admin: true,
          role: 'admin'
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Update error:', updateError);
        return (
          <div className="p-8 text-center">
            <h2 className="text-xl font-bold text-red-600">خطا در به‌روزرسانی کاربر</h2>
            <p className="text-gray-600 mt-2">{updateError.message}</p>
          </div>
        );
      }
      
      tenantId = existingUser.tenant_id || '4cc6e0e8-715c-42da-88b8-3db126ac6176';
    }

    // اگر tenant_id نداشت، خطا بده
    if (!tenantId) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600">کاربر به هیچ مطبی متصل نیست</h2>
          <p className="text-gray-600 mt-2">لطفاً با مدیر سیستم تماس بگیرید.</p>
        </div>
      );
    }

    // ============ مرحله 2: دریافت آمار ============
    
    // تعداد بیماران (✅ رفع خطای TypeScript)
    const { count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    // تعداد فروش‌ها (✅ رفع خطای TypeScript)
    const { count: totalSales } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    // مجموع درآمد
    const { data: salesData } = await supabase
      .from('sales')
      .select('price')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    const totalRevenue = salesData?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;

    // فعالیت‌های اخیر
    const { data: activitiesRaw } = await supabase
      .from('activity_logs')
      .select(`
        id,
        user_id,
        action,
        table_name,
        created_at,
        auth_users!user_id (email)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10);

    const activities = (activitiesRaw || []).map((item: any) => ({
      ...item,
      user_email: item.auth_users?.email || 'سیستم'
    }));

    // فروش‌های اخیر
    const { data: recentSalesRaw } = await supabase
      .from('sales')
      .select(`
        id,
        hearing_aid_model,
        price,
        sale_date,
        patient:patients (
          first_name,
          last_name
        )
      `)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('sale_date', { ascending: false })
      .limit(5);

    const recentSales = (recentSalesRaw || []).map((sale: any) => ({
      ...sale,
      patient: Array.isArray(sale.patient) ? sale.patient[0] : sale.patient
    }));

    // ✅ استفاده از ?? برای مقداردهی پیش‌فرض
    const stats = {
      total_patients: totalPatients ?? 0,
      total_appointments: 0,
      total_sales: totalSales ?? 0,
      total_revenue: totalRevenue,
      recent_activity_count: activities.length,
      conversion_rate: (totalPatients ?? 0) > 0 
        ? Math.round(((totalSales ?? 0) / (totalPatients ?? 0)) * 100) 
        : 0
    };

    return (
      <DashboardClient
        stats={stats}
        activities={activities}
        recentSales={recentSales}
      />
    );
    
  } catch (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">خطای غیرمنتظره</h2>
        <p className="text-gray-600 mt-2">{(error as Error).message}</p>
      </div>
    );
  }
}
export const revalidate = 60;