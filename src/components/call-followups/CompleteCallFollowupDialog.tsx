// src/components/call-followups/CompleteCallFollowupDialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { toast } from "sonner";

import { CALL_RESULTS, type CallResult, type CallFollowup } from "@/types";
import { useCompleteCallFollowup } from "@/hooks/useCallFollowups";

interface CompleteCallFollowupDialogProps {
  followup: CallFollowup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CompleteCallFollowupDialog({
  followup,
  open,
  onOpenChange,
  onSuccess,
}: CompleteCallFollowupDialogProps) {
  const [selectedResult, setSelectedResult] = useState<CallResult | null>(null);
  const [callNotes, setCallNotes] = useState("");
  const [nextDate, setNextDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completeCallFollowup = useCompleteCallFollowup();

  const isCallback = selectedResult === 'callback';

  // reset هنگام باز شدن
  useEffect(() => {
    if (open) {
      setSelectedResult(null);
      setCallNotes("");
      setNextDate(null);
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    setError(null);

    if (!followup) return;

    if (!selectedResult) {
      setError("لطفاً نتیجه مکالمه را انتخاب کنید");
      return;
    }

    if (isCallback && !nextDate) {
      setError("برای تماس مجدد، تاریخ پیگیری بعدی الزامی است");
      return;
    }

    if (nextDate && nextDate <= new Date()) {
      setError("تاریخ پیگیری بعدی باید در آینده باشد");
      return;
    }

    try {
      await completeCallFollowup.mutateAsync({
        id: followup.id,
        result: selectedResult,
        call_notes: callNotes.trim() || null,
        next_followup_date: nextDate ? nextDate.toISOString() : null,
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "خطا در ثبت نتیجه");
    }
  };

  if (!followup) return null;

  const patientName = followup.patient
    ? `${followup.patient.first_name} ${followup.patient.last_name}`
    : "بیمار";

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!completeCallFollowup.isPending) onOpenChange(val);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            ثبت نتیجه مکالمه
          </DialogTitle>
          <DialogDescription>
            نتیجه تماس با <strong>{patientName}</strong> را ثبت کنید
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* انتخاب نتیجه */}
          <div className="space-y-3">
            <Label className="font-semibold flex items-center gap-2">
              نتیجه مکالمه
              <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CALL_RESULTS.map((option) => {
                const isSelected = selectedResult === option.value;
                const colorClasses: Record<string, string> = {
                  green: isSelected
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                    : 'border-gray-200 hover:border-green-300',
                  red: isSelected
                    ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                    : 'border-gray-200 hover:border-red-300',
                  gray: isSelected
                    ? 'border-gray-500 bg-gray-50 ring-2 ring-gray-200'
                    : 'border-gray-200 hover:border-gray-300',
                  blue: isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-blue-300',
                  orange: isSelected
                    ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                    : 'border-gray-200 hover:border-orange-300',
                };

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedResult(option.value)}
                    disabled={completeCallFollowup.isPending}
                    className={`p-3 rounded-lg border-2 text-right transition-all ${colorClasses[option.color]}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{option.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{option.label}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* اگر callback است، تاریخ بعدی اجباری */}
          {isCallback && (
            <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
              <Label className="flex items-center gap-2 font-medium text-blue-700 dark:text-blue-300">
                <AlertCircle className="w-4 h-4" />
                تاریخ و ساعت پیگیری بعدی
                <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                calendar={persian}
                locale={persian_fa}
                value={nextDate}
                onChange={(date: any) => {
                  if (date && date.isValid) {
                    setNextDate(date.toDate());
                  } else {
                    setNextDate(null);
                  }
                }}
                format="YYYY/MM/DD HH:mm"
                calendarPosition="bottom-right"
                plugins={[<TimePicker key="time" position="right" hideSeconds />]}
                placeholder="انتخاب تاریخ و ساعت تماس مجدد"
                className="w-full p-2.5 border rounded-lg bg-white dark:bg-gray-800"
                containerClassName="w-full"
                disabled={completeCallFollowup.isPending}
              />
              <p className="text-xs text-blue-600 dark:text-blue-400">
                پس از ثبت، یک پیگیری جدید برای این تاریخ ایجاد می‌شود
              </p>
            </div>
          )}

          {/* یادداشت مکالمه */}
          <div className="space-y-2">
            <Label className="font-medium">
              یادداشت مکالمه
              <span className="text-xs text-muted-foreground font-normal mr-2">
                (اختیاری)
              </span>
            </Label>
            <textarea
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              className="w-full min-h-[100px] p-3 border rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="جزئیات مکالمه، درخواست‌های بیمار، نکات مهم..."
              disabled={completeCallFollowup.isPending}
            />
          </div>

          {/* خطا */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            data-loading="false"
            onClick={() => onOpenChange(false)}
            disabled={completeCallFollowup.isPending}
          >
            انصراف
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedResult || completeCallFollowup.isPending}
            className="min-w-[140px]"
          >
            {completeCallFollowup.isPending ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                در حال ثبت...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 ml-2" />
                ثبت نتیجه
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}