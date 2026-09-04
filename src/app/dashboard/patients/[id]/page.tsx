// src/app/dashboard/patients/[id]/page.tsx
import { Suspense } from "react";
import { LoadingPage } from "@/components/ui/loading-spinner";
import PatientEditClient from "./page.client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientEditPage({ params }: PageProps) {
  const { id } = await params;


  return (
    <Suspense fallback={<LoadingPage />}>
      <PatientEditClient patientId={id} />
    </Suspense>
  );
}