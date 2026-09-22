// app/admin/tenants/page.tsx
import { getTenants } from "@/lib/supabase/actions";
import { TenantTable } from "@/components/admin/TenantTable";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function TenantsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

//   const isSuperAdmin = user.app_metadata?.is_super_admin === true;
//   if (!isSuperAdmin) {
//     redirect("/dashboard");
//   }

  const { data: tenants, error } = await getTenants();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">خطا</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">مدیریت مطب‌ها</h1>
        <p className="text-muted-foreground">
          مدیریت تمام مطب‌های ثبت شده در سیستم
        </p>
      </div>

      <TenantTable tenants={tenants || []} />
    </div>
  );
}