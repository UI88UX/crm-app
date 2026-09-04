// src/app/dashboard/patients/page.tsx
import { Suspense } from "react";
import { LoadingPage } from "@/components/ui/loading-spinner";
import PatientsPageClient from "./page.client";

export const revalidate = 3600;

export default function PatientsPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <PatientsPageClient />
    </Suspense>
  );
}