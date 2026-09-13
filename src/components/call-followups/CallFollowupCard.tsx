// src/components/call-followups/CallFollowupCard.tsx
"use client";

import { useState } from "react";
import {
  Phone,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CallResultBadge } from "./CallResultBadge";
import { CallFollowupStatusBadge } from "./CallFollowupStatusBadge";
import { toJalaliDisplay, formatJalaliDateTime } from "@/lib/util/jalaliDate";
import type { CallFollowup } from "@/types";
import { isCallFollowupDue } from "@/lib/validations/call-followup";
import { useDeleteCallFollowup, useCancelCallFollowup } from "@/hooks/useCallFollowups";

interface CallFollowupCardProps {
  followup: CallFollowup;
  onComplete?: (followup: CallFollowup) => void;
  onCancel?: (followup: CallFollowup) => void;
  onEdit?: (followup: CallFollowup) => void;
  compact?: boolean; // ← حالت فشرده برای تاریخچه
}

export function CallFollowupCard({
  followup,
  onComplete,
  onEdit,
  compact = false,
}: CallFollowupCardProps) {
  const isPending =
    followup.status === 'pending' || followup.status === 'rescheduled';
  const isDue = isCallFollowupDue(followup.due_date, followup.completed_at);
  const deleteFollowup = useDeleteCallFollowup();
  const cancelFollowup = useCancelCallFollowup();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    // در حالت compact از confirm ساده استفاده کن
    if (compact) {
      if (confirm('آیا از حذف این پیگیری اطمینان دارید؟')) {
        deleteFollowup.mutate(followup.id);
      }
      return;
    }

    // در حالت عادی، دو مرحله‌ای
    if (showDeleteConfirm) {
      deleteFollowup.mutate(followup.id, {
        onSuccess: () => setShowDeleteConfirm(false),
        onError: () => setShowDeleteConfirm(false),
      });
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  // حالت فشرده برای تاریخچه
  if (compact) {
    return (
      <div className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-md transition-colors text-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <CallFollowupStatusBadge status={followup.status} size="sm" />
          {followup.result && (
            <CallResultBadge result={followup.result} size="sm" />
          )}
          <span className="text-xs text-muted-foreground truncate">
            قرار: {toJalaliDisplay(followup.due_date, "DD MMM YY - HH:mm")}
          </span>
          {followup.call_notes && (
            <span className="text-xs text-muted-foreground truncate">
              • {followup.call_notes}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={deleteFollowup.isPending}
          className={`h-7 px-2 text-xs ${showDeleteConfirm
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'text-gray-400 hover:text-red-600'
            }`}
          title={showDeleteConfirm ? 'برای تایید دوباره کلیک کنید' : 'حذف'}
        >
          {deleteFollowup.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    );
  }

  // حالت عادی
  return (
    <Card
      className={`transition-all ${isDue && isPending
        ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20'
        : ''
        }`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* اطلاعات */}
          <div className="flex-1 space-y-2">
            {/* ✅ نام بیمار + تلفن */}
            {followup.patient && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-base">
                    {followup.patient.first_name} {followup.patient.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span dir="ltr">{followup.patient.phone || '---'}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Badgeها */}
            <div className="flex items-center gap-2 flex-wrap">
              <CallFollowupStatusBadge status={followup.status} size="sm" />
              {followup.result && (
                <CallResultBadge result={followup.result} size="sm" />
              )}
              {isDue && isPending && (
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold animate-pulse">
                  سررسید شده
                </span>
              )}
            </div>

            {/* تاریخ و زمان */}
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="text-gray-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-gray-500">قرار تماس:</span>
                <strong>
                  {toJalaliDisplay(followup.due_date, "dddd DD MMMM")}
                </strong>
                <span className="text-blue-600 font-medium">
                  ساعت {toJalaliDisplay(followup.due_date, "HH:mm")}
                </span>
              </span>

              {followup.completed_at && (
                <span className="text-gray-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-gray-500">تماس گرفته شد:</span>
                  <strong>{formatJalaliDateTime(followup.completed_at)}</strong>
                </span>
              )}
            </div>

            {followup.notes && (
              <p className="text-sm text-gray-600 flex items-start gap-1.5">
                <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{followup.notes}</span>
              </p>
            )}

            {followup.call_notes && (
              <div className="bg-muted/50 p-2 rounded-md">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  یادداشت مکالمه:
                </p>
                <p className="text-sm">{followup.call_notes}</p>
              </div>
            )}

            {followup.next_followup_date && (
              <p className="text-xs text-blue-600 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                پیگیری بعدی:{' '}
                {toJalaliDisplay(followup.next_followup_date, "DD MMM YYYY - HH:mm")}
              </p>
            )}
          </div>

          {/* دکمه‌ها */}
          <div className="flex gap-2 mt-2 md:mt-0 flex-shrink-0 items-center">
            {isPending && onComplete && (
              <Button
                size="sm"
                onClick={() => onComplete(followup)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 ml-1" />
                ثبت نتیجه
              </Button>
            )}
            {isPending && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm('آیا از لغو این قرار تماس اطمینان دارید؟')) {
                    cancelFollowup.mutate(followup.id);
                  }
                }}
                data-loading="false"
                disabled={cancelFollowup.isPending && cancelFollowup.variables === followup.id}
                className="min-w-[80px]"
              >
                {cancelFollowup.isPending && cancelFollowup.variables === followup.id ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                    در حال لغو...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 ml-1" />
                    لغو
                  </>
                )}
              </Button>
            )}
            {/* منوی حذف - برای همه‌ی کارت‌ها */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={deleteFollowup.isPending}
              className={`${showDeleteConfirm
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'text-gray-400 hover:text-red-600'
                }`}
              title={showDeleteConfirm ? 'برای تایید دوباره کلیک کنید' : 'حذف'}
            >
              {deleteFollowup.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {showDeleteConfirm && <span className="mr-1 text-xs">تایید؟</span>}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}