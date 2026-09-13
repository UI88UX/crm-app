// src/components/call-followups/CallFollowupBell.tsx
"use client";

import { useState } from "react";
import { Phone, Bell, ArrowRight, AlertTriangle, Clock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { useDueSoonCallFollowups } from "@/hooks/useCallFollowups";
import { useCallFollowupStats } from "@/hooks/useCallFollowupStats";
import { toJalaliDisplay } from "@/lib/util/jalaliDate";
import type { CallFollowup } from "@/types";

export function CallFollowupBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { data: followups = [], isLoading } = useDueSoonCallFollowups();
  const { data: stats } = useCallFollowupStats();

  const unreadCount = stats?.unread || 0;

  const handleGoToPatient = (patientId: string) => {
    setOpen(false);
    router.push(`/dashboard/patients/${patientId}`);
  };

  const handleGoToAll = () => {
    setOpen(false);
    router.push("/dashboard/call-followups");
  };

  // فقط ۵ مورد اول برای dropdown
  const previewFollowups = followups.slice(0, 5);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-primary/10"
          aria-label="پیگیری‌های تلفنی"
        >
          <Bell className="w-5 h-5" />

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-96 p-0 overflow-hidden"
        sideOffset={8}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-l from-orange-50 to-transparent dark:from-orange-950/30 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">پیگیری‌های تلفنی</h3>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0
                    ? `${unreadCount} مورد نیاز به اقدام`
                    : 'موردی برای پیگیری نیست'}
                </p>
              </div>
            </div>
          </div>

          {/* آمار کوچک */}
          {stats && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <p className="text-[10px] text-red-600 font-medium">عقب‌افتاده</p>
                <p className="text-lg font-bold text-red-700">{stats.overdue}</p>
              </div>
              <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                <p className="text-[10px] text-orange-600 font-medium">امروز</p>
                <p className="text-lg font-bold text-orange-700">{stats.today}</p>
              </div>
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-[10px] text-blue-600 font-medium">فردا</p>
                <p className="text-lg font-bold text-blue-700">{stats.tomorrow}</p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              در حال بارگذاری...
            </div>
          ) : previewFollowups.length === 0 ? (
            <div className="p-8 text-center">
              <Phone className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-muted-foreground">
                پیگیری نزدیکی وجود ندارد
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                همه‌چیز به‌روز است ✅
              </p>
            </div>
          ) : (
            <div className="p-2">
              {previewFollowups.map((followup) => {
                const isOverdue = new Date(followup.due_date) < new Date();
                return (
                  <button
                    key={followup.id}
                    onClick={() => handleGoToPatient(followup.patient_id)}
                    className="w-full text-right p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      {/* آیکون */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isOverdue
                            ? 'bg-red-100 text-red-600'
                            : 'bg-orange-100 text-orange-600'
                        }`}
                      >
                        {isOverdue ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>

                      {/* محتوا */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">
                            {followup.patient?.first_name} {followup.patient?.last_name}
                          </p>
                          {isOverdue && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                              عقب‌افتاده
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span dir="ltr">{followup.patient?.phone || '---'}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          قرار تماس: {toJalaliDisplay(followup.due_date, "DD MMM - HH:mm")}
                        </p>
                        {followup.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {followup.notes}
                          </p>
                        )}
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center flex-shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {followups.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={handleGoToAll}
              >
                مشاهده همه پیگیری‌ها
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}