'use client';

import { ShoppingCart, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toJalali } from '@/lib/util/jalaliDate';
import type { Sale } from '@/types';
import Link from 'next/link';

interface RecentSalesProps {
  sales: Sale[];
  loading?: boolean;
  title?: string;
  limit?: number;
}

function formatPrice(price: number): string {
  return price.toLocaleString('fa-IR');
}

export function RecentSales({
  sales,
  loading = false,
  title = 'آخرین فروش‌ها',
  limit = 5,
}: RecentSalesProps) {
  const displaySales = sales.slice(0, limit);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
                <div className="h-4 bg-muted rounded w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/sales">مشاهده همه</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {displaySales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">هیچ فروشی ثبت نشده است</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displaySales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center gap-3 pb-4 border-b last:border-0 last:pb-0"
              >
                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {sale.patient
                      ? `${sale.patient.first_name} ${sale.patient.last_name}`
                      : 'بیمار ناشناس'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {sale.hearing_aid_model}
                  </p>
                </div>

                {/* Price + Date */}
                <div className="text-left shrink-0">
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">
                    {formatPrice(sale.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {toJalali(sale.sale_date) || '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}