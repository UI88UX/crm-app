// src/app/dashboard/appointments/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { AppointmentsPageClient } from "./page.client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const metadata: Metadata = {
  title: "مدیریت نوبت‌ها",
  description: "مدیریت نوبت‌های مطب",
};

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner />
    </div>}>
      <AppointmentsPageClient />
    </Suspense>
  );
}