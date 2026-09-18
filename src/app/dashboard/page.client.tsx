// src/app/dashboard/page.client.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  ShoppingBag,
  TrendingUp,
  Plus,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UpcomingCallFollowupsAlert } from '@/components/call-followups/UpcomingCallFollowupsAlert';

import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentSales } from '@/components/dashboard/RecentSales';
import { ActivityList } from '@/components/dashboard/ActivityList';
import { SubscriptionStatus } from '@/components/dashboard/SubscriptionStatus';
import { SalesChart } from '@/components/dashboard/SalesChart';

import { useDashboardStats } from '@/hooks/useDashboardStats';

export default function DashboardClient() {
  const [mounted, setMounted] = useState(false);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useDashboardStats();

  useEffect(() => {
    setMounted(true);
  }, []);

  // جلوگیری از Hydration Mismatch
  if (!mounted) return null;

  // حالت خطا
  if (isError) {
    return (
      <div className="p-6" dir="rtl">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <AlertCircle className="h-10 w-10 text-red-600" />
            <h2 className="text-lg font-bold text-red-700 dark:text-red-400">
              خطا در دریافت اطلاعات
            </h2>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'خطای نامشخص'}
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 ml-2" />
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = data?.stats;
  const subscription = data?.subscription;
  const monthlySales = data?.monthly_sales || [];
  const recentSales = data?.recent_sales || [];
  const recentActivities = data?.recent_activities || [];

  return (
    <div className="space-y-6" dir="rtl">
      {/* ============ هدر ============ */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">داشبورد</h1>
          <p className="text-muted-foreground mt-1">خلاصه وضعیت مطب شما</p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && !isLoading && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              در حال بروزرسانی...
            </span>
          )}
          <Link href="/dashboard/patients/new">
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              بیمار جدید
            </Button>
          </Link>
        </div>
      </div>

      {/* ============ هشدار پیگیری‌های تلفنی ============ */}
      <UpcomingCallFollowupsAlert />

      {/* ============ کارت‌های آماری ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="کل بیماران فعال"
          value={stats?.total_patients || 0}
          description="بیماران ثبت‌شده در سیستم"
          icon={Users}
          color="blue"
          loading={isLoading}
        />
        <StatsCard
          title="نوبت‌های امروز"
          value={stats?.total_appointments || 0}
          description="نوبت‌های فعال امروز"
          icon={Calendar}
          color="purple"
          loading={isLoading}
        />
        <StatsCard
          title="فروش این ماه"
          value={monthlySales[monthlySales.length - 1]?.sales_count || 0}
          description="تعداد فروش در ماه جاری"
          icon={ShoppingBag}
          color="green"
          loading={isLoading}
        />
        <StatsCard
          title="درآمد این ماه"
          value={
            monthlySales[monthlySales.length - 1]
              ? `${monthlySales[
                monthlySales.length - 1
              ].total_revenue.toLocaleString('fa-IR')} تومان`
              : '۰ تومان'
          }
          description="مجموع درآمد ماه جاری"
          icon={TrendingUp}
          color="orange"
          loading={isLoading}
        />
      </div>

      {/* ============ نمودار فروش + وضعیت اشتراک ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 order-2 lg:order-1">
          <SalesChart data={monthlySales} loading={isLoading} />
        </div>
        <div className="order-1 lg:order-2">
          {subscription ? (
            <SubscriptionStatus subscription={subscription} loading={isLoading} />
          ) : (
            <SubscriptionStatus
              subscription={{
                tenant_name: '-',
                plan: 'basic',
                expires_at: null,
                days_remaining: null,
                max_users: 5,
                current_users: 0,
                is_expiring_soon: false,
              }}
              loading={isLoading}
            />
          )}
        </div>
      </div>

      {/* ============ فروش‌های اخیر + فعالیت‌ها ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentSales sales={recentSales} loading={isLoading} />
        <ActivityList activities={recentActivities} loading={isLoading} />
      </div>
    </div>
  );
}