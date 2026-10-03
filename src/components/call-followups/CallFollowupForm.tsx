// src/components/call-followups/CallFollowupForm.tsx
"use client";

import { useState } from "react";
import { Phone, Calendar, Loader2, AlertCircle, FileText } from "lucide-react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import TimePicker from "react-multi-date-picker/plugins/time_picker";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useCreateCallFollowup } from "@/hooks/useCallFollowups";

interface CallFollowupFormProps {
  patientId: string;
  patientName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CallFollowupForm({
  patientId,
  patientName,
  onSuccess,
  onCancel,
}: CallFollowupFormProps) {
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createCallFollowup = useCreateCallFollowup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedDateTime) {
      setError("لطفاً تاریخ و ساعت پیگیری را انتخاب کنید");
      return;
    }

    if (selectedDateTime <= new Date()) {
      setError("تاریخ و ساعت پیگیری باید در آینده باشد");
      return;
    }

    try {
      await createCallFollowup.mutateAsync({
        patient_id: patientId,
        due_date: selectedDateTime.toISOString(),
        notes: notes.trim() || null,
      });

      // reset
      setSelectedDateTime(null);
      setNotes("");

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "خطا در ثبت پیگیری");
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* هدر */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm sm:text-lg">ثبت قرار تماس تلفنی</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                برای بیمار <strong className="break-words">{patientName}</strong> یک قرار تماس تعیین کنید
              </p>
            </div>
          </div>

          {/* تاریخ و زمان */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-medium">
              <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="whitespace-nowrap">تاریخ و ساعت تماس</span>
              <span className="text-red-500">*</span>
            </Label>
            <DatePicker
              calendar={persian}
              locale={persian_fa}
              value={selectedDateTime}
              onChange={(date: any) => {
                if (date && date.isValid) {
                  setSelectedDateTime(date.toDate());
                } else {
                  setSelectedDateTime(null);
                }
              }}
              format="YYYY/MM/DD HH:mm"
              calendarPosition="bottom-right"
              plugins={[<TimePicker key="time" position="right" hideSeconds />]}
              placeholder="انتخاب تاریخ و ساعت"
              containerClassName="w-full"
              inputClass="w-full h-11 px-3 border rounded-lg bg-background text-sm hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={createCallFollowup.isPending}
            />
          </div>

          {/* یادداشت */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-medium flex-wrap">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              <span>یادداشت (هدف تماس)</span>
              <span className="text-xs text-muted-foreground font-normal">
                (اختیاری)
              </span>
            </Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[80px] p-3 border rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="مثال: پیگیری نتیجه تست شنوایی، یادآوری تنظیم سمعک..."
              disabled={createCallFollowup.isPending}
            />
          </div>

          {/* خطا */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* دکمه‌ها */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 border-t">
            <Button
              type="submit"
              disabled={createCallFollowup.isPending}
              className="w-full sm:w-auto sm:min-w-[140px]"
            >
              {createCallFollowup.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  در حال ثبت...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 ml-2" />
                  ثبت قرار تماس
                </>
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={createCallFollowup.isPending}
                className="w-full sm:w-auto"
              >
                انصراف
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}