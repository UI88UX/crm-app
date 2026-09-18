// src/app/dashboard/users/page.tsx
'use client';

import { useState } from 'react';
import {
  Plus,
  Users as UsersIcon,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUsers } from '@/hooks/useUsers';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { UserForm } from '@/components/users/userForm';
import { UserTable } from '@/components/users/UserTable';
import { cn } from '@/lib/utils';
import { toPersianNumber } from '@/lib/util/jalaliDate';

export default function UsersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data, isLoading, isError, error, refetch, isFetching } = useUsers();
  const { data: currentUser } = useCurrentUser();

  // ============ Error State ============
  if (isError) {
    return (
      <div className="p-4 sm:p-6" dir="rtl">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <AlertCircle className="h-10 w-10 text-red-600" />
            <h2 className="text-lg font-bold text-red-700 dark:text-red-400">
              خطا در دریافت کاربران
            </h2>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'خطای نامشخص'}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 ml-2" />
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const users = data?.users || [];
  const limit = data?.limit;

  const isAtLimit = limit?.is_at_limit ?? false;
  const canAddUser = limit?.can_add_user ?? true;
  const usagePercent =
    limit && limit.max_users > 0
      ? (limit.current_users / limit.max_users) * 100
      : 0;

  const isNearLimit = usagePercent >= 80 && !isAtLimit;

  return (
    <div className="p-4 sm:p-6 space-y-6" dir="rtl">
      {/* ============ هدر ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-muted-foreground" />
            مدیریت کاربران
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            کاربران مطب خود را مدیریت کنید
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && !isLoading && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              در حال بروزرسانی...
            </span>
          )}
          <Button
            onClick={() => setIsFormOpen(true)}
            disabled={!canAddUser || isLoading}
            title={
              !canAddUser
                ? 'به سقف مجاز کاربران رسیده‌اید'
                : 'افزودن کاربر جدید'
            }
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 ml-2" />
            افزودن کاربر
          </Button>
        </div>
      </div>

      {/* ============ کارت محدودیت ============ */}
      {limit && (
        <Card
          className={cn(
            isAtLimit
              ? 'border-red-200 bg-red-50 dark:bg-red-950/20'
              : isNearLimit
              ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/20'
              : ''
          )}
        >
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* متن */}
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'p-2 rounded-lg shrink-0',
                    isAtLimit
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                      : isNearLimit
                      ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400'
                      : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                  )}
                >
                  {isAtLimit || isNearLimit ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <UsersIcon className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {isAtLimit
                      ? 'به سقف مجاز کاربران رسیده‌اید'
                      : isNearLimit
                      ? 'در حال نزدیک شدن به سقف کاربران'
                      : 'ظرفیت کاربران'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {isAtLimit
                      ? 'برای افزودن کاربر جدید، با مدیر سیستم تماس بگیرید'
                      : `${toPersianNumber(limit.remaining)} کاربر دیگر می‌توانید اضافه کنید`}
                  </p>
                </div>
              </div>

              {/* Counter */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center">
                  <p
                    className={cn(
                      'text-2xl font-bold',
                      isAtLimit
                        ? 'text-red-600'
                        : isNearLimit
                        ? 'text-orange-600'
                        : 'text-foreground'
                    )}
                  >
                    {toPersianNumber(limit.current_users)}
                    <span className="text-muted-foreground font-normal text-base mx-1">
                      /
                    </span>
                    {toPersianNumber(limit.max_users)}
                  </p>
                  <p className="text-xs text-muted-foreground">کاربر فعال</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isAtLimit
                    ? 'bg-red-500'
                    : isNearLimit
                    ? 'bg-orange-500'
                    : 'bg-primary'
                )}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ جدول/کارت کاربران ============ */}
      <UserTable
        users={users}
        currentUserId={currentUser?.id}
        loading={isLoading}
      />

      {/* ============ فرم ایجاد کاربر ============ */}
      <UserForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        disabled={!canAddUser}
      />
    </div>
  );
}