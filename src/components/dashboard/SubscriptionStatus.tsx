'use client';

import { Calendar, Users, AlertTriangle, CheckCircle2, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toJalali } from '@/lib/util/jalaliDate';
import type { SubscriptionInfo } from '@/types/dashboard';

interface SubscriptionStatusProps {
  subscription: SubscriptionInfo;
  loading?: boolean;
}

const planLabels: Record<string, string> = {
  free: 'رایگان',
  basic: 'پایه',
  pro: 'حرفه‌ای',
  enterprise: 'سازمانی',
};

const planColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  basic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

export function SubscriptionStatus({
  subscription,
  loading = false,
}: SubscriptionStatusProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">وضعیت اشتراک</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-1/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    tenant_name,
    plan,
    expires_at,
    days_remaining,
    max_users,
    current_users,
    is_expiring_soon,
  } = subscription;

  const userUsagePercent = max_users > 0 ? (current_users / max_users) * 100 : 0;
  const isUserLimitReached = current_users >= max_users;
  const isUserLimitNear = userUsagePercent >= 80 && !isUserLimitReached;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500" />
          وضعیت اشتراک
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* نام مطب + پلن */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">مطب</p>
            <p className="font-semibold truncate">{tenant_name}</p>
          </div>
          <Badge className={cn('shrink-0', planColors[plan] || planColors.basic)}>
            پلن {planLabels[plan] || plan}
          </Badge>
        </div>

        {/* تاریخ انقضا */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div
            className={cn(
              'p-2 rounded-lg shrink-0',
              !expires_at
                ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                : is_expiring_soon
                ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
            )}
          >
            {!expires_at ? (
              <Calendar className="h-4 w-4" />
            ) : is_expiring_soon ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">تاریخ انقضا</p>
            {expires_at ? (
              <>
                <p className="text-sm font-medium">
                  {toJalali(expires_at) || '-'}
                </p>
                {days_remaining !== null && (
                  <p
                    className={cn(
                      'text-xs font-medium mt-0.5',
                      is_expiring_soon ? 'text-red-600' : 'text-green-600'
                    )}
                  >
                    {days_remaining > 0
                      ? `${days_remaining} روز باقی‌مانده`
                      : 'منقضی شده'}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">
                بدون محدودیت
              </p>
            )}
          </div>
        </div>

        {/* تعداد کاربران */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">کاربران فعال</span>
            </div>
            <span
              className={cn(
                'text-sm font-medium',
                isUserLimitReached
                  ? 'text-red-600'
                  : isUserLimitNear
                  ? 'text-orange-600'
                  : 'text-foreground'
              )}
            >
              {current_users} / {max_users}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isUserLimitReached
                  ? 'bg-red-500'
                  : isUserLimitNear
                  ? 'bg-orange-500'
                  : 'bg-primary'
              )}
              style={{ width: `${Math.min(userUsagePercent, 100)}%` }}
            />
          </div>

          {isUserLimitReached && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              به سقف مجاز کاربران رسیده‌اید
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}