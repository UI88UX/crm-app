// src/app/dashboard/sales/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import SaleDetailClient from "./page.client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SaleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: sale, error } = await supabase
    .from("sales")
    .select(`
      *,
      patient:patients(id, first_name, last_name, national_code, phone)
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !sale) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">خطا در دریافت اطلاعات فروش</h2>
        <p className="text-gray-600 mt-2">{error?.message || "فروش یافت نشد"}</p>
      </div>
    );
  }

  return <SaleDetailClient sale={sale} />;
}