// src/app/dashboard/patients/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import PatientEditClient from "./page.client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientEditPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  // دریافت اطلاعات بیمار
  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !patient) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">خطا در دریافت اطلاعات بیمار</h2>
        <p className="text-gray-600 mt-2">{error?.message || "بیمار یافت نشد"}</p>
      </div>
    );
  }

  return <PatientEditClient patientId={id} initialPatient={patient} />;
}