// src/app/dashboard/appointments/new/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { NewAppointmentClient } from "./page.client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const metadata: Metadata = {
  title: "ثبت نوبت جدید",
  description: "ثبت نوبت جدید برای بیمار",
};

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NewAppointmentClient />
    </Suspense>
  );
}