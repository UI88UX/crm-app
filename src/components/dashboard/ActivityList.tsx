'use client';

import {
  User,
  UserPlus,
  Calendar,
  ShoppingCart,
  Pencil,
  Trash2,
  Phone,
  Activity as ActivityIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toJalali, formatTime } from '@/lib/util/jalaliDate';
import type { ActivityLog } from '@/types';
import { cn } from '@/lib/utils';

interface ActivityListProps {
  activities: ActivityLog[];
  loading?: boolean;
  title?: string;
  limit?: number;
}

// نقشه action → (آیکون، رنگ، برچسب)
const actionMap: Record<
  string,
  { icon: typeof User; color: string; label: string }
> = {
  create_patient: {
    icon: UserPlus,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/40',
    label: 'بیمار جدید ثبت شد',
  },
  update_patient: {
    icon: Pencil,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40',
    label: 'اطلاعات بیمار ویرایش شد',
  },
  delete_patient: {
    icon: Trash2,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/40',
    label: 'بیمار حذف شد',
  },
  permanent_delete_patient: {
    icon: Trash2,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/40',
    label: 'بیمار برای همیشه حذف شد',
  },
  create_appointment: {
    icon: Calendar,
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/40',
    label: 'نوبت جدید ثبت شد',
  },
  update_appointment: {
    icon: Pencil,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40',
    label: 'نوبت ویرایش شد',
  },
  cancel_appointment: {
    icon: Calendar,
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/40',
    label: 'نوبت لغو شد',
  },
  create_sale: {
    icon: ShoppingCart,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/40',
    label: 'فروش جدید ثبت شد',
  },
  delete_sale: {
    icon: Trash2,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/40',
    label: 'فروش حذف شد',
  },
  create_call_followup: {
    icon: Phone,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40',
    label: 'پیگیری تلفنی ثبت شد',
  },
};

const defaultAction = {
  icon: ActivityIcon,
  color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/40',
  label: 'فعالیت',
};

export function ActivityList({
  activities,
  loading = false,
  title = 'آخرین فعالیت‌ها',
  limit = 5,
}: ActivityListProps) {
  const displayActivities = activities.slice(0, limit);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ActivityIcon className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">فعالیتی ثبت نشده است</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayActivities.map((activity) => {
              const config = actionMap[activity.action] || defaultAction;
              const Icon = config.icon;
              const date = activity.created_at;

              return (
                <div key={activity.id} className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={cn(
                      'h-9 w-9 rounded-full flex items-center justify-center shrink-0',
                      config.color
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {config.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.user_email || 'کاربر ناشناس'}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="text-left shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {toJalali(date) || '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(date) || ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}