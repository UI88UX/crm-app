// src/app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  DashboardData,
  TenantStats,
  MonthlySalesStat,
  SubscriptionInfo,
} from '@/types/dashboard';
import type { Sale, ActivityLog } from '@/types';

export const dynamic = 'force-dynamic';

// ============================================
// GET /api/dashboard/stats
// دریافت تمام داده‌های داشبورد در یک درخواست
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

    // 3. اجرای موازی همه کوئری‌ها
    const [
      statsResult,
      monthlySalesResult,
      recentSalesResult,
      recentActivitiesResult,
      tenantResult,
      usersCountResult,
    ] = await Promise.all([
      // آمار کلی
      supabase.rpc('get_current_tenant_stats'),

      // فروش ماهانه (۶ ماه اخیر)
      supabase.rpc('get_monthly_sales_stats', { p_months: 6 }),

      // ۵ فروش آخر
      supabase
        .from('sales')
        .select(`
          *,
          patient:patients(id, first_name, last_name, national_code, phone)
        `)
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('sale_date', { ascending: false })
        .limit(5),

      // ۵ فعالیت آخر
      supabase.rpc('get_recent_activities', { p_limit: 5 }),

      // اطلاعات Tenant (برای وضعیت اشتراک)
      supabase
        .from('tenants')
        .select('id, name, settings, is_active')
        .eq('id', tenantId)
        .single(),

      // تعداد کاربران فعال
      createAdminClient()
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_active', true),
    ]);

    // 4. بررسی خطاها
    console.log('=== DEBUG DASHBOARD API ===');
    console.log('tenantId:', tenantId);
    console.log('tenantResult.error:', tenantResult.error);
    console.log('tenantResult.data:', tenantResult.data);
    console.log('statsResult.error:', statsResult.error);
    console.log('statsResult.data:', statsResult.data);
    console.log('usersCountResult.count:', usersCountResult.count);
    console.log('=== END DEBUG ===');

    if (statsResult.error) {
      console.error('Error fetching stats:', statsResult.error);
      return NextResponse.json(
        { error: 'خطا در دریافت آمار: ' + statsResult.error.message },
        { status: 500 }
      );
    }

    if (monthlySalesResult.error) {
      console.error('Error fetching monthly sales:', monthlySalesResult.error);
      // خطای غیرحیاتی — با آرایه خالی ادامه می‌دهیم
    }

    if (tenantResult.error || !tenantResult.data) {
      return NextResponse.json(
        { error: 'اطلاعات مطب یافت نشد.' },
        { status: 404 }
      );
    }

    // 5. پردازش آمار (RPC خروجی آرایه برمی‌گرداند)
    const rawStats = Array.isArray(statsResult.data)
      ? statsResult.data[0]
      : statsResult.data;

    const stats: TenantStats = rawStats
      ? {
        total_patients: Number(rawStats.total_patients) || 0,
        total_appointments: Number(rawStats.total_appointments) || 0,
        total_sales: Number(rawStats.total_sales) || 0,
        total_revenue: Number(rawStats.total_revenue) || 0,
        recent_activity_count: Number(rawStats.recent_activity_count) || 0,
        conversion_rate: Number(rawStats.conversion_rate) || 0,
      }
      : {
        total_patients: 0,
        total_appointments: 0,
        total_sales: 0,
        total_revenue: 0,
        recent_activity_count: 0,
        conversion_rate: 0,
      };

    // 6. پردازش فروش ماهانه
    const monthly_sales: MonthlySalesStat[] = (monthlySalesResult.data || []).map(
      (item: any) => ({
        month_start: item.month_start,
        month_label: item.month_label,
        sales_count: Number(item.sales_count) || 0,
        total_revenue: Number(item.total_revenue) || 0,
      })
    );

    // 7. پردازش فروش‌های اخیر
    const recent_sales = (recentSalesResult.data || []) as Sale[];

    // 8. پردازش فعالیت‌های اخیر
    const recent_activities = (recentActivitiesResult.data || []) as ActivityLog[];

    // 9. پردازش وضعیت اشتراک (با fallback برای settings خالی)
    const tenant = tenantResult.data;
    const settings = (tenant.settings || {}) as Record<string, any>;

    const expires_at: string | null = settings.expires_at || null;
    const plan: string = settings.plan || 'basic';
    const max_users: number = settings.max_users || 5;
    const current_users: number = usersCountResult.count || 0;

    let days_remaining: number | null = null;
    let is_expiring_soon = false;

    if (expires_at) {
      const expiryDate = new Date(expires_at);
      const today = new Date();
      const diffMs = expiryDate.getTime() - today.getTime();
      days_remaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      is_expiring_soon = days_remaining <= 30 && days_remaining >= 0;
    }

    const subscription: SubscriptionInfo = {
      tenant_name: tenant.name,
      plan,
      expires_at,
      days_remaining,
      max_users,
      current_users,
      is_expiring_soon,
    };

    // 10. خروجی نهایی
    const dashboardData: DashboardData = {
      stats,
      monthly_sales,
      recent_sales,
      recent_activities,
      subscription,
    };

    return NextResponse.json({ data: dashboardData });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: error.message || 'خطای غیرمنتظره در سرور' },
      { status: 500 }
    );
  }
}