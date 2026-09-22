// src/app/dashboard/appointments/new/page.client.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import type { Appointment } from "@/types";

export function NewAppointmentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPatientId = searchParams.get("patientId") || undefined;
  const returnTo = searchParams.get("returnTo") || "/dashboard/appointments";

  const handleSuccess = (data: Appointment) => {
    // بعد از ثبت، اگر از صفحه بیمار آمده بودیم، به همان صفحه برگردیم
    // در غیر این صورت به صفحه جزئیات نوبت جدید برویم
    if (returnTo && returnTo !== "/dashboard/appointments") {
      router.push(returnTo);
    } else {
      router.push(`/dashboard/appointments/${data.id}`);
    }
  };

  const handleCancel = () => {
    router.push(returnTo);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ثبت نوبت جدید</h1>
          <p className="text-sm text-muted-foreground mt-1">
            اطلاعات نوبت را وارد کنید
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-background to-muted/20">
          <CardTitle>اطلاعات نوبت</CardTitle>
          <CardDescription>
            تمام فیلدهای الزامی را پر کنید
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <AppointmentForm
            patientId={initialPatientId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            asDialog={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}