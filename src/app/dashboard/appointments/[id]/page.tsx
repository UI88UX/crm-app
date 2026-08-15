// src/app/dashboard/appointments/[id]/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { AppointmentDetailClient } from "./page.client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `جزئیات نوبت`,
    description: "مشاهده جزئیات نوبت",
  };
}

export default async function AppointmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AppointmentDetailClient id={id} />
    </Suspense>
  );
}