// src/components/call-followups/UpcomingCallFollowupsAlert.tsx
"use client";

import { useState } from "react";
import {
  Bell,
  Phone,
  ChevronDown,
  User,
  X,
  Clock,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import moment from "moment-jalaali";
import { useDueSoonCallFollowups } from "@/hooks/useCallFollowups";
import { useRouter } from "next/navigation";
import { toJalaliDisplay } from "@/lib/util/jalaliDate";
import type { CallFollowup } from "@/types";

export function UpcomingCallFollowupsAlert() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const {
    data: followups = [],
    isLoading,
    error,
  } = useDueSoonCallFollowups();

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const visibleFollowups = followups.filter((f) => !dismissedIds.has(f.id));

  if (isLoading) {
    return (
      <Card className="p-4 border-orange-200 bg-orange-50/50 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-orange-200 rounded w-1/3" />
            <div className="h-3 bg-orange-100 rounded w-2/3" />
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return null; // خطا رو سایلنت نشون می‌دیم تا UX خراب نشه
  }

  if (visibleFollowups.length === 0) {
    return null;
  }

  // دسته‌بندی
  const now = new Date();
  const overdueFollowups = visibleFollowups.filter(
    (f) => new Date(f.due_date) < now
  );
  const todayFollowups = visibleFollowups.filter((f) => {
    const due = new Date(f.due_date);
    return (
      due >= now &&
      due.toDateString() === now.toDateString()
    );
  });
  const tomorrowFollowups = visibleFollowups.filter((f) => {
    const due = new Date(f.due_date);
    const tomorrow = new Date(Date.now() + 86400000);
    return due.toDateString() === tomorrow.toDateString();
  });

  const FollowupRow = ({
    followup,
    variant,
  }: {
    followup: CallFollowup;
    variant: 'overdue' | 'today' | 'tomorrow';
  }) => {
    const variantConfig = {
      overdue: {
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-300',
        badge: 'bg-red-100 text-red-700',
        hover: 'hover:bg-red-100/50',
      },
      today: {
        bg: 'bg-orange-50 dark:bg-orange-950/30',
        border: 'border-orange-300',
        badge: 'bg-orange-100 text-orange-700',
        hover: 'hover:bg-orange-100/50',
      },
      tomorrow: {
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-700',
        hover: 'hover:bg-blue-100/50',
      },
    };

    const c = variantConfig[variant];

    return (
      <div
        className={`group flex items-center gap-3 p-2.5 rounded-lg ${c.hover} transition-colors cursor-pointer border ${c.border} ${c.bg}`}
        onClick={() => router.push(`/dashboard/patients/${followup.patient_id}`)}
      >
        {/* Time / Overdue */}
        <div className="flex-shrink-0 text-center min-w-[60px]">
          {variant === 'overdue' ? (
            <>
              <div className="text-xs font-bold text-red-700">عقب‌افتاده</div>
              <div className="text-[10px] text-red-500 mt-0.5">
                {toJalaliDisplay(followup.due_date, "DD MMM")}
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-bold text-gray-800">
                {moment(followup.due_date).format("HH:mm")}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {moment(followup.due_date).fromNow()}
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div className={`w-0.5 self-stretch rounded-full ${
          variant === 'overdue' ? 'bg-red-400' :
          variant === 'today' ? 'bg-orange-400' : 'bg-blue-400'
        }`} />

        {/* Patient Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
              variant === 'overdue' ? 'bg-red-500' :
              variant === 'today' ? 'bg-orange-500' : 'bg-blue-500'
            }`}>
              {followup.patient?.first_name?.[0] || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {followup.patient?.first_name} {followup.patient?.last_name}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span dir="ltr">{followup.patient?.phone || '---'}</span>
              </p>
            </div>
          </div>
          {followup.notes && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
              {followup.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={`tel:${followup.patient?.phone}`}
            onClick={(e) => e.stopPropagation()}
            data-loading="false"
            className="p-1.5 rounded-full hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors"
            title="تماس"
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss(followup.id);
            }}
            data-loading='false'
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            title="رد کردن"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const totalUrgent = overdueFollowups.length + todayFollowups.length;

  return (
    <Card className="overflow-hidden border-2 border-orange-300 dark:border-orange-800 shadow-lg">
      {/* Header */}
      <div
        className="p-4 cursor-pointer select-none flex items-center gap-3 bg-gradient-to-l from-orange-100 to-transparent dark:from-orange-950/40"
        onClick={() => setIsExpanded(!isExpanded)}
        data-loading="false"
      >
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md">
            <Phone className="w-5 h-5" />
          </div>
          {totalUrgent > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold text-white">
              {totalUrgent}
            </span>
          )}
        </div>

        <div className="flex-1">
          <h4 className="font-bold text-gray-800 dark:text-gray-100">
            پیگیری‌های تلفنی نزدیک
          </h4>
          <p className="text-xs text-gray-600 mt-0.5">
            {overdueFollowups.length > 0 && `${overdueFollowups.length} عقب‌افتاده`}
            {overdueFollowups.length > 0 && todayFollowups.length > 0 && " • "}
            {todayFollowups.length > 0 && `${todayFollowups.length} امروز`}
            {(overdueFollowups.length > 0 || todayFollowups.length > 0) && tomorrowFollowups.length > 0 && " • "}
            {tomorrowFollowups.length > 0 && `${tomorrowFollowups.length} فردا`}
          </p>
        </div>

        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-orange-200 dark:border-orange-900/40">
          <div className="p-3 space-y-4 max-h-[500px] overflow-y-auto">
            {/* عقب‌افتاده */}
            {overdueFollowups.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    عقب‌افتاده
                  </span>
                  <Badge variant="outline" className="text-[10px] border-red-200 text-red-600">
                    {overdueFollowups.length}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  {overdueFollowups.map((f) => (
                    <FollowupRow key={f.id} followup={f} variant="overdue" />
                  ))}
                </div>
              </div>
            )}

            {/* امروز */}
            {todayFollowups.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                    <Calendar className="w-3.5 h-3.5" />
                    امروز
                  </span>
                  <Badge variant="outline" className="text-[10px] border-orange-200 text-orange-600">
                    {todayFollowups.length}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  {todayFollowups.map((f) => (
                    <FollowupRow key={f.id} followup={f} variant="today" />
                  ))}
                </div>
              </div>
            )}

            {/* فردا */}
            {tomorrowFollowups.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    <Calendar className="w-3.5 h-3.5" />
                    فردا
                  </span>
                  <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600">
                    {tomorrowFollowups.length}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  {tomorrowFollowups.map((f) => (
                    <FollowupRow key={f.id} followup={f} variant="tomorrow" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}