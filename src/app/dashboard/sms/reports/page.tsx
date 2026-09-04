// src/app/dashboard/sms/reports/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// ✅ ایمپورت React Query
import { useSmsStats } from "@/hooks/useSmsCampaigns";
import { Button } from "@/components/ui/button";

export default function SmsReportsPage() {
  // ✅ React Query
  const { data: stats, isLoading, isError, error, refetch } = useSmsStats();

  // بارگذاری
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // خطا
  if (isError || !stats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error?.message || "هیچ داده‌ای برای نمایش وجود ندارد"}</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">گزارش‌های پیامکی</h1>
        <p className="text-sm text-muted-foreground mt-1">
          آمار و تحلیل ارسال پیامک‌ها
        </p>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              کل پیامک‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total_sent.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              نرخ تحویل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {stats.delivery_rate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              هزینه کل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats.total_cost.toLocaleString()} تومان
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              این ماه
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {stats.this_month_sent.toLocaleString()}
            </p>
            {stats.last_month_sent > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                ماه قبل: {stats.last_month_sent.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* جزئیات */}
      <Card>
        <CardHeader>
          <CardTitle>جزئیات ارسال</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">موفق</span>
              <span className="font-medium text-green-600">
                {stats.total_delivered.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ناموفق</span>
              <span className="font-medium text-red-600">
                {stats.total_failed.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">مجموع</span>
              <span className="font-medium">{stats.total_sent.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}