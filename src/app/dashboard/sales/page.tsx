// src/app/dashboard/sales/page.tsx
import { Suspense } from "react";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { createClient } from "@/lib/supabase/server";
import SalesClient from "./page.client";

export const revalidate = 60;

interface PatientSimple {
  id: string;
  first_name: string;
  last_name: string;
  national_code: string;
}

async function getPatients() {
  const supabase = await createClient();
  
  const { data: tenantId } = await supabase.rpc('get_current_tenant_id');
  if (!tenantId) return [];

  const { data: patients } = await supabase
    .from("patients")
    .select("id, first_name, last_name, national_code")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("first_name", { ascending: true });

  return patients || [];
}

export default async function SalesPage() {
  const patients = await getPatients();
  
  return (
    <Suspense fallback={<LoadingPage />}>
      <SalesClient patients={patients} />
    </Suspense>
  );
}