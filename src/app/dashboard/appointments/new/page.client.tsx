// src/app/dashboard/appointments/new/page.client.tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import type { Appointment } from "@/types";

export function NewAppointmentClient() {
  const router = useRouter();

  const handleSuccess = (data: Appointment) => {
    router.push(`/dashboard/appointments/${data.id}`);
  };

  const handleCancel = () => {
    router.push("/dashboard/appointments");
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
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

      <Card>
        <CardHeader>
          <CardTitle>اطلاعات نوبت</CardTitle>
          <CardDescription>
            تمام فیلدهای الزامی را پر کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            isOpen={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}