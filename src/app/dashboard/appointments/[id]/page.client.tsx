// src/app/dashboard/appointments/[id]/page.client.tsx// src/app/dashboard/appointments/[id]/page.client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Calendar, Clock, User, Edit, Trash2, Loader2 } from "lucide-react";
import moment from "moment-jalaali";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { toJalaliDisplay, formatJalaliDateTime } from "@/lib/util/jalaliDate";
import { APPOINTMENT_TYPE_MAP, type Appointment } from "@/types";
import { appointmentKeys } from "@/hooks/useAppointments";
import { toast } from "sonner";

interface AppointmentDetailClientProps {
  id: string;
}

// کلیدهای Query
const appointmentDetailKeys = {
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
};

export function AppointmentDetailClient({ id }: AppointmentDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showEditForm, setShowEditForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  
  const {
    data: appointment,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: appointmentDetailKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/appointments/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "خطا در دریافت نوبت");
      }
      const result = await response.json();
      return result.data as Appointment;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  // حذف نوبت
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "خطا در حذف نوبت");
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.stats() });
      queryClient.removeQueries({ queryKey: appointmentDetailKeys.detail(id) });
      toast.success("نوبت با موفقیت حذف شد");
      router.push("/dashboard/appointments");
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطا در حذف نوبت");
    },
  });

  // لغو نوبت
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", reason: "لغو توسط کاربر" }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "خطا در لغو نوبت");
      }
      const result = await response.json();
      return result.data as Appointment;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(appointmentDetailKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.stats() });
      toast.success("نوبت با موفقیت لغو شد");
    },
    onError: (error: Error) => {
      toast.error(error.message || "خطا در لغو نوبت");
    },
  });

  // ویرایش نوبت
  const handleEditSuccess = (data: Appointment) => {
    queryClient.setQueryData(appointmentDetailKeys.detail(id), data);
    queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    setShowEditForm(false);
    toast.success("نوبت با موفقیت ویرایش شد");
  };

  const handleDelete = () => {
    if (!appointment) return;
    if (!confirm(`آیا از حذف نوبت "${appointment.title || 'بدون عنوان'}" اطمینان دارید؟`)) {
      return;
    }
    deleteMutation.mutate();
  };

  const handleCancel = () => {
    if (!appointment) return;
    if (!confirm(`آیا از لغو نوبت "${appointment.title || 'بدون عنوان'}" اطمینان دارید؟`)) {
      return;
    }
    cancelMutation.mutate();
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
        <p className="text-red-500">{error?.message || "نوبت یافت نشد"}</p>
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