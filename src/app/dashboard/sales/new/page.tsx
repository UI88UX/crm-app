// src/app/dashboard/sales/new/page.tsx

import { createClient } from "@/lib/supabase/server";
import NewSaleClient from "./page.client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ثبت فروش جدید | سیستم مدیریت مطب",
  description: "ثبت فروش سمعک جدید",
};

interface PatientSimple {
  id: string;
  first_name: string;
  last_name: string;
  national_code: string;
}

export default async function NewSalePage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">لطفاً وارد حساب کاربری خود شوید</h2>
      </div>
    );
  }

  // دریافت Tenant ID
  const { data: tenantId, error: tenantError } = await supabase
    .rpc('get_current_tenant_id');

  if (tenantError || !tenantId) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">خطا در دریافت اطلاعات مطب</h2>
        <p className="text-gray-600 mt-2">{tenantError?.message || 'Tenant یافت نشد'}</p>
      </div>
    );
  }

  // دریافت لیست بیماران برای انتخاب در فرم
  const { data: patients, error: patientsError } = await supabase
    .from("patients")
    .select("id, first_name, last_name, national_code")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("first_name", { ascending: true });

  if (patientsError) {
    console.error("Error fetching patients:", patientsError);
  }

  return <NewSaleClient patients={patients || []} />;
}