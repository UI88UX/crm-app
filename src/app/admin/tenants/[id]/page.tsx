// app/admin/tenants/[id]/page.tsx
import { TenantForm } from "@/components/admin/TenantForm";
import { getTenant } from "@/lib/supabase/actions";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TenantFormData } from "@/lib/validations/tenant";

export default async function EditTenantPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: tenant, error } = await getTenant(id);

  if (error || !tenant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">خطا</h2>
          <p className="text-gray-600">{error || "مطب یافت نشد"}</p>
        </div>
      </div>
    );
  }

  // تبدیل داده‌ها به فرمت مورد نیاز فرم با نوع صحیح
  const initialData: Partial<TenantFormData> & { id: string } = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    email: tenant.email,
    phone: tenant.phone,
    address: tenant.address,
    website: tenant.website,
    registration_number: tenant.registration_number,
    license_key: tenant.license_key,
    is_active: tenant.is_active ?? true,
    plan: "free" as const,
    max_users: 5,
    max_patients: 100,
    expires_at: null,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ویرایش مطب</h1>
        <p className="text-muted-foreground">
          اطلاعات مطب "{tenant.name}" را ویرایش کنید
        </p>
      </div>

      <TenantForm initialData={initialData} isEdit={true} />
    </div>
  );
}