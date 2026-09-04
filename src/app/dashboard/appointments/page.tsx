// src/app/dashboard/appointments/page.tsx
import { Suspense } from "react";
import { LoadingPage } from "@/components/ui/loading-spinner";
import AppointmentsPageClient from "./page.client";

export const revalidate = 3600;

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <AppointmentsPageClient />
    </Suspense>
  );
}