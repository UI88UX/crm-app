'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, ShoppingCart, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MonthlySalesStat } from '@/types/dashboard';

interface SalesChartProps {
  data: MonthlySalesStat[];
  loading?: boolean;
}

// ============================================
// نام ماه‌های شمسی (بدون نیاز به moment)
// ============================================
const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

/**
 * تبدیل YYYY-MM میلادی به نام ماه شمسی
 * مثال: 2025-05 → مرداد ۱۴۰۴
 *
 * الگوریتم: از Intl.DateTimeFormat با calendar persian استفاده می‌کنیم
 * که خودش دقیقاً تبدیل می‌کنه.
 */
function toJalaliMonthLabel(monthLabel: string): string {
  try {
    const [year, month] = monthLabel.split('-').map(Number);
    if (!year || !month) return monthLabel;

    // تاریخ میلادی اولین روز ماه
    const date = new Date(year, month - 1, 15);

    // استفاده از Intl برای تقویم شمسی
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      month: 'long',
      year: 'numeric',
    });

    // خروجی مثل: "مرداد ۱۴۰۴"
    const formatted = formatter.format(date);

    // حذف فاصله اضافی و برگرداندن
    return formatted.replace(/\u200c/g, '').trim();
  } catch {
    return monthLabel;
  }
}

/**
 * فرمت اعداد به فارسی
 */
function toPersianNumber(num: number): string {
  return num.toLocaleString('fa-IR');
}

/**
 * فرمت قیمت به صورت خلاصه
 * مثال: 45000000 → ۴۵ میلیون
 */
function formatCompactPrice(price: number): string {
  if (price >= 1_000_000_000) {
    const value = (price / 1_000_000_000).toFixed(1);
    return `${toPersianNumber(parseFloat(value))} میلیارد`;
  }
  if (price >= 1_000_000) {
    const value = (price / 1_000_000).toFixed(0);
    return `${toPersianNumber(parseInt(value))} میلیون`;
  }
  if (price >= 1_000) {
    const value = (price / 1_000).toFixed(0);
    return `${toPersianNumber(parseInt(value))} هزار`;
  }
  return toPersianNumber(price);
}

// ============================================
// Tooltip سفارشی
// ============================================
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as MonthlySalesStat;

  return (
    <div
      className="bg-background border rounded-lg shadow-lg p-3 text-sm"
      dir="rtl"
    >
      <p className="font-semibold mb-2 text-foreground">
        {toJalaliMonthLabel(data.month_label)}
      </p>
      <div className="space-y-1">
        <p className="text-muted-foreground flex items-center gap-1">
          <ShoppingCart className="h-3 w-3" />
          تعداد فروش:{' '}
          <span className="font-medium text-foreground">
            {toPersianNumber(data.sales_count)}
          </span>
        </p>
        <p className="text-muted-foreground flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          درآمد:{' '}
          <span className="font-medium text-foreground">
            {toPersianNumber(data.total_revenue)} تومان
          </span>
        </p>
      </div>
    </div>
  );
}

export function SalesChart({ data, loading = false }: SalesChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">نمودار فروش</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-[250px] bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.total_revenue, 0);
  const totalSales = data.reduce((sum, item) => sum + item.sales_count, 0);

  const chartData = data.map((item) => ({
    ...item,
    displayLabel: toJalaliMonthLabel(item.month_label),
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground shrink-0" />
            نمودار فروش ۶ ماه اخیر
          </CardTitle>
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1 text-muted-foreground">
              <ShoppingCart className="h-3 w-3" />
              <span>{toPersianNumber(totalSales)} فروش</span>
            </div>
            <div className="font-semibold text-green-600 dark:text-green-400">
              {formatCompactPrice(totalRevenue)} تومان
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[280px] sm:h-[300px] flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              داده‌ای برای نمایش وجود ندارد
            </p>
          </div>
        ) : (
          <div className="w-full h-[280px] sm:h-[300px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                  vertical={false}
                />
                <XAxis
                  dataKey="displayLabel"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  tickMargin={8}
                  className="text-muted-foreground"
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  tickFormatter={(v) => formatCompactPrice(v)}
                  className="text-muted-foreground"
                  width={65}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: 'hsl(var(--muted-foreground))',
                    strokeWidth: 1,
                    strokeDasharray: '3 3',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total_revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{
                    r: 4,
                    strokeWidth: 2,
                    fill: 'hsl(var(--background))',
                    stroke: 'hsl(var(--primary))',
                  }}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    fill: 'hsl(var(--primary))',
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}