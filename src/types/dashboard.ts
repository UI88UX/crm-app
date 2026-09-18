// src/types/dashboard.ts
import type { Sale, ActivityLog } from '@/types';

// ============================================
// Dashboard Stats Types
// ============================================

/**
 * خروجی تابع RPC: get_current_tenant_stats
 */
export interface TenantStats {
  total_patients: number;
  total_appointments: number; // تعداد نوبت‌های امروز
  total_sales: number;
  total_revenue: number;
  recent_activity_count: number;
  conversion_rate: number;
}

/**
 * خروجی تابع RPC: get_monthly_sales_stats
 */
export interface MonthlySalesStat {
  month_start: string;      // YYYY-MM-DD
  month_label: string;      // YYYY-MM
  sales_count: number;
  total_revenue: number;
}

/**
 * اطلاعات اشتراک (از settings جدول tenants)
 */
export interface SubscriptionInfo {
  tenant_name: string;
  plan: string;              // free | basic | pro | enterprise
  expires_at: string | null; // ISO date
  days_remaining: number | null;
  max_users: number;
  current_users: number;
  is_expiring_soon: boolean; // کمتر از ۳۰ روز
}

/**
 * داده کامل داشبورد (خروجی API Route)
 */
export interface DashboardData {
  stats: TenantStats;
  monthly_sales: MonthlySalesStat[];
  recent_sales: Sale[];
  recent_activities: ActivityLog[];
  subscription: SubscriptionInfo;
}