// src/app/dashboard/sales/page.tsx
import { createClient } from "@/lib/supabase/server";
import SalesClient from "./page.client";
import type { Sale } from "@/types";

// تعریف نوع برای Patient خلاصه شده
interface PatientSimple {
  id: string;
  first_name: string;
  last_name: string;
  national_code: string;
}
export const revalidate = 60;

export default async function SalesPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">لطفاً وارد حساب کاربری خود شوید</h2>
      </div>
    );
  }

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

  // دریافت لیست فروش‌ها
  const { data: sales, error: salesError } = await supabase
    .from("sales")
    .select(`
      *,
      patient:patients (
        id,
        first_name,
        last_name,
        national_code,
        phone
      )
    `)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("sale_date", { ascending: false });

  if (salesError) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">خطا در دریافت فروش‌ها</h2>
        <p className="text-gray-600 mt-2">{salesError.message}</p>
      </div>
    );
  }

  // دریافت لیست بیماران (فقط فیلدهای مورد نیاز)
  const { data: patients, error: patientsError } = await supabase
    .from("patients")
    .select("id, first_name, last_name, national_code")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (patientsError) {
    console.error("Error fetching patients:", patientsError);
  }

  return (
    <SalesClient 
      sales={sales || []} 
      patients={patients || []} 
    />
  );
}