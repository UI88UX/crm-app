// src/app/dashboard/appointments/[id]/page.client.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Calendar, Clock, User, Edit, Trash2, Loader2 } from "lucide-react";
import moment from "moment-jalaali";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { toJalali, formatJalaliDateTime, toJalaliDisplay } from "@/lib/util/jalaliDate";
import { APPOINTMENT_TYPE_MAP, APPOINTMENT_STATUSES, type Appointment } from "@/types";

interface AppointmentDetailClientProps {
  id: string;
}

export function AppointmentDetailClient({ id }: AppointmentDetailClientProps) {
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // دریافت نوبت
  useEffect(() => {
    const fetchAppointment = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/appointments/${id}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "خطا در دریافت نوبت");
        }

        setAppointment(result.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "خطا در دریافت نوبت";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchAppointment();
    }
  }, [id]);

  // ویرایش نوبت
  const handleEditSuccess = (data: Appointment) => {
    setAppointment(data);
    setShowEditForm(false);
  };

  // حذف نوبت
  const handleDelete = async () => {
    if (!appointment) return;
    if (!confirm(`آیا از حذف نوبت "${appointment.title || 'بدون عنوان'}" اطمینان دارید؟`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "خطا در حذف نوبت");
      }

      router.push("/dashboard/appointments");
    } catch (err) {
      const message = err instanceof Error ? err.message : "خطا در حذف نوبت";
      alert(message);
    } finally {
      setIsDeleting(false);
    }
  };

  // لغو نوبت
  const handleCancel = async () => {
    if (!appointment) return;
    if (!confirm(`آیا از لغو نوبت "${appointment.title || 'بدون عنوان'}" اطمینان دارید؟`)) {
      return;
    }

    setIsCanceling(true);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", reason: "لغو توسط کاربر" }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "خطا در لغو نوبت");
      }

      setAppointment(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "خطا در لغو نوبت";
      alert(message);
    } finally {
      setIsCanceling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error || "نوبت یافت نشد"}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/appointments")}>
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت به لیست نوبت‌ها
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">جزئیات نوبت</h1>
          <p className="text-sm text-muted-foreground mt-1">
            مشاهده و مدیریت اطلاعات نوبت
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/appointments")}>
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت
        </Button>
      </div>

      {/* اطلاعات اصلی */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {appointment.title || "نوبت بدون عنوان"}
              </CardTitle>
              <CardDescription className="mt-1">
                <AppointmentStatusBadge status={appointment.status} />
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {appointment.status !== "cancelled" &&
                appointment.status !== "completed" &&
                appointment.status !== "no_show" && (
                  <Button
                    variant="outline"
                    className="text-orange-600"
                    onClick={handleCancel}
                    disabled={isCanceling}
                  >
                    {isCanceling && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    لغو نوبت
                  </Button>
                )}
              <Button variant="outline" onClick={() => setShowEditForm(true)}>
                <Edit className="w-4 h-4 ml-2" />
                ویرایش
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 ml-2" />
                )}
                حذف
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* اطلاعات بیمار */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                بیمار
              </div>
              <div className="font-medium">
                {appointment.patient?.first_name} {appointment.patient?.last_name}
              </div>
              <div className="text-sm text-muted-foreground">
                کد ملی: {appointment.patient?.national_code}
              </div>
              <div className="text-sm text-muted-foreground">
                تلفن: {appointment.patient?.phone}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                تاریخ و زمان
              </div>
              <div className="font-medium">
                {toJalaliDisplay(appointment.start_time)}
              </div>
              <div className="text-sm text-muted-foreground">
                ساعت: {moment(appointment.start_time).format("HH:mm")} -{" "}
                {moment(appointment.end_time).format("HH:mm")}
              </div>
              <div className="text-sm text-muted-foreground">
                مدت زمان:{" "}
                {Math.round(
                  (new Date(appointment.end_time).getTime() -
                    new Date(appointment.start_time).getTime()) /
                    (1000 * 60)
                )}{" "}
                دقیقه
              </div>
            </div>
          </div>

          {/* نوع */}
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">نوع نوبت</div>
            <Badge variant="secondary">
              {APPOINTMENT_TYPE_MAP[appointment.type as keyof typeof APPOINTMENT_TYPE_MAP] || appointment.type}
            </Badge>
          </div>

          {/* توضیحات */}
          {appointment.description && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">توضیحات</div>
              <div className="p-3 bg-muted rounded-lg whitespace-pre-wrap">
                {appointment.description}
              </div>
            </div>
          )}

          {/* یادداشت */}
          {appointment.notes && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">یادداشت</div>
              <div className="p-3 bg-muted/50 rounded-lg whitespace-pre-wrap text-sm">
                {appointment.notes}
              </div>
            </div>
          )}

          {/* دلیل لغو */}
          {appointment.cancellation_reason && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">دلیل لغو</div>
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg whitespace-pre-wrap text-sm text-red-600 dark:text-red-400">
                {appointment.cancellation_reason}
              </div>
            </div>
          )}

          {/* اطلاعات ثبت */}
          <div className="text-xs text-muted-foreground border-t pt-4">
            <div>تاریخ ثبت: {formatJalaliDateTime(appointment.created_at)}</div>
            {appointment.updated_at && appointment.updated_at !== appointment.created_at && (
              <div>آخرین ویرایش: {formatJalaliDateTime(appointment.updated_at)}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* فرم ویرایش */}
      {showEditForm && (
        <AppointmentForm
          appointment={appointment}
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEditForm(false)}
          isOpen={showEditForm}
          onOpenChange={(open) => {
            setShowEditForm(open);
            if (!open) setShowEditForm(false);
          }}
        />
      )}
    </div>
  );
}