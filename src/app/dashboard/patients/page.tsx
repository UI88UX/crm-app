// src/app/dashboard/patients/page.tsx
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getPatientFiles } from "@/lib/storage/patientFiles";
import PatientsPageClient from "./page.client";
import { LoadingPage } from "@/components/ui/loading-spinner";

export const revalidate = 3600;

interface PatientWithFiles {
  id: string;
  first_name: string;
  last_name: string;
  national_code: string;
  phone: string;
  gender: string;
  created_at: string;
  file_count: number;
}

async function PatientsData() {
  const supabase = await createClient();
  
  // دریافت لیست بیماران
  const { data: patients, error } = await supabase
    .from("patients")
    .select("*")
    .is("deleted_at", null) // فقط بیماران حذف نشده
    .order("created_at", { ascending: false });

  if (error || !patients) {
    return <PatientsPageClient initialPatients={[]} />;
  }

  // دریافت تعداد فایل‌ها برای هر بیمار (به صورت موازی)
  const patientsWithFiles = await Promise.all(
    patients.map(async (patient) => {
      try {
        const { files } = await getPatientFiles(patient.id);
        return {
          ...patient,
          file_count: files.length,
        };
      } catch (error) {
        return {
          ...patient,
          file_count: 0,
        };
      }
    })
  );

  return <PatientsPageClient initialPatients={patientsWithFiles} />;
}

export default function PatientsPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <PatientsData />
    </Suspense>
  );
}