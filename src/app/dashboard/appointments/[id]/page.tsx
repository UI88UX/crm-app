// src/app/dashboard/appointments/[id]/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { AppointmentDetailClient } from "./page.client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface PageProps {
  params: Promise<{ id: string }>; // ✅ اضافه کردن Promise
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params; // ✅ await params
  return {
    title: `جزئیات نوبت ${id}`,
    description: "مشاهده جزئیات نوبت",
  };
}

export default async function AppointmentDetailPage({ params }: PageProps) {
  const { id } = await params; // ✅ await params
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AppointmentDetailClient id={id} />
    </Suspense>
  );
}