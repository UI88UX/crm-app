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

// src/app/dashboard/patients/page.tsx

// در تابع PatientsData، بعد از دریافت بیماران و فایل‌ها، sales_count را هم اضافه کنید:

async function PatientsData() {
  const supabase = await createClient();
  
  const { data: patients, error } = await supabase
    .from("patients")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !patients) {
    return <PatientsPageClient initialPatients={[]} />;
  }

  // دریافت تعداد فایل‌ها و فروش‌ها به صورت موازی
  const patientsWithData = await Promise.all(
    patients.map(async (patient) => {
      try {
        // دریافت تعداد فایل‌ها
        const { files } = await getPatientFiles(patient.id);
        
        // دریافت تعداد فروش‌ها از دیتابیس مستقیم
        const { count: salesCount, error: salesError } = await supabase
          .from("sales")
          .select("*", { count: 'exact', head: true })
          .eq("patient_id", patient.id)
          .is("deleted_at", null);

        return {
          ...patient,
          file_count: files.length,
          sales_count: salesError ? 0 : (salesCount || 0),
        };
      } catch (error) {
        return {
          ...patient,
          file_count: 0,
          sales_count: 0,
        };
      }
    })
  );

  return <PatientsPageClient initialPatients={patientsWithData} />;
}

export default function PatientsPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <PatientsData />
    </Suspense>
  );
}